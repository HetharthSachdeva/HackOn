"""Sliding-window rate limiter backed by Redis.

Per-IP per-minute counter. Disabled by default (``RATE_LIMIT_ENABLED=false``)
since the hackathon demo doesn't need it; flip the env var to harden in
staging/prod. Whitelisted paths (``/health``, ``/openapi.json``, ``/docs``)
are never rate-limited.

We use Redis ``INCR`` + ``EXPIRE`` (a coarse fixed-window) rather than a
true sliding log to keep latency in the 1ms range. Good enough for ~120 RPM
default. For true sliding-window precision, swap in a ZSET-of-timestamps
implementation later.

If Redis is unreachable, requests are *allowed* — fail open. Rate-limiting
should never take down the API itself.
"""

from __future__ import annotations

import structlog
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core import redis as redis_core
from app.core.config import get_settings

log = structlog.get_logger(__name__)

_EXEMPT_PREFIXES = (
    "/health",
    "/api/v1/health",
    "/docs",
    "/redoc",
    "/openapi.json",
)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Cap requests-per-minute per client IP using a Redis counter."""

    async def dispatch(self, request: Request, call_next):
        settings = get_settings()
        if not settings.rate_limit_enabled or not redis_core.is_configured():
            return await call_next(request)

        path = request.url.path
        if any(path.startswith(p) for p in _EXEMPT_PREFIXES):
            return await call_next(request)

        client_ip = _client_ip(request)
        window_key = redis_core.key("ratelimit", client_ip)
        try:
            r = redis_core.get_redis()
            count = await r.incr(window_key)
            if count == 1:
                await r.expire(window_key, 60)
        except Exception as exc:  # noqa: BLE001 — fail open
            log.warning("ratelimit.redis_error_failing_open", error=str(exc))
            return await call_next(request)

        if count > settings.rate_limit_per_minute:
            return JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "code": "rate_limited",
                        "message": "Too many requests. Slow down a bit.",
                        "details": {
                            "limit_per_minute": settings.rate_limit_per_minute,
                            "current": int(count),
                        },
                        "request_id": getattr(request.state, "request_id", None),
                    }
                },
                headers={"Retry-After": "60"},
            )
        return await call_next(request)


def _client_ip(request: Request) -> str:
    """Best-effort client IP, honouring ``X-Forwarded-For`` if present."""
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
