"""Cart request/response schemas."""

from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.product import ProductRead


class CartItemAdd(BaseModel):
    """Body for ``POST /cart/items``."""

    asin: str = Field(..., examples=["B0EXAMPLE1"])
    quantity: int = Field(1, ge=1, le=100)


class CartItemUpdate(BaseModel):
    """Body for ``PUT /cart/items/{asin}``."""

    quantity: int = Field(..., ge=1, le=100)


class CartItemRead(BaseModel):
    """A line item enriched with the live product snapshot."""

    model_config = ConfigDict(from_attributes=True)

    asin: str
    quantity: int
    product: ProductRead | None = Field(
        None,
        description="Live product details. May be null if the product is no longer in catalog.",
    )
    line_total: Decimal | None = Field(
        None,
        description="`quantity * product.price`, or null if product is missing.",
    )


class CartRead(BaseModel):
    """Full cart with computed totals."""

    items: list[CartItemRead]
    item_count: int = Field(..., description="Sum of quantities across all lines")
    subtotal: Decimal
    promo_code: str | None = None
    discount: Decimal = Decimal("0")
    delivery_fee: Decimal = Decimal("0")
    total: Decimal


class PromoApply(BaseModel):
    promo_code: str = Field(..., min_length=1, max_length=50, examples=["FLAT50"])
