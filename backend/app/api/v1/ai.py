"""AI endpoints: semantic search, intent-to-cart, similar items, snap-to-cart stub."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile, status

from app.core.deps import CurrentUserDep, DBSession, OptionalUserDep
from app.schemas.ai import (
    IntentToCartRequest,
    IntentToCartResponse,
    SemanticSearchRequest,
    SemanticSearchResponse,
    SimilarRequest,
    SnapToCartResponse,
)
from app.schemas.product import ProductSearchHit
from app.services import intent_to_cart, semantic_search

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post(
    "/semantic-search",
    response_model=SemanticSearchResponse,
    summary="Semantic product search (pgvector cosine)",
    description=(
        "Embed the query with sentence-transformers and rank the catalog by "
        "cosine similarity. Falls back to keyword search if the embedding "
        "model is unavailable; `used_semantic` tells you which path ran."
    ),
)
async def post_semantic_search(
    payload: SemanticSearchRequest,
    db: DBSession,
    _user: OptionalUserDep,
) -> SemanticSearchResponse:
    hits, used_semantic = await semantic_search.search(
        db, payload.q, limit=payload.limit, in_stock_only=payload.in_stock_only
    )
    return SemanticSearchResponse(
        query=payload.q, used_semantic=used_semantic, items=hits
    )


@router.post(
    "/cart-from-intent",
    response_model=IntentToCartResponse,
    status_code=status.HTTP_200_OK,
    summary="🧠 Intent-to-Cart — natural language → ready cart",
    description=(
        "Send a free-form prompt like `dinner for 4, vegetarian, under ₹800`. "
        "The API parses budget + servings, semantically retrieves candidates, "
        "greedily fits them to your budget, and returns a structured cart "
        "with per-item rationale. Set `apply_to_cart=true` to add the picks "
        "to your real cart in the same call."
    ),
)
async def post_cart_from_intent(
    payload: IntentToCartRequest,
    db: DBSession,
    user: OptionalUserDep,
) -> IntentToCartResponse:
    user_id = uuid.UUID(user.id) if user else None
    # Guests can generate a bundle but cannot apply it to a cart
    apply = payload.apply_to_cart and user is not None
    return await intent_to_cart.cart_from_intent(
        db,
        prompt=payload.prompt,
        user_id=user_id,
        budget=payload.budget,
        max_items=payload.max_items,
        apply_to_cart=apply,
    )


@router.post(
    "/similar",
    response_model=list[ProductSearchHit],
    summary="Find products similar to a given ASIN (pgvector)",
)
async def post_similar(
    payload: SimilarRequest, db: DBSession, _user: OptionalUserDep
) -> list[ProductSearchHit]:
    return await semantic_search.similar(db, payload.asin, limit=payload.limit)


@router.get(
    "/similar/{asin}",
    response_model=list[ProductSearchHit],
    summary="Find products similar to a given ASIN (GET convenience)",
)
async def get_similar(
    asin: str, db: DBSession, _user: OptionalUserDep, limit: int = 10
) -> list[ProductSearchHit]:
    return await semantic_search.similar(db, asin, limit=limit)


@router.post(
    "/snap-to-cart",
    response_model=SnapToCartResponse,
    summary="📸 Snap-to-cart (stub — vision wiring pending)",
    description=(
        "Accepts an image upload plus optional hint text. Today this stubs "
        "the vision step: it just embeds the `hint` text (if any) and runs "
        "semantic search. Replace with a real CLIP/multimodal call later."
    ),
)
async def post_snap_to_cart(
    db: DBSession,
    _user: CurrentUserDep,
    image: Annotated[UploadFile, File(description="Image of the item or shelf")],
    hint: Annotated[str | None, Form(description="Optional text hint")] = None,
) -> SnapToCartResponse:
    # Don't actually read the bytes here — vision pipeline lands in Phase 4.
    _ = await image.read(1)  # noqa: F841 — touch the upload so it isn't garbage
    query = hint or "snacks beverages essentials"
    hits, _used = await semantic_search.search(db, query, limit=8, in_stock_only=True)
    return SnapToCartResponse(
        detected_keywords=[w for w in query.split() if len(w) > 2][:6],
        items=hits,
    )
