# ─────────────────────────────────────────────
#  STAGE 1 : Build React avec Node.js
# ─────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Variables d'env pour Vite (inject au build time)
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL

# Dépendances en premier (cache Docker)
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Code source
COPY . .

# Build de production
RUN npm run build

# ─────────────────────────────────────────────
#  STAGE 2 : Servir avec Nginx
# ─────────────────────────────────────────────
FROM nginx:1.25-alpine AS runner

# Config Nginx custom (SPA support)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fichiers statiques buildés
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -q --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
