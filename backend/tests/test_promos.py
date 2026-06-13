"""Tests for promo-code discount math."""

from __future__ import annotations

from decimal import Decimal

import pytest

from app.services import promos


def test_lookup_is_case_insensitive() -> None:
    assert promos.lookup("flat50") is promos.lookup("FLAT50")
    assert promos.lookup("Save10").code == "SAVE10"


def test_unknown_code_returns_none() -> None:
    assert promos.lookup("DOES_NOT_EXIST") is None
    assert promos.lookup(None) is None


def test_flat_discount_applies_above_min() -> None:
    p = promos.lookup("FLAT50")
    assert promos.compute_discount(p, Decimal("200")) == Decimal("50")


def test_flat_discount_skipped_below_min() -> None:
    p = promos.lookup("FLAT50")
    assert promos.compute_discount(p, Decimal("100")) == Decimal("0")


def test_percent_discount_quantized() -> None:
    p = promos.lookup("SAVE10")
    # 10% of 199 = 19.9 -> 19.90
    assert promos.compute_discount(p, Decimal("199")) == Decimal("19.90")


def test_flat_discount_capped_at_subtotal() -> None:
    p = promos.lookup("FLAT50")
    # subtotal == min_subtotal == 199; flat 50 is fine.
    assert promos.compute_discount(p, Decimal("199")) == Decimal("50")


@pytest.mark.parametrize(
    "code,subtotal,expected",
    [
        ("FLAT50", "500", "50"),
        ("SAVE10", "500", "50.00"),
        ("NEW100", "400", "100"),
        ("NEW100", "298", "0"),
    ],
)
def test_compute_discount_examples(code: str, subtotal: str, expected: str) -> None:
    p = promos.lookup(code)
    assert promos.compute_discount(p, Decimal(subtotal)) == Decimal(expected)
