# Local Setup (New PC)

End-to-end instructions for getting this backend running on a fresh Windows
machine. Covers local **Postgres + pgvector + Memurai (Redis)** and uses
Supabase only for (a) the product catalog and (b) auth-token issuance.

> **Why local infra instead of pointing everything at Supabase?**
> The free-tier Supabase direct DB connection is IPv6-only and the Supavisor
> pooler rejected our credentials. Running Postgres + Redis locally is more
> reliable, faster for dev, and works offline. Catalog data is pulled once
> from Supabase via `python -m app.cli sync-catalog`.

---

## 1. Prerequisites — install these system-wide

| Tool | Recommended version | Install command |
|---|---|---|
| **Git** | any | `winget install Git.Git` |
| **Python** | 3.11+ (3.12 ideal) | `winget install Python.Python.3.12` |
| **PostgreSQL** | 17.x | See note ⚠ below |
| **Memurai Developer** (Redis for Windows) | 4.x | See note ⚠ below |
| **VS 2022 Build Tools** (needed to compile pgvector) | latest | `winget install Microsoft.VisualStudio.2022.BuildTools` — pick the **"Desktop development with C++"** workload in the installer UI |

### ⚠ Postgres install note

The winget package `PostgreSQL.PostgreSQL.17` sets a **random, unknown**
superuser password. Easiest fix: download the **EnterpriseDB graphical
installer** from <https://www.postgresql.org/download/windows/> instead — it
prompts you for the `postgres` password during install. Use `1234` (or
anything you'll remember; it's local-only).

### ⚠ Memurai install note

`winget install Memurai.MemuraiDeveloper` may fail with exit code 1603 due
to a custom-action temp-dir bug. Workaround — download the MSI directly:

```powershell
$url = "https://dist.memurai.com/releases/Memurai-Developer/4.1.2/Memurai-Developer-v4.1.2.msi"
Invoke-WebRequest $url -OutFile "$env:TEMP\memurai.msi"
Start-Process msiexec.exe -ArgumentList "/i `"$env:TEMP\memurai.msi`" /qn" -Verb RunAs -Wait
Get-Service Memurai   # should be Running
```

### ⚠ pgvector — must be compiled from source on Windows

There is no winget / binary package. Open an **elevated `cmd.exe`** (not
PowerShell — the `vcvars64.bat` setup needs cmd semantics) and run:

```bat
cd %TEMP%
curl -L -o pgvector.zip https://github.com/pgvector/pgvector/archive/refs/tags/v0.8.1.zip
tar -xf pgvector.zip
cd pgvector-0.8.1
set "PGROOT=C:\Program Files\PostgreSQL\17"
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
nmake /F Makefile.win
nmake /F Makefile.win install
```

This drops `vector.dll` into `C:\Program Files\PostgreSQL\17\lib\` and the
SQL files into `share\extension\`.

---

## 2. Clone the repo

```powershell
git clone <your-repo-url> backend
cd backend
```

## 3. Create the virtualenv and install dependencies

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
# If PowerShell blocks activation:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

pip install -e ".[dev,ai]"
```

The `[ai]` extra pulls `sentence-transformers` + `torch` (~2 GB). It's
only required for `/ai/semantic-search` and `/ai/intent-to-cart`. Drop it
if you don't need those locally.

> **Activation tip:** PowerShell can't use `activate.bat`. Always use
> `Activate.ps1`, or skip activation entirely and call
> `.\.venv\Scripts\python.exe ...` directly.

## 4. Create the `qcommerce` database and enable pgvector

```powershell
$env:PGPASSWORD = "1234"     # whatever you set as the postgres superuser password
$psql = "C:\Program Files\PostgreSQL\17\bin\psql.exe"

& $psql -h 127.0.0.1 -U postgres -c "CREATE DATABASE qcommerce;"
& $psql -h 127.0.0.1 -U postgres -d qcommerce -c "CREATE EXTENSION vector;"
```

Verify:

```powershell
& $psql -h 127.0.0.1 -U postgres -d qcommerce -c "\dx vector"
```

