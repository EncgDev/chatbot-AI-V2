# 🤖 NORA — Chatbot & Back-Office ENCG Marrakech

> **NORA** est l'assistante virtuelle officielle de l'École Nationale de Commerce et de Gestion de Marrakech (Université Cadi Ayyad).
> Plateforme web complète, conteneurisée avec Docker : **chatbot public intelligent** (SQL + IA générative avec mémoire) et **back-office d'administration sécurisé** (gestion CRUD des questions/réponses).

---

## ✨ Fonctionnalités

### 🗣️ Chatbot public (NORA)

- **V1 — Recherche SQL locale** : moteur de recherche 100 % PostgreSQL (tolérance aux accents, synonymes sémantiques ENCG, stemming français, scoring intention/sujet). Rapide, sans quota, sans API externe.
- **V2 — IA générative (RAG)** : les QAs les plus pertinentes sont extraites par **recherche sémantique vectorielle** (embeddings Gemini) puis injectées dans le prompt de **Google Gemini** pour des réponses naturelles et fidèles.
- **🧠 Mémoire conversationnelle** : sessions persistées en BDD (`chat_sessions` / `chat_messages`) — NORA comprend les relances (*« et ses conditions d'accès ? »*).
- **🛡️ Fallback automatique** : si Gemini est indisponible (quota, timeout, clé absente), bascule transparente vers la V1 — **aucune erreur visible** pour l'utilisateur. Header de diagnostic `X-Nora-Fallback`.
- **⏱️ Kiosque tactile** : retour automatique à l'accueil après 30 s d'inactivité, puis **purge de la session** après 30 s supplémentaires (confidentialité des visiteurs).
- **Interface React** moderne : mascotte 3D animée, grille de catégories, chat temps réel, base de connaissances navigable, design fidèle à la charte ENCG.

### 🔐 Back-Office d'administration

- **Login sécurisé** : mots de passe hashés (werkzeug PBKDF2), sessions révocables stockées en BDD (tokens opaques 64 hex, expiration 12 h), anti force-brute (blocage 10 min après 5 échecs), erreurs génériques anti-énumération.
- **CRUD complet** : catégories et questions/réponses avec validations serveur (double-protection : catégorie non supprimable si non vide → 409).
- **Régénération des embeddings** en un clic (thread d'arrière-plan + statut temps réel) pour maintenir la recherche sémantique à jour.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     Docker Compose (chatbot-ai-v2)               │
│                                                                  │
│  ┌────────────┐   ┌───────────────┐   HTTP  ┌────────────────┐  │
│  │  frontend  │──▶│    backend    │────────▶│  PostgreSQL 15 │  │
│  │ React+Vite │   │  Flask :5000  │         │      db        │  │
│  │   :5173    │   │  (chatbot)    │────────▶│    :5432       │  │
│  └────────────┘   └───────┬───────┘         │  6 tables :    │  │
│                           │ Gemini API       │  categories    │  │
│  ┌────────────┐   (RAG)   ▼                 │  QAs           │  │
│  │ frontend_  │   ┌───────────────┐         │  chat_sessions │  │
│  │ admin      │──▶│ backend_admin │────────▶│  chat_messages │  │
│  │ React :5174│   │  Flask :5001  │         │  admin_users   │  │
│  └────────────┘   └───────────────┘         │  admin_sessions│  │
│                                             └────────────────┐  │
└──────────────────────────────────────────────────────────────│──┘
                                                                │
                          Volume partagé ./backend/data ◀───────┘
                          (embeddings.json — recherche sémantique
                           régénérée depuis l'admin)
```

| Service | Image / Stack | Port | Rôle |
|---|---|---|---|
| `db` | postgres:15-alpine | 5432 | Base de données PostgreSQL partagée |
| `backend` | python:3.10-slim + Flask + Gunicorn | 5000 | API publique du chatbot (V1/V2) |
| `frontend` | Node + Vite (React 18, Tailwind, Three.js) | 5173 | Interface chatbot publique |
| `backend_admin` | python:3.10-slim + Flask + Gunicorn | 5001 | API Admin (auth + CRUD + embeddings) |
| `frontend_admin` | Node + Vite (React 19, Tailwind 4) | 5174 | Back-office d'administration |

---

## 🗄️ Modèle de données

```sql
categories (id, name)                      -- Thématiques publiques
"QAs"      (id, question, response, category_id → categories)
chat_sessions (id UUID. created_at, last_active)      -- Mémoire V2
chat_messages (id, session_id → chat_sessions, role, content, version, created_at)
admin_users (id, email UNIQUE, password_hash, full_name, is_active...)  -- Back-office
admin_sessions (id, user_id → admin_users, token UNIQUE, expires_at, revoked)
```

Scripts d'initialisation : `database/init.sql` (schéma + index) puis `database/encgm_training_dataset_inserts.sql` (93+ QAs, 10 catégories ENCG).

---

## 🚀 Démarrage rapide

### Prérequis

- Docker Desktop ≥ 24.x et Docker Compose ≥ 2.x
- (Optionnel, V2) Clé API Google Gemini → https://aistudio.google.com/app/apikey

### 1. Configuration

```bash
cp .env.example .env
# Éditer .env : AI_API_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, SECRET_KEY_ADMIN...
```

### 2. Lancement

```bash
docker compose up --build -d
```

### 3. Créer le compte administrateur

```bash
docker exec nora_v2_backend_admin python scripts/create_admin.py
```

### 4. (Optionnel) Générer les embeddings sémantiques

```bash
docker exec nora_v2_backend python scripts/embed_qas.py
# ou depuis le back-office : bouton « Régénérer l'IA »
```

| URL | Service |
|---|---|
| http://localhost:5173 | 🎨 Chatbot public NORA |
| http://localhost:5174 | 🔐 Back-office Admin |
| http://localhost:5000/api/health | 🩺 API publique |
| http://localhost:5001/api/admin/health | 🩺 API admin |

---

## 📡 API — Vue d'ensemble

### API publique (`:5000`)

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Santé service + BDD |
| GET | `/api/categories` | Liste des catégories (+ compteurs) |
| GET | `/api/qas?category_id=X` | QAs (filtrables par catégorie) |
| POST | `/api/chat/v1` | Recherche SQL — body `{message, session_id?}` |
| POST | `/api/chat/v2` | RAG Gemini + mémoire — body `{message, session_id?}` |
| GET | `/api/chat/sessions/<uuid>` | Historique d'une session |

### API admin (`:5001`) — `Authorization: Bearer <token>`

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/admin/auth/login` | Connexion → token (12 h) |
| POST | `/api/admin/auth/logout` | Révocation du token |
| GET | `/api/admin/auth/me` | Profil admin courant |
| GET/POST/PUT/DELETE | `/api/admin/categories[/<id>]` | CRUD catégories (409 si non vide) |
| GET/POST/PUT/DELETE | `/api/admin/qas[/<id>]` | CRUD QAs (filtres `category_id`, `search`) |
| POST | `/api/admin/embeddings/regenerate` | Reconstruction de l'index sémantique |
| GET | `/api/admin/embeddings/status` | État de la régénération |

> Contrats JSON complets (formats stricts d'équipe) : **[TASKS.md](TASKS.md)** et **[TASKS_ADMIN.md](TASKS_ADMIN.md)**.

---

## 📁 Structure du projet

```
Chatboot/
├── docker-compose.yml            # Orchestration des 5 services
├── .env.example                  # Template des variables d'environnement
├── README.md                     # Ce fichier
├── TASKS.md                      # Contrats & tâches chatbot (V1/V2)
├── TASKS_ADMIN.md                # Contrats & tâches back-office admin
├── GUIDE_DEPLOIEMENT_LOCAL_NGROK.md
├── GUIDE_DEPLOIEMENT_UBUNTU.md
│
├── database/                     # Schéma + seed (Soufiane)
│   ├── init.sql                  #   6 tables + index + extension pgcrypto
│   ├── encgm_training_dataset_inserts.sql   # 93+ QAs — 10 catégories ENCG
│   └── README_BDD.md
│
├── backend/                      # API chatbot (Yahya)
│   ├── app/
│   │   ├── models.py             #   Category, QA, ChatSession, ChatMessage
│   │   ├── routes/               #   health, categories, qas, chat (v1/v2, sessions)
│   │   └── services/             #   SearchService (SQL + sémantique),
│   │                             #   GeminiService (RAG+mémoire), ConversationService
│   ├── scripts/embed_qas.py      #   Vectorisation Gemini Embeddings
│   └── data/embeddings.json      #   Cache vectoriel (généré)
│
├── backend_admin/                # API Back-office (Yahya)
│   ├── app/
│   │   ├── auth.py               #   Tokens BDD + @require_admin + anti brute-force
│   │   └── routes/               #   auth, categories, qas, health/embeddings
│   └── scripts/create_admin.py   #   Création du compte admin (.env)
│
├── frontend/                     # UI chatbot (Youssef)
│   └── src/components/           #   WelcomeScreen, CategoryGrid, ChatInterface,
│                                 #   KnowledgeBase, Avatar3D, VersionToggle...
│
└── frontend_admin/               # UI Back-office (Youssef)
    └── src/
        ├── pages/                #   LoginPage, CategoriesPage, QAsPage
        └── components/           #   DashboardLayout, tables, modals, Toast
```

---

## ⚙️ Variables d'environnement principales

| Variable | Description |
|---|---|
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Base PostgreSQL partagée |
| `AI_API_KEY` | Clé Google Gemini (V2 + embeddings) |
| `AI_MODEL` | Modèle de génération (ex. `gemini-2.5-flash`) |
| `EMBEDDING_MODEL` | Modèle d'embeddings (ex. `models/gemini-embedding-001`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Compte admin initial (consommés par `create_admin.py`) |
| `SECRET_KEY_ADMIN` | Clé secrète de l'API admin (distincte du public) |
| `CORS_ORIGINS` / `CORS_ORIGINS_ADMIN` | Origines autorisées (admin restreint à `:5174`) |

> 🔒 Sécurité : `.env` n'est jamais commité. Penser à **régénérer la clé Gemini** si elle a été exposée.

---

## 🛠️ Commandes utiles

```bash
# Logs
docker logs -f nora_v2_backend
docker logs -f nora_v2_backend_admin

# Réinitialisation complète (⚠️ supprime les données)
docker compose down -v && docker compose up --build -d

# Vérifier les données
docker exec nora_v2_db psql -U nora_user -d nora_v2_db -c 'SELECT count(*) FROM "QAs";'

# Tests rapides
curl http://localhost:5000/api/health
curl -X POST http://localhost:5000/api/chat/v2 \
     -H "Content-Type: application/json" \
     -d '{"message": "c est quoi la filiere finance ?"}'
```

Guides de déploiement : [Local / Ngrok](GUIDE_DEPLOIEMENT_LOCAL_NGROK.md) · [Serveur Ubuntu](GUIDE_DEPLOIEMENT_UBUNTU.md)

---

## 👥 Équipe

| Membre | Rôle | Périmètre |
|---|---|---|
| 🟦 **Soufiane** | Base de données & Data | `database/` — schéma, seed, intégrité |
| 🟨 **Yahya** | Backend & IA | `backend/` + `backend_admin/` — API, RAG, mémoire, auth, fallback |
| 🟩 **Youssef** | Frontend & UX | `frontend/` + `frontend_admin/` — UI chatbot & back-office |

**Règle d'or d'intégration** : les noms de tables/colonnes (Soufiane) sont la source de vérité pour les modèles (Yahya) ; les formats JSON de l'API (Yahya) sont le contrat strict consommé par les frontends (Youssef). Voir `TASKS.md` / `TASKS_ADMIN.md`.

---

## 📚 Stack technique

**Backends** : Python 3.10 · Flask 3 · Flask-SQLAlchemy · PostgreSQL 15 (psycopg2) · Google Gemini API (génération + embeddings) · Gunicorn
**Frontends** : React 18/19 · Vite · Tailwind CSS · Framer Motion · Three.js/react-three-fiber · Axios · Lucide
**Infra** : Docker Compose · Nginx · Volume partagé d'embeddings

---

*École Nationale de Commerce et de Gestion — Marrakech · Université Cadi Ayyad*
