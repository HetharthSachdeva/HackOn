from __future__ import annotations

from pydantic import BaseModel


class ExtractedQuery(BaseModel):
    items: list[str]
    budget: float | None = None
    occasion: str | None = None
    preferences: list[str] = []
    categories: list[str] = []
    tags: list[str] = []
