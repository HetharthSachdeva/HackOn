"""WebSocket endpoints for live order tracking and notifications.

These use Redis pub/sub for fan-out so they work across multiple uvicorn
workers and across replicas. If Redis isn't configured, the socket is
closed with code 1011 immediately and a structured reason.

Auth: the bearer token is passed as a ``?token=...`` query string parameter
because browsers can't set headers on WebSocket connections.

Wire format
-----------
Every server→client message is a JSON object with at least ``{"event": ...}``::

    {"event": "status_changed", "data": {"order_id": "...", "status": "packed"}}
    {"event": "notification", "data": { ... NotificationRead ... }}
    {"event": "ping"}                            # keepalive every 25s
    {"event": "error", "message": "..."}         # surfaced server-side error
"""

from __future__ import annotations

import asyncio
import uuid

import structlog
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.core import redis as redis_core
from app.core.security import decode_supabase_jwt
from app.repositories import order as order_repo
from app.services import events
from app.core.database import get_session_factory

log = structlog.get_logger(__name__)

router = APIRouter(prefix="/ws", tags=["websockets"])

# WS close codes
_WS_INTERNAL_ERROR = 1011
_WS_POLICY_VIOLATION = 1008

_PING_INTERVAL_SECONDS = 25


async def _authenticate(ws: WebSocket, token: str | None) -> str | None:
    """Verify the bearer token from the query string; return the user_id sub."""
    if not token:
        await ws.close(code=_WS_POLICY_VIOLATION, reason="missing token")
        return None
    try:
        user = decode_supabase_jwt(token)
    except Exception as exc:  # noqa: BLE001
        log.warning("ws.auth_failed", error=str(exc))
        await ws.close(code=_WS_POLICY_VIOLATION, reason="invalid token")
        return None
    return user.id


async def _require_redis(ws: WebSocket) -> bool:
    if not redis_core.is_configured():
        await ws.close(
            code=_WS_INTERNAL_ERROR,
            reason="realtime requires REDIS_URL",
        )
        return False
    return True


async def _ping_loop(ws: WebSocket) -> None:
    """Background keepalive task — proxies/LBs love it."""
    try:
        while True:
            await asyncio.sleep(_PING_INTERVAL_SECONDS)
            await ws.send_json({"event": "ping"})
    except (WebSocketDisconnect, RuntimeError):
        return


async def _stream(ws: WebSocket, *channels: str) -> None:
    """Subscribe to Redis channels and forward every event to the socket."""
    ping_task = asyncio.create_task(_ping_loop(ws))
    try:
        async with events.subscribe(*channels) as stream:
            async for event in stream:
                await ws.send_json(event)
    except WebSocketDisconnect:
        return
    except Exception as exc:  # noqa: BLE001
        log.warning("ws.stream_error", error=str(exc))
        try:
            await ws.send_json({"event": "error", "message": str(exc)})
        except Exception:  # noqa: BLE001 — socket may already be closed
            pass
    finally:
        ping_task.cancel()


@router.websocket("/orders/{order_id}")
async def ws_order(
    websocket: WebSocket,
    order_id: uuid.UUID,
    token: str = Query(..., description="Supabase access token"),
) -> None:
    """Stream live updates for a single order. Auth required."""
    await websocket.accept()
    user_id = await _authenticate(websocket, token)
    if user_id is None:
        return
    if not await _require_redis(websocket):
        return

    # Authorize: the order must belong to this user. We open a short-lived
    # DB session purely for the access check, then close it.
    factory = get_session_factory()
    async with factory() as session:
        order = await order_repo.get_for_user(session, uuid.UUID(user_id), order_id)
    if order is None:
        await websocket.close(code=_WS_POLICY_VIOLATION, reason="order not found")
        return

    await websocket.send_json(
        {
            "event": "connected",
            "data": {"order_id": str(order_id), "status": order.status},
        }
    )
    await _stream(websocket, events.order_channel(order_id))


@router.websocket("/notifications")
async def ws_notifications(
    websocket: WebSocket,
    token: str = Query(..., description="Supabase access token"),
) -> None:
    """Stream live notifications for the authenticated user."""
    await websocket.accept()
    user_id = await _authenticate(websocket, token)
    if user_id is None:
        return
    if not await _require_redis(websocket):
        return

    await websocket.send_json({"event": "connected", "data": {"user_id": user_id}})
    await _stream(websocket, events.user_notifications_channel(user_id))
