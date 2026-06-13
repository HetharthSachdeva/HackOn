"""Reorder subscription service.

Handles creating, listing, skipping, pausing, resuming, and cancelling
subscriptions. No background scheduler in Phase 3 — that arrives in Phase 4.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError, ValidationError
from app.models.reorder import ReorderStatus, ReorderSubscription
from app.repositories import ai as ai_repo
from app.repositories import product as product_repo
from app.schemas.product import ProductRead
from app.schemas.reorder import ReorderCreate, ReorderRead, ReorderReadWithProduct, ReorderUpdate


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def list_for_user(
    session: AsyncSession, user_id: uuid.UUID
) -> list[ReorderReadWithProduct]:
    subs = await ai_repo.list_subscriptions(session, user_id)
    by_asin = await product_repo.get_products_by_asins(session, [s.asin for s in subs])
    return [
        ReorderReadWithProduct(
            **ReorderRead.model_validate(s).model_dump(),
            product=ProductRead.model_validate(p) if (p := by_asin.get(s.asin)) else None,
        )
        for s in subs
    ]


async def upcoming(
    session: AsyncSession, user_id: uuid.UUID, *, within_days: int
) -> list[ReorderReadWithProduct]:
    subs = await ai_repo.list_upcoming(
        session, user_id, within_days=within_days, now=_now()
    )
    by_asin = await product_repo.get_products_by_asins(session, [s.asin for s in subs])
    return [
        ReorderReadWithProduct(
            **ReorderRead.model_validate(s).model_dump(),
            product=ProductRead.model_validate(p) if (p := by_asin.get(s.asin)) else None,
        )
        for s in subs
    ]


async def create(
    session: AsyncSession, user_id: uuid.UUID, payload: ReorderCreate
) -> ReorderRead:
    product = await product_repo.get_product(session, payload.asin)
    if product is None:
        raise NotFoundError(f"Product {payload.asin} not found")
    sub = ReorderSubscription(
        user_id=user_id,
        asin=payload.asin,
        quantity=payload.quantity,
        cadence_days=payload.cadence_days,
        next_run_at=_now() + timedelta(days=payload.starts_in_days),
        status=ReorderStatus.ACTIVE.value,
    )
    await ai_repo.add_subscription(session, sub)
    await session.commit()
    await session.refresh(sub)
    return ReorderRead.model_validate(sub)


async def update(
    session: AsyncSession,
    user_id: uuid.UUID,
    sub_id: uuid.UUID,
    payload: ReorderUpdate,
) -> ReorderRead:
    sub = await ai_repo.get_subscription_for_user(session, user_id, sub_id)
    if sub is None:
        raise NotFoundError("Subscription not found")
    if sub.status == ReorderStatus.CANCELLED.value:
        raise ConflictError("Cancelled subscriptions cannot be modified")
    if payload.quantity is not None:
        sub.quantity = payload.quantity
    if payload.cadence_days is not None:
        sub.cadence_days = payload.cadence_days
    await session.commit()
    await session.refresh(sub)
    return ReorderRead.model_validate(sub)


async def skip(
    session: AsyncSession, user_id: uuid.UUID, sub_id: uuid.UUID
) -> ReorderRead:
    """Push ``next_run_at`` forward by one cadence — the "skip don't order" trick."""
    sub = await ai_repo.get_subscription_for_user(session, user_id, sub_id)
    if sub is None:
        raise NotFoundError("Subscription not found")
    if sub.status != ReorderStatus.ACTIVE.value:
        raise ConflictError("Only active subscriptions can be skipped")
    sub.next_run_at = sub.next_run_at + timedelta(days=sub.cadence_days)
    await session.commit()
    await session.refresh(sub)
    return ReorderRead.model_validate(sub)


async def set_status(
    session: AsyncSession,
    user_id: uuid.UUID,
    sub_id: uuid.UUID,
    status: ReorderStatus,
) -> ReorderRead:
    sub = await ai_repo.get_subscription_for_user(session, user_id, sub_id)
    if sub is None:
        raise NotFoundError("Subscription not found")
    if sub.status == ReorderStatus.CANCELLED.value:
        raise ConflictError("Subscription already cancelled")
    sub.status = status.value
    if status == ReorderStatus.ACTIVE and sub.next_run_at < _now():
        sub.next_run_at = _now() + timedelta(days=sub.cadence_days)
    await session.commit()
    await session.refresh(sub)
    return ReorderRead.model_validate(sub)


async def delete(
    session: AsyncSession, user_id: uuid.UUID, sub_id: uuid.UUID
) -> None:
    sub = await ai_repo.get_subscription_for_user(session, user_id, sub_id)
    if sub is None:
        raise NotFoundError("Subscription not found")
    await ai_repo.delete_subscription(session, sub)
    await session.commit()


def compute_next_cadence(quantity: int, days_observed: int) -> int:
    """Naive helper: future scheduler can use this to infer cadence from history."""
    if quantity <= 0:
        raise ValidationError("quantity must be > 0")
    return max(1, days_observed // quantity)
