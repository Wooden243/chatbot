import sqlite3
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from app.api import create_app
from app.config import Settings


class FakeAI:
    def __init__(self):
        self.calls = []

    def reply(self, history):
        self.calls.append(history)
        return 'テストの回答'


@pytest.fixture
def setup(tmp_path):
    settings = Settings(_env_file=None, database_url=f'sqlite:///{tmp_path / "test.db"}', openai_api_key='')
    fake = FakeAI()
    return settings, fake


def test_crud_history_and_restart(setup):
    settings, fake = setup
    with TestClient(create_app(settings, fake)) as client:
        assert client.get('/api/conversations').json() == []
        first = client.post('/api/conversations', json={})
        assert first.status_code == 201
        id = first.json()['id']
        path = f'/api/conversations/{id}'
        second = client.post('/api/conversations', json={'title': '別の会話'}).json()['id']
        result = client.post(path + '/messages', json={'content': 'こんにちは'})
        assert result.status_code == 201
        assert result.json()['title'] == 'こんにちは'
        assert [m['role'] for m in result.json()['messages']] == ['user', 'assistant']
        assert client.post(path + '/messages', json={'content': '続き'}).status_code == 201
        assert fake.calls[1] == [{'role': 'user', 'content': 'こんにちは'}, {'role': 'assistant', 'content': 'テストの回答'}, {'role': 'user', 'content': '続き'}]
        assert client.get(f'/api/conversations/{second}').json()['messages'] == []
        assert len(client.get(path).json()['messages']) == 4
        assert client.get('/api/conversations').json()[0]['id'] == id
    with TestClient(create_app(settings, fake)) as client:
        assert len(client.get(path).json()['messages']) == 4
        assert client.delete(path).status_code == 204
        assert client.get(path).status_code == 404
        assert client.delete(path).status_code == 404
    with sqlite3.connect(settings.database_url.removeprefix('sqlite:///')) as db:
        assert db.execute('SELECT COUNT(*) FROM messages').fetchone()[0] == 0
        assert db.execute('SELECT COUNT(*) FROM conversations').fetchone()[0] == 1


@pytest.mark.parametrize('content', ['', '   ', 'a' * 10001])
def test_invalid_messages(setup, content):
    settings, fake = setup
    with TestClient(create_app(settings, fake)) as client:
        id = client.post('/api/conversations', json={}).json()['id']
        assert client.post(f'/api/conversations/{id}/messages', json={'content': content}).status_code == 422
        assert not fake.calls


def test_missing_key_and_not_found(setup):
    settings, _ = setup
    with TestClient(create_app(settings)) as client:
        id = client.post('/api/conversations', json={}).json()['id']
        path = f'/api/conversations/{id}'
        assert client.post(path + '/messages', json={'content': 'hello'}).status_code == 503
        assert client.get(path).json()['messages'] == []
        assert client.post('/api/conversations/9999/messages', json={'content': 'hello'}).status_code == 404
        assert client.post('/api/conversations', json={'title': ' '}).status_code == 422


def test_ai_failure_is_atomic(setup):
    settings, _ = setup
    class FailingAI:
        def reply(self, history):
            raise HTTPException(502, 'test error')
    with TestClient(create_app(settings, FailingAI())) as client:
        id = client.post('/api/conversations', json={}).json()['id']
        path = f'/api/conversations/{id}'
        assert client.post(path + '/messages', json={'content': 'hello'}).status_code == 502
        assert client.get(path).json()['messages'] == []


def test_cors(setup):
    settings, fake = setup
    with TestClient(create_app(settings, fake)) as client:
        response = client.options('/api/conversations', headers={'Origin': 'http://localhost:3000', 'Access-Control-Request-Method': 'POST'})
        assert response.headers['access-control-allow-origin'] == 'http://localhost:3000'
        response = client.options('/api/conversations', headers={'Origin': 'https://untrusted.example', 'Access-Control-Request-Method': 'POST'})
        assert 'access-control-allow-origin' not in response.headers
