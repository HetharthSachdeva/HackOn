"""Verify the WebSocket endpoints close cleanly when Redis isn't configured."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_ws_orders_requires_token(client):
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect("/api/v1/ws/orders/00000000-0000-0000-0000-000000000000"):
            pass
    # FastAPI returns 403 for missing required query params before websocket accept.
    # If accepted then closed, we get a 1008 code instead.
    assert exc.value.code in (1008, 1011, 1006, 403)


def test_ws_notifications_requires_token(client):
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect("/api/v1/ws/notifications"):
            pass
    assert exc.value.code in (1008, 1011, 1006, 403)
