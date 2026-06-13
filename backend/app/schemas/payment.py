"""Payment request/response schemas."""

from __future__ import annotations

import uuid
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.payment import PaymentProvider, PaymentStatus


class PaymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    provider: PaymentProvider
    provider_ref: str | None = None
    status: PaymentStatus
    amount: Decimal


class PaymentCapture(BaseModel):
    """Body for ``POST /payments/{id}/capture`` (mock providers only)."""

    success: bool = True
