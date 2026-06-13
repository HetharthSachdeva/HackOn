"""Cart endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, status

from app.core.deps import CurrentUserDep, DBSession
from app.schemas.cart import CartItemAdd, CartItemUpdate, CartRead, PromoApply
from app.services import cart as cart_service

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get(
    "",
    response_model=CartRead,
    summary="Get my cart with live prices and totals",
)
async def get_cart(db: DBSession, user: CurrentUserDep) -> CartRead:
    return await cart_service.get_enriched_cart(db, uuid.UUID(user.id))


@router.post(
    "/items",
    response_model=CartRead,
    status_code=status.HTTP_201_CREATED,
    summary="Add a product to my cart (additive)",
)
async def add_item(
    payload: CartItemAdd, db: DBSession, user: CurrentUserDep
) -> CartRead:
    return await cart_service.add_item(
        db, uuid.UUID(user.id), payload.asin, payload.quantity
    )


@router.put(
    "/items/{asin}",
    response_model=CartRead,
    summary="Set the quantity of an existing cart line",
)
async def update_item(
    asin: str,
    payload: CartItemUpdate,
    db: DBSession,
    user: CurrentUserDep,
) -> CartRead:
    return await cart_service.update_item(
        db, uuid.UUID(user.id), asin, payload.quantity
    )


@router.delete(
    "/items/{asin}",
    response_model=CartRead,
    summary="Remove a line from my cart",
)
async def remove_item(
    asin: str, db: DBSession, user: CurrentUserDep
) -> CartRead:
    return await cart_service.remove_item(db, uuid.UUID(user.id), asin)


@router.delete(
    "",
    response_model=CartRead,
    summary="Empty my cart",
)
async def clear_cart(db: DBSession, user: CurrentUserDep) -> CartRead:
    return await cart_service.clear(db, uuid.UUID(user.id))


@router.post(
    "/promo",
    response_model=CartRead,
    summary="Apply a promo code",
    description="Try `FLAT50`, `SAVE10`, or `NEW100` in the hackathon build.",
)
async def apply_promo(
    payload: PromoApply, db: DBSession, user: CurrentUserDep
) -> CartRead:
    return await cart_service.apply_promo(db, uuid.UUID(user.id), payload.promo_code)


@router.delete(
    "/promo",
    response_model=CartRead,
    summary="Remove the applied promo code",
)
async def remove_promo(db: DBSession, user: CurrentUserDep) -> CartRead:
    return await cart_service.remove_promo(db, uuid.UUID(user.id))
