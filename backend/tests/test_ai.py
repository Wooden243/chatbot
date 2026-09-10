from types import SimpleNamespace
from unittest.mock import patch
import httpx
import pytest
from fastapi import HTTPException
from openai import AuthenticationError, RateLimitError, APITimeoutError, APIConnectionError
from app.ai import OpenAIResponder
from app.config import Settings


def test_sdk_receives_history():
    history = [{'role': 'user', 'content': 'hello'}, {'role': 'assistant', 'content': 'hi'}, {'role': 'user', 'content': 'again'}]
    with patch('app.ai.OpenAI') as sdk:
        client = sdk.return_value.__enter__.return_value
        client.chat.completions.create.return_value = SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content='answer'))])
        ai = OpenAIResponder(Settings(_env_file=None, openai_api_key='test-only-placeholder'))
        assert ai.reply(history) == 'answer'
        assert client.chat.completions.create.call_args.kwargs['messages'] == history


@pytest.mark.parametrize('kind,status', [(AuthenticationError,503), (RateLimitError,429), (APITimeoutError,504), (APIConnectionError,502)])
def test_sdk_errors_are_sanitized(kind, status):
    request = httpx.Request('POST', 'https://api.openai.com/v1/chat/completions')
    if kind in (AuthenticationError, RateLimitError):
        error = kind('private upstream details', response=httpx.Response(400, request=request), body=None)
    else:
        error = kind(request=request)
    with patch('app.ai.OpenAI') as sdk:
        sdk.return_value.__enter__.return_value.chat.completions.create.side_effect = error
        with pytest.raises(HTTPException) as exc:
            OpenAIResponder(Settings(_env_file=None, openai_api_key='test-only-placeholder')).reply([])
        assert exc.value.status_code == status
        assert 'private upstream' not in exc.value.detail


def test_empty_answer():
    with patch('app.ai.OpenAI') as sdk:
        sdk.return_value.__enter__.return_value.chat.completions.create.return_value = SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=' '))])
        with pytest.raises(HTTPException) as exc:
            OpenAIResponder(Settings(_env_file=None, openai_api_key='test-only-placeholder')).reply([])
        assert exc.value.status_code == 502
