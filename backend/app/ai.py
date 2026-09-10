from fastapi import HTTPException
from openai import OpenAI, APIError, APITimeoutError, RateLimitError, AuthenticationError
from .config import Settings


class OpenAIResponder:
    def __init__(self, settings: Settings):
        self.settings = settings

    def reply(self, history: list[dict[str, str]]) -> str:
        if not self.settings.openai_api_key:
            raise HTTPException(503, 'OPENAI_API_KEY が設定されていません。バックエンドの環境設定を確認してください。')
        try:
            with OpenAI(api_key=self.settings.openai_api_key, timeout=45, max_retries=0) as client:
                result = client.chat.completions.create(model=self.settings.openai_model, messages=history)
            content = result.choices[0].message.content
            if not content or not content.strip():
                raise HTTPException(502, 'AIから空の回答が返されました。もう一度送信してください。')
            return content
        except AuthenticationError:
            raise HTTPException(503, 'AIサービスの認証設定を確認してください。') from None
        except RateLimitError:
            raise HTTPException(429, 'AIの利用制限に達しました。時間をおいて再試行してください。') from None
        except APITimeoutError:
            raise HTTPException(504, 'AIの応答がタイムアウトしました。もう一度送信してください。') from None
        except APIError:
            raise HTTPException(502, 'AIサービスと通信できませんでした。もう一度送信してください。') from None
