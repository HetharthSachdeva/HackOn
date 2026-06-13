"""Token verification tests for the Supabase JWT decoder."""

from __future__ import annotations

import time

import jwt
import pytest

from app.core.config import get_settings
from app.core.errors import UnauthorizedError
from app.core.security import decode_supabase_jwt


def _make_token(**overrides: object) -> str:
    settings = get_settings()
    payload: dict[str, object] = {
        "sub": "user-123",
        "email": "shopper@example.com",
        "role": "authenticated",
        "aud": "authenticated",
        "exp": int(time.time()) + 3600,
    }
    payload.update(overrides)
    return jwt.encode(payload, settings.supabase_jwt_secret, algorithm="HS256")


def test_decode_valid_token() -> None:
    user = decode_supabase_jwt(_make_token())
    assert user.id == "user-123"
    assert user.email == "shopper@example.com"
    assert user.role == "authenticated"


def test_rejects_expired_token() -> None:
    token = _make_token(exp=int(time.time()) - 60)
    with pytest.raises(UnauthorizedError):
        decode_supabase_jwt(token)


def test_rejects_wrong_audience() -> None:
    token = _make_token(aud="anon")
    with pytest.raises(UnauthorizedError):
        decode_supabase_jwt(token)


def test_rejects_empty_token() -> None:
    with pytest.raises(UnauthorizedError):
        decode_supabase_jwt("")
