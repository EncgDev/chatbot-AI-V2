# 🚀 NORA — Guide de Déploiement Production (CI/CD GitLab)

> **Objectif** : L'application se déploie **automatiquement** sur le serveur à chaque
> push sur la branche `main`. Ce guide explique comment préparer le serveur et
> configurer GitLab pour que tout fonctionne dès le premier clone.

---

## 📋 Architecture de l'Application

```
┌─────────────────────────────────────────────────────────────────┐
│                     SERVEUR UBUNTU (Docker)                     │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   frontend   │    │ frontend_    │    │  PostgreSQL  │       │
│  │   (Nginx)    │    │   admin      │    │    15        │       │
│  │   Port 80    │    │  (Nginx)     │    │  Port 5432   │       │
│  │              │    │  Port 8080   │    │  (interne)   │       │
│  └──────┬───────┘    └──────┬───────┘    └──────────────┘       │
│         │ /api/*            │ /api/admin/*        ▲              │
│         ▼                   ▼                     │              │
│  ┌──────────────┐    ┌──────────────┐             │              │
│  │   backend    │    │ backend_     │─────────────┘              │
│  │   (Flask)    │    │   admin      │  (même BDD partagée)      │
│  │   Port 5000  │    │  (Flask)     │                           │
│  │  (interne)   │    │  Port 5001   │                           │
│  └──────────────┘    │  (interne)   │                           │
│                      └──────────────┘                           │
│                                                                 │
│  Volume partagé : backend_shared_data (embeddings.json)         │
└─────────────────────────────────────────────────────────────────┘
```

**Ports exposés au réseau :**
| Port | Service | Description |
|------|---------|-------------|
| `80` | `frontend` | Chatbot public (accessible depuis internet) |
| `8080` | `frontend_admin` | Interface admin (back-office) |

> Les backends (5000, 5001) et PostgreSQL (5432) ne sont **pas exposés** — Nginx
> fait office de reverse-proxy et route les appels `/api/*` en interne.

---

## 📝 Prérequis Serveur

### 1. Système
- **Ubuntu 22.04+** (ou tout Linux avec Docker)
- **2 Go RAM minimum** (4 Go recommandé)
- **20 Go disque** libre
- Ports **80** et **8080** ouverts dans le pare-feu / security group

### 2. Logiciels à installer sur le serveur

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# ⚠️ Déconnectez-vous et reconnectez-vous pour que le groupe docker prenne effet

# Docker Compose (plugin v2 — inclus avec Docker récent)
docker compose version
# Devrait afficher v2.x.x — sinon installer séparément :
# sudo apt install docker-compose-plugin

# Rsync (utilisé par le CI/CD pour synchroniser les fichiers)
sudo apt install -y rsync
```

---

## 🔐 Configuration GitLab CI/CD

### 1. Générer une clé SSH sur le serveur

```bash
# Sur le serveur cible
ssh-keygen -t ed25519 -C "gitlab-cicd-deploy" -f ~/.ssh/gitlab_deploy -N ""

# Ajouter la clé publique aux authorized_keys
cat ~/.ssh/gitlab_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Afficher la clé PRIVÉE (à copier dans GitLab)
cat ~/.ssh/gitlab_deploy
```

### 2. Configurer les variables CI/CD dans GitLab

Allez dans **GitLab** → votre projet → **Settings** → **CI/CD** → **Variables**

Ajoutez les variables suivantes :

| Variable | Type | Protection | Valeur |
|----------|------|------------|--------|
| `SSH_PRIVATE_KEY` | Variable (File) | ✅ Protected | Le contenu de `~/.ssh/gitlab_deploy` (clé privée) |
| `DEPLOY_HOST` | Variable | ✅ Protected | IP publique ou hostname du serveur |
| `DEPLOY_USER` | Variable | ✅ Protected | Utilisateur SSH (ex: `ubuntu`) |
| `DEPLOY_PATH` | Variable | ✅ Protected | Chemin sur le serveur (ex: `/home/ubuntu/nora-chatbot`) |
| `ENV_FILE_CONTENT` | Variable | ✅ Protected + Masked | Contenu complet du fichier `.env` de production (voir ci-dessous) |

### 3. Préparer le contenu de `ENV_FILE_CONTENT`

Copiez le contenu de `.env.example` et remplacez les valeurs par vos vrais secrets :

```env
# --- PostgreSQL ---
POSTGRES_DB=nora_db
POSTGRES_USER=nora_user
POSTGRES_PASSWORD=VotreMotDePasseForTresSecurise123!

# --- Backend Flask ---
DB_HOST=db
DB_PORT=5432
DB_NAME=nora_db
DB_USER=nora_user
DB_PASSWORD=VotreMotDePasseForTresSecurise123!
FLASK_ENV=production
SECRET_KEY=une-cle-aleatoire-de-64-caracteres-ici

# --- IA Provider ---
AI_API_KEY=votre_vrai_api_key_gemini
AI_PROVIDER=gemini
AI_MODEL=gemini-3.5-flash-lite

