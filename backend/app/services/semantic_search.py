"""Semantic + keyword search over the product catalog.

The semantic path uses pgvector cosine distance over the
``qcommerce_products.embedding`` column. The keyword fallback uses ILIKE
on title/tags/category. Both share a common return shape.
"""

from __future__ import annotations

from typing import Any

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import uuid

from app.ai import embedding
from app.models.product import Product
from app.models.user_preference import UserPreference
from app.repositories import product as product_repo
from app.schemas.product import ProductSearchHit

log = structlog.get_logger(__name__)


def _has_vector(vec: Any) -> bool:
    """Return True when a pgvector value is present without bool-evaluating arrays."""
    if vec is None:
        return False
    try:
        return len(vec) > 0
    except TypeError:
        return True


async def search(
    session: AsyncSession,
    query: str,
    *,
    limit: int = 20,
    in_stock_only: bool = True,
    user_id: uuid.UUID | None = None,
) -> tuple[list[ProductSearchHit], bool]:
    """Return ``(hits, used_semantic)``.

    Falls back to keyword search if the embedding model is unavailable or
    fails for any reason. The ``used_semantic`` flag tells the caller which
    path was taken.
    """
    try:
        vec = embedding.embed_text(query)
    except Exception as exc:  # noqa: BLE001 — broad on purpose, fall through to keyword
        log.warning("semantic.unavailable_using_keyword", error=str(exc))
        return await _keyword(session, query, limit=limit, in_stock_only=in_stock_only), False

    user_vec = None
    if user_id:
        user_pref = (await session.execute(select(UserPreference).where(UserPreference.user_id == user_id))).scalar_one_or_none()
        if user_pref and _has_vector(user_pref.embedding):
            user_vec = user_pref.embedding

    return await _semantic(session, vec, limit=limit, in_stock_only=in_stock_only, user_vec=user_vec), True


async def _semantic(
    session: AsyncSession,
    vec: list[float],
    *,
    limit: int,
    in_stock_only: bool,
    user_vec: list[float] | None = None,
) -> list[ProductSearchHit]:
    query_distance = Product.embedding.cosine_distance(vec)
    if _has_vector(user_vec):
        user_distance = Product.embedding.cosine_distance(user_vec)
        distance = (query_distance * 0.85 + user_distance * 0.15).label("distance")
    else:
        distance = query_distance.label("distance")
        
    stmt = (
        select(Product, distance)
        .where(Product.embedding.is_not(None))
        .where(query_distance < 0.65)
        .order_by(distance.asc())
        .limit(limit)
    )
    if in_stock_only:
        stmt = stmt.where(Product.in_stock.is_(True))
    rows = (await session.execute(stmt)).all()
    return [_to_hit(product, score=1.0 - float(dist)) for product, dist in rows]


async def _keyword(
    session: AsyncSession,
    query: str,
    *,
    limit: int,
    in_stock_only: bool,
) -> list[ProductSearchHit]:
    items, _total = await product_repo.list_products(
        session,
        limit=limit,
        offset=0,
        q=query,
        in_stock_only=in_stock_only,
        sort="reviews_desc",
    )
    return [_to_hit(p, score=None) for p in items]


async def similar(
    session: AsyncSession, asin: str, *, limit: int = 10
) -> list[ProductSearchHit]:
    """Find catalog neighbors of one product via pgvector."""
    anchor = await product_repo.get_product(session, asin)
    if anchor is None or anchor.embedding is None:
        return []
    distance = Product.embedding.cosine_distance(anchor.embedding).label("distance")
    stmt = (
        select(Product, distance)
        .where(Product.asin != asin, Product.embedding.is_not(None))
        .order_by(distance.asc())
        .limit(limit)
    )
    rows = (await session.execute(stmt)).all()
    return [_to_hit(p, score=1.0 - float(d)) for p, d in rows]


def _to_hit(product: Product, *, score: float | None) -> ProductSearchHit:
    data: dict[str, Any] = ProductSearchHit.model_validate(product).model_dump()
    data["score"] = score
    return ProductSearchHit(**data)
