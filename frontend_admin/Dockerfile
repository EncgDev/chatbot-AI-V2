# ──────────────────────────────────────────────────────────
#  NORA Admin — Frontend (Vite + React 18)
#  Port exposé : 5174
# ──────────────────────────────────────────────────────────

FROM node:20-alpine AS base
WORKDIR /app

# Dépendances
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

# Sources
COPY . .

EXPOSE 5174

# Mode développement (hot-reload dans Docker)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"]
