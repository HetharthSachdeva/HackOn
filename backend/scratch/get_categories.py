import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from sqlalchemy.sql import func
from app.models.product import Product
from app.core.database import session_scope

async def main():
    async with session_scope() as session:
        # Get distinct categories
        stmt = select(Product.category, func.count().label("cnt")).group_by(Product.category).order_by(func.count().desc())
        res = await session.execute(stmt)
        categories = res.all()
        print("Categories:")
        for cat, cnt in categories:
            print(f"  - {cat} ({cnt} products)")

        # Get some sample tags
        stmt_tags = select(Product.tags).where(Product.tags != "").limit(100)
        res_tags = await session.execute(stmt_tags)
        tags = set()
        for row in res_tags.scalars():
            for t in row.split(","):
                if t.strip():
                    tags.add(t.strip().lower())
        print("\nSample Tags:")
        print(", ".join(sorted(list(tags))[:60]))

if __name__ == "__main__":
    asyncio.run(main())
