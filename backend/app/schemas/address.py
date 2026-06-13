"""Address request/response schemas."""

from __future__ import annotations

import uuid
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class AddressBase(BaseModel):
    label: str | None = Field(None, max_length=50, examples=["Home"])
    recipient_name: str = Field(..., max_length=200, examples=["Jane Doe"])
    phone: str = Field(..., max_length=20, examples=["+919876543210"])
    line1: str = Field(..., examples=["123 MG Road"])
    line2: str | None = None
    city: str = Field(..., max_length=100, examples=["Bengaluru"])
    state: str = Field(..., max_length=100, examples=["Karnataka"])
    pincode: str = Field(..., max_length=20, examples=["560001"])
    landmark: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    """All fields optional — only supplied ones are updated."""

    label: str | None = None
    recipient_name: str | None = None
    phone: str | None = None
    line1: str | None = None
    line2: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    landmark: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    is_default: bool | None = None


class AddressRead(AddressBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
