from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class TrackingEventRequest(BaseModel):
    event_type: Literal["view", "cart_add", "search"]
    asin: str | None = Field(None, description="The product ASIN (required for view/cart_add)")
    query: str | None = Field(None, description="The search query (required for search)")
