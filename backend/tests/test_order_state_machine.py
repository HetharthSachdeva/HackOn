"""Pure-Python tests for the order state machine."""

from __future__ import annotations

import pytest

from app.core.errors import ConflictError
from app.models.order import Order, OrderStatus
from app.services.order import transition_status


def _make_order(status: OrderStatus) -> Order:
    return Order(
        user_id="00000000-0000-0000-0000-000000000000",
        status=status.value,
        subtotal=0,
        delivery_fee=0,
        discount=0,
        total=0,
        address_snapshot={},
    )


@pytest.mark.parametrize(
    "current,target",
    [
        (OrderStatus.PLACED, OrderStatus.CONFIRMED),
        (OrderStatus.PLACED, OrderStatus.CANCELLED),
        (OrderStatus.CONFIRMED, OrderStatus.PACKED),
        (OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
        (OrderStatus.PACKED, OrderStatus.OUT_FOR_DELIVERY),
        (OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED),
    ],
)
def test_allowed_transitions(current: OrderStatus, target: OrderStatus) -> None:
    order = _make_order(current)
    transition_status(order, target)
    assert order.status == target.value


@pytest.mark.parametrize(
    "current,target",
    [
        (OrderStatus.PLACED, OrderStatus.PACKED),
        (OrderStatus.PLACED, OrderStatus.DELIVERED),
        (OrderStatus.PACKED, OrderStatus.CANCELLED),
        (OrderStatus.DELIVERED, OrderStatus.CONFIRMED),
        (OrderStatus.CANCELLED, OrderStatus.PLACED),
    ],
)
def test_forbidden_transitions(current: OrderStatus, target: OrderStatus) -> None:
    order = _make_order(current)
    with pytest.raises(ConflictError):
        transition_status(order, target)
    assert order.status == current.value  # state unchanged on failure
