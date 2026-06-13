"""AI layer: provider-agnostic LLM wrapper, embeddings, prompts."""

from app.ai.embedding import embed_text, get_embedder, is_available  # noqa: F401
from app.ai.llm import (  # noqa: F401
    CartSuggestion,
    GemmaProvider,
    LLMProvider,
    StubLLMProvider,
    get_provider,
    reset_provider_cache,
)
