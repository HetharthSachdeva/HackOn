"""Product (catalog) response schemas."""

from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, computed_field


class ProductBase(BaseModel):
    """Public projection of a product. Mirrors ``qcommerce_products`` columns."""

    model_config = ConfigDict(from_attributes=True)

    asin: str = Field(..., description="Amazon-style product ID (primary key)")
    title: str
    category: str
    price: Decimal
    img_url: str | None = None
    stars: float | None = None
    reviews: int | None = None
    unit_size: str | None = None
    stock_qty: int | None = None
    in_stock: bool | None = None
    delivery_time_mins: int | None = None
    tags: str | None = None


class ProductRead(ProductBase):
    """Product as returned by list/detail endpoints, with parsed tags."""

    @computed_field  # type: ignore[prop-decorator]
    @property
    def tag_list(self) -> list[str]:
        """Comma-separated ``tags`` parsed into a list."""
        if not self.tags:
            return []
        return [t.strip() for t in self.tags.split(",") if t.strip()]


class CategoryRead(BaseModel):
    """Distinct category, optionally with a product count."""

    name: str
    product_count: int | None = None


class ProductSearchHit(ProductRead):
    """A product returned by semantic/keyword search, with a relevance score."""

    score: float | None = Field(
        None,
        description="Higher is better. For pgvector cosine search this is `1 - distance`.",
    )
