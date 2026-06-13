"""Order placement, status transitions, cancellation, reorder."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Iterable

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError, ValidationError
from app.models.delivery import Delivery, DeliveryStatus, SlotType
from app.models.notification import NotificationType
from app.models.order import Order, OrderItem, OrderStatus
from app.models.payment import PaymentProvider
from app.repositories import address as address_repo
from app.repositories import cart as cart_repo
from app.repositories import order as order_repo
from app.repositories import product as product_repo
from app.schemas.order import OrderCreate
from app.services import events, notifications
from app.services import payment as payment_service
from app.services import promos
from app.services.cart import (
    DELIVERY_FEE,
    FREE_DELIVERY_OVER,
)
from app.services.delivery import (
    express_eta,
    find_scheduled_slot,
)

# Valid state transitions for our FSM.
_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.PLACED: {OrderStatus.CONFIRMED, OrderStatus.CANCELLED},
    OrderStatus.CONFIRMED: {OrderStatus.PACKED, OrderStatus.CANCELLED},
    OrderStatus.PACKED: {OrderStatus.OUT_FOR_DELIVERY},
    OrderStatus.OUT_FOR_DELIVERY: {OrderStatus.DELIVERED},
    OrderStatus.DELIVERED: set(),
    OrderStatus.CANCELLED: set(),
}

# Once an order reaches this status, the user can no longer cancel.
_USER_CANCELLABLE: set[OrderStatus] = {OrderStatus.PLACED, OrderStatus.CONFIRMED}


def _can_transition(current: OrderStatus, target: OrderStatus) -> bool:
    return target in _TRANSITIONS.get(current, set())


def transition_status(order: Order, target: OrderStatus) -> Order:
    """Move ``order`` to ``target`` if the transition is allowed."""
    current = OrderStatus(order.status)
    if not _can_transition(current, target):
        raise ConflictError(
            f"Cannot move order from {current.value!r} to {target.value!r}"
        )
    order.status = target.value
    return order


async def transition_and_notify(
    session: AsyncSession, order: Order, target: OrderStatus
) -> Order:
    """Transition an order's status and emit a notification + WS event."""
    previous = order.status
    transition_status(order, target)
    await notifications.create_and_publish(
        session,
        user_id=order.user_id,
        type=NotificationType.ORDER_STATUS_CHANGED,
        title=f"Order #{str(order.id)[:8]} is now {target.value.replace('_', ' ')}",
        body=None,
        payload={"order_id": str(order.id), "status": target.value, "previous": previous},
    )
    await events.publish(
        events.order_channel(order.id),
        {
            "event": "status_changed",
            "data": {
                "order_id": str(order.id),
                "status": target.value,
                "previous": previous,
            },
        },
    )
    return order


async def place_order(
    session: AsyncSession, user_id: uuid.UUID, payload: OrderCreate
) -> Order:
    """Snapshot the cart into a new order, attach payment + delivery, clear cart."""
    address = await address_repo.get_for_user(session, user_id, payload.address_id)
    if address is None:
        raise NotFoundError("Address not found")

    cart = await cart_repo.get_cart(session, user_id)
    if cart is None or not cart.items:
        raise ValidationError("Your cart is empty")

    products = await product_repo.get_products_by_asins(
        session, [item.asin for item in cart.items]
    )

    items: list[OrderItem] = []
    subtotal = Decimal("0")
    per_item_etas: list[int | None] = []
    for line in cart.items:
        product = products.get(line.asin)
        if product is None:
            raise ValidationError(f"Product {line.asin} is no longer available")
        if product.in_stock is False:
            raise ValidationError(f"{product.title!r} is out of stock")
        if product.stock_qty is not None and line.quantity > product.stock_qty:
            raise ValidationError(
                f"Only {product.stock_qty} unit(s) of {product.title!r} available"
            )
        line_total = (product.price * line.quantity).quantize(Decimal("0.01"))
        subtotal += line_total
        per_item_etas.append(product.delivery_time_mins)
        items.append(
            OrderItem(
                asin=product.asin,
                title_snapshot=product.title,
                unit_price_snapshot=product.price,
                img_url_snapshot=product.img_url,
                quantity=line.quantity,
                line_total=line_total,
            )
        )

    promo = promos.lookup(cart.promo_code)
    discount = promos.compute_discount(promo, subtotal)
    delivery_fee = (
        Decimal("0") if subtotal >= FREE_DELIVERY_OVER else DELIVERY_FEE
    )
    total = (subtotal - discount + delivery_fee).quantize(Decimal("0.01"))

    initial_status = (
        OrderStatus.CONFIRMED
        if payload.payment_provider == PaymentProvider.COD
        else OrderStatus.PLACED
    )

    order = Order(
        user_id=user_id,
        status=initial_status.value,
        subtotal=subtotal.quantize(Decimal("0.01")),
        delivery_fee=delivery_fee,
        discount=discount.quantize(Decimal("0.01")),
        total=total,
        promo_code=cart.promo_code,
        address_snapshot=_snapshot_address(address),
    )
    order.items = items
    order.payment = payment_service.create_payment(order, payload.payment_provider)
    order.delivery = _build_delivery(payload, per_item_etas)

    await order_repo.add(session, order)
    await cart_repo.clear_items(session, user_id)
    await cart_repo.set_promo(session, user_id, None)

    await notifications.create_and_publish(
        session,
        user_id=user_id,
        type=NotificationType.ORDER_PLACED,
        title=f"Order placed! ₹{order.total}",
        body="We'll notify you as your order moves through our system.",
        payload={"order_id": str(order.id), "total": float(order.total)},
    )
    await events.publish(
        events.order_channel(order.id),
        {
            "event": "order_placed",
            "data": {"order_id": str(order.id), "status": order.status},
        },
    )
    return order


