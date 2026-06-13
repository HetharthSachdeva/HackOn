"""Tests for DEV_BYPASS_AUTH — the local-only auth short-circuit.

Critical safety properties:

* The bypass returns a synthetic dev user when enabled.
* The `X-Dev-User-Id` header overrides the configured default per request.
* The bypass **refuses to load** if APP_ENV is anything but "dev".
* With the bypass off, unauthenticated requests still 401.
* `get_optional_user` returns the dev user (not None) while bypass is on.

These tests exercise the dependency through the real FastAPI app so we
catch any wiring regressions in `app/core/deps.py` end-to-end.
"""

from __future__ import annotations

import importlib

import pytest
from fastapi import APIRouter, FastAPI
from fastapi.testclient import TestClient

from app.api.v1 import auth as auth_router
from app.core import deps as deps_module
from app.core.config import get_settings
from app.core.deps import OptionalUserDep
from app.core.errors import register_exception_handlers


def _fresh_settings(monkeypatch: pytest.MonkeyPatch, **env: str) -> None:
    """Apply env overrides and reset the cached Settings + warn-once flag."""
    for key, value in env.items():
        monkeypatch.setenv(key, value)
    get_settings.cache_clear()
    deps_module._dev_bypass_warned = False


def _build_app() -> FastAPI:
    """Minimal app exposing only /auth/me — keeps tests fast and focused."""
    app = FastAPI()
    register_exception_handlers(app)
    app.include_router(auth_router.router)
    return app


@pytest.fixture(autouse=True)
def _reset_after_test() -> None:
    yield
    get_settings.cache_clear()
    deps_module._dev_bypass_warned = False


# --- positive: bypass works in dev -----------------------------------------


def test_bypass_returns_synthetic_user_without_token(monkeypatch) -> None:
    _fresh_settings(
        monkeypatch,
        APP_ENV="dev",
        DEV_BYPASS_AUTH="true",
        DEV_USER_ID="aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        DEV_USER_EMAIL="alice@local.test",
    )

    client = TestClient(_build_app())
    resp = client.get("/auth/me")  # NO Authorization header

    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    assert body["email"] == "alice@local.test"
    assert body["role"] == "authenticated"


def test_bypass_header_overrides_default_user_id(monkeypatch) -> None:
    _fresh_settings(
        monkeypatch,
        APP_ENV="dev",
        DEV_BYPASS_AUTH="true",
        DEV_USER_ID="11111111-1111-1111-1111-111111111111",
    )

    client = TestClient(_build_app())
    override = "99999999-9999-9999-9999-999999999999"
    resp = client.get("/auth/me", headers={"X-Dev-User-Id": override})

    assert resp.status_code == 200
    assert resp.json()["id"] == override


def test_bypass_blank_header_falls_back_to_default(monkeypatch) -> None:
    _fresh_settings(
        monkeypatch,
        APP_ENV="dev",
        DEV_BYPASS_AUTH="true",
        DEV_USER_ID="22222222-2222-2222-2222-222222222222",
    )

    client = TestClient(_build_app())
    resp = client.get("/auth/me", headers={"X-Dev-User-Id": "   "})

    assert resp.status_code == 200
    assert resp.json()["id"] == "22222222-2222-2222-2222-222222222222"


def test_bypass_ignores_bogus_bearer_token(monkeypatch) -> None:
    """A garbage token shouldn't 401 when bypass is on — that's the point."""
    _fresh_settings(monkeypatch, APP_ENV="dev", DEV_BYPASS_AUTH="true")

    client = TestClient(_build_app())
    resp = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer this-is-not-a-real-jwt"},
    )
    assert resp.status_code == 200


# --- negative: bypass off ---------------------------------------------------


def test_bypass_off_requires_real_token(monkeypatch) -> None:
    _fresh_settings(monkeypatch, APP_ENV="dev", DEV_BYPASS_AUTH="false")

    client = TestClient(_build_app())
    resp = client.get("/auth/me")
    assert resp.status_code == 401


# --- safety rail: cross-env guard ------------------------------------------


@pytest.mark.parametrize("env", ["staging", "prod"])
def test_bypass_refuses_to_load_outside_dev(
    monkeypatch: pytest.MonkeyPatch, env: str
) -> None:
    monkeypatch.setenv("APP_ENV", env)
    monkeypatch.setenv("DEV_BYPASS_AUTH", "true")
    get_settings.cache_clear()

    with pytest.raises(Exception) as exc_info:
        get_settings()

    # Pydantic wraps the ValueError in a ValidationError; either way the
    # message must mention DEV_BYPASS_AUTH so misconfig is obvious.
    assert "DEV_BYPASS_AUTH" in str(exc_info.value)


# --- get_optional_user behavior --------------------------------------------


def test_optional_user_returns_dev_user_when_bypass_on(monkeypatch) -> None:
    """When bypass is on there is no anonymous mode — even optional auth
    returns the dev user."""
    _fresh_settings(
        monkeypatch,
        APP_ENV="dev",
        DEV_BYPASS_AUTH="true",
        DEV_USER_ID="33333333-3333-3333-3333-333333333333",
    )

    # Use a small inline app exposing optional auth.
    app = FastAPI()
    register_exception_handlers(app)
    router = APIRouter()

    @router.get("/whoami")
    async def whoami(user: OptionalUserDep) -> dict:
        return {"id": user.id if user else None}

    app.include_router(router)
    client = TestClient(app)
    resp = client.get("/whoami")  # no token

    assert resp.status_code == 200, resp.text
    assert resp.json()["id"] == "33333333-3333-3333-3333-333333333333"


def teardown_module() -> None:
    """Reset cached settings for any downstream test modules."""
    get_settings.cache_clear()
    deps_module._dev_bypass_warned = False
    importlib.reload(deps_module)  # belt-and-braces
