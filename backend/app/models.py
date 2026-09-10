from datetime import datetime, timezone
from sqlalchemy import ForeignKey, String, Text, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def now() -> datetime:
    return datetime.now(timezone.utc)


class Conversation(Base):
    __tablename__ = 'conversations'
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(100), default='新しいチャット')
    created_at: Mapped[datetime] = mapped_column(default=now)
    updated_at: Mapped[datetime] = mapped_column(default=now, onupdate=now)
    messages: Mapped[list['Message']] = relationship(back_populates='conversation', cascade='all, delete-orphan', order_by='Message.id')


class Message(Base):
    __tablename__ = 'messages'
    __table_args__ = (CheckConstraint("role IN ('user', 'assistant')"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey('conversations.id', ondelete='CASCADE'), index=True)
    role: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=now)
    conversation: Mapped[Conversation] = relationship(back_populates='messages')
