"""Admin endpoints.

Locked behind a static shared-secret token (``X-Admin-Token`` header) set
in ``ADMIN_TOKEN``. Leave it empty to disable the entire router. In a real
deployment, replace this with a proper RBAC scheme on the Supabase JWT.
"""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Header, Query, status
from sqlalchemy import select

from app.core.config import get_settings
from app.core.deps import DBSession
from app.core.errors import ForbiddenError, NotFoundError
from app.models.mission import Mission
from app.models.order import OrderStatus
from app.repositories import ai as ai_repo
from app.repositories import order as order_repo
from app.schemas.mission import MissionCreate, MissionRead
from app.schemas.order import OrderRead
from app.services import missions as missions_service
from app.services import order as order_service


def _require_admin(
    x_admin_token: Annotated[str | None, Header(alias="X-Admin-Token")] = None,
) -> None:
    settings = get_settings()
    if not settings.admin_token:
        raise ForbiddenError("Admin endpoints are disabled (set ADMIN_TOKEN).")
    if x_admin_token != settings.admin_token:
        raise ForbiddenError("Invalid admin token.")


router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(_require_admin)],
)


# --- Orders ----------------------------------------------------------------


@router.get(
    "/orders",
    response_model=list[OrderRead],
    summary="List orders across all users",
)
async def admin_list_orders(
    db: DBSession,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
    status_filter: Annotated[OrderStatus | None, Query(alias="status")] = None,
) -> list[OrderRead]:
    rows = await order_repo.list_all(
        db,
        limit=limit,
        offset=offset,
        status=status_filter.value if status_filter else None,
    )
    return [OrderRead.model_validate(o) for o in rows]


@router.get(
    "/orders/stats",
    summary="Order counts grouped by status",
)
async def admin_order_stats(db: DBSession) -> dict[str, int]:
    return await order_repo.stats_by_status(db)


@router.post(
    "/orders/{order_id}/advance",
    response_model=OrderRead,
    summary="Force-advance any order's status",
    description=(
        "Drives an order through the FSM regardless of ownership. Emits "
        "notifications + WS events just like the user-facing flow."
    ),
)
async def admin_advance_order(
    order_id: uuid.UUID,
    target: OrderStatus,
    db: DBSession,
) -> OrderRead:
    order = await order_repo.get(db, order_id)
    if order is None:
        raise NotFoundError("Order not found")
    await order_service.transition_and_notify(db, order, target)
    return OrderRead.model_validate(order)


# --- Missions --------------------------------------------------------------


@router.post(
    "/missions",
    response_model=MissionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a curated mission bundle",
)
async def admin_create_mission(
    payload: MissionCreate, db: DBSession
) -> MissionRead:
    mission = Mission(**payload.model_dump())
    await ai_repo.create_mission(db, mission)
    await db.commit()
    return MissionRead.model_validate(mission)


@router.post(
    "/missions/seed-defaults",
    summary="Seed a starter set of mission bundles (idempotent)",
)
async def admin_seed_missions(db: DBSession) -> dict[str, int]:
    n = await missions_service.seed_default_missions(db)
    await db.commit()
    return {"inserted": n}


# --- Catalog (read-only sanity probes) ------------------------------------


@router.get(
    "/catalog/health",
    summary="Cheap probe: row count + embedding coverage",
)
async def admin_catalog_health(db: DBSession) -> dict[str, int]:
    from app.models.product import Product
    from sqlalchemy import func as sqlfunc

    total = (
        await db.execute(select(sqlfunc.count()).select_from(Product))
    ).scalar_one()
    with_embedding = (
        await db.execute(
            select(sqlfunc.count())
            .select_from(Product)
            .where(Product.embedding.is_not(None))
        )
    ).scalar_one()
    in_stock = (
        await db.execute(
            select(sqlfunc.count())
            .select_from(Product)
            .where(Product.in_stock.is_(True))
        )
    ).scalar_one()
    return {
        "products_total": int(total),
        "products_with_embedding": int(with_embedding),
        "products_in_stock": int(in_stock),
    }
