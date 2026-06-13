# Quick-Commerce Backend

An **AI-first** FastAPI backend for a quick-commerce app.

> _Customers arrive with an immediate need. Our job is to collapse
> **discover → decide → purchase** into a single expressive action._

## What's in the box

- :material-rocket: **FastAPI** with auto-generated OpenAPI at `/docs` and `/redoc`
- :material-database: **Supabase Postgres** via async SQLAlchemy 2.x + asyncpg
- :material-shield-key: **Supabase Auth** — JWT verification on every request
- :material-brain: **pgvector semantic search** with `sentence-transformers/all-MiniLM-L6-v2`
- :material-cart: **Intent-to-Cart**, **Mission Bundles**, **Smart Reorders**, **Recommendations**
- :material-broadcast: **WebSocket** order tracking

## Where to next

- [Local Setup (New PC)](local-setup.md) — full step-by-step for a fresh Windows machine (local Postgres + pgvector + Memurai)
- [Getting Started](getting-started.md) — quick reference (Supabase-only flow)
- [Architecture](architecture.md) — the big picture
- [Domain Model](domain-model.md) — entities and relationships
- [AI Module](ai-module.md) — how Intent-to-Cart works
- [Deployment](deployment.md) — Supabase + Docker recipes
