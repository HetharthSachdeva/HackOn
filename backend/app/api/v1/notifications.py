"""Notification endpoints (persisted feed)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Query, status

from app.core.deps import CurrentUserDep, DBSession
from app.schemas.notification import NotificationRead, NotificationUnreadCount
from app.services import notifications as notif_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get(
    "",
    response_model=list[NotificationRead],
    summary="List my notifications",
)
async def list_notifications(
    db: DBSession,
    user: CurrentUserDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    unread_only: bool = False,
) -> list[NotificationRead]:
    return await notif_service.list_for_user(
        db,
        uuid.UUID(user.id),
        limit=limit,
        offset=offset,
        unread_only=unread_only,
    )


@router.get(
    "/unread-count",
    response_model=NotificationUnreadCount,
    summary="Count of unread notifications",
)
async def unread_count(
    db: DBSession, user: CurrentUserDep
) -> NotificationUnreadCount:
    n = await notif_service.unread_count(db, uuid.UUID(user.id))
    return NotificationUnreadCount(unread=n)


@router.post(
    "/{notification_id}/read",
    response_model=NotificationRead,
    summary="Mark a notification as read",
)
async def mark_read(
    notification_id: uuid.UUID, db: DBSession, user: CurrentUserDep
) -> NotificationRead:
    return await notif_service.mark_read(db, uuid.UUID(user.id), notification_id)


@router.post(
    "/read-all",
    status_code=status.HTTP_200_OK,
    summary="Mark all my notifications as read",
)
async def mark_all_read(
    db: DBSession, user: CurrentUserDep
) -> dict[str, int]:
    n = await notif_service.mark_all_read(db, uuid.UUID(user.id))
    return {"marked_read": n}