You should see `vector | 0.8.1 | public | vector data type and ...`.

## 5. Verify Memurai is running

```powershell
Get-Service Memurai   # Status should be Running
.\.venv\Scripts\python.exe -c "import redis; print(redis.Redis().ping())"
# expected: True
```

## 6. Configure `.env`

```powershell
Copy-Item .env.example .env
notepad .env
```

Fill in these fields (everything else can stay at defaults):

```ini
# --- Local Postgres ---
DATABASE_URL="postgresql+asyncpg://postgres:1234@127.0.0.1:5432/qcommerce"

# --- Local Redis (Memurai) ---
REDIS_URL="redis://localhost:6379/0"
REDIS_NAMESPACE="qc"

# --- Supabase ---
# URL is needed so the server can derive the JWKS endpoint that verifies
# user access tokens. The anon + service_role keys are only used by the
# `sync-catalog` command to pull product rows.
SUPABASE_URL="https://svdwcionemyzyptdzymj.supabase.co"
SUPABASE_ANON_KEY="<paste anon key from Supabase dashboard>"
SUPABASE_SERVICE_ROLE_KEY="<paste service_role key>"
SUPABASE_JWT_SECRET=""   # leave empty for modern ES256/RS256 projects
```

Where to find each Supabase value:

| Variable | Dashboard location |
|---|---|
| `SUPABASE_URL` | Project Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Project Settings → API → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` `secret` |

## 7. Run migrations (creates all 13 tables)

```powershell
.\.venv\Scripts\alembic.exe upgrade head
```

Expect four migrations to apply (`0001` … `0004_catalog_local`).

## 8. Sync the product catalog from Supabase

```powershell
python -m app.cli sync-catalog
```

This paginates `qcommerce_products` via the Supabase REST API and upserts
each row into the local DB. Takes ~25 s for ~6,400 rows. Re-run any time
to pick up upstream changes; pass `--truncate` to wipe and reload from
scratch.

## 9. Run the test suite

```powershell
pytest -q
# expected: 70 passed
```

## 10. Start the dev server

```powershell
python -m app.cli serve --reload
```

Browse to:

- <http://127.0.0.1:8000/docs> — Swagger UI
- <http://127.0.0.1:8000/redoc> — ReDoc
- <http://127.0.0.1:8000/health> — `{"status":"ok"}`
- <http://127.0.0.1:8000/api/v1/catalog/products> — should return catalog rows

---

## Authentication

The backend **never** issues tokens. Users sign up / sign in via the
Supabase Auth SDK on the client, and the resulting JWT is sent as
`Authorization: Bearer <token>` on every API call. The server verifies the
signature against the Supabase JWKS endpoint
(`<SUPABASE_URL>/auth/v1/.well-known/jwks.json`) — public keys are cached
in-process for 10 minutes and rotate automatically.

Minimal client snippet:

```js
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { data } = await supabase.auth.signInWithPassword({ email, password });
const token = data.session.access_token;

await fetch("http://127.0.0.1:8000/api/v1/auth/me", {
  headers: { Authorization: `Bearer ${token}` },
});
```

Test from `/docs`: click **Authorize**, paste the access token (no
`Bearer ` prefix — FastAPI adds it), then invoke any secured endpoint.

### Bypassing auth for local testing

For quick local poking it's annoying to mint a real token. Flip on the
dev bypass in `.env`:

```ini
APP_ENV="dev"
DEV_BYPASS_AUTH=true
DEV_USER_ID="00000000-0000-0000-0000-000000000001"
DEV_USER_EMAIL="dev@local.test"
```

Restart the server. Every request now authenticates as the configured dev
user — no `Authorization` header needed. You'll see a fat warning banner
in the startup logs and on the first request.

To act "as" a different user without restarting, send the
`X-Dev-User-Id` header on the request:

```powershell
curl.exe http://127.0.0.1:8000/api/v1/auth/me `
  -H "X-Dev-User-Id: 11111111-2222-3333-4444-555555555555"
