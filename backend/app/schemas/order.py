"""Order request/response schemas."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.order import OrderStatus
from app.models.payment import PaymentProvider
from app.schemas.delivery import DeliveryRead, SlotType
from app.schemas.payment import PaymentRead


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    asin: str
    title_snapshot: str
    unit_price_snapshot: Decimal
    img_url_snapshot: str | None = None
    quantity: int
    line_total: Decimal


class OrderCreate(BaseModel):
    """Body for ``POST /orders`` — checkout."""

    address_id: uuid.UUID = Field(..., description="ID of a saved address belonging to the user")
    payment_provider: PaymentProvider = Field(
        PaymentProvider.COD,
        description="cod | mock_upi | mock_card",
    )
    slot_type: SlotType = Field(
        SlotType.EXPRESS,
        description="express (immediate) or scheduled (pick a window)",
    )
    scheduled_slot_start: datetime | None = Field(
        None,
        description="Required when slot_type=scheduled; must match an option from /delivery/slots.",
    )


class OrderCancel(BaseModel):
    reason: str | None = Field(None, max_length=500)


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    status: OrderStatus
    subtotal: Decimal
    delivery_fee: Decimal
    discount: Decimal
    total: Decimal
    promo_code: str | None = None
    address_snapshot: dict[str, Any]
    cancelled_at: datetime | None = None
    cancel_reason: str | None = None
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemRead]
    payment: PaymentRead | None = None
    delivery: DeliveryRead | None = None
