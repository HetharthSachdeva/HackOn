"""Test the lazy embedding loader (smoke test, only when ai extras installed)."""

from __future__ import annotations

import pytest


def _ai_installed() -> bool:
    try:
        import sentence_transformers  # noqa: F401
    except ImportError:
        return False
    return True


@pytest.mark.skipif(not _ai_installed(), reason="ai extras not installed")
def test_embed_text_returns_384_dims() -> None:
    from app.ai import embedding

    vec = embedding.embed_text("hello world")
    assert isinstance(vec, list)
    assert len(vec) == 384
    assert all(isinstance(x, float) for x in vec[:5])
