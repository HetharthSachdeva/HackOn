"""Event bus on top of Redis pub/sub.

Topics
------
* ``orders:{order_id}`` — order lifecycle events (status changes, ETA).
* ``users:{user_id}:notifications`` — per-user notification fan-out.

Why Redis? In-memory pub/sub doesn't survive across uvicorn workers or
horizontal scale-out — events emitted in worker A would never reach a
client connected to worker B. Redis gives us a single shared channel
without any custom broker.

Payloads are JSON-serialized dicts. Producers don't await subscriber
delivery; this is fire-and-forget.
"""

from __future__ import annotations

import json
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

import structlog

from app.core import redis as redis_core

log = structlog.get_logger(__name__)


# --- Channel name builders -------------------------------------------------


def order_channel(order_id: uuid.UUID | str) -> str:
    return redis_core.key("orders", str(order_id))


def user_notifications_channel(user_id: uuid.UUID | str) -> str:
    return redis_core.key("users", str(user_id), "notifications")


# --- Publish ---------------------------------------------------------------


async def publish(channel: str, event: dict[str, Any]) -> int:
    """Publish ``event`` on ``channel``. Returns subscriber count.

    Silently no-ops (returns 0) if Redis isn't configured — useful for
    background work that shouldn't fail when realtime is disabled.
    """
    if not redis_core.is_configured():
        return 0
    try:
        r = redis_core.get_redis()
        return int(await r.publish(channel, json.dumps(event, default=str)))
    except Exception as exc:  # noqa: BLE001 — never let observability break the call site
        log.warning("events.publish_failed", channel=channel, error=str(exc))
        return 0


# --- Subscribe -------------------------------------------------------------


@asynccontextmanager
async def subscribe(*channels: str) -> AsyncIterator[AsyncIterator[dict[str, Any]]]:
    """Async context manager yielding an iterator of parsed events.

    Usage::

        async with subscribe(order_channel(oid)) as events:
            async for event in events:
                await websocket.send_json(event)
    """
    if not redis_core.is_configured():
        raise RuntimeError(
            "Realtime features require REDIS_URL. Configure it in .env."
        )

    r = redis_core.get_redis()
    pubsub = r.pubsub()
    await pubsub.subscribe(*channels)
    log.info("events.subscribed", channels=list(channels))
    try:
        yield _stream(pubsub)
    finally:
        try:
            await pubsub.unsubscribe(*channels)
        finally:
            await pubsub.aclose()
        log.info("events.unsubscribed", channels=list(channels))


async def _stream(pubsub) -> AsyncIterator[dict[str, Any]]:
    async for raw in pubsub.listen():
        if raw is None or raw.get("type") != "message":
            continue
        data = raw.get("data")
        if not data:
            continue
        try:
            yield json.loads(data)
        except json.JSONDecodeError:
            log.warning("events.bad_payload", data=data[:200])
