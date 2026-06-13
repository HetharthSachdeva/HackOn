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
