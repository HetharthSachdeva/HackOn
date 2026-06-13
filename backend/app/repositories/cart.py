"""Cart repository — per-user upsert/remove of cart items."""

from __future__ import annotations

import uuid

from sqlalchemy import delete as sa_delete
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cart import Cart, CartItem


async def get_or_create_cart(session: AsyncSession, user_id: uuid.UUID) -> Cart:
    cart = await session.get(Cart, user_id)
    if cart is None:
        cart = Cart(user_id=user_id)
        session.add(cart)
        await session.flush()
    return cart


async def get_cart(session: AsyncSession, user_id: uuid.UUID) -> Cart | None:
    return await session.get(Cart, user_id)


async def get_item(
    session: AsyncSession, user_id: uuid.UUID, asin: str
) -> CartItem | None:
    stmt = select(CartItem).where(
        CartItem.user_id == user_id, CartItem.asin == asin
    )
    return (await session.execute(stmt)).scalar_one_or_none()


async def upsert_item(
    session: AsyncSession, user_id: uuid.UUID, asin: str, quantity: int
) -> CartItem:
    """Insert or update a cart line, returning the persisted row."""
    existing = await get_item(session, user_id, asin)
    if existing is not None:
        existing.quantity = quantity
        await session.flush()
        return existing
    item = CartItem(user_id=user_id, asin=asin, quantity=quantity)
    session.add(item)
    await session.flush()
    return item


async def remove_item(session: AsyncSession, user_id: uuid.UUID, asin: str) -> bool:
    stmt = sa_delete(CartItem).where(
        CartItem.user_id == user_id, CartItem.asin == asin
    )
    result = await session.execute(stmt)
    return bool(result.rowcount)


async def clear_items(session: AsyncSession, user_id: uuid.UUID) -> None:
    stmt = sa_delete(CartItem).where(CartItem.user_id == user_id)
    await session.execute(stmt)


async def set_promo(
    session: AsyncSession, user_id: uuid.UUID, promo_code: str | None
) -> Cart:
    cart = await get_or_create_cart(session, user_id)
    cart.promo_code = promo_code
    await session.flush()
    return cart
