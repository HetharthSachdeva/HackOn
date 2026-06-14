"""Request/response schemas for AI endpoints."""

from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.product import ProductSearchHit


class SemanticSearchRequest(BaseModel):
    q: str = Field(..., min_length=1, max_length=500, examples=["healthy late-night snacks under ₹200"])
    limit: int = Field(20, ge=1, le=50)
    in_stock_only: bool = True


class SemanticSearchResponse(BaseModel):
    query: str
    used_semantic: bool = Field(
        ...,
        description="True if the embedding model was used; False if we fell back to keyword search.",
    )
    items: list[ProductSearchHit]


class IntentToCartRequest(BaseModel):
    """Body for ``POST /ai/cart-from-intent``."""

    prompt: str = Field(
        ...,
        min_length=2,
        max_length=500,
        examples=["dinner for 4, vegetarian, under ₹800"],
    )
    budget: Decimal | None = Field(
        None,
        ge=Decimal("0"),
        description="Optional hard budget cap; parsed from the prompt if omitted.",
    )
    max_items: int = Field(8, ge=1, le=20)


class IntentCartItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    asin: str
    title: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal
    img_url: str | None = None
    rationale: str | None = None


class BundleComponent(BaseModel):
    component_name: str
    options: list[IntentCartItem]


class IntentToCartResponse(BaseModel):
    prompt: str
    explanation: str
    components: list[BundleComponent]
    budget: Decimal | None = None
    used_semantic: bool = True


class SimilarRequest(BaseModel):
    asin: str
    limit: int = Field(10, ge=1, le=50)


class SnapToCartResponse(BaseModel):
    """Stub response shape for ``POST /ai/snap-to-cart`` (vision pending)."""

    detected_keywords: list[str]
    items: list[ProductSearchHit]
    note: str = "Snap-to-cart is a stub. Wire a vision model to populate `detected_keywords`."
