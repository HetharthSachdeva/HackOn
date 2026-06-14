from __future__ import annotations

import uuid

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai import embedding as embedding_service
from app.models.product import Product
from app.models.user_preference import UserPreference

log = structlog.get_logger(__name__)


async def track_event(
    session: AsyncSession,
    user_id: uuid.UUID,
    event_type: str,
    asin: str | None = None,
    query: str | None = None,
) -> None:
    """Updates the user's preference vector based on the event.

    - If the user views or adds an item to cart, we shift their vector towards that product's embedding.
    - If the user searches, we shift their vector towards the embedded query.
    """
    vector_to_blend = None

    if (event_type in ("view", "cart_add")) and asin:
        # Fetch the product embedding
        product = await session.get(Product, asin)
        if product and product.embedding:
            vector_to_blend = product.embedding

    elif event_type == "search" and query:
        # Embed the search query
        try:
            vector_to_blend = embedding_service.embed_text(query)
        except Exception as exc:
            log.warning("tracking.embed_search_failed", query=query, error=str(exc))

    if not vector_to_blend:
        return

    # Determine learning rate (alpha) based on signal strength
    # Cart adds are stronger signals than views or searches
    alpha = 0.3 if event_type == "cart_add" else 0.1

    # Fetch or create UserPreference
    stmt = select(UserPreference).where(UserPreference.user_id == user_id)
    user_pref = (await session.execute(stmt)).scalar_one_or_none()

    if not user_pref:
        # First interaction! Set their vector exactly to the current item
        user_pref = UserPreference(user_id=user_id, embedding=vector_to_blend)
        session.add(user_pref)
    else:
        # Blend the new vector into the existing one using exponential moving average
        current_vec = user_pref.embedding if user_pref.embedding is not None else [0.0] * len(vector_to_blend)
        new_vec = [
            (1.0 - alpha) * current_vec[i] + alpha * vector_to_blend[i]
            for i in range(len(current_vec))
        ]
        user_pref.embedding = new_vec

    await session.commit()
    log.info("tracking.vector_updated", user_id=str(user_id), event_type=event_type)
