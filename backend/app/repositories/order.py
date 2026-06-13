"""Order repository — persistence for orders, items, payments, deliveries."""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order


async def add(session: AsyncSession, order: Order) -> Order:
    session.add(order)
    await session.flush()
    return order


async def get_for_user(
    session: AsyncSession, user_id: uuid.UUID, order_id: uuid.UUID
) -> Order | None:
    stmt = select(Order).where(Order.id == order_id, Order.user_id == user_id)
    return (await session.execute(stmt)).scalar_one_or_none()


async def get(session: AsyncSession, order_id: uuid.UUID) -> Order | None:
    """Look up an order without checking ownership (admin use only)."""
    return await session.get(Order, order_id)


async def list_for_user(
    session: AsyncSession, user_id: uuid.UUID, *, limit: int, offset: int
) -> list[Order]:
    stmt = (
        select(Order)
        .where(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list((await session.execute(stmt)).scalars().all())


async def list_all(
    session: AsyncSession,
    *,
    limit: int,
    offset: int,
    status: str | None = None,
) -> list[Order]:
    """Admin listing across all users."""
    stmt = select(Order).order_by(Order.created_at.desc()).limit(limit).offset(offset)
    if status:
        stmt = stmt.where(Order.status == status)
    return list((await session.execute(stmt)).scalars().all())


async def stats_by_status(session: AsyncSession) -> dict[str, int]:
    stmt = select(Order.status, func.count(Order.id)).group_by(Order.status)
    rows = (await session.execute(stmt)).all()
    return {status: int(n) for status, n in rows}
