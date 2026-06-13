"""Delivery slot + tracking schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.delivery import DeliveryStatus, SlotType


class SlotOption(BaseModel):
    """A delivery slot the user can pick at checkout."""

    slot_type: SlotType
    slot_start: datetime
    slot_end: datetime
    eta_mins: int
    label: str = Field(..., examples=["Express • 12 mins"])


class DeliveryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    slot_type: SlotType
    slot_start: datetime
    slot_end: datetime
    eta_mins: int
    status: DeliveryStatus
    rider_name: str | None = None
    rider_phone: str | None = None
    delivered_at: datetime | None = None