```

> **Hard safety rails:** the app **refuses to start** if
> `DEV_BYPASS_AUTH=true` while `APP_ENV` is anything other than `"dev"`.
> Pydantic raises a validation error at import time, so a misconfigured
> staging or prod deploy crashes fast instead of silently exposing every
> route. Leave the flag at `false` in any committed `.env` file.

---

## Enabling Gemma 4 (Google AI Studio)

The AI endpoints (`/ai/intent-to-cart`, `/ai/snap-to-cart`, etc.) ship with
a deterministic stub provider so they work out of the box. To switch to a
real model, point the backend at Google's hosted Gemma 4:

1. Get a free API key at <https://aistudio.google.com/apikey>.
2. Edit `.env`:

   ```ini
   LLM_PROVIDER="gemma"
   LLM_API_KEY="<your AI Studio key>"
   LLM_MODEL="gemma-4-31b-it"   # 31b dense (recommended). Alt: gemma-4-26b-a4b-it (MoE, faster but occasionally returns 500s)
   ```
3. Restart the server. No code changes required — every route that calls
   `app.ai.llm.get_provider()` automatically picks up the new provider.

> The provider sends a **`responseSchema`** with every `suggest_cart` call.
> Gemma 4 otherwise narrates its reasoning before answering (no JSON-only
> mode is honored without a schema); supplying the schema gives us
> guaranteed structured output and ~10x cleaner responses.

If the upstream API errors or returns malformed JSON, the provider logs a
warning and degrades to the deterministic stub output for that single
request — your demo never hard-fails.

To run Gemma locally via Ollama (offline, no API key) instead, point the
provider at Ollama's OpenAI-compatible endpoint:

```ini
LLM_PROVIDER="gemma"
LLM_BASE_URL="http://localhost:11434/v1"
LLM_API_KEY="ollama"
LLM_MODEL="gemma3:4b"
```

---

## Daily cheat sheet

```powershell
.\.venv\Scripts\Activate.ps1
python -m app.cli serve --reload                   # dev server (autoreload)
pytest -q                                          # tests
.\.venv\Scripts\alembic.exe revision --autogenerate -m "msg"   # new migration
.\.venv\Scripts\alembic.exe upgrade head                       # apply migrations
python -m app.cli sync-catalog                     # re-pull catalog (incremental)
python -m app.cli sync-catalog --truncate          # wipe + reload catalog
```

---

## Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| `ModuleNotFoundError: No module named 'uvicorn'` | venv isn't activated. `activate.bat` doesn't work in PowerShell — use `Activate.ps1`, or call `.\.venv\Scripts\python.exe -m app.cli serve --reload` directly. |
| `psql: error: connection ... failed: password authentication failed` | Postgres password is wrong. Reset it via UAC-elevated script that flips `pg_hba.conf` to `trust`, runs `ALTER USER postgres WITH PASSWORD '...'`, then restores `scram-sha-256`. |
| `extension "vector" is not available` | pgvector wasn't compiled/installed. Re-run the nmake steps in Section 1; confirm `vector.dll` is at `C:\Program Files\PostgreSQL\17\lib\vector.dll`. |
| `redis.exceptions.ConnectionError: Error 10061 connecting to localhost:6379` | Memurai service isn't running. `Start-Service Memurai`. |
| `gaierror` connecting to `db.<ref>.supabase.co` | Direct Supabase host is IPv6-only on free tier; your network has no IPv6. We don't use that connection anymore — make sure `DATABASE_URL` points at `127.0.0.1`. |
| Swagger `/docs` shows the route but it 401s with a valid token | Token might be from a different Supabase project, or the `SUPABASE_URL` in `.env` doesn't match the project that issued the token. JWKS verification needs them aligned. |
| WebSocket endpoints close immediately | `REDIS_URL` is empty. Realtime fan-out requires Redis pub/sub. |
| `InsecureKeyLengthWarning` during tests | Harmless — the test fixture uses a short HS256 secret. Ignored intentionally. |
