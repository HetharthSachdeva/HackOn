import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import get_settings
from app.ai.llm import GemmaProvider

async def main():
    settings = get_settings()
    print("LLM Provider:", settings.llm_provider)
    print("LLM Model:", settings.llm_model)
    print("Has API Key:", bool(settings.llm_api_key))
    
    if not settings.llm_api_key:
        print("Error: No API key found!")
        return

    provider = GemmaProvider(
        api_key=settings.llm_api_key,
        model=settings.llm_model,
        base_url=settings.llm_base_url,
    )
    
    prompt = "i have to leave for airport in 30 mins , anything i might need but missing"
    print(f"\nParsing query: '{prompt}'...")
    try:
        res = await provider.parse_query(prompt)
        print("\nSUCCESS!")
        print(res)
    except Exception as e:
        print("\nFAILURE!")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
