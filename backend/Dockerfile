# ─── Python Runtime ──────────────────────────────────────────
FROM python:3.10-slim

# ─── Répertoire de travail ────────────────────────────────────
WORKDIR /app

# ─── Variables d'environnement Python ────────────────────────
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# ─── Dépendances système (nécessaires pour psycopg2) ─────────
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

# ─── Exposition du port ───────────────────────────────────────
EXPOSE 5000

# ─── Healthcheck ─────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# ─── Lancement avec Gunicorn ─────────────────────────────────
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:create_app()"]