"""Read-only data access for ``qcommerce_products``."""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import defer

from app.models.product import Product


def _apply_filters(
    stmt: Select,
    *,
    category: str | None,
    min_price: Decimal | None,
    max_price: Decimal | None,
    in_stock_only: bool,
    min_stars: float | None,
    q: str | None,
) -> Select:
    if category:
        stmt = stmt.where(Product.category == category)
    if min_price is not None:
        stmt = stmt.where(Product.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Product.price <= max_price)
    if in_stock_only:
        stmt = stmt.where(Product.in_stock.is_(True))
    if min_stars is not None:
        stmt = stmt.where(Product.stars >= min_stars)
    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Product.title.ilike(pattern),
                Product.tags.ilike(pattern),
                Product.category.ilike(pattern),
            )
        )
    return stmt


_SORT_MAP = {
    "price_asc": Product.price.asc(),
    "price_desc": Product.price.desc(),
    "stars_desc": Product.stars.desc().nullslast(),
    "reviews_desc": Product.reviews.desc().nullslast(),
}


async def list_products(
    session: AsyncSession,
    *,
    limit: int,
    offset: int,
    category: str | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    in_stock_only: bool = False,
    min_stars: float | None = None,
    q: str | None = None,
    sort: str | None = None,
) -> tuple[list[Product], int]:
    """Return (page, total) for a filtered product list."""
    base = select(Product)
    base = _apply_filters(
        base,
        category=category,
        min_price=min_price,
        max_price=max_price,
        in_stock_only=in_stock_only,
        min_stars=min_stars,
        q=q,
    )

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    order_by = _SORT_MAP.get(sort or "", Product.reviews.desc().nullslast())
    page_stmt = base.options(defer(Product.embedding)).order_by(order_by).limit(limit).offset(offset)
    rows = (await session.execute(page_stmt)).scalars().all()
    return list(rows), int(total)


async def get_product(session: AsyncSession, asin: str) -> Product | None:
    stmt = select(Product).options(defer(Product.embedding)).where(Product.asin == asin)
    return (await session.execute(stmt)).scalar_one_or_none()


async def get_products_by_asins(
    session: AsyncSession, asins: list[str]
) -> dict[str, Product]:
    """Return a ``{asin: Product}`` dict for the given ASINs (missing ones omitted)."""
    if not asins:
        return {}
    stmt = select(Product).options(defer(Product.embedding)).where(Product.asin.in_(asins))
    rows = (await session.execute(stmt)).scalars().all()
    return {row.asin: row for row in rows}


async def list_categories(session: AsyncSession) -> list[tuple[str, int]]:
    """Return ``[(category, product_count), ...]`` ordered by count desc."""
    stmt = (
        select(Product.category, func.count().label("n"))
        .group_by(Product.category)
        .order_by(func.count().desc())
    )
    rows = (await session.execute(stmt)).all()
    return [(name, int(n)) for name, n in rows]
