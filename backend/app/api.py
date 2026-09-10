from contextlib import asynccontextmanager
from threading import Lock
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from .ai import OpenAIResponder
from .config import Settings
from .database import Base, make_database
from .models import Conversation, Message, now
from .schemas import ConversationCreate, ConversationOut, ConversationDetail, MessageCreate


def create_app(settings: Settings | None = None, responder=None) -> FastAPI:
    settings = settings or Settings()
    engine, sessions = make_database(settings.database_url)
    ai = responder or OpenAIResponder(settings)
    write_lock = Lock()

    @asynccontextmanager
    async def lifespan(app):
        Base.metadata.create_all(engine)
        yield
        engine.dispose()

    app = FastAPI(title='Chatbot API', version='1.0.0', lifespan=lifespan)
    app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=['GET', 'POST', 'DELETE'], allow_headers=['Content-Type'])

    @app.get('/health')
    def health():
        return {'status': 'ok'}

    def get_conversation(session, conversation_id):
        conversation = session.get(Conversation, conversation_id)
        if conversation is None:
            raise HTTPException(404, '会話が見つかりません。')
        return conversation

    @app.get('/api/conversations', response_model=list[ConversationOut])
    def list_conversations():
        with sessions() as session:
            return session.scalars(select(Conversation).order_by(Conversation.updated_at.desc(), Conversation.id.desc())).all()

    @app.post('/api/conversations', response_model=ConversationDetail, status_code=201)
    def create_conversation(body: ConversationCreate):
        with write_lock, sessions() as session:
            conversation = Conversation(title=body.title)
            session.add(conversation)
            session.commit()
            return ConversationDetail.model_validate(conversation)

    @app.get('/api/conversations/{conversation_id}', response_model=ConversationDetail)
    def conversation_detail(conversation_id: int):
        with sessions() as session:
            return ConversationDetail.model_validate(get_conversation(session, conversation_id))

    @app.delete('/api/conversations/{conversation_id}', status_code=204)
    def delete_conversation(conversation_id: int):
        with write_lock, sessions() as session:
            session.delete(get_conversation(session, conversation_id))
            session.commit()
            return Response(status_code=204)

    @app.post('/api/conversations/{conversation_id}/messages', response_model=ConversationDetail, status_code=201)
    def send_message(conversation_id: int, body: MessageCreate):
        if not write_lock.acquire(blocking=False):
            raise HTTPException(409, '別の処理が実行中です。完了後に再試行してください。')
        try:
            with sessions() as session:
                conversation = get_conversation(session, conversation_id)
                history = [{'role': m.role, 'content': m.content} for m in conversation.messages]
                history.append({'role': 'user', 'content': body.content})
                answer = ai.reply(history)
                conversation.messages.extend([Message(role='user', content=body.content), Message(role='assistant', content=answer)])
                if len(history) == 1 and conversation.title == '新しいチャット':
                    conversation.title = body.content[:40]
                conversation.updated_at = now()
                session.commit()
                return ConversationDetail.model_validate(conversation)
        finally:
            write_lock.release()

    return app
