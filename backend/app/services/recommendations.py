"""Recommendation feeds: trending, your-usual, and similar.

For Phase 3 these are intentionally simple and read directly from the
catalog — no learning loop yet. They're shaped to be swappable with real
ranking models later.
"""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.product import ProductRead


async def trending(
    session: AsyncSession, *, limit: int = 12
) -> list[ProductRead]:
    """Highest-engagement in-stock products (proxy: reviews * stars)."""
    stmt = (
        select(Product)
        .where(Product.in_stock.is_(True))
        .order_by(
            (func.coalesce(Product.reviews, 0) * func.coalesce(Product.stars, 0)).desc()
        )
        .limit(limit)
    )
    rows = (await session.execute(stmt)).scalars().all()
    return [ProductRead.model_validate(p) for p in rows]


async def your_usual(
    session: AsyncSession, user_id: uuid.UUID, *, limit: int = 12
) -> list[ProductRead]:
    """Products the user has ordered most often historically."""
    stmt = (
        select(OrderItem.asin, func.sum(OrderItem.quantity).label("n"))
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.user_id == user_id)
        .group_by(OrderItem.asin)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
    )
    rows = (await session.execute(stmt)).all()
    asins = [r[0] for r in rows]
    if not asins:
        return await trending(session, limit=limit)

    products_stmt = select(Product).where(Product.asin.in_(asins))
    products = {p.asin: p for p in (await session.execute(products_stmt)).scalars().all()}
    return [
        ProductRead.model_validate(products[a]) for a in asins if a in products
    ]


async def for_you(
    session: AsyncSession, user_id: uuid.UUID, *, limit: int = 12
) -> list[ProductRead]:
    """Personalized feed: your-usual blended with trending fill."""
    primary = await your_usual(session, user_id, limit=limit)
    if len(primary) >= limit:
        return primary
    seen = {p.asin for p in primary}
    fill = [
        p
        for p in await trending(session, limit=limit * 2)
        if p.asin not in seen
    ]
    return (primary + fill)[:limit]
