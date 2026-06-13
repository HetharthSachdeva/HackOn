"""Delivery-address CRUD."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, status

from app.core.deps import CurrentUserDep, DBSession
from app.core.errors import NotFoundError
from app.models.address import Address
from app.repositories import address as address_repo
from app.schemas.address import AddressCreate, AddressRead, AddressUpdate

router = APIRouter(prefix="/addresses", tags=["addresses"])


@router.get("", response_model=list[AddressRead], summary="List my addresses")
async def list_addresses(
    db: DBSession, user: CurrentUserDep
) -> list[AddressRead]:
    rows = await address_repo.list_for_user(db, uuid.UUID(user.id))
    return [AddressRead.model_validate(a) for a in rows]


@router.post(
    "",
    response_model=AddressRead,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new address",
)
async def create_address(
    payload: AddressCreate, db: DBSession, user: CurrentUserDep
) -> AddressRead:
    address = Address(user_id=uuid.UUID(user.id), **payload.model_dump())
    saved = await address_repo.create(db, address)
    return AddressRead.model_validate(saved)


@router.get(
    "/{address_id}",
    response_model=AddressRead,
    summary="Get one of my addresses",
)
async def get_address(
    address_id: uuid.UUID, db: DBSession, user: CurrentUserDep
) -> AddressRead:
    address = await address_repo.get_for_user(db, uuid.UUID(user.id), address_id)
    if address is None:
        raise NotFoundError("Address not found")
    return AddressRead.model_validate(address)


@router.patch(
    "/{address_id}",
    response_model=AddressRead,
    summary="Update one of my addresses",
)
async def update_address(
    address_id: uuid.UUID,
    payload: AddressUpdate,
    db: DBSession,
    user: CurrentUserDep,
) -> AddressRead:
    address = await address_repo.get_for_user(db, uuid.UUID(user.id), address_id)
    if address is None:
        raise NotFoundError("Address not found")
    updates = payload.model_dump(exclude_unset=True)
    updated = await address_repo.update_fields(db, address, updates)
    return AddressRead.model_validate(updated)


@router.delete(
    "/{address_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete one of my addresses",
)
async def delete_address(
    address_id: uuid.UUID, db: DBSession, user: CurrentUserDep
) -> None:
    address = await address_repo.get_for_user(db, uuid.UUID(user.id), address_id)
    if address is None:
        raise NotFoundError("Address not found")
    await address_repo.delete(db, address)
