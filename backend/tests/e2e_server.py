"""Local browser test server: fake only the external AI; use real API and SQLite."""
from pathlib import Path
import os
from app.api import create_app
from app.config import Settings


class TestResponder:
    def reply(self, history):
        import time
        time.sleep(0.3)
        return f'E2E回答: {history[-1]["content"]} (履歴 {len(history)} 件)'


database = Path(__file__).resolve().parents[1] / '.test-data' / 'browser.db'
database.parent.mkdir(exist_ok=True)
app = create_app(Settings(_env_file=None, database_url=f'sqlite:///{database.as_posix()}', openai_api_key=''), None if os.getenv('E2E_MISSING_KEY') else TestResponder())
