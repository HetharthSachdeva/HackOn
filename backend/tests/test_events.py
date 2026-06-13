"""Tests for Redis-backed services in the absence of a live Redis.

When REDIS_URL is empty:
* ``publish`` should silently return 0
* ``subscribe`` should raise RuntimeError
* ``get_redis`` should raise RuntimeError
"""

from __future__ import annotations

import pytest

from app.core import redis as redis_core
from app.core.config import get_settings
from app.services import events


@pytest.fixture
def no_redis(monkeypatch: pytest.MonkeyPatch) -> None:
    """Force ``REDIS_URL=""`` regardless of what .env sets, and reset caches."""
    monkeypatch.setenv("REDIS_URL", "")
    get_settings.cache_clear()
    monkeypatch.setattr(redis_core, "_client", None)
    yield
    get_settings.cache_clear()


@pytest.mark.anyio
async def test_publish_noop_without_redis(no_redis: None) -> None:
    assert redis_core.is_configured() is False
    assert await events.publish("any:channel", {"x": 1}) == 0


@pytest.mark.anyio
async def test_subscribe_raises_without_redis(no_redis: None) -> None:
    with pytest.raises(RuntimeError):
        async with events.subscribe("any:channel"):
            pass


def test_get_redis_raises_without_url(no_redis: None) -> None:
    with pytest.raises(RuntimeError):
        redis_core.get_redis()


def test_key_namespaces() -> None:
    k = redis_core.key("orders", "abc")
    assert k.startswith("qc:")
    assert k.endswith(":orders:abc")


def test_channel_names() -> None:
    assert events.order_channel("o1") == "qc:orders:o1"
    assert events.user_notifications_channel("u1") == "qc:users:u1:notifications"
