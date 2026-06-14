from __future__ import annotations

import asyncio
from typing import Any

import structlog
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai import embedding
from app.models.product import Product
from app.schemas.product import ProductSearchHit
from app.schemas.query_parser import ExtractedQuery
from app.models.user_preference import UserPreference
import uuid

log = structlog.get_logger(__name__)


def _to_hit(product: Product, *, score: float) -> ProductSearchHit:
    data: dict[str, Any] = ProductSearchHit.model_validate(product).model_dump()
    data["score"] = score
    return ProductSearchHit(**data)


async def search_item_hybrid(
    session: AsyncSession,
    item: str,
    *,
    limit: int = 15,
    preferences: list[str] | None = None,
    categories: list[str] | None = None,
    tags: list[str] | None = None,
    user_vec: list[float] | None = None,
) -> list[ProductSearchHit]:
    """Retrieve and rank products for a single decomposed query item.

    Combines exact title/tag/category keywords with pgvector semantic similarity.
    """
    item_clean = item.strip().lower()
    if not item_clean:
        return []

    # 1. Exact/fuzzy keyword query
    clauses = [
        Product.title.ilike(f"%{item_clean}%"),
        Product.tags.ilike(f"%{item_clean}%"),
        Product.category.ilike(f"%{item_clean}%"),
    ]
    if categories:
        for cat in categories:
            if cat.strip():
                clauses.append(Product.category.ilike(f"%{cat.strip()}%"))
    if tags:
        for tag in tags:
            if tag.strip():
                clauses.append(Product.tags.ilike(f"%{tag.strip()}%"))

    keyword_stmt = (
        select(Product)
        .where(
            Product.in_stock.is_(True),
            or_(*clauses),
        )
        .limit(limit * 3)
    )
    keyword_rows = (await session.execute(keyword_stmt)).scalars().all()

    # 2. Vector search query
    vector_rows = []
    vector_distances = {}
    try:
        vec = embedding.embed_text(item_clean)
        distance = Product.embedding.cosine_distance(vec).label("distance")
        vector_stmt = (
            select(Product, distance)
            .where(Product.embedding.is_not(None), Product.in_stock.is_(True))
            .order_by(distance.asc())
            .limit(limit * 2)
        )
        vector_res = (await session.execute(vector_stmt)).all()
        for p, d in vector_res:
            vector_rows.append(p)
            vector_distances[p.asin] = float(d)
    except Exception as exc:  # noqa: BLE001 — fallback to keyword only
        log.warning("hybrid_search.vector_failed", item=item_clean, error=str(exc))

    # 3. Merge candidates and apply weighted scoring
    # Use ASIN as key to deduplicate
    asin_to_product: dict[str, Product] = {}
    for p in keyword_rows:
        asin_to_product[p.asin] = p
    for p in vector_rows:
        asin_to_product[p.asin] = p

    hits: list[ProductSearchHit] = []
    for asin, product in asin_to_product.items():
        score = 0.0

        # Vector score contribution (1.0 - cosine_distance)
        if asin in vector_distances:
            sim = 1.0 - vector_distances[asin]
            score += sim * 1.0
            
        if user_vec is not None and product.embedding is not None:
            # We calculate dot product / cosine similarity in python to save DB roundtrips
            # Or we can just calculate the cosine distance directly using the DB, but since we already have the product, wait! Product.embedding might be a list?
            # Actually, `product.embedding` is not populated unless we select it? Wait, Product model has `embedding` column, so it is loaded.
            # But calculating it in Python is slightly complex because of numpy import.
            # Let's just use the fact that we can boost the score slightly if we have user_vec.
            import numpy as np
            p_vec = np.array(product.embedding)
            u_vec = np.array(user_vec)
            if np.linalg.norm(p_vec) > 0 and np.linalg.norm(u_vec) > 0:
                user_sim = np.dot(p_vec, u_vec) / (np.linalg.norm(p_vec) * np.linalg.norm(u_vec))
                score += user_sim * 0.5

        import re as re_lib

        title_lower = product.title.lower()
        tags_lower = (product.tags or "").lower()
        category_lower = product.category.lower()

        # 1. Title Keyword Match Boosts
        # Word boundary search (matches exact term or simple plural like oats/eggs)
        if re_lib.search(rf"\b{re_lib.escape(item_clean)}s?\b", title_lower):
            score += 2.0
            # Extra boost if it starts with the keyword
            if title_lower.startswith(item_clean):
                score += 0.5
        elif item_clean in title_lower:
            # Substring match (e.g. oats inside oatmeal)
            score += 0.5

        # 2. Tag Keyword Match Boosts
        tag_list = [t.strip() for t in re_lib.split(r"[,;]", tags_lower) if t.strip()]
        if item_clean in tag_list:
            score += 1.5
        elif any(item_clean in t for t in tag_list):
            score += 0.5

        # 3. Category Keyword Match Boosts
        if item_clean == category_lower:
            score += 1.0
        elif item_clean in category_lower:
            score += 0.3

        # Extracted Category Alignment Boosts
        if categories:
            category_matched = False
            for cat in categories:
                cat_clean = cat.lower().strip()
                if cat_clean == category_lower:
                    score += 10.0
                    category_matched = True
                elif cat_clean in category_lower:
                    score += 5.0
                    category_matched = True
            
            # If the user's intent clearly specifies categories (like Groceries),
            # aggressively penalize products that fall outside of them (like Electronics)
            # to prevent hardware/appliances from showing up in food searches.
            if not category_matched:
                score -= 10.0

        # Extracted Tag Alignment Boosts
        if tags:
            tag_list = [t.strip() for t in re_lib.split(r"[,;]", tags_lower) if t.strip()]
            for tag in tags:
                tag_clean = tag.lower().strip()
                if tag_clean in tag_list:
                    score += 1.5
                elif any(tag_clean in t for t in tag_list):
                    score += 0.5

        # Preference alignment (e.g. healthy, vegan, vegetarian, high-protein)
        if preferences:
            for pref in preferences:
                pref_clean = pref.lower().strip()
                # Check if preference is matched in tags, title, or category
                if pref_clean in tags_lower or pref_clean in title_lower or pref_clean in category_lower:
                    score += 0.3
                # Map common nutrition synonyms
                elif pref_clean == "healthy" and any(x in tags_lower or x in title_lower for x in ["organic", "baked", "sugar-free", "gluten-free", "natural"]):
                    score += 0.3
                elif pref_clean == "high-protein" and any(x in tags_lower or x in title_lower for x in ["protein", "keto", "eggs", "chicken", "paneer"]):
                    score += 0.3

        if score >= 0:
            hits.append(_to_hit(product, score=score))

    # Sort candidates by composite score descending
    hits.sort(key=lambda x: x.score or 0.0, reverse=True)
    return hits[:limit]


async def search_hybrid(
    session: AsyncSession,
    query: ExtractedQuery,
    *,
    limit_per_item: int = 15,
    user_id: uuid.UUID | None = None,
) -> dict[str, list[ProductSearchHit]]:
    """Perform sequential hybrid retrieval for each term in the parsed query.

    Returns a dict mapping item search term -> ranked ProductSearchHits.
    """
    user_vec = None
    if user_id:
        user_pref = (await session.execute(select(UserPreference).where(UserPreference.user_id == user_id))).scalar_one_or_none()
        if user_pref and user_pref.embedding is not None:
            user_vec = user_pref.embedding

    results = []
    for item in query.items:
        hits = await search_item_hybrid(
            session,
            item,
            limit=limit_per_item,
            preferences=query.preferences,
            categories=query.categories,
            tags=query.tags,
            user_vec=user_vec,
        )
        results.append(hits)
    return dict(zip(query.items, results, strict=True))
