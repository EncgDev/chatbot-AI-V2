# 🚀 Guide Complet de Déploiement : NORA Chatbot sur Linux Ubuntu

> **Document d'analyse et procédure pas-à-pas**  
> **Projet :** NORA — Chatbot ENCG Marrakech  
> **Auteurs :** Analyse automatique pour l'équipe (Soufiane, Yahya, Youssef)  
> **Date :** Septembre 2026  
> **Branche cible :** `deploy`

---

## 📑 Sommaire
1. [Analyse Technique Préalable du Projet](#1-analyse-technique-préalable-du-projet)
2. [Points de Vigilance : Différences Dev vs Production](#2-points-de-vigilance--différences-dev-vs-production)
3. [Spécifications & Prérequis Serveur](#3-spécifications--prérequis-serveur)
4. [Étape 1 : Préparation & Sécurisation du Serveur Ubuntu](#étape-1--préparation--sécurisation-du-serveur-ubuntu)
5. [Étape 2 : Installation de Docker & Docker Compose sur Ubuntu](#étape-2--installation-de-docker--docker-compose-sur-ubuntu)
6. [Étape 3 : Récupération du Projet sur le Serveur](#étape-3--récupération-du-projet-sur-le-serveur)
7. [Étape 4 : Configuration des Variables d'Environnement (.env)](#étape-4--configuration-des-variables-denvironnement-env)
8. [Étape 5 : Ajustements Recommandés pour la Production](#étape-5--ajustements-recommandés-pour-la-production)
9. [Étape 6 : Construction et Démarrage des Services](#étape-6--construction-et-démarrage-des-services)
10. [Étape 7 : Tests & Validation du Déploiement](#étape-7--tests--validation-du-déploiement)
11. [Étape 8 : Configuration d'un Domaine et HTTPS (SSL Let's Encrypt)](#étape-8--configuration-dun-domaine-et-https-ssl-lets-encrypt)
12. [Étape 9 : Maintenance, Sauvegardes & Mises à Jour Continues](#étape-9--maintenance-sauvegardes--mises-à-jour-continues)
13. [Guide de Dépannage (Troubleshooting)](#guide-de-dépannage-troubleshooting)

---

## 1. Analyse Technique Préalable du Projet

L'application **NORA** repose sur une architecture conteneurisée 3-tiers articulée autour de Docker Compose :

```
                        Navigateur Client (Internet)
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Serveur Linux Ubuntu                            │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Conteneur nora_frontend (Nginx / Port 80)                      │   │
│   │  - Sert les fichiers statiques React (dist)                    │   │
│   │  - Proxy interne pour les requêtes /api vers le backend        │   │
│   └──────────────────────────────┬─────────────────────────────────┘   │
│                                  │ (Réseau interne Docker : nora_network)
│                                  ▼                                     │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Conteneur nora_backend (Flask + Gunicorn / Port 5000 interne)  │   │
│   │  - API REST : /api/health, /api/categories, /api/qas           │   │
│   │  - Moteur Chat V1 : Full-Text Search PostgreSQL                │   │
│   │  - Moteur Chat V2 : RAG contextuel + Google Gemini 1.5 Flash   │   │
│   └──────────────────────────────┬─────────────────────────────────┘   │
│                                  │ (Réseau interne Docker)             │
│                                  ▼                                     │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Conteneur nora_db (PostgreSQL 15 Alpine / Port 5432 interne)   │   │
│   │  - Volume persistant : postgres_data                           │   │
│   │  - Auto-initialisation : 01-init.sql + 02-inserts.sql          │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Inventaire des Services :
1. **Base de Données (`db` / `nora_db`) :**
   - Image : `postgres:15-alpine`
   - Volume persistant : `postgres_data`
   - Initialisation automatique via `/docker-entrypoint-initdb.d/` :
     - `01-init.sql` : Création des tables `categories` et `QAs` avec index GIN pour la recherche plein texte en français.
     - `02-inserts.sql` : Jeu de données complet d'entraînement ENCG Marrakech.
   - Healthcheck intégré : `pg_isready`.

2. **Backend API (`backend` / `nora_backend`) :**
   - Runtime : `python:3.10-slim`
   - Serveur WSGI : `gunicorn --bind 0.0.0.0:5000 app:create_app()`
   - Dépendances : Flask 3, Flask-SQLAlchemy, Flask-CORS, psycopg2-binary, google-generativeai.
   - Dépendance ordonnée : Attend que `db` soit dans l'état `service_healthy`.

3. **Frontend Web (`frontend` / `nora_frontend`) :**
   - Framework : React 18 + Vite + Tailwind CSS + Lucide Icons + Three.js / Canvas.
   - Dockerfile multi-stage :
     - Étape 1 (`builder`) : Node 18 Alpine compile les sources en bundle de production (`npm run build`).
     - Étape 2 (`runner`) : Nginx 1.25 Alpine sert les fichiers statiques de `/app/dist` sur le port 80.

---

## 2. Points de Vigilance : Différences Dev vs Production

Avant de lancer le déploiement sur Ubuntu, l'analyse du dépôt met en évidence **4 éléments clés actuellement configurés pour le développement local** :

| Élément | État Actuel dans le Dépôt (Mode Dev) | Comportement Attendu en Production (Ubuntu) |
|---|---|---|
| **Frontend target** | `target: builder` dans `docker-compose.yml` | Doit utiliser l'image finale Nginx (`runner`) pour un service ultra-léger et rapide. |
| **Commande Frontend** | `command: npm run dev -- --host 0.0.0.0` (port 5173) | Nginx en mode daemon sur le port 80 (ou 3000). Pas de serveur Vite actif en prod. |
| **Volumes montés** | `./backend:/app` et `./frontend:/app` | À désactiver en production : le code doit être figé dans les images Docker pour la reproductibilité. |
| **Exposition PostgreSQL** | Port `5432:5432` exposé sur toutes les interfaces hôtes | **Risque de sécurité majeur sur un serveur public**. Le port 5432 ne doit être accessible que dans le réseau Docker interne. |
| **Routage API (`/api`)** | Le dev utilise le proxy Vite de la machine locale | En production, Nginx doit faire le reverse-proxy de `/api/` vers `http://backend:5000/`. |

---

## 3. Spécifications & Prérequis Serveur

### Caractéristiques minimales recommandées pour le VPS Ubuntu :
- **Système d'Exploitation :** Ubuntu 22.04 LTS ou Ubuntu 24.04 LTS (64-bit x86_64).
- **Processeur (CPU) :** 1 à 2 vCPU.
- **Mémoire Vive (RAM) :** Minimum **2 Go** (ou 1 Go avec au moins 2 Go de SWAP obligatoire pour le build Node.js).
- **Espace Disque :** 20 Go SSD minimum.
- **Accès :** Accès SSH avec droits administrateur (`sudo`).
- **Nom de domaine (Optionnel mais conseillé) :** Pointant vers l'adresse IP publique du serveur pour le HTTPS.

---

## Étape 1 : Préparation & Sécurisation du Serveur Ubuntu

Connectez-vous à votre serveur via votre terminal :
```bash
ssh root@IP_DU_SERVEUR
```

### 1.1 Mise à jour des paquets système
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git htop ufw fail2ban ca-certificates gnupg lsb-release
```

### 1.2 Configuration de la mémoire virtuelle (SWAP de 2 Go)
> 💡 *Essentiel sur les serveurs de 1 ou 2 Go de RAM afin d'éviter un plantage (Out Of Memory) lors de la compilation du frontend React (`npm run build`).*

```bash
# Vérifier si un swap existe déjà
sudo swapon --show

# Si aucun swap n'est affiché, créer 2 Go de swap :
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Rendre le swap permanent au redémarrage
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 1.3 Configuration du Pare-feu (UFW)
Ouvrez uniquement les ports nécessaires (SSH, HTTP, HTTPS) :
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (futur SSL)
# Si vous testez avec des ports alternatifs temporairement :
# sudo ufw allow 3000/tcp
# sudo ufw allow 5173/tcp

sudo ufw --force enable
sudo ufw status
```

---

## Étape 2 : Installation de Docker & Docker Compose sur Ubuntu

Suivez la méthode officielle Docker pour Ubuntu :

### 2.1 Ajouter le dépôt officiel Docker
```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### 2.2 Installer Docker Engine et le plugin Docker Compose
```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 2.3 Vérifier l'installation et activer au démarrage
```bash
sudo systemctl enable docker
sudo systemctl start docker

# Vérification des versions
docker --version
docker compose version
```

### 2.4 (Recommandé) Permettre l'exécution de Docker sans `sudo`
Si vous utilisez un utilisateur standard (ex: `ubuntu`) :
```bash
sudo usermod -aG docker $USER
# Appliquer le nouveau groupe sans vous déconnecter :
newgrp docker
```

---

## Étape 3 : Récupération du Projet sur le Serveur

### 3.1 Cloner le dépôt Git
Placez-vous dans votre dossier personnel et clonez la branche `deploy` :
```bash
cd ~
git clone -b deploy https://github.com/EncgDev/chatbot.git nora-chatbot
cd nora-chatbot
```

### 3.2 Vérifier l'arborescence des fichiers
Assurez-vous que tous les fichiers sont présents :
```bash
ls -la
```
Vous devez voir :
- `docker-compose.yml`
- `.env.example`
- Dossiers : `backend/`, `frontend/`, `database/`

---

## Étape 4 : Configuration des Variables d'Environnement (.env)

Le fichier `.env` contient les mots de passe et clés secrètes. **Il ne doit jamais être commité sur Git**.

### 4.1 Créer le fichier `.env`
```bash
cp .env.example .env
```

### 4.2 Générer des clés sécurisées et éditer le fichier
Pour générer une clé secrète robuste sous Linux :
```bash
openssl rand -hex 24
```

Éditez le fichier avec `nano` :
```bash
nano .env
```

Renseignez les valeurs adaptées pour la production :
```ini
# ============================================================
#  NORA — Variables d'Environnement de Production
# ============================================================

# --- PostgreSQL ---
POSTGRES_DB=nora_db
POSTGRES_USER=nora_user
POSTGRES_PASSWORD=METTEZ_UN_MOT_DE_PASSE_TRES_COMPLIQUE_ICI

# --- Backend Flask ---
DB_HOST=db
DB_PORT=5432
DB_NAME=nora_db
DB_USER=nora_user
DB_PASSWORD=LE_MEME_MOT_DE_PASSE_QUE_CI_DESSUS
FLASK_ENV=production
SECRET_KEY=CLE_SECRETE_GENEREE_AVEC_OPENSSL

# --- IA Provider (Google Gemini) ---
# Clé gratuite disponible sur https://aistudio.google.com/
AI_API_KEY=votre_vraie_cle_api_gemini_ici
AI_PROVIDER=gemini
AI_MODEL=gemini-1.5-flash

# --- Sécurité CORS (Optionnel, * par défaut) ---
CORS_ORIGINS=*
```
Sauvegardez avec `CTRL + O`, confirmez avec `Entrée`, puis quittez avec `CTRL + X`.

---

## Étape 5 : Ajustements Recommandés pour la Production

> ⚠️ **Important :** Conformément à votre consigne, aucun fichier de votre code source local n'a été modifié.  
> Voici la configuration optimisée à appliquer sur le serveur Ubuntu pour une mise en production propre, stable et sécurisée.

### 5.1 Pourquoi ajuster `frontend/nginx.conf` ?
En local, Vite proxyfiait `/api` vers `localhost:5000`.  
En production, le navigateur des utilisateurs se connecte à l'IP ou au domaine du serveur. Nginx doit rediriger de manière transparente les requêtes `/api/` vers le conteneur backend Flask.

**Contenu de `frontend/nginx.conf` recommandé en production :**
```nginx
server {
    listen       80;
    server_name  localhost;

    root   /usr/share/nginx/html;
    index  index.html;

    # ── 1. SPA fallback : routes React ───────────────────────────────────
    location / {
        try_files $uri $uri/ /index.html;
    }

    # ── 2. Reverse Proxy vers le Backend Flask ───────────────────────────
    location /api/ {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_read_timeout 60s;
    }

    # ── 3. Cache optimisé pour les assets statiques ──────────────────────
    location ~* \.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)$ {
        expires    1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # ── 4. Pas de cache pour index.html ──────────────────────────────────
    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        expires    0;
    }

    # ── 5. Sécurité ──────────────────────────────────────────────────────
    add_header X-Frame-Options        "SAMEORIGIN"   always;
    add_header X-Content-Type-Options "nosniff"      always;
    add_header X-XSS-Protection       "1; mode=block" always;

    # ── 6. Compression Gzip ──────────────────────────────────────────────
    gzip              on;
    gzip_vary         on;
    gzip_proxied      any;
    gzip_comp_level   6;
    gzip_types        text/plain text/css text/xml application/json
                      application/javascript application/xml+rss
                      application/atom+xml image/svg+xml;

    error_page 404 /index.html;
}
```

### 5.2 Pourquoi ajuster `docker-compose.yml` pour la production ?
1. **Fermer le port PostgreSQL 5432** vers l'extérieur (le backend y accède via le réseau Docker privé `nora_network`).
2. **Utiliser le build Nginx** pour le frontend (`runner`) au lieu de `npm run dev` (`builder`).
3. **Supprimer les volumes de montage de dev** (`./frontend:/app` et `./backend:/app`).

**Structure de `docker-compose.yml` adaptée à la production :**
```yaml
version: '3.9'

services:
  # ─────────────────────────────────────────────
  #  SERVICE 1 : Base de données PostgreSQL 15
  # ─────────────────────────────────────────────
  db:
    image: postgres:15-alpine
    container_name: nora_db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-nora_db}
      POSTGRES_USER: ${POSTGRES_USER:-nora_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-nora_secret_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/01-init.sql:ro
      - ./database/encgm_training_dataset_inserts.sql:/docker-entrypoint-initdb.d/02-inserts.sql:ro
    # En production, pas besoin d'exposer 5432 sur le Web public :
    expose:
      - "5432"
    networks:
      - nora_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-nora_user} -d ${POSTGRES_DB:-nora_db}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ─────────────────────────────────────────────
  #  SERVICE 2 : Backend Flask (API REST)
  # ─────────────────────────────────────────────
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: nora_backend
    restart: unless-stopped
    environment:
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: ${POSTGRES_DB:-nora_db}
      DB_USER: ${POSTGRES_USER:-nora_user}
      DB_PASSWORD: ${POSTGRES_PASSWORD:-nora_secret_password}
      AI_API_KEY: ${AI_API_KEY:-}
      AI_PROVIDER: ${AI_PROVIDER:-gemini}
      FLASK_ENV: ${FLASK_ENV:-production}
      SECRET_KEY: ${SECRET_KEY:-change-me}
    expose:
      - "5000"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - nora_network

  # ─────────────────────────────────────────────
  #  SERVICE 3 : Frontend React servi par Nginx
  # ─────────────────────────────────────────────
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      # Utilise le stage 'runner' (Nginx) par défaut
    container_name: nora_frontend
    restart: unless-stopped
    ports:
      - "80:80"                  # Accessible directement sur http://IP_DU_SERVEUR
    depends_on:
      - backend
    networks:
      - nora_network

# ─────────────────────────────────────────────
#  VOLUMES & RÉSEAU
# ─────────────────────────────────────────────
volumes:
  postgres_data:
    driver: local

networks:
  nora_network:
    driver: bridge
```

---

## Étape 6 : Construction et Démarrage des Services

### 6.1 Lancer la construction et l'exécution en arrière-plan
Depuis la racine du projet (`~/nora-chatbot`) :
```bash
docker compose up -d --build
```

### 6.2 Vérifier l'état des conteneurs
```bash
docker compose ps
```
Tous les conteneurs doivent afficher le statut `Up` (avec `(healthy)` pour `nora_db`).

### 6.3 Suivre les journaux (logs) en direct
```bash
# Voir les logs globaux
docker compose logs -f

# Voir spécifiquement l'initialisation de PostgreSQL
docker compose logs db

# Voir les logs du backend Flask
docker compose logs backend
```

---

## Étape 7 : Tests & Validation du Déploiement

Exécutez ces commandes directement sur le serveur ou depuis votre poste local :

### 7.1 Vérifier la Santé du Backend & la Connexion BDD
```bash
curl -i http://localhost:5000/api/health
# Si le reverse proxy Nginx est actif :
curl -i http://localhost/api/health
```
**Réponse attendue :**
```json
{
  "database": "ok",
  "service": "NORA API",
  "status": "ok",
  "version": "1.0.0"
}
```

### 7.2 Vérifier le chargement des Catégories
```bash
curl http://localhost/api/categories
```
Doit retourner les 10 catégories issues de `encgm_training_dataset_inserts.sql`.

### 7.3 Tester le Chat V1 (Recherche SQL rapide)
```bash
curl -X POST http://localhost/api/chat/v1 \
     -H "Content-Type: application/json" \
     -d '{"message": "Quelles sont les valeurs de l ENCGM"}'
```

### 7.4 Tester le Chat V2 (IA RAG Google Gemini)
```bash
curl -X POST http://localhost/api/chat/v2 \
     -H "Content-Type: application/json" \
     -d '{"message": "Bonjour, parle moi de la filiere Finance"}'
```

### 7.5 Tester l'Interface Web Frontend
Ouvrez votre navigateur sur :
```
http://IP_PUBLIQUE_DU_SERVEUR
```
Vous devez voir s'afficher l'interface d'accueil de NORA (WelcomeScreen), la mascotte 3D, la grille des catégories et la zone de messagerie.

---

## Étape 8 : Configuration d'un Domaine et HTTPS (SSL Let's Encrypt)

Pour un déploiement professionnel sécurisé accessible via `https://nora.votredomaine.com` :

### 8.1 Pointer le domaine vers le serveur
Dans la console de votre registrar (OVH, Namecheap, Cloudflare, etc.) :
- Créez un enregistrement de type **A** :
  - Nom / Hôte : `nora` (ou `@`)
  - Valeur : `IP_PUBLIQUE_DU_SERVEUR`
  - TTL : 3600

### 8.2 Méthode recommandée avec Nginx hôte & Certbot
1. Configurez `docker-compose.yml` pour écouter sur `127.0.0.1:3000:80`.
2. Installez Nginx et Certbot sur le système Ubuntu hôte :
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```
3. Créez un bloc de configuration `/etc/nginx/sites-available/nora.conf` :
```nginx
server {
    server_name nora.votredomaine.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
4. Activez le site et obtenez le certificat SSL :
```bash
sudo ln -s /etc/nginx/sites-available/nora.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d nora.votredomaine.com
```
Certbot configurera automatiquement le renouvellement SSL automatique tous les 90 jours.

---

## Étape 9 : Maintenance, Sauvegardes & Mises à Jour Continues

### 9.1 Comment mettre à jour le projet lors d'un nouveau commit Git ?
```bash
cd ~/nora-chatbot
git pull origin deploy
docker compose up -d --build
```
Docker ne reconstruira que les couches modifiées grâce au cache.

### 9.2 Sauvegarder la base de données PostgreSQL
Créer une sauvegarde SQL instantanée :
```bash
docker exec -t nora_db pg_dump -U nora_user -d nora_db > ~/backup_nora_$(date +%F_%T).sql
```

### 9.3 Automatiser la sauvegarde quotidienne (Cron Job)
```bash
crontab -e
```
Ajoutez la ligne suivante pour sauvegarder chaque nuit à 03h00 :
```cron
0 3 * * * docker exec -t nora_db pg_dump -U nora_user -d nora_db | gzip > /home/ubuntu/backups/nora_$(date +\%F).sql.gz
```

### 9.4 Commandes utiles au quotidien
| Action | Commande |
|---|---|
| Arrêter l'application | `docker compose stop` |
| Redémarrer l'application | `docker compose restart` |
| Reconstruire sans cache | `docker compose build --no-cache && docker compose up -d` |
| Consulter l'usage mémoire et CPU | `docker stats` |
| Nettoyer les images et volumes inutilisés | `docker system prune -f` |

---

## Guide de Dépannage (Troubleshooting)

### 🔴 Problème 1 : Le conteneur frontend plante avec `JavaScript heap out of memory` pendant le build
- **Cause :** Mémoire RAM insuffisante sur le serveur lors de la compilation Vite / Rollup.
- **Solution :** Créez un fichier SWAP de 2 Go comme décrit à l'**Étape 1.2**.

### 🔴 Problème 2 : La base de données ne contient aucune table ou question
- **Cause :** Le volume `postgres_data` existait déjà avant l'ajout des scripts SQL. Docker n'exécute les scripts de `/docker-entrypoint-initdb.d/` que si le dossier de données PostgreSQL est totalement vide.
- **Solution :** Réinitialisez le volume (attention : efface les données existantes) :
  ```bash
  docker compose down -v
  docker compose up -d --build
  ```

### 🔴 Problème 3 : Le Chat V2 renvoie `503 Service Unavailable`
- **Cause :** `AI_API_KEY` absente ou invalide dans le `.env`.
- **Solution :** Vérifiez votre clé Google Gemini sur [Google AI Studio](https://aistudio.google.com/) et assurez-vous qu'elle est bien copiée sans guillemets dans votre fichier `.env`. Redémarrez le backend : `docker compose restart backend`.

### 🔴 Problème 4 : Erreur `port is already allocated` (ex: port 80 ou 5432)
- **Cause :** Un service Apache, Nginx ou PostgreSQL tourne déjà directement sur le serveur Ubuntu hôte.
- **Solution :** Identifiez le processus qui occupe le port :
  ```bash
  sudo lsof -i :80
  # Si un service système tourne :
  sudo systemctl stop nginx  # ou apache2
  sudo systemctl disable apache2
  ```

---
*Ce document est prêt pour être utilisé en tant que feuille de route officielle de déploiement par l'équipe projet.*
