"""Repositories for missions and reorder subscriptions."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mission import Mission
from app.models.reorder import ReorderStatus, ReorderSubscription


# ---------- missions -------------------------------------------------------


async def list_missions(session: AsyncSession) -> list[Mission]:
    stmt = select(Mission).where(Mission.is_active == 1).order_by(Mission.created_at.desc())
    return list((await session.execute(stmt)).scalars().all())


async def get_mission_by_slug(session: AsyncSession, slug: str) -> Mission | None:
    stmt = select(Mission).where(Mission.slug == slug)
    return (await session.execute(stmt)).scalar_one_or_none()


async def create_mission(session: AsyncSession, mission: Mission) -> Mission:
    session.add(mission)
    await session.flush()
    return mission


# ---------- reorder subscriptions -----------------------------------------


async def list_subscriptions(
    session: AsyncSession, user_id: uuid.UUID
) -> list[ReorderSubscription]:
    stmt = (
        select(ReorderSubscription)
        .where(ReorderSubscription.user_id == user_id)
        .order_by(ReorderSubscription.next_run_at.asc())
    )
    return list((await session.execute(stmt)).scalars().all())


async def list_upcoming(
    session: AsyncSession,
    user_id: uuid.UUID,
    *,
    within_days: int,
    now,
) -> list[ReorderSubscription]:
    from datetime import timedelta

    cutoff = now + timedelta(days=within_days)
    stmt = (
        select(ReorderSubscription)
        .where(
            ReorderSubscription.user_id == user_id,
            ReorderSubscription.status == ReorderStatus.ACTIVE.value,
            ReorderSubscription.next_run_at <= cutoff,
        )
        .order_by(ReorderSubscription.next_run_at.asc())
    )
    return list((await session.execute(stmt)).scalars().all())


async def get_subscription_for_user(
    session: AsyncSession, user_id: uuid.UUID, sub_id: uuid.UUID
) -> ReorderSubscription | None:
    stmt = select(ReorderSubscription).where(
        ReorderSubscription.id == sub_id,
        ReorderSubscription.user_id == user_id,
    )
    return (await session.execute(stmt)).scalar_one_or_none()


async def add_subscription(
    session: AsyncSession, sub: ReorderSubscription
) -> ReorderSubscription:
    session.add(sub)
    await session.flush()
    return sub


async def delete_subscription(
    session: AsyncSession, sub: ReorderSubscription
) -> None:
    await session.delete(sub)
    await session.flush()
