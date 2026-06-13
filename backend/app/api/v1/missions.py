"""Mission bundle endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.deps import DBSession, OptionalUserDep
from app.schemas.mission import MissionBundle, MissionRead
from app.services import missions as missions_service

router = APIRouter(prefix="/missions", tags=["missions"])


@router.get(
    "",
    response_model=list[MissionRead],
    summary="List active mission bundles",
)
async def list_missions(db: DBSession, _user: OptionalUserDep) -> list[MissionRead]:
    return await missions_service.list_missions(db)


@router.get(
    "/{slug}",
    response_model=MissionBundle,
    summary="Resolve a mission into a ready-to-add bundle",
    description=(
        "Runs the mission's semantic query against the live catalog and "
        "returns the top items respecting `max_items` and any filters."
    ),
)
async def get_mission(slug: str, db: DBSession, _user: OptionalUserDep) -> MissionBundle:
    return await missions_service.resolve_bundle(db, slug)
