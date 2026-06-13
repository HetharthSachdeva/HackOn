"""Delivery slot computation and slot-option generation.

In a real system, slots are constrained by dark-store capacity and rider
availability. For the hackathon we generate plausible options on the fly.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.models.delivery import SlotType
from app.schemas.delivery import SlotOption

DEFAULT_EXPRESS_MINUTES = 15  # fallback ETA when products lack per-item ETA
EXPRESS_BUFFER_MINUTES = 3


def express_eta(per_item_etas: list[int | None]) -> int:
    """ETA = max(per-item ETAs) + small buffer, with a sensible default."""
    valid = [e for e in per_item_etas if e is not None and e > 0]
    base = max(valid) if valid else DEFAULT_EXPRESS_MINUTES
    return base + EXPRESS_BUFFER_MINUTES


def _round_up_to(dt: datetime, minutes: int) -> datetime:
    """Round ``dt`` UP to the next multiple of ``minutes``."""
    discard = timedelta(
        minutes=dt.minute % minutes,
        seconds=dt.second,
        microseconds=dt.microsecond,
    )
    if discard:
        dt += timedelta(minutes=minutes) - discard
    return dt


def generate_slots(*, now: datetime | None = None) -> list[SlotOption]:
    """Generate slot options for the next 4 hours plus an express option."""
    now = now or datetime.now(timezone.utc)

    options: list[SlotOption] = []

    # Express: deliver as soon as possible.
    eta = DEFAULT_EXPRESS_MINUTES + EXPRESS_BUFFER_MINUTES
    options.append(
        SlotOption(
            slot_type=SlotType.EXPRESS,
            slot_start=now,
            slot_end=now + timedelta(minutes=eta),
            eta_mins=eta,
            label=f"Express • ~{eta} mins",
        )
    )

    # Scheduled 30-min windows starting from the next round half-hour.
    first = _round_up_to(now + timedelta(minutes=30), 30)
    for i in range(8):  # ~4 hours of options
        start = first + timedelta(minutes=30 * i)
        end = start + timedelta(minutes=30)
        eta_to_start = int((start - now).total_seconds() // 60)
        label = f"{start.strftime('%I:%M %p').lstrip('0')} – {end.strftime('%I:%M %p').lstrip('0')}"
        options.append(
            SlotOption(
                slot_type=SlotType.SCHEDULED,
                slot_start=start,
                slot_end=end,
                eta_mins=max(eta_to_start, 1),
                label=label,
            )
        )
    return options


def find_scheduled_slot(slot_start: datetime) -> SlotOption | None:
    """Validate a user-picked scheduled slot against the current options."""
    for option in generate_slots():
        if option.slot_type == SlotType.SCHEDULED and option.slot_start == slot_start:
            return option
    return None