# --- CORS ---
CORS_ORIGINS=*
VITE_API_URL=

# --- Admin ---
SECRET_KEY_ADMIN=une-autre-cle-aleatoire-differente
ADMIN_EMAIL=admin@encg.ac.ma
ADMIN_PASSWORD=VotreMotDePasseAdmin8+
CORS_ORIGINS_ADMIN=http://localhost:8080
EMBEDDING_MODEL=models/text-embedding-004
```

> **⚠️ Important** : Collez le contenu **brut** (pas encodé) dans la variable GitLab.
> Cochez "Protected" et "Masked" pour la sécurité.

---

## 🗂️ Préparer le serveur (une seule fois)

```bash
# Créer le répertoire de déploiement
mkdir -p /home/ubuntu/nora-chatbot
```

C'est tout ! Le pipeline CI/CD se charge de tout le reste :
- Synchroniser les fichiers via rsync
- Écrire le fichier `.env` de production
- Construire et démarrer les conteneurs Docker

---

## 🔄 Workflow de Déploiement

### Déploiement automatique (recommandé)

```
develop (dev local) → merge request → main → 🚀 Deploy auto
```

1. Vous travaillez sur la branche `develop`
2. Vous créez une **Merge Request** vers `main`
3. Le pipeline CI/CD exécute : **Lint** → **Build** → **Test**
4. Après merge dans `main`, le pipeline re-exécute tout + **Deploy automatique**

### Que fait le pipeline ?

```
                 main branch push
                       │
            ┌──────────┴──────────┐
            │   STAGE 1 : LINT    │  Vérification qualité code
            │  - backend (flake8) │  (Python + JS)
            │  - frontend (eslint)│
            │  - admin (oxlint)   │
            └──────────┬──────────┘
                       │
            ┌──────────┴──────────┐
            │  STAGE 2 : BUILD    │  Construction images Docker
            │  - backend          │  (4 images poussées au registre)
            │  - frontend         │
            │  - backend_admin    │
            │  - frontend_admin   │
            └──────────┬──────────┘
                       │
            ┌──────────┴──────────┐
            │   STAGE 3 : TEST    │  Tests de santé
            │  - backend (import) │  (Flask import + build React)
            │  - backend_admin    │
            │  - frontend build   │
            │  - admin build      │
            └──────────┬──────────┘
                       │
            ┌──────────┴──────────┐
            │  STAGE 4 : DEPLOY   │  SSH → serveur Ubuntu
            │  - rsync fichiers   │  (automatique sur main)
            │  - écrire .env      │
            │  - docker compose   │
            │  - healthchecks     │
            └─────────────────────┘
```

---

## 🌐 Accès depuis Internet

### Frontend public (Chatbot)

Le frontend public tourne sur le **port 80** du serveur. Pour le rendre accessible depuis internet :

**Option A — IP publique directe** (si le serveur a une IP publique) :
```
http://IP_DU_SERVEUR
```

**Option B — Nom de domaine** (recommandé) :
1. Achetez ou utilisez un domaine existant
2. Créez un enregistrement DNS `A` pointant vers l'IP du serveur
3. L'app est accessible via `http://votre-domaine.com`

**Option C — HTTPS avec Certbot** (recommandé pour la production) :
```bash
# Sur le serveur
sudo apt install certbot
sudo certbot certonly --standalone -d votre-domaine.com
```
Puis configurez le port 443 dans docker-compose.prod.yml.

### Frontend Admin (Back-Office)

L'admin tourne sur le **port 8080** :
```
http://IP_DU_SERVEUR:8080
```

> **💡 Sécurité** : L'admin est protégé par authentification (email + mot de passe).
> Pour plus de sécurité, vous pouvez restreindre le port 8080 à certaines IPs
> dans le pare-feu du serveur.

---

## 🛑 Actions Manuelles Requises (Checklist)

Voici la liste de **tout ce que vous devez faire manuellement** — le reste est automatisé :

### Sur le serveur (une seule fois)
- [ ] Installer Docker et Docker Compose
- [ ] Installer rsync (`sudo apt install rsync`)
- [ ] Créer le répertoire de déploiement (`mkdir -p /home/ubuntu/nora-chatbot`)
- [ ] Générer la clé SSH pour le CI/CD
- [ ] Ouvrir les ports 80 et 8080 dans le pare-feu / security group

### Sur GitLab (une seule fois)
- [ ] Ajouter `SSH_PRIVATE_KEY` (clé privée du serveur)
- [ ] Ajouter `DEPLOY_HOST` (IP du serveur)
- [ ] Ajouter `DEPLOY_USER` (utilisateur SSH, ex: `ubuntu`)
- [ ] Ajouter `DEPLOY_PATH` (ex: `/home/ubuntu/nora-chatbot`)
- [ ] Ajouter `ENV_FILE_CONTENT` (contenu du .env de production)

### Pour chaque déploiement (automatique)
- Poussez vos changements sur `main` → le pipeline se déclenche automatiquement ✅

