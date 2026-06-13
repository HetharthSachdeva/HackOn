"""Smart reorder subscription endpoints (skip-don't-order pattern)."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Query, status

from app.core.deps import CurrentUserDep, DBSession
from app.models.reorder import ReorderStatus
from app.schemas.reorder import (
    ReorderCreate,
    ReorderRead,
    ReorderReadWithProduct,
    ReorderUpdate,
)
from app.services import reorders as reorders_service

router = APIRouter(prefix="/reorders", tags=["reorders"])


@router.get(
    "",
    response_model=list[ReorderReadWithProduct],
    summary="List my reorder subscriptions",
)
async def list_my_reorders(
    db: DBSession, user: CurrentUserDep
) -> list[ReorderReadWithProduct]:
    return await reorders_service.list_for_user(db, uuid.UUID(user.id))


@router.get(
    "/upcoming",
    response_model=list[ReorderReadWithProduct],
    summary="List subscriptions due to run within the next N days",
)
async def list_upcoming(
    db: DBSession,
    user: CurrentUserDep,
    within_days: int = Query(7, ge=1, le=90),
) -> list[ReorderReadWithProduct]:
    return await reorders_service.upcoming(db, uuid.UUID(user.id), within_days=within_days)


@router.post(
    "",
    response_model=ReorderRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new reorder subscription",
)
async def create_reorder(
    payload: ReorderCreate, db: DBSession, user: CurrentUserDep
) -> ReorderRead:
    return await reorders_service.create(db, uuid.UUID(user.id), payload)


@router.patch(
    "/{sub_id}",
    response_model=ReorderRead,
    summary="Update quantity / cadence of a subscription",
)
async def update_reorder(
    sub_id: uuid.UUID,
    payload: ReorderUpdate,
    db: DBSession,
    user: CurrentUserDep,
) -> ReorderRead:
    return await reorders_service.update(db, uuid.UUID(user.id), sub_id, payload)


@router.post(
    "/{sub_id}/skip",
    response_model=ReorderRead,
    summary="🔁 Skip the next run — pushes next_run_at by one cadence",
)
async def skip_reorder(
    sub_id: uuid.UUID, db: DBSession, user: CurrentUserDep
) -> ReorderRead:
    return await reorders_service.skip(db, uuid.UUID(user.id), sub_id)


@router.post(
    "/{sub_id}/pause",
    response_model=ReorderRead,
    summary="Pause a subscription",
)
async def pause_reorder(
    sub_id: uuid.UUID, db: DBSession, user: CurrentUserDep
) -> ReorderRead:
    return await reorders_service.set_status(
        db, uuid.UUID(user.id), sub_id, ReorderStatus.PAUSED
    )


@router.post(
    "/{sub_id}/resume",
    response_model=ReorderRead,
    summary="Resume a paused subscription",
)
async def resume_reorder(
    sub_id: uuid.UUID, db: DBSession, user: CurrentUserDep
) -> ReorderRead:
    return await reorders_service.set_status(
        db, uuid.UUID(user.id), sub_id, ReorderStatus.ACTIVE
    )


@router.delete(
    "/{sub_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a subscription",
)
async def delete_reorder(
    sub_id: uuid.UUID, db: DBSession, user: CurrentUserDep
) -> None:
    await reorders_service.delete(db, uuid.UUID(user.id), sub_id)
