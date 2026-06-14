# syntax=docker/dockerfile:1.7
# Unified Dockerfile to build and run both the React frontend and FastAPI backend

ARG PYTHON_VERSION=3.12
ARG NODE_VERSION=20

# ---------- Stage 1: Build Frontend ----------
FROM node:${NODE_VERSION}-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Copy all frontend files and build
COPY frontend/ ./
RUN npm run build


# ---------- Stage 2: Build Backend Dependencies ----------
FROM python:${PYTHON_VERSION}-slim AS backend-builder
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app/backend

# System deps
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential libpq-dev \
 && rm -rf /var/lib/apt/lists/*

COPY backend/pyproject.toml backend/README.md ./
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

# Install runtime deps
ARG INSTALL_AI=false
COPY backend/app ./app
RUN if [ "$INSTALL_AI" = "true" ]; then \
        pip install ".[ai]"; \
    else \
        pip install "."; \
    fi


# ---------- Stage 3: Runtime ----------
FROM python:${PYTHON_VERSION}-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:${PATH}" \
    APP_ENV=prod \
    APP_DEBUG=false

# System deps required at runtime
RUN apt-get update \
 && apt-get install -y --no-install-recommends libpq5 \
 && rm -rf /var/lib/apt/lists/*

# Run as a non-root user
RUN groupadd --system app && useradd --system --gid app --create-home app

WORKDIR /app

# Copy python environment from backend-builder
COPY --from=backend-builder /opt/venv /opt/venv

# Copy backend code
COPY --chown=app:app backend/app ./backend/app
COPY --chown=app:app backend/alembic ./backend/alembic
COPY --chown=app:app backend/alembic.ini ./backend/alembic.ini

# Copy compiled frontend code into the container
COPY --from=frontend-builder --chown=app:app /app/frontend/dist ./backend/frontend_dist

USER app
WORKDIR /app/backend

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request,sys; \
        sys.exit(0 if urllib.request.urlopen('http://localhost:8000/api/v1/health', timeout=2).status==200 else 1)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
