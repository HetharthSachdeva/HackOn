"""Review schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    asin: str = Field(..., examples=["B0EXAMPLE1"])
    rating: int = Field(..., ge=1, le=5)
    title: str | None = Field(None, max_length=200)
    body: str | None = Field(None, max_length=5000)


class ReviewUpdate(BaseModel):
    rating: int | None = Field(None, ge=1, le=5)
    title: str | None = Field(None, max_length=200)
    body: str | None = Field(None, max_length=5000)


class ReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    asin: str
    rating: int
    title: str | None = None
    body: str | None = None
    created_at: datetime
    updated_at: datetime


class ReviewSummary(BaseModel):
    asin: str
    average_rating: float | None = None
    review_count: int = 0
