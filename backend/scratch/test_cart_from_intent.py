import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Configure structlog to print to stdout/stderr
import structlog
structlog.configure(
    processors=[
        structlog.processors.JSONRenderer()
    ]
)

from app.core.database import session_scope
from app.services.intent_to_cart import cart_from_intent

async def main():
    prompt = "i have to leave for airport in 30 mins , anything i might need but missing"
    print(f"Running cart_from_intent with prompt: '{prompt}'")
    
    async with session_scope() as session:
        response = await cart_from_intent(
            session=session,
            prompt=prompt,
            user_id=None,
            budget=None,
            max_items=8,
            apply_to_cart=False
        )
        print("\n=== PIPELINE RESPONSE ===")
        print(response.model_dump())

if __name__ == "__main__":
    asyncio.run(main())
