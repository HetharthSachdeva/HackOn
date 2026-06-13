"""Delivery: slot options + tracking lookup."""

from __future__ import annotations

import uuid

from fastapi import APIRouter

from app.core.deps import CurrentUserDep, DBSession
from app.core.errors import NotFoundError
from app.repositories import order as order_repo
from app.schemas.delivery import DeliveryRead, SlotOption
from app.services.delivery import generate_slots

router = APIRouter(prefix="/delivery", tags=["delivery"])


@router.get(
    "/slots",
    response_model=list[SlotOption],
    summary="Available delivery slots (express + scheduled windows)",
)
async def list_slots() -> list[SlotOption]:
    return generate_slots()


@router.get(
    "/orders/{order_id}",
    response_model=DeliveryRead,
    summary="Get delivery details for one of my orders",
)
async def get_order_delivery(
    order_id: uuid.UUID, db: DBSession, user: CurrentUserDep
) -> DeliveryRead:
    order = await order_repo.get_for_user(db, uuid.UUID(user.id), order_id)
    if order is None or order.delivery is None:
        raise NotFoundError("Delivery not found")
    return DeliveryRead.model_validate(order.delivery)
