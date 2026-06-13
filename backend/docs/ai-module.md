# AI Module

The AI layer is split into two concerns:

1. **Retrieval** — turning a user prompt into a small set of candidate products.
2. **Reasoning** — turning those candidates into a coherent cart.

## Retrieval: pgvector + `all-MiniLM-L6-v2`

Embeddings already exist in `qcommerce_products.embedding`. At request time:

```python
# 1. Embed the user prompt using the same model that built the column.
vec = embedder.encode("dinner for 4 under ₹800, vegetarian")

# 2. Cosine similarity in Postgres.
SELECT asin, title, price, 1 - (embedding <=> :vec) AS score
FROM qcommerce_products
WHERE in_stock = true
ORDER BY embedding <=> :vec
LIMIT 30;
```

The `<=>` operator is pgvector's cosine distance.

## Reasoning: provider-agnostic LLM wrapper

```python
class LLMProvider(Protocol):
    async def complete(self, system: str, user: str, **kwargs) -> str: ...

class StubLLMProvider:
    """Deterministic, key-free implementation for the hackathon demo."""
```

We default to `StubLLMProvider`, which applies simple rules (budget, dietary
flags, quantity inference) over the retrieved candidates. Plug in OpenAI /
Anthropic / Gemini later by implementing the same protocol.

## Intent-to-Cart flow

```
prompt
  │
  ▼ embed (local, ~50ms)
  │
  ▼ pgvector top-30
  │
  ▼ filter (in_stock, dietary, price ceiling)
  │
  ▼ assemble (quantity = ceil(servings / unit_size); respect budget)
  │
  ▼ Cart { items, subtotal, swaps, explanations }
```

## Endpoints (Phase 3)

| Method | Path                              | Description                                          | Auth |
| ------ | --------------------------------- | ---------------------------------------------------- | ---- |
| POST   | `/api/v1/ai/semantic-search`      | pgvector cosine search (keyword fallback)            | none |
| POST   | `/api/v1/ai/cart-from-intent`     | NL prompt → ready-to-checkout cart                   | yes  |
| POST   | `/api/v1/ai/similar`              | Find similar products (by ASIN body)                 | none |
| GET    | `/api/v1/ai/similar/{asin}`       | Find similar products (GET convenience)              | none |
| POST   | `/api/v1/ai/snap-to-cart`         | Image upload → cart (vision stub)                    | yes  |
| GET    | `/api/v1/missions`                | List active mission bundles                          | none |
| GET    | `/api/v1/missions/{slug}`         | Resolve a mission to a live bundle                   | none |
| GET    | `/api/v1/recommendations/trending`| Highest-engagement in-stock products                 | none |
| GET    | `/api/v1/recommendations/your-usual` | Products you reorder most                         | yes  |
| GET    | `/api/v1/recommendations/for-you` | Personalized feed                                    | yes  |
| GET    | `/api/v1/reorders`                | List my subscriptions                                | yes  |
| GET    | `/api/v1/reorders/upcoming`       | Subscriptions due within N days                      | yes  |
| POST   | `/api/v1/reorders`                | Create a subscription                                | yes  |
| PATCH  | `/api/v1/reorders/{id}`           | Update qty / cadence                                 | yes  |
| POST   | `/api/v1/reorders/{id}/skip`      | Push `next_run_at` by one cadence                    | yes  |
| POST   | `/api/v1/reorders/{id}/pause`     | Pause a subscription                                 | yes  |
| POST   | `/api/v1/reorders/{id}/resume`    | Resume a paused subscription                         | yes  |
| DELETE | `/api/v1/reorders/{id}`           | Delete a subscription                                | yes  |

## Snap-to-Cart (Phase 3 stub)

Accepts an image upload, runs a placeholder classifier, returns a cart.
Vision-model integration is a one-file swap when we're ready.
