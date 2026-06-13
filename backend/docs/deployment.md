# Deployment

## Local (development)

```powershell
uvicorn app.main:app --reload
```

## Docker

```powershell
# Build + run API and Redis together.
docker compose up --build

# AI extras baked in (adds ~2 GB to image size):
docker build --build-arg INSTALL_AI=true -t qcommerce-api:ai .
```

The included `docker-compose.yml` only runs the API and Redis — Supabase
stays hosted. Set `DATABASE_URL` in `.env` to your Supabase pooled
connection; the compose file forces `REDIS_URL=redis://redis:6379/0` so
the container always talks to the local Redis service.

## Supabase setup

1. Create a Supabase project.
2. Enable the `vector` extension (Database → Extensions).
3. Create the `qcommerce_products` table (see [Domain Model](domain-model.md)).
4. Populate it with your upstream pipeline.
5. Copy keys + JWT secret + connection string into `.env`.

## Redis

Required for WebSocket realtime + rate limiting. Local dev: Docker Compose
includes it. Production options:

- **Upstash** (serverless Redis): set `REDIS_URL` to the `rediss://` URL.
- **Self-hosted**: any Redis 6+ works; use `redis://` (or `rediss://` for TLS).
- **Disable**: leave `REDIS_URL=""`. The REST API still works; WebSockets
  return a 1011 close with `realtime requires REDIS_URL`.

## Database migrations

We use Alembic for app-owned tables only. The externally-managed
`qcommerce_products` table is excluded from autogeneration.

```powershell
# After adding a model, generate a migration:
alembic revision --autogenerate -m "add carts and cart_items"

# Apply migrations:
alembic upgrade head
```

## Production checklist

- [ ] Set `APP_ENV=prod` and `APP_DEBUG=false`
- [ ] Lock `CORS_ORIGINS` to your real frontend origin(s)
- [ ] Use the **pooled** Supabase connection string (port 6543)
- [ ] Configure `REDIS_URL` (Upstash or self-hosted) — required for WS
- [ ] Set `ADMIN_TOKEN` to a long random string (or leave blank to disable admin routes)
- [ ] Set `RATE_LIMIT_ENABLED=true` and tune `RATE_LIMIT_PER_MINUTE`
- [ ] Rotate `SUPABASE_SERVICE_ROLE_KEY` if it ever leaks
- [ ] Add a real LLM provider key when ready (and set `LLM_PROVIDER`)
- [ ] Front the API with a TLS terminator (nginx, Caddy, or your platform)
- [ ] Run with multiple uvicorn workers / replicas — Redis pub/sub keeps WS fan-out coherent
