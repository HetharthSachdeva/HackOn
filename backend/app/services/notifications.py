"""Notifications service: persist to Postgres, then fan out via Redis pub/sub.

Persistence is the source of truth — clients can fetch missed notifications
on reconnect via ``GET /notifications``. The pub/sub channel only carries
*live* delivery to currently-connected websockets.
"""

from __future__ import annotations

import uuid
from typing import Any

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.models.notification import Notification, NotificationType
from app.repositories import notification as notif_repo
from app.schemas.notification import NotificationRead
from app.services import events

log = structlog.get_logger(__name__)


async def create_and_publish(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    type: NotificationType,
    title: str,
    body: str | None = None,
    payload: dict[str, Any] | None = None,
) -> NotificationRead:
    """Persist a notification and broadcast it on the user's channel.

    The session is flushed (not committed) so this can participate in a
    larger transaction (e.g., from the order service). The caller is
    responsible for the eventual commit; fan-out only happens once the row
    is visible to other workers, so we publish *after* flush succeeds.
    """
    notif = Notification(
        user_id=user_id,
        type=type.value,
        title=title,
        body=body,
        payload=payload,
    )
    await notif_repo.add(session, notif)

    dto = NotificationRead.model_validate(notif)
    await events.publish(
        events.user_notifications_channel(user_id),
        {"event": "notification", "data": dto.model_dump(mode="json")},
    )
    return dto


async def list_for_user(
    session: AsyncSession,
    user_id: uuid.UUID,
    *,
    limit: int,
    offset: int,
    unread_only: bool,
) -> list[NotificationRead]:
    rows = await notif_repo.list_for_user(
        session, user_id, limit=limit, offset=offset, unread_only=unread_only
    )
    return [NotificationRead.model_validate(r) for r in rows]


async def unread_count(session: AsyncSession, user_id: uuid.UUID) -> int:
    return await notif_repo.unread_count(session, user_id)


async def mark_read(
    session: AsyncSession, user_id: uuid.UUID, notification_id: uuid.UUID
) -> NotificationRead:
    updated = await notif_repo.mark_read(session, user_id, notification_id)
    if not updated:
        # Either it doesn't exist or it's already read; load it for accurate response.
        notif = await notif_repo.get_for_user(session, user_id, notification_id)
        if notif is None:
            raise NotFoundError("Notification not found")
        return NotificationRead.model_validate(notif)
    await session.commit()
    notif = await notif_repo.get_for_user(session, user_id, notification_id)
    assert notif is not None
    return NotificationRead.model_validate(notif)


async def mark_all_read(session: AsyncSession, user_id: uuid.UUID) -> int:
    n = await notif_repo.mark_all_read(session, user_id)
    await session.commit()
    return n
