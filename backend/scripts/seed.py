"""Demo data loader.

Seeds a handful of app-owned rows for local demos. Does NOT touch the
externally-managed ``qcommerce_products`` table.

Usage::

    python -m scripts.seed --user-id <SUPABASE_USER_UUID>

You can get your Supabase user UUID from the Supabase dashboard
(Authentication → Users) or from the ``sub`` claim of any access token.
"""

from __future__ import annotations

import argparse
import asyncio
import uuid

import structlog

from app.core.database import session_scope
from app.core.logging import configure_logging
from app.models.address import Address

log = structlog.get_logger(__name__)


_DEMO_ADDRESSES = [
    {
        "label": "Home",
        "recipient_name": "Demo User",
        "phone": "+919876543210",
        "line1": "Flat 1201, Sunshine Apartments",
        "line2": "100 Feet Road",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560038",
        "landmark": "Opposite Indiranagar Metro",
        "latitude": "12.971599",
        "longitude": "77.594566",
        "is_default": True,
    },
    {
        "label": "Office",
        "recipient_name": "Demo User",
        "phone": "+919876543210",
        "line1": "Building B, Tech Park",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560103",
    },
]


async def seed(user_id: uuid.UUID) -> None:
    async with session_scope() as session:
        for data in _DEMO_ADDRESSES:
            address = Address(user_id=user_id, **data)
            session.add(address)
        await session.flush()
        log.info("seed.addresses_created", count=len(_DEMO_ADDRESSES), user_id=str(user_id))


def main() -> None:
    configure_logging()
    parser = argparse.ArgumentParser(description="Seed demo data for one user.")
    parser.add_argument(
        "--user-id",
        required=True,
        help="Supabase user UUID to attach demo addresses to.",
    )
    args = parser.parse_args()

    user_id = uuid.UUID(args.user_id)
    asyncio.run(seed(user_id))


if __name__ == "__main__":
    main()
