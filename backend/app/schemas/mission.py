"""Mission bundle schemas."""

from __future__ import annotations

import uuid
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.product import ProductRead


class MissionBase(BaseModel):
    slug: str = Field(..., max_length=80, examples=["hangover-kit"])
    title: str = Field(..., max_length=200, examples=["Hangover Kit"])
    description: str | None = None
    image_url: str | None = None
    hero_color: str | None = Field(None, examples=["#FF6B6B"])
    query: str = Field(..., examples=["coconut water electrolytes painkiller bananas"])
    max_items: int = Field(6, ge=1, le=20)
    category_filter: str | None = None
    max_unit_price: Decimal | None = None
    is_active: int = 1


class MissionCreate(MissionBase):
    pass


class MissionRead(MissionBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID


class MissionBundleItem(BaseModel):
    product: ProductRead
    suggested_quantity: int = 1


class MissionBundle(BaseModel):
    """Full mission bundle resolved at request time."""

    mission: MissionRead
    items: list[MissionBundleItem]
    estimated_total: Decimal
    used_semantic: bool
