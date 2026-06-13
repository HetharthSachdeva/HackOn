"""Reviews & ratings endpoints."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Query, status

from app.core.deps import CurrentUserDep, DBSession, OptionalUserDep
from app.schemas.review import ReviewCreate, ReviewRead, ReviewSummary, ReviewUpdate
from app.services import reviews as reviews_service

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get(
    "/product/{asin}",
    response_model=list[ReviewRead],
    summary="List reviews for a product (newest first)",
)
async def list_for_product(
    asin: str,
    db: DBSession,
    _user: OptionalUserDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[ReviewRead]:
    return await reviews_service.list_for_product(db, asin, limit=limit, offset=offset)


@router.get(
    "/product/{asin}/summary",
    response_model=ReviewSummary,
    summary="Aggregate rating for a product",
)
async def product_summary(
    asin: str, db: DBSession, _user: OptionalUserDep
) -> ReviewSummary:
    return await reviews_service.summary(db, asin)


@router.get(
    "/mine",
    response_model=list[ReviewRead],
    summary="List my reviews",
)
async def list_mine(
    db: DBSession,
    user: CurrentUserDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[ReviewRead]:
    return await reviews_service.list_for_user(
        db, uuid.UUID(user.id), limit=limit, offset=offset
    )


@router.post(
    "",
    response_model=ReviewRead,
    status_code=status.HTTP_201_CREATED,
    summary="Write a review for a product",
)
async def create_review(
    payload: ReviewCreate, db: DBSession, user: CurrentUserDep
) -> ReviewRead:
    return await reviews_service.create(db, uuid.UUID(user.id), payload)


@router.patch(
    "/{review_id}",
    response_model=ReviewRead,
    summary="Edit one of my reviews",
)
async def update_review(
    review_id: uuid.UUID,
    payload: ReviewUpdate,
    db: DBSession,
    user: CurrentUserDep,
) -> ReviewRead:
    return await reviews_service.update(db, uuid.UUID(user.id), review_id, payload)


@router.delete(
    "/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete one of my reviews",
)
async def delete_review(
    review_id: uuid.UUID, db: DBSession, user: CurrentUserDep
) -> None:
    await reviews_service.delete(db, uuid.UUID(user.id), review_id)
