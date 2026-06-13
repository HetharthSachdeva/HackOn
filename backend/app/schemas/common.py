"""Cross-cutting schemas: pagination, generic envelopes."""

from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """Standard paginated response envelope."""

    items: list[T]
    total: int = Field(..., description="Total number of items matching the query")
    limit: int = Field(..., description="Page size")
    offset: int = Field(..., description="Items skipped before this page")

    @property
    def has_more(self) -> bool:
        return self.offset + len(self.items) < self.total
