# Quick-Commerce Backend

> AI-first FastAPI backend for a quick-commerce app. Built on Supabase
> (Postgres + Auth + Storage), with semantic search and Intent-to-Cart
> powered by pgvector + `sentence-transformers/all-MiniLM-L6-v2`.

## ✨ Highlights

- **FastAPI** with auto-generated OpenAPI docs (`/docs`, `/redoc`)
- **Async SQLAlchemy 2.x** over Supabase Postgres (asyncpg)
- **Supabase Auth** for users — JWT verified on every request
- **pgvector semantic search** over an existing `qcommerce_products` table
- **Intent-to-Cart**: natural-language prompt → ready-to-pay cart
- **Mission bundles**, **smart reorders** (skip-don't-order), **recommendations**
- **WebSocket order tracking + notifications**, fan-out over **Redis pub/sub** (scales horizontally)
- **Rate limiting** (Redis-backed, fail-open) and **admin endpoints** (shared-secret)
- **Reviews & ratings** with one-per-user constraint
- **MkDocs Material** documentation site
- **Dockerfile + docker-compose** for one-command local boot

## 📦 Project Status

| Phase | Scope | Status |
|---|---|---|
| 1 | Skeleton & foundations | ✅ done |
| 2 | Commerce core (catalog, cart, orders, payments) | ✅ done |
| 3 | AI differentiators (Intent-to-Cart, missions, reorders) | ✅ done |
| 4 | Realtime, reviews, admin, rate-limit, Docker, docs | ✅ done |

## 🚀 Quickstart

### 1. Prerequisites
- Python 3.11+ (3.14 supported)
- A Supabase project with the `qcommerce_products` table populated (see below)
- Redis (only required for WebSocket realtime + rate limiting — the REST API works without it)

### 2. Install
```powershell
# create + activate a virtualenv
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1

# install in editable mode with dev tools
pip install -e ".[dev]"

# (optional) AI extras: sentence-transformers + torch (~2 GB download)
pip install -e ".[ai]"
```

### 3. Configure
```powershell
Copy-Item .env.example .env
# Then edit .env and fill in your Supabase credentials.
```

You need from your Supabase dashboard:
- **Project URL** (Settings → API)
- **`anon` key** and **`service_role` key** (Settings → API)
- **JWT secret** (Settings → API → JWT Settings)
- **Database connection string** (Settings → Database → use POOLED, port 6543)

### 4. Run

#### Locally (without Docker)
```powershell
# Start Redis however you like, then:
uvicorn app.main:app --reload
```

#### With Docker Compose (recommended)
```powershell
# Builds the API image, starts Redis + API together.
docker compose up --build
```

Open:
- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health: http://localhost:8000/health

## 🔌 WebSocket endpoints

Live updates for orders and notifications. Pass the Supabase access token
as a query string parameter (browsers can't set WS request headers).

```
ws://localhost:8000/api/v1/ws/orders/{order_id}?token=<jwt>
ws://localhost:8000/api/v1/ws/notifications?token=<jwt>
```

Every message is a JSON object: `{"event": "...", "data": {...}}`. The server
sends a `ping` event every 25 seconds for proxy keepalive. **Realtime
requires `REDIS_URL`** — without it the socket is closed with code 1011 and
a clear reason.

## 🛡 Admin endpoints

Locked behind a shared secret. Set `ADMIN_TOKEN=...` in `.env`, then call
with `X-Admin-Token: <value>`. Leaving the env var blank disables the
entire `/admin/*` router with a 403.

## 🧯 Rate limiting

Off by default. Flip `RATE_LIMIT_ENABLED=true` and tune
`RATE_LIMIT_PER_MINUTE`. The counter lives in Redis; if Redis is down,
requests are allowed through (fail-open).

## 🗂 The Catalog (`qcommerce_products`)

This backend assumes the following table already exists in your Supabase project
and is populated by an upstream pipeline. **We do not write to it.**

```sql
create extension if not exists vector;

create table qcommerce_products (
  asin varchar primary key,
  title text not null,
  category varchar not null,
  price decimal(10, 2) not null,
  img_url text,
  stars float,
  reviews int,
  unit_size varchar,
  stock_qty int,
  in_stock boolean,
  delivery_time_mins int,
  tags text,
  embedding vector(384)   -- all-MiniLM-L6-v2
);
```

All new tables (carts, orders, missions, etc.) reference `asin` as `varchar`
without an FK constraint, so the catalog can be rebuilt independently.

## 📚 Documentation

- Auto API reference: `/docs` and `/redoc`
- Prose docs (architecture, domain model, AI deep-dive):
  ```powershell
  mkdocs serve
  ```
  then open http://localhost:8000

## 🧪 Tests
```powershell
pytest
```

## 🏗 Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app factory
│   ├── core/                    # config, db, security, deps, errors, logging
│   ├── models/                  # SQLAlchemy entities
│   ├── schemas/                 # Pydantic request/response models
│   ├── api/v1/                  # routers (one per feature)
│   ├── services/                # business logic
│   ├── repositories/            # DB access
│   ├── ai/                      # LLM wrapper, embeddings, prompts
│   ├── ws/                      # WebSocket handlers
│   └── utils/
├── alembic/                     # migrations
├── tests/
├── docs/                        # MkDocs source
├── scripts/                     # seed, indexing
├── .env.example
├── pyproject.toml
└── README.md
```

## 🪪 License
MIT
