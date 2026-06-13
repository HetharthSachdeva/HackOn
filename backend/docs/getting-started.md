# Getting Started

## Prerequisites

- Python 3.11+ (3.14 supported)
- A Supabase project with the `qcommerce_products` table created and populated

## 1. Install

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
```

For the optional AI features (Phase 3):

```powershell
pip install -e ".[dev,ai]"
```

## 2. Configure

```powershell
Copy-Item .env.example .env
```

Edit `.env` and fill in the Supabase values. You need:

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | Project Settings → API |
| `SUPABASE_ANON_KEY` | Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API |
| `SUPABASE_JWT_SECRET` | Project Settings → API → JWT Settings |
| `DATABASE_URL` | Project Settings → Database → Connection string (use **pooled**, port 6543) |

## 3. Run

```powershell
uvicorn app.main:app --reload
```

Visit:

- API: <http://localhost:8000>
- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>
- Health: <http://localhost:8000/health>
- Readiness: <http://localhost:8000/health/ready>

## 4. Verify auth

Grab an access token from the Supabase client SDK (or the dashboard), then:

```bash
curl -H "Authorization: Bearer <YOUR_SUPABASE_JWT>" http://localhost:8000/api/v1/auth/me
```

## 5. Browse the docs site

```powershell
mkdocs serve
```

Opens at <http://localhost:8000> (use `--dev-addr 127.0.0.1:8001` if the API is already on 8000).
