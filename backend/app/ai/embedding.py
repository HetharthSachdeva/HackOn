"""Embedding model loader.

We use the same model that built the ``embedding`` column upstream:
``sentence-transformers/all-MiniLM-L6-v2`` (384 dims).

The model is loaded **lazily** on first use because:
* It downloads ~80 MB the first time.
* PyTorch initialization is slow (~1–2 s) and we don't want it in startup.
* Tests that don't touch AI pay zero cost.

If ``sentence_transformers`` is not installed (the ``ai`` extra wasn't
selected), :func:`is_available` returns ``False`` and callers fall back to
keyword search.
"""

from __future__ import annotations

from threading import Lock
from typing import Any

import structlog

from app.core.config import get_settings

log = structlog.get_logger(__name__)

_model: Any | None = None
_model_lock = Lock()
_unavailable_reason: str | None = None


def is_available() -> bool:
    """Return True if the embedding model can be loaded (or already is)."""
    return _unavailable_reason is None


def get_embedder() -> Any:
    """Return the cached SentenceTransformer model, loading it on first use.

    Raises:
        RuntimeError: If sentence-transformers isn't installed or the model
            failed to load. Callers should use :func:`is_available` first if
            they want a soft fallback.
    """
    global _model, _unavailable_reason
    if _model is not None:
        return _model
    with _model_lock:
        if _model is not None:
            return _model
        try:
            from sentence_transformers import SentenceTransformer  # type: ignore
        except ImportError as exc:
            _unavailable_reason = (
                "sentence-transformers not installed. "
                "Install with: pip install -e \".[ai]\""
            )
            raise RuntimeError(_unavailable_reason) from exc

        settings = get_settings()
        log.info("embedding.loading_model", model=settings.embedding_model)
        try:
            _model = SentenceTransformer(settings.embedding_model)
        except Exception as exc:
            _unavailable_reason = f"Failed to load embedding model: {exc}"
            raise RuntimeError(_unavailable_reason) from exc
        log.info("embedding.model_loaded", model=settings.embedding_model)
        return _model


def embed_text(text: str) -> list[float]:
    """Embed a single string into a 384-dim float list."""
    model = get_embedder()
    vec = model.encode(text, normalize_embeddings=True, show_progress_bar=False)
    return vec.tolist()


def embed_texts(texts: list[str], *, batch_size: int = 128) -> list[list[float]]:
    """Batch-embed many strings at once.

    Roughly 30-50x faster than calling :func:`embed_text` in a loop because
    SentenceTransformer can vectorize the forward pass across a batch on
    CPU/GPU. Used by the catalog re-embed job.
    """
    if not texts:
        return []
    model = get_embedder()
    vecs = model.encode(
        texts,
        batch_size=batch_size,
        normalize_embeddings=True,
        show_progress_bar=False,
        convert_to_numpy=True,
    )
    return [v.tolist() for v in vecs]


def build_catalog_text(
    *,
    title: str,
    category: str | None,
    tags: str | None,
) -> str:
    """Build the canonical text we embed for one catalog row.

    Why all three fields and not just the title?
        Small models like ``all-MiniLM-L6-v2`` essentially match on word
        overlap when the source text is a single short product title.
        Without category/tags context, "Magnetic Chip Clips" ranks just as
        high as "Potato Chips" for the query ``"chips"`` because both
        titles contain the literal word. Folding the category and tag list
        into the embedded text gives the model the disambiguating signal
        it needs ("Household Essentials" vs "Groceries & Kitchen").

    Format is deliberately readable English so the encoder treats it as
    a coherent passage rather than a bag of fields. Missing values
    degrade gracefully to ``"none"``.
    """
    cat = (category or "").strip() or "uncategorized"
    raw_tags = (tags or "").replace(";", ", ").strip()
    tag_part = raw_tags if raw_tags else "none"
    return f"{title.strip()}. Category: {cat}. Tags: {tag_part}."
