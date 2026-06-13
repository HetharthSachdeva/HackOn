"""Notification schemas."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.models.notification import NotificationType


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    type: NotificationType
    title: str
    body: str | None = None
    payload: dict[str, Any] | None = None
    read_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class NotificationUnreadCount(BaseModel):
    unread: int