def _build_delivery(payload: OrderCreate, per_item_etas: list[int | None]) -> Delivery:
    now = datetime.now(timezone.utc)
    if payload.slot_type == SlotType.EXPRESS:
        eta = express_eta(per_item_etas)
        return Delivery(
            slot_type=SlotType.EXPRESS.value,
            slot_start=now,
            slot_end=now + _minutes(eta),
            eta_mins=eta,
            status=DeliveryStatus.PENDING.value,
        )
    if payload.scheduled_slot_start is None:
        raise ValidationError("scheduled_slot_start is required for scheduled slots")
    option = find_scheduled_slot(payload.scheduled_slot_start)
    if option is None:
        raise ValidationError("Selected slot is no longer available")
    return Delivery(
        slot_type=SlotType.SCHEDULED.value,
        slot_start=option.slot_start,
        slot_end=option.slot_end,
        eta_mins=option.eta_mins,
        status=DeliveryStatus.PENDING.value,
    )


def _minutes(n: int):
    from datetime import timedelta

    return timedelta(minutes=n)


def _snapshot_address(address) -> dict:
    """Freeze the address into a JSONB-friendly dict for the order record."""
    return {
        "id": str(address.id),
        "label": address.label,
        "recipient_name": address.recipient_name,
        "phone": address.phone,
        "line1": address.line1,
        "line2": address.line2,
        "city": address.city,
        "state": address.state,
        "pincode": address.pincode,
        "landmark": address.landmark,
        "latitude": float(address.latitude) if address.latitude is not None else None,
        "longitude": float(address.longitude) if address.longitude is not None else None,
    }


async def cancel_order(
    session: AsyncSession,
    user_id: uuid.UUID,
    order_id: uuid.UUID,
    reason: str | None,
) -> Order:
    order = await order_repo.get_for_user(session, user_id, order_id)
    if order is None:
        raise NotFoundError("Order not found")
    current = OrderStatus(order.status)
    if current not in _USER_CANCELLABLE:
        raise ConflictError(f"Order in status {current.value!r} cannot be cancelled")
    transition_status(order, OrderStatus.CANCELLED)
    order.cancelled_at = datetime.now(timezone.utc)
    order.cancel_reason = reason
    await notifications.create_and_publish(
        session,
        user_id=order.user_id,
        type=NotificationType.ORDER_CANCELLED,
        title=f"Order #{str(order.id)[:8]} cancelled",
        body=reason,
        payload={"order_id": str(order.id), "reason": reason},
    )
    await events.publish(
        events.order_channel(order.id),
        {
            "event": "cancelled",
            "data": {"order_id": str(order.id), "reason": reason},
        },
    )
    return order


async def reorder(
    session: AsyncSession, user_id: uuid.UUID, order_id: uuid.UUID
) -> Iterable[str]:
    """Push every line of a past order back into the user's cart.

    Returns the list of ASINs successfully re-added (skipping any no-longer-available items).
    """
    order = await order_repo.get_for_user(session, user_id, order_id)
    if order is None:
        raise NotFoundError("Order not found")

    await cart_repo.get_or_create_cart(session, user_id)
    added: list[str] = []
    for item in order.items:
        product = await product_repo.get_product(session, item.asin)
        if product is None or product.in_stock is False:
            continue
        existing = await cart_repo.get_item(session, user_id, item.asin)
        target_qty = (existing.quantity if existing else 0) + item.quantity
        if product.stock_qty is not None:
            target_qty = min(target_qty, product.stock_qty)
        await cart_repo.upsert_item(session, user_id, item.asin, target_qty)
        added.append(item.asin)
    return added
