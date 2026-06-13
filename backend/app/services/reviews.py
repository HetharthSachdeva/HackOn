"""Reviews service: per-product summary + per-user CRUD."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError
from app.models.review import Review
from app.repositories import product as product_repo
from app.repositories import review as review_repo
from app.schemas.review import ReviewCreate, ReviewRead, ReviewSummary, ReviewUpdate


async def list_for_product(
    session: AsyncSession, asin: str, *, limit: int, offset: int
) -> list[ReviewRead]:
    rows = await review_repo.list_for_product(session, asin, limit=limit, offset=offset)
    return [ReviewRead.model_validate(r) for r in rows]


async def list_for_user(
    session: AsyncSession, user_id: uuid.UUID, *, limit: int, offset: int
) -> list[ReviewRead]:
    rows = await review_repo.list_for_user(session, user_id, limit=limit, offset=offset)
    return [ReviewRead.model_validate(r) for r in rows]


async def summary(session: AsyncSession, asin: str) -> ReviewSummary:
    avg, n = await review_repo.summary(session, asin)
    return ReviewSummary(asin=asin, average_rating=avg, review_count=n)


async def create(
    session: AsyncSession, user_id: uuid.UUID, payload: ReviewCreate
) -> ReviewRead:
    product = await product_repo.get_product(session, payload.asin)
    if product is None:
        raise NotFoundError(f"Product {payload.asin} not found")
    if await review_repo.get_by_user_and_asin(session, user_id, payload.asin) is not None:
        raise ConflictError(
            "You've already reviewed this product. Edit your existing review instead."
        )
    review = Review(
        user_id=user_id,
        asin=payload.asin,
        rating=payload.rating,
        title=payload.title,
        body=payload.body,
    )
    await review_repo.add(session, review)
    await session.commit()
    await session.refresh(review)
    return ReviewRead.model_validate(review)


async def update(
    session: AsyncSession,
    user_id: uuid.UUID,
    review_id: uuid.UUID,
    payload: ReviewUpdate,
) -> ReviewRead:
    review = await review_repo.get_for_user(session, user_id, review_id)
    if review is None:
        raise NotFoundError("Review not found")
    if payload.rating is not None:
        review.rating = payload.rating
    if payload.title is not None:
        review.title = payload.title
    if payload.body is not None:
        review.body = payload.body
    await session.commit()
    await session.refresh(review)
    return ReviewRead.model_validate(review)


async def delete(
    session: AsyncSession, user_id: uuid.UUID, review_id: uuid.UUID
) -> None:
    review = await review_repo.get_for_user(session, user_id, review_id)
    if review is None:
        raise NotFoundError("Review not found")
    await review_repo.delete(session, review)
    await session.commit()
