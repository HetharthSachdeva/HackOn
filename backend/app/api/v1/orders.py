"""Order endpoints: place, list, get, cancel, reorder, advance state."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Query, status

from app.core.deps import CurrentUserDep, DBSession
from app.core.errors import NotFoundError
from app.models.order import OrderStatus
from app.repositories import order as order_repo
from app.schemas.order import OrderCancel, OrderCreate, OrderRead
from app.services import order as order_service

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post(
    "",
    response_model=OrderRead,
    status_code=status.HTTP_201_CREATED,
    summary="Place an order from my cart",
)
async def place_order(
    payload: OrderCreate, db: DBSession, user: CurrentUserDep
) -> OrderRead:
    order = await order_service.place_order(db, uuid.UUID(user.id), payload)
    return OrderRead.model_validate(order)


@router.get("", response_model=list[OrderRead], summary="List my orders")
async def list_orders(
    db: DBSession,
    user: CurrentUserDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[OrderRead]:
    rows = await order_repo.list_for_user(
        db, uuid.UUID(user.id), limit=limit, offset=offset
    )
    return [OrderRead.model_validate(o) for o in rows]


@router.get("/{order_id}", response_model=OrderRead, summary="Get one of my orders")
async def get_order(
    order_id: uuid.UUID, db: DBSession, user: CurrentUserDep
) -> OrderRead:
    order = await order_repo.get_for_user(db, uuid.UUID(user.id), order_id)
    if order is None:
        raise NotFoundError("Order not found")
    return OrderRead.model_validate(order)


@router.post(
    "/{order_id}/cancel",
    response_model=OrderRead,
    summary="Cancel an order (only allowed while placed/confirmed)",
)
async def cancel_order(
    order_id: uuid.UUID,
    payload: OrderCancel,
    db: DBSession,
    user: CurrentUserDep,
) -> OrderRead:
    order = await order_service.cancel_order(
        db, uuid.UUID(user.id), order_id, payload.reason
    )
    await db.refresh(order)
    return OrderRead.model_validate(order)


@router.post(
    "/{order_id}/reorder",
    summary="Push the items from a past order back into my cart",
)
async def reorder(
    order_id: uuid.UUID, db: DBSession, user: CurrentUserDep
) -> dict[str, list[str]]:
    added = await order_service.reorder(db, uuid.UUID(user.id), order_id)
    return {"added_asins": list(added)}


@router.post(
    "/{order_id}/advance",
    response_model=OrderRead,
    summary="(Demo/admin) advance an order to the next state",
    description=(
        "Convenience endpoint for the hackathon demo. In production this "
        "would be triggered by warehouse / rider apps, not the user. "
        "Emits a notification + WebSocket event on success."
    ),
)
async def advance_order(
    order_id: uuid.UUID,
    target: OrderStatus,
    db: DBSession,
    user: CurrentUserDep,
) -> OrderRead:
    order = await order_repo.get_for_user(db, uuid.UUID(user.id), order_id)
    if order is None:
        raise NotFoundError("Order not found")
    await order_service.transition_and_notify(db, order, target)
    await db.refresh(order)
    return OrderRead.model_validate(order)
