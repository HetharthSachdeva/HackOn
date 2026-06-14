"""Tests for the LLM provider stub and CartSuggestion contract."""

from __future__ import annotations

import pytest

from app.ai.llm import CartSuggestion, StubLLMProvider, get_provider


@pytest.mark.anyio
async def test_stub_provider_empty_candidates() -> None:
    provider = StubLLMProvider()
    result = await provider.suggest_cart("snacks", [], budget=None)
    assert isinstance(result, CartSuggestion)
    assert result.rationale_by_asin == {}
    assert "couldn't" in result.explanation.lower() or "no" in result.explanation.lower()


@pytest.mark.anyio
async def test_stub_provider_with_candidates() -> None:
    provider = StubLLMProvider()
    candidates = [
        {"asin": "A1", "title": "Chips", "price": 50, "category": "snacks", "tags": ""},
        {"asin": "A2", "title": "Soda", "price": 40, "category": "beverages", "tags": ""},
    ]
    result = await provider.suggest_cart("snack pack", candidates, budget=200.0)
    assert "200" in result.explanation
    assert set(result.rationale_by_asin) == {"A1", "A2"}


def test_get_provider_returns_singleton() -> None:
    import app.ai.llm as llm_module

    llm_module._provider = None
    p1 = get_provider()
    p2 = get_provider()
    assert p1 is p2


@pytest.mark.anyio
async def test_stub_provider_parse_query() -> None:
    provider = StubLLMProvider()
    res = await provider.parse_query("healthy breakfast with oats and fruit under ₹500")
    assert "oats" in res.items or "breakfast" in res.items or "fruit" in res.items or any("oats" in it for it in res.items)
    assert res.budget == 500.0
    assert "healthy" in res.preferences
    assert res.occasion == "breakfast"
    assert "Groceries & Kitchen" in res.categories
    assert "breakfast" in res.tags
