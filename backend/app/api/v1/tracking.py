from __future__ import annotations

import uuid
from fastapi import APIRouter, status, BackgroundTasks

from app.core.deps import CurrentUserDep, DBSession
from app.schemas.tracking import TrackingEventRequest
from app.services import tracking

router = APIRouter(prefix="/tracking", tags=["tracking"])


@router.post(
    "/event",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Track a user event for personalization",
)
async def post_tracking_event(
    payload: TrackingEventRequest,
    db: DBSession,
    user: CurrentUserDep,
    background_tasks: BackgroundTasks,
) -> dict[str, str]:
    """Asynchronously logs the event and updates the user's preference vector."""
    user_id = uuid.UUID(user.id)
    
    # Run the vector update in the background so we don't block the API response
    background_tasks.add_task(
        tracking.track_event,
        db,
        user_id,
        payload.event_type,
        payload.asin,
        payload.query,
    )
    
    return {"status": "accepted"}
