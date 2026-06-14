"""Mission bundles: resolve a curated query into a bundle of products."""

from __future__ import annotations

from decimal import Decimal

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai import llm
from app.core.errors import NotFoundError
from app.models.mission import Mission
from app.repositories import ai as ai_repo
from app.schemas.mission import MissionBundle, MissionBundleItem, MissionRead
from app.schemas.product import ProductRead
from app.services import semantic_search
from app.services import hybrid_search

log = structlog.get_logger(__name__)


async def list_missions(session: AsyncSession) -> list[MissionRead]:
    rows = await ai_repo.list_missions(session)
    return [MissionRead.model_validate(m) for m in rows]


async def resolve_bundle(session: AsyncSession, slug: str) -> MissionBundle:
    mission = await ai_repo.get_mission_by_slug(session, slug)
    if mission is None:
        raise NotFoundError(f"Mission {slug!r} not found")

    # 1. Decompose the mission query into sub-queries
    provider = llm.get_provider()
    log.info("resolve_bundle.start", slug=slug, query=mission.query, provider=provider.name)
    extracted = await provider.parse_query(mission.query)

    # 2. Perform hybrid search for each decomposed item
    results_by_item = await hybrid_search.search_hybrid(
        session, extracted, limit_per_item=max(15, mission.max_items * 2)
    )

    allowed_cats = (
        [c.strip().lower() for c in mission.category_filter.split(",") if c.strip()]
        if mission.category_filter
        else None
    )

    # 3. Round-robin merge candidates list to construct final pool and filter by category/price
    filtered = []
    seen_asins = set()
    max_len = max(len(hits) for hits in results_by_item.values()) if results_by_item else 0

    for i in range(max_len):
        for item_query, hits_list in results_by_item.items():
            if i < len(hits_list):
                hit = hits_list[i]
                if hit.asin not in seen_asins:
                    seen_asins.add(hit.asin)

                    # Filter by category constraint
                    if allowed_cats and not any(
                        allowed in (hit.category or "").lower() for allowed in allowed_cats
                    ):
                        continue
                    # Filter by price constraint
                    if mission.max_unit_price is not None and Decimal(str(hit.price)) > mission.max_unit_price:
                        continue

                    filtered.append(hit)
                    if len(filtered) >= mission.max_items:
                        break
        if len(filtered) >= mission.max_items:
            break

    items = [
        MissionBundleItem(product=ProductRead.model_validate(h.model_dump()))
        for h in filtered
    ]
    estimated_total = sum(
        (Decimal(str(it.product.price)) * it.suggested_quantity for it in items),
        Decimal("0"),
    )

    return MissionBundle(
        mission=MissionRead.model_validate(mission),
        items=items,
        estimated_total=estimated_total.quantize(Decimal("0.01")),
        used_semantic=True,
    )


async def seed_default_missions(session: AsyncSession) -> int:
    """Idempotently create a handful of demo missions. Returns count inserted."""
    defaults = [
        dict(
            slug="hangover-kit",
            title="Hangover Kit",
            description="Rehydrate, refuel, recover. Everything for the morning after.",
            hero_color="#FF6B6B",
            query="coconut water electrolytes pain reliever bananas eggs bread",
            max_items=6,
        ),
        dict(
            slug="dinner-for-4",
            title="Dinner for 4",
            description="A complete vegetarian dinner spread.",
            hero_color="#4ECDC4",
            query="paneer naan rice dal vegetables curd",
            max_items=8,
        ),
        dict(
            slug="midnight-munchies",
            title="Midnight Munchies",
            description="Late-night cravings, sorted in 10 minutes.",
            hero_color="#FFE66D",
            query="chips chocolate biscuits ice cream cold drink",
            max_items=6,
        ),
        dict(
            slug="healthy-breakfast",
            title="Healthy Breakfast",
            description="Oats, fruits, and protein for a strong start.",
            hero_color="#95E1D3",
            query="oats banana almonds milk eggs yogurt fruits",
            max_items=6,
        ),
        dict(
            slug="game-night",
            title="Game Night",
            description="Snacks and drinks for the squad.",
            hero_color="#F38181",
            query="popcorn nachos beer chips dip soda chocolate",
            max_items=7,
        ),
    ]
    inserted = 0
    for spec in defaults:
        if await ai_repo.get_mission_by_slug(session, spec["slug"]) is not None:
            continue
        await ai_repo.create_mission(session, Mission(**spec))
        inserted += 1
    return inserted
