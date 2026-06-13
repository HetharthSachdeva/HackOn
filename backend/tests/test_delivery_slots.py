"""Tests for delivery-slot generation."""

from __future__ import annotations

from datetime import datetime, timezone

from app.models.delivery import SlotType
from app.services.delivery import express_eta, generate_slots


def test_express_eta_uses_max_with_buffer() -> None:
    assert express_eta([10, 20, None, 5]) == 23  # max(20) + 3 buffer


def test_express_eta_defaults_when_no_data() -> None:
    assert express_eta([None, None]) == 18  # 15 default + 3 buffer


def test_generate_slots_includes_one_express_first() -> None:
    fixed_now = datetime(2026, 6, 13, 12, 17, tzinfo=timezone.utc)
    options = generate_slots(now=fixed_now)
    assert len(options) >= 2
    assert options[0].slot_type == SlotType.EXPRESS
    assert all(o.slot_type == SlotType.SCHEDULED for o in options[1:])


def test_scheduled_slots_align_to_half_hour() -> None:
    fixed_now = datetime(2026, 6, 13, 12, 17, tzinfo=timezone.utc)
    options = generate_slots(now=fixed_now)
    scheduled = [o for o in options if o.slot_type == SlotType.SCHEDULED]
    for opt in scheduled:
        assert opt.slot_start.minute in {0, 30}
        assert opt.slot_end.minute in {0, 30}
        assert (opt.slot_end - opt.slot_start).total_seconds() == 30 * 60
