"""Smoke tests for the admin auth dependency and rate-limit middleware."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import create_app


@pytest.fixture
def admin_client(monkeypatch):
    monkeypatch.setenv("ADMIN_TOKEN", "test-admin-token")
    get_settings.cache_clear()
    app = create_app()
    client = TestClient(app)
    yield client
    get_settings.cache_clear()


def test_admin_requires_token(admin_client):
    r = admin_client.get("/api/v1/admin/orders/stats")
    assert r.status_code == 403
    body = r.json()
    assert body["error"]["code"] == "forbidden"


def test_admin_rejects_wrong_token(admin_client):
    r = admin_client.get(
        "/api/v1/admin/orders/stats",
        headers={"X-Admin-Token": "wrong"},
    )
    assert r.status_code == 403


def test_admin_disabled_when_token_unset(monkeypatch):
    monkeypatch.setenv("ADMIN_TOKEN", "")
    get_settings.cache_clear()
    try:
        app = create_app()
        client = TestClient(app)
        r = client.get(
            "/api/v1/admin/orders/stats",
            headers={"X-Admin-Token": "anything"},
        )
        assert r.status_code == 403
        assert "disabled" in r.json()["error"]["message"].lower()
    finally:
        get_settings.cache_clear()
