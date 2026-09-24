# ─── Python Runtime ──────────────────────────────────────────
FROM python:3.10-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# ─── Dépendances système (psycopg2) ──────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ─── Dépendances Python ───────────────────────────────────────
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# ─── Code source ─────────────────────────────────────────────
COPY . .

EXPOSE 5001

# ─── Healthcheck ─────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5001/api/admin/health || exit 1

# ─── Lancement avec Gunicorn (port 5001 — séparé du public) ──
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "app:create_app()"]
