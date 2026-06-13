"""Catalog read endpoints — products, categories, keyword search."""

from __future__ import annotations

from decimal import Decimal
from typing import Annotated, Literal

from fastapi import APIRouter, Query

from app.core.deps import DBSession
from app.core.errors import NotFoundError
from app.repositories import product as product_repo
from app.schemas.common import Page
from app.schemas.product import CategoryRead, ProductRead

router = APIRouter(prefix="/catalog", tags=["catalog"])

SortOption = Literal["price_asc", "price_desc", "stars_desc", "reviews_desc"]


@router.get(
    "/products",
    response_model=Page[ProductRead],
    summary="List products with filters",
)
async def list_products(
    db: DBSession,
    limit: Annotated[int, Query(ge=1, le=1000)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    category: str | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    in_stock_only: bool = False,
    min_stars: Annotated[float | None, Query(ge=0, le=5)] = None,
    q: Annotated[str | None, Query(description="Keyword search on title/tags/category")] = None,
    sort: SortOption | None = None,
) -> Page[ProductRead]:
    items, total = await product_repo.list_products(
        db,
        limit=limit,
        offset=offset,
        category=category,
        min_price=min_price,
        max_price=max_price,
        in_stock_only=in_stock_only,
        min_stars=min_stars,
        q=q,
        sort=sort,
    )
    return Page[ProductRead](
        items=[ProductRead.model_validate(p) for p in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/products/{asin}",
    response_model=ProductRead,
    summary="Get a product by ASIN",
)
async def get_product(asin: str, db: DBSession) -> ProductRead:
    product = await product_repo.get_product(db, asin)
    if product is None:
        raise NotFoundError(f"Product {asin} not found")
    return ProductRead.model_validate(product)


@router.get(
    "/categories",
    response_model=list[CategoryRead],
    summary="List distinct categories with product counts",
)
async def list_categories(db: DBSession) -> list[CategoryRead]:
    rows = await product_repo.list_categories(db)
    return [CategoryRead(name=name, product_count=count) for name, count in rows]


@router.get(
    "/search",
    response_model=Page[ProductRead],
    summary="Keyword search (alias for ?q=… on /products)",
    description=(
        "Convenience alias for the keyword-search use-case. Semantic vector "
        "search is exposed separately under `/ai/semantic-search` (Phase 3)."
    ),
)
async def search(
    q: Annotated[str, Query(min_length=1, max_length=200)],
    db: DBSession,
    limit: Annotated[int, Query(ge=1, le=1000)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> Page[ProductRead]:
    items, total = await product_repo.list_products(
        db, limit=limit, offset=offset, q=q
    )
    return Page[ProductRead](
        items=[ProductRead.model_validate(p) for p in items],
        total=total,
        limit=limit,
        offset=offset,
    )
