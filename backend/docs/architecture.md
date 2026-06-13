# Architecture

## High-level

```
                ┌──────────────────────────┐
   client ───►  │   FastAPI (this repo)    │
                │  - JWT verification      │
                │  - REST + WebSocket      │  ◄──┐
                │  - business logic        │     │ pub/sub
                └────┬─────────────┬───────┘     │ (events,
                     │             │             │ notifications)
        async SA     │             │  supabase-py│
        + asyncpg    ▼             ▼             ▼
              ┌──────────┐   ┌─────────────┐   ┌──────────┐
              │ Supabase │   │ Supabase    │   │  Redis   │
              │ Postgres │   │ Auth /      │   │ (pub/sub │
              │ pgvector │   │ Storage     │   │ + ratelim│
              └──────────┘   └─────────────┘   └──────────┘
```

## Layering

| Layer | Responsibility | Pure? |
|---|---|---|
| `app/api/v1/` | HTTP routers; validation; depends on services | No (FastAPI) |
| `app/services/` | Business logic; composes repositories | Yes |
| `app/repositories/` | DB access (SQLAlchemy) | No (SA) |
| `app/models/` | ORM models | No (SA) |
| `app/schemas/` | Pydantic request/response models | Yes |
| `app/ai/` | Embedding + LLM providers, prompts | Yes (LLM optional) |
| `app/core/` | Cross-cutting (config, db, security, errors, redis, rate limit) | Mixed |

The split keeps routers thin and services testable without spinning up a
real DB. Repositories are the only layer that talks SQL.

## Why Redis?

We chose Redis over in-memory primitives for anything shared across
requests/workers:

- **WebSocket fan-out** — multiple workers can publish/subscribe to the
  same channel; without this, an event emitted in worker A would never
  reach a client connected to worker B.
- **Rate limiting** — a process-local counter is wrong the second you scale
  past one worker.
- **(Future) caches** — trending recommendations, dedup keys, etc.

In-memory data structures don't survive horizontal scaling. They bite back
later. See [Realtime](realtime.md) for the pub/sub design.

## Error model

All errors flow through `app/core/errors.py` and respond with:

```json
{
  "error": {
    "code": "not_found",
    "message": "Product abc123 was not found",
    "details": null,
    "request_id": "..."
  }
}
```

Domain code raises `AppError` subclasses (`NotFoundError`, `ValidationError`,
`UnauthorizedError`, …). Routers never construct `HTTPException` directly.

## Request lifecycle

1. `RequestContextMiddleware` assigns a request ID and binds it to the
   structlog context.
2. `RateLimitMiddleware` checks the per-IP Redis counter (no-op if disabled).
3. CORS middleware runs.
4. Route dependencies resolve: `get_db` opens a session, `get_current_user`
   verifies the JWT.
5. The handler runs, returning a Pydantic model.
6. On exit, the session commits (or rolls back on exception) and closes.
7. Exception handlers translate any raised `AppError` into a JSON response.
