"""One-shot catalog sync from upstream Supabase into our local Postgres.

Why this exists:
    The product catalog (``qcommerce_products`` + 384-d embeddings) is
    produced by a separate pipeline and stored in Supabase. Rather than make
    our API depend on Supabase for every read, we mirror the catalog
    locally with this command, then run all transactional traffic against
    one Postgres instance. Re-run whenever the upstream catalog changes:

        python -m app.cli sync-catalog            # incremental upsert
        python -m app.cli sync-catalog --truncate # full refresh

Network calls are paginated against the Supabase REST API (PostgREST), which
returns at most 1000 rows per request by default. We page until exhaustion.

Embedding handling:
    Postgres+pgvector returns vectors as a Python list of floats over
    psycopg/asyncpg. The Supabase REST API serializes them as a JSON string
    like ``"[0.1, 0.2, ...]"``; we parse + cast as needed before binding.
"""

from __future__ import annotations

import asyncio
import json
import math
import time
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlencode

import httpx
import structlog
from sqlalchemy import delete, text
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core.config import get_settings
from app.core.database import get_session_factory
from app.models.product import EMBEDDING_DIM, Product

log = structlog.get_logger(__name__)

# PostgREST hard ceiling per request when ``Prefer: count=...`` isn't set.
_PAGE_SIZE = 1000

# The exact column set we mirror. Keep in sync with Product.__table__.
_COLUMNS = (
    "asin",
    "title",
    "category",
    "price",
    "img_url",
    "stars",
    "reviews",
    "unit_size",
    "stock_qty",
    "in_stock",
    "delivery_time_mins",
    "tags",
    "embedding",
)


@dataclass(slots=True)
class SyncStats:
    """Counters returned by :func:`sync_catalog`."""

    fetched: int = 0
    inserted: int = 0
    updated: int = 0
    skipped_invalid: int = 0
    elapsed_seconds: float = 0.0


def _parse_embedding(value: Any) -> list[float] | None:
    """Normalize the ``embedding`` field from PostgREST into a Python list."""
    if value is None:
        return None
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except json.JSONDecodeError:
            return None
    if not isinstance(value, list):
        return None
    if len(value) != EMBEDDING_DIM:
        return None
    try:
        out = [float(x) for x in value]
    except (TypeError, ValueError):
        return None
    # Reject NaN/Inf — pgvector will refuse them at insert time anyway.
    if any(math.isnan(x) or math.isinf(x) for x in out):
        return None
    return out


def _normalize_row(row: dict[str, Any]) -> dict[str, Any] | None:
    """Coerce a PostgREST row into the shape our ORM model expects."""
    asin = row.get("asin")
    title = row.get("title")
    category = row.get("category")
    price = row.get("price")
    if not asin or not title or not category or price is None:
        return None

    return {
        "asin": str(asin),
        "title": str(title),
        "category": str(category),
        "price": price,
        "img_url": row.get("img_url"),
        "stars": row.get("stars"),
        "reviews": row.get("reviews"),
        "unit_size": row.get("unit_size"),
        "stock_qty": row.get("stock_qty"),
        "in_stock": row.get("in_stock"),
        "delivery_time_mins": row.get("delivery_time_mins"),
        "tags": row.get("tags"),
        "embedding": _parse_embedding(row.get("embedding")),
    }


async def _fetch_page(
    client: httpx.AsyncClient,
    *,
    base_url: str,
    headers: dict[str, str],
    offset: int,
    limit: int,
) -> list[dict[str, Any]]:
    """Fetch a single page of products from Supabase REST."""
    query = urlencode(
        {
            "select": ",".join(_COLUMNS),
            "order": "asin.asc",
            "limit": limit,
            "offset": offset,
        }
    )
    url = f"{base_url}/rest/v1/qcommerce_products?{query}"
    resp = await client.get(url, headers=headers, timeout=60.0)
    resp.raise_for_status()
    return resp.json()


async def sync_catalog(
    *,
    truncate: bool = False,
    batch_size: int = 500,
) -> SyncStats:
    """Pull the entire upstream catalog and upsert it into the local DB.

    Args:
        truncate: If True, delete all local rows first (full refresh). If
            False (default), upsert by primary key so existing rows are
            updated and new rows are inserted.
        batch_size: How many rows to write per ``ON CONFLICT`` statement.
            Keeps each transaction small so we don't hold long locks.

    Returns:
        :class:`SyncStats` with counters and elapsed wall time.
    """
    settings = get_settings()
    if not settings.supabase_url:
        raise RuntimeError("SUPABASE_URL is not configured")
    # Reading the catalog only needs the anon key (public read).
    api_key = settings.supabase_anon_key or settings.supabase_service_role_key
    if not api_key:
        raise RuntimeError("SUPABASE_ANON_KEY (or service-role) is not configured")

    headers = {"apikey": api_key, "Authorization": f"Bearer {api_key}"}
    started = time.perf_counter()
    stats = SyncStats()

    sessionmaker = get_session_factory()
    async with httpx.AsyncClient(http2=False) as client:
        if truncate:
            async with sessionmaker() as session:
                await session.execute(delete(Product))
                await session.commit()
                log.info("catalog_sync.truncated")

        offset = 0
        buffer: list[dict[str, Any]] = []
        while True:
            page = await _fetch_page(
                client,
                base_url=settings.supabase_url.rstrip("/"),
                headers=headers,
                offset=offset,
                limit=_PAGE_SIZE,
            )
            if not page:
                break
            stats.fetched += len(page)
            log.info(
                "catalog_sync.page",
                offset=offset,
                returned=len(page),
                total_fetched=stats.fetched,
            )
            for raw in page:
                norm = _normalize_row(raw)
                if norm is None:
                    stats.skipped_invalid += 1
                    continue
                buffer.append(norm)
                if len(buffer) >= batch_size:
                    await _flush_batch(sessionmaker, buffer, stats)
                    buffer.clear()
            offset += len(page)
            if len(page) < _PAGE_SIZE:
                break

        if buffer:
            await _flush_batch(sessionmaker, buffer, stats)

    stats.elapsed_seconds = time.perf_counter() - started
    return stats


async def _flush_batch(
    sessionmaker: Any,
    rows: list[dict[str, Any]],
    stats: SyncStats,
) -> None:
    """Upsert one batch and update counters using PostgreSQL ``RETURNING``.

    We use ``ON CONFLICT (asin) DO UPDATE`` and rely on ``xmax`` to tell us
    whether each affected row was an insert (xmax = 0) or an update.
    """
    stmt = pg_insert(Product.__table__).values(rows)
    update_cols = {c: stmt.excluded[c] for c in _COLUMNS if c != "asin"}
    stmt = stmt.on_conflict_do_update(
        index_elements=[Product.__table__.c.asin],
        set_=update_cols,
    ).returning(text("(xmax = 0) AS inserted"))

    async with sessionmaker() as session:
        result = await session.execute(stmt)
        for (inserted,) in result.all():
            if inserted:
                stats.inserted += 1
            else:
                stats.updated += 1
        await session.commit()


def run_sync(*, truncate: bool = False, batch_size: int = 500) -> SyncStats:
    """Sync entry point for CLI / scripts (creates the asyncio loop)."""
    return asyncio.run(sync_catalog(truncate=truncate, batch_size=batch_size))
