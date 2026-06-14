# ⚡ Amazon Now — AI-First Quick Commerce

> An AI-powered quick-commerce web app where customers describe what they need in plain
> language and get a ready-to-checkout cart in seconds — alongside a traditional fast
> browse/search experience.

Built for **Amazon HackOn 6.0**.

---

## 📖 Table of Contents
- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [How AI Mode Works (Intent-to-Cart)](#-how-ai-mode-works-intent-to-cart)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#-environment-variables)
- [API Overview](#-api-overview)
- [End-to-End Workflow](#-end-to-end-workflow)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 The Problem

Quick-commerce customers arrive with an **immediate need** and expect to finish their
purchase in **seconds**. Yet most shopping experiences still rely on search → browse →
compare → add items one-by-one. 

> **How might we help customers discover, decide, and purchase what they need in the
> fastest and most effortless way possible?**

## 💡 Our Solution

Amazon Now adds an **AI Mode** on top of a normal quick-commerce storefront:

- **Normal Mode** — fast catalog browsing, search, filters, deals, cart, and checkout.
- **AI Mode** — type (or speak) a need like *"healthy breakfast for a week under ₹1000"*
  and the assistant builds a **complete, budget-aware, ready-to-checkout bundle** using
  semantic search + an LLM, with one-tap "Add Bundle to Cart."

This collapses the discover → decide → purchase journey into a single prompt.

---

## ✨ Key Features

### Shopping (Normal Mode)
- 🛒 Product catalog with search, category filters, price slider, and rating filters
- 🔥 "Today's Deals" with discounts and a featured-partner banner
- 📦 Product detail pages, cart with live quantity/price updates, free-delivery progress
- 👤 Auth (Supabase), saved addresses, checkout, order history, cancel/return

### AI Mode (the differentiator)
- 🤖 **Intent-to-Cart** — natural-language prompt → curated bundle
- 🧠 **Semantic search** over the catalog via `pgvector` + sentence-transformer embeddings
- ✍️ **LLM-written** bundle explanation + per-item rationale (Google Gemma)
- 🔁 **Replace** any item and **Optimize** the bundle (Cheapest / Healthiest / High Protein / Vegan)
- 💰 Budget parsing, savings, AI confidence, and delivery ETA on the bundle card
- 🌌 Premium animated "AI terminal" UI (futuristic background, glowing accents)

---

## 🏗 Architecture

```
┌────────────────────┐        HTTP / axios          ┌────────────────────┐
│   React (Vite)     │  ───────────────────────────► │   FastAPI backend  │
│   localhost:5173   │   /api/v1/* (JWT Bearer)      │   localhost:8000   │
│                    │ ◄─────────────────────────── │                    │
│  Redux · Tailwind  │                               │  async SQLAlchemy  │
└─────────┬──────────┘                               └─────────┬──────────┘
          │ Supabase Auth (JWT)                                │
          ▼                                                    ▼
   ┌──────────────┐                          ┌──────────────────────────────┐
   │ Supabase Auth│                          │ Supabase Postgres + pgvector  │
   └──────────────┘                          │ qcommerce_products, carts,    │
                                              │ orders, addresses, reviews…   │
                                              └───────────────┬──────────────┘
                                                              │
                                       ┌──────────────────────┴───────────────┐
                                       │ Gemma LLM (Google AI Studio)          │
                                       │ all-MiniLM-L6-v2 embeddings (local)   │
                                       └───────────────────────────────────────┘
```

---

## 🧰 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router, Redux Toolkit, Tailwind CSS, Framer Motion, axios |
| **Auth** | Supabase Auth (JWT) |
| **Backend** | FastAPI, async SQLAlchemy 2.x, asyncpg, Pydantic, Uvicorn |
| **Database** | Supabase Postgres + `pgvector` |
| **AI / ML** | `sentence-transformers/all-MiniLM-L6-v2` embeddings, Google **Gemma** LLM |
| **Realtime** | WebSockets + Redis pub/sub (optional) |
| **Infra** | Docker + docker-compose, Alembic migrations |

---

## 🧠 How AI Mode Works (Intent-to-Cart)

When a user submits a prompt in AI Mode, the frontend calls
`POST /api/v1/ai/cart-from-intent`. The backend pipeline
(`backend/app/services/intent_to_cart.py`) runs:

1. **Parse constraints** — extract budget and servings from the text (regex).
2. **Semantic search** — embed the prompt and run a `pgvector` cosine-distance query
   against `qcommerce_products.embedding` to retrieve the best matches.
   *Falls back to keyword search if embeddings are unavailable.*
3. **Assemble the cart** — greedily pick top-ranked, in-stock items that fit the budget.
4. **LLM rationale** — Gemma writes a customer-facing explanation + per-item reasons.
   *Falls back to a deterministic stub if the LLM errors.*
5. **Return the bundle** — items, subtotal, savings, confidence → rendered as the
   AI Bundle card.

`Replace` and `Optimize` simply re-run this pipeline with a tweaked prompt.

---

## 📁 Project Structure

```
HackOn/
├── frontend/                     # React + Vite app
│   ├── src/
│   │   ├── api/                  # axios calls (catalog loader, supabase client)
│   │   ├── components/
│   │   │   ├── header/           # QuickCommerceHeader (search + AI toggle)
│   │   │   ├── home/             # Home, QuickCommerceHero, AIBundleCard, ProductsSlider
│   │   │   ├── products/         # Products list, Product card, ProductDetails
│   │   │   ├── cart/ · checkout/ · orders/ · logIn/ · footer/
│   │   ├── context/              # cart / address / order React contexts
│   │   ├── redux/                # amazonSlice, store (guest cart, auth state)
│   │   └── App.jsx               # routes + AI-mode state (Layout)
│   ├── .env
│   └── package.json
│
├── backend/                      # FastAPI app
│   ├── app/
│   │   ├── main.py               # app factory + middleware + CORS
│   │   ├── api/v1/               # routers: catalog, cart, orders, ai, auth, …
│   │   ├── services/             # intent_to_cart, semantic_search, cart, …
│   │   ├── ai/                   # embeddings + LLM provider (Gemma/stub)
│   │   ├── models/ · schemas/ · repositories/ · core/ · ws/
│   ├── alembic/                  # DB migrations
│   ├── .env
│   ├── pyproject.toml
│   └── docker-compose.yml
│
└── README.md
```

---

## 🚀 Getting Started

**Prerequisites:** Node.js 18+, Python 3.11+, and a Supabase project with the
populated `qcommerce_products` table (already configured via `.env`).

### Backend Setup

From the `backend/` folder (PowerShell):

```powershell
# 1. Create & activate a virtual environment
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
# If activation is blocked: Set-ExecutionPolicy -Scope Process -Bypass

# 2. Install dependencies
pip install -e ".[dev]"
pip install -e ".[ai]"     # AI extras (torch + sentence-transformers, ~2 GB) — needed for AI Mode

# 3. Run the server
uvicorn app.main:app --reload --port 8000
# If 'uvicorn' isn't found, use:  python -m uvicorn app.main:app --reload --port 8000
```

Verify:
- API root → http://localhost:8000
- Swagger docs → http://localhost:8000/docs
- Health → http://localhost:8000/health

> Without the `[ai]` extras the app still runs — AI Mode just falls back to keyword
> search instead of semantic embeddings.

### Frontend Setup

From the `frontend/` folder:

```powershell
# 1. Install dependencies
npm install

# 2. Start the dev server (Vite, port 5173)
npm run dev
```

Open http://localhost:5173. Keep the backend running on port 8000 (the frontend calls it).

---

## 🔐 Environment Variables

Both apps read a `.env` file (already provided for the hackathon).

**`backend/.env`** (key entries):
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Async Postgres URL (points at populated Supabase DB) |
| `SUPABASE_URL` / `SUPABASE_*_KEY` | Supabase project + keys |
| `LLM_PROVIDER` / `LLM_API_KEY` / `LLM_MODEL` | LLM config (`gemma` / `stub`) |
| `EMBEDDING_MODEL` | `sentence-transformers/all-MiniLM-L6-v2` |
| `CORS_ORIGINS` | Allowed frontend origins (5173 / 3000) |
| `DEV_BYPASS_AUTH` | `true` for local dev (skips auth) |
| `REDIS_URL` | Optional — for WebSocket realtime + rate limiting |

**`frontend/.env`**: Supabase URL + anon key (`VITE_SUPABASE_*`).

> ⚠️ The committed keys are for the hackathon/demo only — rotate them before any public deployment.

---

## 🔌 API Overview

All endpoints are under `/api/v1`:

| Domain | Example endpoints |
|---|---|
| **Catalog** | `GET /catalog/products`, `GET /catalog/products/{asin}` |
| **AI** | `POST /ai/cart-from-intent` (Intent-to-Cart) |
| **Cart** | `GET /cart`, `POST /cart/items`, `PUT/DELETE /cart/items/{asin}` |
| **Orders** | `POST /orders`, `GET /orders`, `POST /orders/{id}/cancel` |
| **Addresses** | `GET/POST/DELETE /addresses` |
| **Auth** | Supabase-backed JWT verification |
| **More** | `missions`, `reorders`, `recommendations`, `reviews`, `notifications`, `ws` (realtime), `admin` |

Full interactive reference at **http://localhost:8000/docs**.

---

## 🔄 End-to-End Workflow

1. **Boot** — `App.jsx` loads the catalog once via `GET /catalog/products?limit=1000`
   and shares it across pages.
2. **Browse / search (Normal Mode)** — filter and sort the catalog client-side; view
   product details; add to cart.
3. **AI Mode** — toggle AI → type/speak intent → `POST /ai/cart-from-intent` →
   semantic search + LLM → **AI Bundle** → tweak with Replace/Optimize → Add to Cart.
4. **Cart** — synced to the backend for signed-in users (Redux for guests); shows
   subtotal, tax, free-delivery progress, total.
5. **Checkout** — choose address + payment → `POST /orders` → order confirmed.
6. **Orders** — view history, cancel/return; optional live tracking via WebSocket.

---

## 🛠 Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| `ERR_CONNECTION_REFUSED` on `:8000` | Backend not running — start uvicorn. |
| `uvicorn: command not found` | venv not activated, or use `python -m uvicorn …`. |
| `net::ERR_FAILED` / 500 on AI/catalog | Backend DB unreachable — ensure `DATABASE_URL` points to the populated Supabase DB and restart the backend (it reads `.env` at startup). |
| AI bundle "generation failed" | Backend 500 — check the uvicorn terminal (with `APP_DEBUG=true` it prints the traceback). |
| Activation blocked in PowerShell | Run `Set-ExecutionPolicy -Scope Process -Bypass`, then activate. |

---

## 📄 License
MIT — built for Amazon HackOn 6.0.
