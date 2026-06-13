"""Repository: reviews."""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review import Review


async def list_for_product(
    session: AsyncSession, asin: str, *, limit: int, offset: int
) -> list[Review]:
    stmt = (
        select(Review)
        .where(Review.asin == asin)
        .order_by(Review.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list((await session.execute(stmt)).scalars().all())


async def list_for_user(
    session: AsyncSession, user_id: uuid.UUID, *, limit: int, offset: int
) -> list[Review]:
    stmt = (
        select(Review)
        .where(Review.user_id == user_id)
        .order_by(Review.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list((await session.execute(stmt)).scalars().all())


async def get_by_user_and_asin(
    session: AsyncSession, user_id: uuid.UUID, asin: str
) -> Review | None:
    stmt = select(Review).where(Review.user_id == user_id, Review.asin == asin)
    return (await session.execute(stmt)).scalar_one_or_none()


async def get_for_user(
    session: AsyncSession, user_id: uuid.UUID, review_id: uuid.UUID
) -> Review | None:
    stmt = select(Review).where(Review.id == review_id, Review.user_id == user_id)
    return (await session.execute(stmt)).scalar_one_or_none()


async def add(session: AsyncSession, review: Review) -> Review:
    session.add(review)
    await session.flush()
    return review


async def delete(session: AsyncSession, review: Review) -> None:
    await session.delete(review)
    await session.flush()


async def summary(session: AsyncSession, asin: str) -> tuple[float | None, int]:
    """Return ``(avg_rating, count)`` for an ASIN — ``(None, 0)`` if no reviews."""
    stmt = select(
        func.avg(Review.rating).label("avg"),
        func.count(Review.id).label("n"),
    ).where(Review.asin == asin)
    row = (await session.execute(stmt)).one()
    avg = float(row.avg) if row.avg is not None else None
    return avg, int(row.n)
