"""Payment endpoints: status lookup + mock capture."""

from __future__ import annotations

import uuid

from fastapi import APIRouter

from app.core.deps import CurrentUserDep, DBSession
from app.core.errors import NotFoundError
from app.repositories import order as order_repo
from app.schemas.payment import PaymentCapture, PaymentRead
from app.services import payment as payment_service

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get(
    "/orders/{order_id}",
    response_model=PaymentRead,
    summary="Get the payment for one of my orders",
)
async def get_for_order(
    order_id: uuid.UUID, db: DBSession, user: CurrentUserDep
) -> PaymentRead:
    order = await order_repo.get_for_user(db, uuid.UUID(user.id), order_id)
    if order is None or order.payment is None:
        raise NotFoundError("Payment not found")
    return PaymentRead.model_validate(order.payment)


@router.post(
    "/orders/{order_id}/capture",
    response_model=PaymentRead,
    summary="Capture a pending mock-card / mock-UPI payment",
    description=(
        "Mock providers only. Flips the payment to `captured` (or `failed`) "
        "and, on success, transitions the order from `placed` → `confirmed`."
    ),
)
async def capture_payment(
    order_id: uuid.UUID,
    payload: PaymentCapture,
    db: DBSession,
    user: CurrentUserDep,
) -> PaymentRead:
    from app.models.order import OrderStatus
    from app.services.order import transition_status

    order = await order_repo.get_for_user(db, uuid.UUID(user.id), order_id)
    if order is None:
        raise NotFoundError("Order not found")

    payment = payment_service.capture_payment(order.payment, success=payload.success)
    if payload.success and order.status == OrderStatus.PLACED.value:
        transition_status(order, OrderStatus.CONFIRMED)
    return PaymentRead.model_validate(payment)