---

## 🔧 Commandes Utiles (sur le serveur)

```bash
# Voir l'état de tous les conteneurs
cd /home/ubuntu/nora-chatbot
docker compose -f docker-compose.prod.yml ps

# Voir les logs d'un service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f backend_admin
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f frontend_admin

# Redémarrer un service
docker compose -f docker-compose.prod.yml restart backend

# Redémarrer tout
docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml up -d --build

# Accéder au shell d'un conteneur
docker exec -it nora_v2_backend bash
docker exec -it nora_v2_backend_admin bash

# Créer/Modifier le compte admin manuellement
docker exec nora_v2_backend_admin python scripts/create_admin.py

# Vérifier la santé des services
curl http://localhost:5000/api/health
curl http://localhost:5001/api/admin/health
curl http://localhost:80
curl http://localhost:8080

# Nettoyer les images Docker inutilisées
docker image prune -f
docker system prune -f
```

---

## 🐛 Dépannage

| Problème | Solution |
|----------|----------|
| Pipeline échoue à l'étape SSH | Vérifiez que `SSH_PRIVATE_KEY` est correcte et que la clé publique est dans `authorized_keys` sur le serveur |
| Container `db` ne démarre pas | Vérifiez que le volume `postgres_data_v2` n'est pas corrompu : `docker volume rm chatbot-ai-v2_postgres_data_v2` (⚠️ perd les données) |
| Frontend affiche une page blanche | Vérifiez les logs nginx : `docker logs nora_v2_frontend` |
| API renvoie 502/503 | Le backend n'est pas encore prêt — attendez 30-60s après le déploiement |
| Admin login ne fonctionne pas | Le compte admin est créé par `init.sql`. Pour le recréer : `docker exec nora_v2_backend_admin python scripts/create_admin.py` |
| Embeddings non générés | Allez sur l'admin → Dashboard → Cliquez "Régénérer les embeddings" |
| Port 80 / 8080 inaccessible | Vérifiez le pare-feu : `sudo ufw status` et les security groups cloud |

---

## 📁 Structure du Projet

```
chatbot-AI-V2/
├── .gitlab-ci.yml              # Pipeline CI/CD (lint → build → test → deploy)
├── docker-compose.yml          # Développement local (5 services, hot-reload)
├── docker-compose.prod.yml     # Production (5 services, nginx, gunicorn)
├── .env.example                # Template des variables d'environnement
├── .gitignore
│
├── database/
│   ├── init.sql                # Schema + admin user initial
│   └── encgm_training_dataset_inserts.sql  # Données initiales
│
├── backend/                    # API publique (Flask + Gunicorn)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── config.py
│   ├── app/
│   │   ├── __init__.py         # Factory pattern
│   │   ├── models.py           # SQLAlchemy models
│   │   ├── routes/             # health, categories, qas, chat
│   │   └── services/           # gemini_service, search_service
│   └── scripts/
│       └── embed_qas.py        # Génération initiale des embeddings
│
├── frontend/                   # Chatbot public (React + Vite)
│   ├── Dockerfile              # Multi-stage : Node build → Nginx
│   ├── nginx.conf              # Reverse-proxy /api/* → backend:5000
│   ├── vite.config.js
│   └── src/
│       ├── api/chatApi.js      # Client API Axios
│       └── components/         # ChatInterface, etc.
│
├── backend_admin/              # API admin (Flask + Gunicorn)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── config.py
│   ├── app/
│   │   ├── __init__.py
│   │   ├── models.py           # AdminUser, AdminSession, QA, Category
│   │   ├── auth.py             # Token-based auth + anti brute-force
│   │   └── routes/             # auth, categories CRUD, QAs CRUD, embeddings
│   └── scripts/
│       └── create_admin.py     # Création compte admin
│
└── frontend_admin/             # Interface admin (React + Vite)
    ├── Dockerfile              # Dev (hot-reload)
    ├── Dockerfile.prod         # Production (Node build → Nginx)
    ├── nginx.prod.conf         # Reverse-proxy /api/admin/* → backend_admin:5001
    ├── vite.config.js
    └── src/
        ├── api/adminApi.js     # Client API admin (Axios + token)
        ├── pages/              # Login, Dashboard, Categories, QAs
        └── components/         # DashboardLayout, Tables, Modals
```

---

## ✅ Résumé

| Aspect | Détail |
|--------|--------|
| **Branche de déploiement** | `main` |
| **Déclencheur** | Push automatique (pas besoin de clic) |
| **Services** | 5 conteneurs Docker (db, backend, frontend, backend_admin, frontend_admin) |
| **Frontend public** | Port 80 (nginx + reverse-proxy) |
| **Frontend admin** | Port 8080 (nginx + reverse-proxy) |
| **Base de données** | PostgreSQL 15 (interne, non exposée) |
| **Reverse-proxy** | Nginx intégré dans chaque frontend |
| **Pas besoin de** | Ngrok, IP locale, VITE_API_URL configuré |
