"""AI layer: provider-agnostic LLM wrapper, embeddings, prompts."""

from app.ai.embedding import embed_text, get_embedder, is_available  # noqa: F401
from app.ai.llm import CartSuggestion, LLMProvider, StubLLMProvider, get_provider  # noqa: F401
