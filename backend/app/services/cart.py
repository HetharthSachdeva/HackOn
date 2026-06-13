"""Cart service: read enriched cart with live prices, totals, and discounts."""

from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError, ValidationError
from app.models.cart import CartItem
from app.repositories import cart as cart_repo
from app.repositories import product as product_repo
from app.schemas.cart import CartItemRead, CartRead
from app.schemas.product import ProductRead
from app.services import promos

# Hackathon flat delivery fee. Real systems compute from distance/slot.
DELIVERY_FEE = Decimal("29.00")
FREE_DELIVERY_OVER = Decimal("499.00")


async def get_enriched_cart(session: AsyncSession, user_id: uuid.UUID) -> CartRead:
    """Return the user's cart joined to live product data with totals."""
    cart = await cart_repo.get_cart(session, user_id)
    items: list[CartItem] = cart.items if cart else []

    by_asin = await product_repo.get_products_by_asins(
        session, [item.asin for item in items]
    )

    item_reads: list[CartItemRead] = []
    subtotal = Decimal("0")
    item_count = 0
    for item in items:
        product = by_asin.get(item.asin)
        product_dto = ProductRead.model_validate(product) if product else None
        line_total: Decimal | None = None
        if product is not None:
            line_total = (product.price * item.quantity).quantize(Decimal("0.01"))
            subtotal += line_total
        item_count += item.quantity
        item_reads.append(
            CartItemRead(
                asin=item.asin,
                quantity=item.quantity,
                product=product_dto,
                line_total=line_total,
            )
        )

    promo = promos.lookup(cart.promo_code if cart else None)
    discount = promos.compute_discount(promo, subtotal)

    delivery_fee = Decimal("0") if subtotal >= FREE_DELIVERY_OVER else DELIVERY_FEE
    # Empty cart shouldn't be charged delivery.
    if subtotal == Decimal("0"):
        delivery_fee = Decimal("0")

    total = (subtotal - discount + delivery_fee).quantize(Decimal("0.01"))

    return CartRead(
        items=item_reads,
        item_count=item_count,
        subtotal=subtotal.quantize(Decimal("0.01")),
        promo_code=cart.promo_code if cart else None,
        discount=discount.quantize(Decimal("0.01")),
        delivery_fee=delivery_fee.quantize(Decimal("0.01")),
        total=total,
    )


async def add_item(
    session: AsyncSession, user_id: uuid.UUID, asin: str, quantity: int
) -> CartRead:
    """Add ``quantity`` of ``asin`` to the cart (additive when already present)."""
    product = await product_repo.get_product(session, asin)
    if product is None:
        raise NotFoundError(f"Product {asin} not found")
    if product.in_stock is False:
        raise ValidationError(f"Product {asin} is out of stock")

    await cart_repo.get_or_create_cart(session, user_id)
    existing = await cart_repo.get_item(session, user_id, asin)
    new_qty = (existing.quantity if existing else 0) + quantity
    if product.stock_qty is not None and new_qty > product.stock_qty:
        raise ValidationError(
            f"Only {product.stock_qty} unit(s) available for {asin}",
        )
    await cart_repo.upsert_item(session, user_id, asin, new_qty)
    return await get_enriched_cart(session, user_id)


async def update_item(
    session: AsyncSession, user_id: uuid.UUID, asin: str, quantity: int
) -> CartRead:
    product = await product_repo.get_product(session, asin)
    if product is None:
        raise NotFoundError(f"Product {asin} not found")
    if product.stock_qty is not None and quantity > product.stock_qty:
        raise ValidationError(f"Only {product.stock_qty} unit(s) available for {asin}")
    existing = await cart_repo.get_item(session, user_id, asin)
    if existing is None:
        raise NotFoundError(f"{asin} is not in your cart")
    await cart_repo.upsert_item(session, user_id, asin, quantity)
    return await get_enriched_cart(session, user_id)


async def remove_item(
    session: AsyncSession, user_id: uuid.UUID, asin: str
) -> CartRead:
    removed = await cart_repo.remove_item(session, user_id, asin)
    if not removed:
        raise NotFoundError(f"{asin} is not in your cart")
    return await get_enriched_cart(session, user_id)


async def clear(session: AsyncSession, user_id: uuid.UUID) -> CartRead:
    await cart_repo.clear_items(session, user_id)
    return await get_enriched_cart(session, user_id)


async def apply_promo(
    session: AsyncSession, user_id: uuid.UUID, code: str
) -> CartRead:
    promo = promos.lookup(code)
    if promo is None:
        raise NotFoundError(f"Promo code {code!r} not found")
    await cart_repo.set_promo(session, user_id, promo.code)
    return await get_enriched_cart(session, user_id)


async def remove_promo(session: AsyncSession, user_id: uuid.UUID) -> CartRead:
    await cart_repo.set_promo(session, user_id, None)
    return await get_enriched_cart(session, user_id)
