"""Tests for the intent-to-cart prompt parser and assembler."""

from __future__ import annotations

from decimal import Decimal

import pytest

from app.schemas.product import ProductSearchHit
from app.services.intent_to_cart import (
    _assemble,
    parse_budget,
    parse_servings,
)


@pytest.mark.parametrize(
    "prompt,expected",
    [
        ("snacks under 200", Decimal("200")),
        ("dinner under ₹800", Decimal("800")),
        ("breakfast budget of 500", Decimal("500")),
        ("max 350 rupees", Decimal("350")),
        ("max₹350", Decimal("350")),
        ("up to 600", Decimal("600")),
        ("less than 150", Decimal("150")),
        ("anything ₹999 please", Decimal("999")),
        ("just snacks", None),
        ("", None),
    ],
)
def test_parse_budget(prompt: str, expected: Decimal | None) -> None:
    assert parse_budget(prompt) == expected


@pytest.mark.parametrize(
    "prompt,expected",
    [
        ("dinner for 4 people", 4),
        ("snacks for 2 guests", 2),
        ("breakfast for 6 pax", 6),
        ("just food", None),
        ("for the weekend", None),
    ],
)
def test_parse_servings(prompt: str, expected: int | None) -> None:
    assert parse_servings(prompt) == expected


def _hit(asin: str, price: str, *, score: float = 0.8, stars: float | None = 4.0):
    return ProductSearchHit(
        asin=asin,
        title=f"Product {asin}",
        category="snacks",
        price=Decimal(price),
        score=score,
        stars=stars,
        in_stock=True,
    )


def test_assemble_respects_budget() -> None:
    candidates = [_hit("A", "100"), _hit("B", "200"), _hit("C", "300")]
    chosen = _assemble(candidates, budget=Decimal("350"), max_items=10, servings=None)
    asins = [c.asin for c in chosen]
    assert "A" in asins
    assert sum((c.line_total for c in chosen), Decimal("0")) <= Decimal("350")


def test_assemble_no_budget_picks_max_items() -> None:
    candidates = [_hit(f"P{i}", "100") for i in range(20)]
    chosen = _assemble(candidates, budget=None, max_items=5, servings=None)
    assert len(chosen) == 5


def test_assemble_uses_servings_for_first_item() -> None:
    candidates = [_hit("A", "50"), _hit("B", "30")]
    chosen = _assemble(candidates, budget=None, max_items=5, servings=4)
    assert chosen[0].quantity == 4
    assert chosen[0].line_total == Decimal("200")
    assert chosen[1].quantity == 1


def test_assemble_falls_back_to_qty_1_when_servings_exceed_budget() -> None:
    # Servings of 4 × ₹100 = ₹400 would breach a ₹150 budget; falls to qty 1.
    candidates = [_hit("A", "100", score=0.9)]
    chosen = _assemble(candidates, budget=Decimal("150"), max_items=5, servings=4)
    assert len(chosen) == 1
    assert chosen[0].quantity == 1
    assert chosen[0].line_total == Decimal("100")


def test_assemble_empty_candidates() -> None:
    assert _assemble([], budget=None, max_items=5, servings=None) == []
