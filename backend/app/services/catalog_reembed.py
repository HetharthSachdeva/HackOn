"""Locally re-compute the ``embedding`` column for every catalog row.

Why this exists:
    The embeddings that arrived with the Supabase catalog were computed
    over the product *title only*. With a small encoder like
    ``all-MiniLM-L6-v2`` and a noisy long-tail Amazon-style catalog, that
    is not enough disambiguating signal — query ``"chips"`` returns chip
    *clips*, query ``"snacks"`` returns *snack organizers*, etc.

    This job re-embeds every row using
    ``f"{title}. Category: {category}. Tags: {tags}."`` (see
    :func:`app.ai.embedding.build_catalog_text`) so the vector captures
    product *type* in addition to product *name*.

Operation:
    Reads all rows once into memory (6,423 rows × ~120 bytes = ~770 KB,
    trivial), batch-encodes through SentenceTransformer (fast on CPU
    with batch_size=128), then UPDATEs in chunks via ``executemany``.

    Re-runnable; the HNSW index on the embedding column is maintained
    incrementally by Postgres on UPDATE so no separate reindex is needed.
"""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass

import structlog
from sqlalchemy import bindparam, select

from app.ai.embedding import build_catalog_text, embed_texts
from app.core.database import get_session_factory
from app.models.product import Product

log = structlog.get_logger(__name__)


@dataclass(slots=True)
class ReembedStats:
    """Counters returned by :func:`reembed_catalog`."""

    fetched: int = 0
    updated: int = 0
    skipped_empty: int = 0
    elapsed_seconds: float = 0.0


async def reembed_catalog(*, batch_size: int = 128) -> ReembedStats:
    """Recompute every product embedding from ``title + category + tags``.

    Args:
        batch_size: Batch size for both the SentenceTransformer encoder
            and the DB UPDATE. 128 is a good default for CPU; raise on GPU.

    Returns:
        :class:`ReembedStats` with counters and wall time.
    """
    started = time.perf_counter()
    stats = ReembedStats()
    sessionmaker = get_session_factory()

    async with sessionmaker() as session:
        rows = (
            await session.execute(
                select(
                    Product.asin,
                    Product.title,
                    Product.category,
                    Product.tags,
                )
            )
        ).all()
    stats.fetched = len(rows)
    log.info("catalog_reembed.fetched", count=stats.fetched)

    asins: list[str] = []
    texts: list[str] = []
    for asin, title, category, tags in rows:
        if not title:
            stats.skipped_empty += 1
            continue
        asins.append(asin)
        texts.append(
            build_catalog_text(title=title, category=category, tags=tags)
        )

    if not asins:
        stats.elapsed_seconds = time.perf_counter() - started
        return stats

    # Bulk UPDATE via Core (table-level) — bypasses the ORM identity tracker
    # so we avoid `bulk synchronize of persistent objects not supported`.
    products_t = Product.__table__
    update_stmt = (
        products_t.update()
        .where(products_t.c.asin == bindparam("b_asin"))
        .values(embedding=bindparam("b_embedding"))
    )

    encode_started = time.perf_counter()
    for start in range(0, len(asins), batch_size):
        chunk_asins = asins[start : start + batch_size]
        chunk_texts = texts[start : start + batch_size]
        vectors = embed_texts(chunk_texts, batch_size=batch_size)
        payload = [
            {"b_asin": asin, "b_embedding": vec}
            for asin, vec in zip(chunk_asins, vectors, strict=True)
        ]
        async with sessionmaker() as session:
            await session.execute(update_stmt, payload)
            await session.commit()
        stats.updated += len(payload)
        log.info(
            "catalog_reembed.batch",
            done=stats.updated,
            total=len(asins),
        )

    log.info(
        "catalog_reembed.encode_done",
        seconds=round(time.perf_counter() - encode_started, 2),
    )
    stats.elapsed_seconds = time.perf_counter() - started
    return stats


def run_reembed(*, batch_size: int = 128) -> ReembedStats:
    """Sync entry point for CLI / scripts (creates the asyncio loop)."""
    return asyncio.run(reembed_catalog(batch_size=batch_size))
