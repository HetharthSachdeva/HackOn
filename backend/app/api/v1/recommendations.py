"""Recommendation endpoints: trending, for-you, your-usual."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Query

from app.core.deps import CurrentUserDep, DBSession, OptionalUserDep
from app.schemas.product import ProductRead
from app.services import recommendations as recs_service

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get(
    "/trending",
    response_model=list[ProductRead],
    summary="Trending products right now",
)
async def get_trending(
    db: DBSession,
    _user: OptionalUserDep,
    limit: int = Query(12, ge=1, le=50),
) -> list[ProductRead]:
    return await recs_service.trending(db, limit=limit)


@router.get(
    "/your-usual",
    response_model=list[ProductRead],
    summary="Products you order most often",
)
async def get_your_usual(
    db: DBSession,
    user: CurrentUserDep,
    limit: int = Query(12, ge=1, le=50),
) -> list[ProductRead]:
    return await recs_service.your_usual(db, uuid.UUID(user.id), limit=limit)


@router.get(
    "/for-you",
    response_model=list[ProductRead],
    summary="Personalized feed (your-usual blended with trending)",
)
async def get_for_you(
    db: DBSession,
    user: CurrentUserDep,
    limit: int = Query(12, ge=1, le=50),
) -> list[ProductRead]:
    return await recs_service.for_you(db, uuid.UUID(user.id), limit=limit)
