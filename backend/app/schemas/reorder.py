"""Reorder-subscription schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.reorder import ReorderStatus
from app.schemas.product import ProductRead


class ReorderCreate(BaseModel):
    asin: str = Field(..., examples=["B0EXAMPLE1"])
    quantity: int = Field(1, ge=1, le=50)
    cadence_days: int = Field(..., ge=1, le=180, examples=[7, 14, 30])
    starts_in_days: int = Field(
        0,
        ge=0,
        le=180,
        description="Days from now until the first scheduled run. 0 = today.",
    )


class ReorderUpdate(BaseModel):
    quantity: int | None = Field(None, ge=1, le=50)
    cadence_days: int | None = Field(None, ge=1, le=180)


class ReorderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    asin: str
    quantity: int
    cadence_days: int
    next_run_at: datetime
    status: ReorderStatus
    created_at: datetime
    updated_at: datetime


class ReorderReadWithProduct(ReorderRead):
    product: ProductRead | None = None
