from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT / '.env', extra='ignore')
    openai_api_key: str = ''
    openai_model: str = 'gpt-4o-mini'
    database_url: str = f'sqlite:///{(ROOT / "chatbot.db").as_posix()}'
    cors_origins: list[str] = ['http://localhost:3000', 'http://127.0.0.1:3000']
