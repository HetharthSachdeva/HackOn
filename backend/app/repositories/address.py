"""Address repository — per-user CRUD."""

from __future__ import annotations

import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.address import Address


async def list_for_user(session: AsyncSession, user_id: uuid.UUID) -> list[Address]:
    stmt = select(Address).where(Address.user_id == user_id).order_by(
        Address.is_default.desc(),
        Address.created_at.desc(),
    )
    return list((await session.execute(stmt)).scalars().all())


async def get_for_user(
    session: AsyncSession, user_id: uuid.UUID, address_id: uuid.UUID
) -> Address | None:
    stmt = select(Address).where(Address.id == address_id, Address.user_id == user_id)
    return (await session.execute(stmt)).scalar_one_or_none()


async def create(session: AsyncSession, address: Address) -> Address:
    if address.is_default:
        await _clear_other_defaults(session, address.user_id, exclude_id=None)
    session.add(address)
    await session.flush()
    return address


async def update_fields(
    session: AsyncSession, address: Address, updates: dict[str, object]
) -> Address:
    for key, value in updates.items():
        setattr(address, key, value)
    if updates.get("is_default") is True:
        await _clear_other_defaults(session, address.user_id, exclude_id=address.id)
    await session.flush()
    return address


async def delete(session: AsyncSession, address: Address) -> None:
    await session.delete(address)
    await session.flush()


async def _clear_other_defaults(
    session: AsyncSession, user_id: uuid.UUID, exclude_id: uuid.UUID | None
) -> None:
    stmt = (
        update(Address)
        .where(Address.user_id == user_id, Address.is_default.is_(True))
        .values(is_default=False)
    )
    if exclude_id is not None:
        stmt = stmt.where(Address.id != exclude_id)
    await session.execute(stmt)
