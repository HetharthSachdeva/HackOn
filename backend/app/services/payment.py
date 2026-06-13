"""Mock payment provider.

This module exposes a single :func:`create_payment` function that takes an
:class:`~app.models.order.Order` and a chosen :class:`PaymentProvider`, then
returns a fully-populated :class:`~app.models.payment.Payment` row ready to
attach to the order.

* ``cod`` payments are created in ``pending`` status (collected on delivery).
* ``mock_upi`` / ``mock_card`` are also created in ``pending`` status with a
  fake provider reference. The user (or our auto-capture path in
  :func:`capture_payment`) flips them to ``captured`` later.

A real provider integration (Razorpay, Stripe, etc.) implements the same
shape, so swapping it later is a one-file change.
"""

from __future__ import annotations

import secrets

from app.core.errors import ConflictError, NotFoundError
from app.models.order import Order
from app.models.payment import Payment, PaymentProvider, PaymentStatus


def create_payment(order: Order, provider: PaymentProvider) -> Payment:
    """Build a Payment row for ``order`` using ``provider``."""
    ref = None if provider == PaymentProvider.COD else f"mock_{secrets.token_hex(8)}"
    return Payment(
        order_id=order.id,
        provider=provider.value,
        provider_ref=ref,
        status=PaymentStatus.PENDING.value,
        amount=order.total,
    )


def capture_payment(payment: Payment | None, success: bool = True) -> Payment:
    """Mark a non-COD payment as captured (or failed) and return it."""
    if payment is None:
        raise NotFoundError("Payment not found")
    if payment.provider == PaymentProvider.COD.value:
        raise ConflictError("COD payments are captured on delivery, not via API")
    if payment.status != PaymentStatus.PENDING.value:
        raise ConflictError(f"Payment is already in status {payment.status!r}")
    payment.status = (
        PaymentStatus.CAPTURED.value if success else PaymentStatus.FAILED.value
    )
    return payment
