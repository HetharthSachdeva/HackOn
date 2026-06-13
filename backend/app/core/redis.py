"""Async Redis client (singleton).

Used for:

* WebSocket pub/sub fan-out (orders, notifications) — works across
  multiple uvicorn workers and across multiple replicas.
* Rate limiting (sliding-window counters).
* Short-lived caches when needed (e.g., trending recommendations).

We avoid in-process structures (asyncio.Queue, dict-of-sockets) on purpose
so the API scales horizontally without losing events.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import structlog

from app.core.config import get_settings

if TYPE_CHECKING:
    from redis.asyncio import Redis

log = structlog.get_logger(__name__)

_client: "Redis | None" = None


def is_configured() -> bool:
    """True if ``REDIS_URL`` is set."""
    return bool(get_settings().redis_url)


def get_redis() -> "Redis":
    """Return the process-wide async Redis client.

    Raises:
        RuntimeError: If ``REDIS_URL`` isn't configured. Callers that need
            to behave gracefully should check :func:`is_configured` first.
    """
    global _client
    if _client is not None:
        return _client

    settings = get_settings()
    if not settings.redis_url:
        raise RuntimeError(
            "REDIS_URL is not configured. Set it in .env to enable "
            "realtime / rate-limit / cache features."
        )

    # Imported lazily so the rest of the app can boot without redis-py.
    from redis.asyncio import Redis

    _client = Redis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
    )
    log.info("redis.connected", url=_redact(settings.redis_url))
    return _client


async def close_redis() -> None:
    """Close the singleton client on shutdown."""
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None
        log.info("redis.closed")


def key(*parts: str) -> str:
    """Build a namespaced Redis key from string segments."""
    settings = get_settings()
    return ":".join((settings.redis_namespace, *parts))


def _redact(url: str) -> str:
    """Hide the password segment of a Redis URL for safe logging."""
    if "@" in url and "://" in url:
        scheme, rest = url.split("://", 1)
        creds, host = rest.split("@", 1)
        return f"{scheme}://***@{host}"
    return url
