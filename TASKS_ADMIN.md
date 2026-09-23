# 📋 TASKS_ADMIN.md — Gestion des Tâches — Back-Office Admin NORA

> **Projet :** NORA Admin — Interface de gestion (CRUD QAs & Catégories + Login sécurisé)
> **Équipe :** Soufiane (BDD) · Yahya (Backend Admin) · Youssef (Frontend Admin)
> **Principe :** backend **séparé** (`backend_admin/`, port 5001) + frontend **séparé** (`frontend_admin/`, port 5174),
> mais **même base de données** PostgreSQL que le chatbot public.
>
> ⚠️ Ce document gouverne le Back-Office. Les règles de `TASKS.md` (chatbot) restent en vigueur.
> En cas de conflit entre les deux documents → PR + validation des 3 membres.

---

# 0️⃣ Décisions d'équipe (validées)

| # | Décision | Choix retenu |
|---|----------|--------------|
| 1 | Type de session | **Tokens stockés en BDD** (`admin_sessions`), révocables, expiration 12 h |
| 2 | Multi-utilisateurs | **1 compte seed** maintenant ; schéma multi-utilisateurs prêt |
| 3 | Régénération embeddings | **Bouton manuel** dans l'admin + bannière "changements en attente" |
| 4 | Consultation conversations visiteurs | **Reporté** (hors périmètre initial, page lecture seule possible plus tard) |

---

# 1️⃣ ARCHITECTURE — Sous-conteneurs dans le compose principal

```
docker-compose.yml (chatbot-ai-v2)
 ├─ db              :5432   PostgreSQL (INCHANGÉ)
 ├─ backend         :5000   NORA public — chatbot (INCHANGÉ)
 ├─ frontend        :5173   NORA public — UI (INCHANGÉ)
 ├─ backend_admin   :5001   🆕 API Admin (auth + CRUD)
 └─ frontend_admin  :5174   🆕 Back-office React (login + gestion)
```

```
Chatboot/
├── backend/             🟨 Existant — NE PAS MODIFIER
├── frontend/            🟩 Existant — NE PAS MODIFIER
├── database/init.sql    🟦 Ajout Section 4 (tables admin) uniquement
├── backend_admin/       🆕 Application Flask autonome
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── config.py
│   ├── run.py
│   ├── scripts/
│   │   └── create_admin.py     # création du compte admin depuis .env
│   └── app/
│       ├── __init__.py         # factory create_app()
│       ├── models.py           # AdminUser, AdminSession, CategoryAdmin, QAAdmin
│       ├── auth.py             # décorateur @require_admin + helpers token
│       └── routes/
│           ├── __init__.py
│           ├── auth_routes.py       # login / logout / me
│           ├── categories_routes.py # CRUD catégories
│           ├── qas_routes.py        # CRUD QAs
│           └── admin_health.py      # GET /api/admin/health
└── frontend_admin/      🆕 Application React + Vite autonome
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js   # proxy /api → http://backend_admin:5001
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx               # route guard + layout
        ├── api/adminApi.js       # SEUL point d'accès réseau (règle §5)
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── CategoriesPage.jsx
        │   └── QAsPage.jsx
        └── components/
            ├── DashboardLayout.jsx
            ├── CategoriesTable.jsx
            ├── QAsTable.jsx
            ├── QAFormModal.jsx
            ├── ConfirmDeleteModal.jsx
            └── Toast.jsx
```

---

# 2️⃣ CONTRATS OFFICIELS (source de vérité — à ne pas casser)

## 2.1 Contrat BDD (Section 4 de `database/init.sql` — Soufiane)

```sql
-- ⚠️ AJOUT UNIQUEMENT — ne jamais toucher aux tables existantes
CREATE TABLE IF NOT EXISTS admin_users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    full_name     VARCHAR(80),
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    last_login    TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_sessions (
    id          SERIAL PRIMARY KEY,
    user_id     INT          NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    token       VARCHAR(64)  NOT NULL UNIQUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMP    NOT NULL,
    revoked     BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user  ON admin_sessions(user_id);
```

## 2.2 Contrat API Admin — Auth

### `POST /api/admin/auth/login`
```json
// Body
{ "email": "admin@encg.ac.ma", "password": "..." }

// Succès 200
{ "success": true, "token": "ab12...64hex", "user": { "email": "...", "full_name": "..." },
  "expires_at": "2026-09-23T10:00:00" }

// Erreur 401 (TOUJOURS générique — jamais "email inexistant")
{ "success": false, "error": "Identifiants incorrects." }

// Erreur 429 (après 5 échecs consécutifs sur le même email)
{ "success": false, "error": "Trop de tentatives. Réessayez dans 10 minutes." }
```

### `POST /api/admin/auth/logout` — header `Authorization: Bearer <token>`
```json
{ "success": true }
```

### `GET /api/admin/auth/me` — header `Authorization: Bearer <token>`
```json
{ "success": true, "user": { "email": "...", "full_name": "..." } }

// Si token absent / révoqué / expiré → 401
{ "success": false, "error": "Session expirée ou invalide." }
```

## 2.3 Contrat API Admin — CRUD (toutes protégées par `@require_admin`)

```
# Catégories
GET    /api/admin/categories          → { success, data: [{id, name, qa_count}], total }
POST   /api/admin/categories          → body {name}                      → 201 {success, data}
PUT    /api/admin/categories/<id>     → body {name}                      → {success, data}
DELETE /api/admin/categories/<id>     → REFUSÉ si qa_count > 0           → 409
                                        { success:false, error:"Catégorie non vide : X QAs associées." }

# QAs
GET    /api/admin/qas?category_id=X&search=mot  → {success, data:[{id,question,response,category_id}], total}
POST   /api/admin/qas                 → body {question, response, category_id} → 201 {success, data}
PUT    /api/admin/qas/<id>            → body {question, response, category_id} → {success, data}
DELETE /api/admin/qas/<id>            → {success}

# Embeddings (cohérence recherche sémantique)
POST   /api/admin/embeddings/regenerate   → { success, count: 93 }
GET    /api/admin/health                  → { status:"ok", service:"NORA Admin API", database:"ok" }
```

**Validations obligatoires côté serveur — erreur 400 si :**
- `question` ou `response` vide (après `strip()`)
- `category_id` inexistant en BDD
- `name` de catégorie vide ou déjà existant (doublon insensible à la casse → 409)

---

# 3️⃣ RÈGLES D'INTÉGRATION STRICTES (anti-conflits)

| # | Règle | Qui |
|---|-------|-----|
| 1 | Le schéma BDD est la source de vérité — aucun rename de table/colonne | 🟦 Soufiane |
| 2 | Préfixe admin : `/api/admin/*` UNIQUEMENT. Préfixe public `/api/*` : lecture seule, INCHANGÉ | 🟨 Yahya |
| 3 | Erreurs : toujours `{ "success": false, "error": "..." }` + code HTTP 400/401/404/409/429/500 | 🟨 Yahya |
| 4 | Token transmis UNIQUEMENT via header `Authorization: Bearer <token>` — pas de cookie, pas d'URL | 🟨🟩 Les deux |
| 5 | `frontend_admin/src/api/adminApi.js` = SEUL point d'accès réseau. Aucun axios dans les composants | 🟩 Youssef |
| 6 | L'admin appelle `:5001` (backend_admin). Le public appelle `:5000` (backend). Jamais de mélange | 🟨🟩 Les deux |
| 7 | Suppression de catégorie NON VIDE = interdite (409) — protège l'Écran 2 du chatbot en production | 🟨 Yahya |
| 8 | `.env` : jamais commité. Nouvelles variables : `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SECRET_KEY_ADMIN`, `CORS_ORIGINS_ADMIN` — ajoutées à `.env.example` sans valeurs réelles | Tous |
| 9 | Après tout CRUD QA → la recherche sémantique est obsolète tant que "Régénérer embeddings" n'a pas été cliqué (comportement assumé, bannière dans l'UI) | 🟩 Youssef |
| 10 | Le backend public N'ÉCRIT JAMAIS dans `admin_users` / `admin_sessions` | 🟨 Yahya |

---

# 4️⃣ 🟦 SOUFIANE — Tâches BDD

**Branche :** `feature/db-admin` (depuis `develop`)

| Statut | Tâche | Fichier / Livrable | Détails |
|:------:|-------|--------------------|---------|
| ✅ | **Table `admin_users`** | `database/init.sql` — Section 4 | SQL exact de §2.1. Tous champs NOT NULL avec defaults explicites |
| ✅ | **Table `admin_sessions`** | `database/init.sql` — Section 4 | SQL exact de §2.1. FK cascade vers `admin_users` |
| ✅ | **2 index de performance** | `database/init.sql` | `idx_admin_sessions_token` (login lookups) + `idx_admin_sessions_user` |
| ✅ | **NE RIEN TOUCHER d'autre** | `database/init.sql` | `categories`, `QAs`, `chat_sessions`, `chat_messages` = intouchables |
| ✅ | **Test d'intégrité** | `docker compose down -v && docker compose up db` | Les 3 scripts initdb passent sans erreur dans `docker logs nora_v2_db` |
| ✅ | **Test cascade** | psql | `DELETE FROM admin_users WHERE id=1` → ses `admin_sessions` supprimées automatiquement |
| ✅ | **Script de vérification** | `database/README_BDD.md` (mise à jour) | Documenter les 2 tables + le rappel "chatbot public = lecture seule" |

> 🔒 Le compte admin initial n'est PAS seedé en SQL : le hash est généré par le script Python de Yahya (`create_admin.py`) qui lit `ADMIN_EMAIL`/`ADMIN_PASSWORD` du `.env`.

---

# 5️⃣ 🟨 YAHYA — Tâches Backend Admin

**Branches :** `feature/admin-api` (auth) puis merge, puis `feature/admin-docker`

## Phase 1 — Socle & Auth

| Statut | Tâche | Fichier | Détails & règles |
|:------:|-------|---------|------------------|
| ⬜ | **`backend_admin/` squelette** | `Dockerfile`, `requirements.txt`, `config.py`, `run.py`, `app/__init__.py` | Factory pattern identique à `backend/`. Port **5001**. `requirements.txt` : Flask, Flask-SQLAlchemy, Flask-CORS, SQLAlchemy, psycopg2-binary, python-dotenv, gunicorn, requests (réutilise `scripts/embed_qas.py` via subprocess — voir Phase 3) |
| ⬜ | **Modèles `AdminUser` / `AdminSession`** | `app/models.py` | Miroir EXACT du SQL §2.1. + `to_dict()` sans `password_hash` (JAMAIS exposé) |
| ⬜ | **Modèles lecture `CategoryAdmin` / `QAAdmin`** | `app/models.py` | `__tablename__ = "categories"` et `__tablename__ = "QAs"` (casse exacte !) — lecture/écriture CRUD |
| ⬜ | **Helper token** | `app/auth.py` | `secrets.token_hex(32)` (64 chars), expiration **12 h** (`expires_at = NOW() + 12h`), fonction `current_admin()` utilisée par le décorateur |
| ⬜ | **Décorateur `@require_admin`** | `app/auth.py` | Lit `Authorization: Bearer <token>` → valide : existe, `revoked=FALSE`, `expires_at > NOW()` → sinon **401** format §2.2. Sur succès → `g.admin_user` |
| ⬜ | **`POST /api/admin/auth/login`** | `app/routes/auth_routes.py` | `check_password_hash` (werkzeug), erreurs **génériques**, `last_login = NOW()`, purge des sessions expirées à chaque login (`DELETE ... WHERE expires_at < NOW()`), anti brute-force : 5 échecs email → **429 pendant 10 min** (compteur en mémoire `{email: (count, blocked_until)}`) |
| ⬜ | **`POST /api/admin/auth/logout`** | `auth_routes.py` | Marque `revoked=TRUE` → `{success: true}` |
| ⬜ | **`GET /api/admin/auth/me`** | `auth_routes.py` | Retourne `{success, user}` sinon 401 |
| ⬜ | **Script `create_admin.py`** | `backend_admin/scripts/create_admin.py` | Lit `ADMIN_EMAIL`/`ADMIN_PASSWORD` depuis l'env → hash werkzeug → INSERT (idempotent : si email existe → met à jour le hash). Usage : `docker exec nora_v2_backend_admin python scripts/create_admin.py` |
| ⬜ | **`GET /api/admin/health`** | `admin_health.py` | Même format que le public + `SELECT 1` |

## Phase 2 — CRUD

| Statut | Tâche | Fichier | Détails & règles |
|:------:|-------|---------|------------------|
| ⬜ | **CRUD Catégories** | `categories_routes.py` | 4 routes §2.3. **DELETE protégé** : `if qa_count > 0 → 409`. POST/PUT : doublon de nom (iLike exact) → 409 |
| ⬜ | **CRUD QAs** | `qas_routes.py` | 4 routes §2.3. Validation `category_id` existe (400 sinon). `search` : `ilike` sur question+response |
| ⬜ | **Codes HTTP stricts** | toutes routes | 200 OK / 201 créé / 400 validation / 401 non auth / 404 introuvable / 409 conflit / 429 rate-limit / 500 serveur |

## Phase 3 — Embeddings & Docker

| Statut | Tâche | Fichier | Détails |
|:------:|-------|---------|---------|
| ⬜ | **`POST /api/admin/embeddings/regenerate`** | `qas_routes.py` ou `admin_health.py` | Exécute en semi-synchrone la vectorisation des QAs (même logique que `backend/scripts/embed_qas.py` — Option A Gemini, fichier `data/embeddings.json` **partagé via volume** `./backend/data` monté aussi dans `backend_admin`). Timeout généreux (120 s). Retourne `{success, count}` |
| ⬜ | **`backend_admin/Dockerfile`** | nouveau | `python:3.10-slim`, non-root user, gunicorn, EXPOSE 5001, healthcheck curl `/api/admin/health` |
| ⬜ | **Service compose `backend_admin`** | `docker-compose.yml` | Port `5001:5001`, env `DB_*` + `SECRET_KEY_ADMIN` + `CORS_ORIGINS_ADMIN=http://localhost:5174`, `depends_on: db: service_healthy`, volumes `./backend_admin:/app` + `./backend/data:/app/data` (partage embeddings) |
| ⬜ | **`.env.example` mis à jour** | racine + `backend_admin/.env.example` | Ajout des 4 variables admin (valeurs vides) |
| ⬜ | **Tests curl/Postman documentés dans la PR** | — | login (ok / mauvais mot de passe / 429), me, logout (+réutilisation du token → 401), CRUD complet, DELETE catégorie pleine → 409, regenerate |

---

# 6️⃣ 🟩 YOUSSEF — Tâches Frontend Admin

**Branches :** `feature/admin-ui-auth` puis `feature/admin-ui-crud`

## Phase 1 — Auth & Layout

| Statut | Tâche | Fichier | Règle d'intégration |
|:------:|-------|---------|---------------------|
| ⬜ | **Init projet** | `frontend_admin/` (Vite + React 18 + Tailwind) | Réutiliser la palette NORA exacte (`#85181A`, `#C85A32`, `#F8F3EA`, `#3D271D`) + Lucide-react + axios |
| ⬜ | **`vite.config.js`** | proxy `/api` → `http://backend_admin:5001` | Port dev **5174** pour éviter le conflit avec le frontend principal (5173) |
| ⬜ | **`adminApi.js`** | `frontend_admin/src/api/` | SEUL accès réseau (règle §3-5). Intercepteur : ajoute `Authorization: Bearer <token>` (lu en `sessionStorage`), sur **401 → purge token + redirect `/login`**. Fonctions : `login`, `logout`, `getMe`, `listCategories`, `createCategory`, `updateCategory`, `deleteCategory`, `listQAs`, `createQA`, `updateQA`, `deleteQA`, `regenerateEmbeddings` |
| ⬜ | **`LoginPage.jsx`** | pages/ | Email + password, loader, message générique *"Identifiants incorrects."*, 429 → afficher le message du serveur, redirection auto si `getMe()` OK au mount |
| ⬜ | **Route guard + `DashboardLayout.jsx`** | App.jsx | Sans token valide → Login. Sidebar : Catégories / QAs / Régénérer IA / Déconnexion. Header : nom de l'admin connecté |
| ⬜ | **Logout** | header | Appelle `logout()` → purge `sessionStorage` → Login |

## Phase 2 — CRUD UI

| Statut | Tâche | Fichier | Détails UX |
|:------:|-------|---------|-----------|
| ⬜ | **`CategoriesPage` + `CategoriesTable`** | pages + components | Table : nom, compteur QAs, actions Éditer/Supprimer. Bouton Supprimer **désactivé + tooltip** si `qa_count > 0` (aligné 409). Ajout/édition inline avec validation "nom requis" |
| ⬜ | **`QAsPage` + `QAsTable`** | pages + components | Table : question (tronquée), badge catégorie, aperçu réponse. Filtre select catégorie (`listCategories`) + champ recherche (`search=`). Pagination simple côté client (50/page) |
| ⬜ | **`QAFormModal.jsx`** | components | Création/édition : textarea question + textarea réponse + select catégorie. Validation front : question/response non vides (bloquant) |
| ⬜ | **`ConfirmDeleteModal.jsx`** | components | Modal de confirmation avec libellé explicite (jamais de suppression silencieuse) |
| ⬜ | **`Toast.jsx`** | components | Succès vert "✓ Enregistré" / erreur rouge avec `error` du serveur |
| ⬜ | **Bouton "Régénérer l'IA"** | sidebar | Appelle `regenerateEmbeddings()` → toast `{count}` QAs vectorisées. **Bannière orange persistante** dès qu'un CRUD QA a eu lieu : *"Des modifications ne sont pas encore visibles dans les réponses IA — régénérez l'index."* (disparaît après régénération) |
| ⬜ | **Dockerfile + compose `frontend_admin`** | — | Multi-stage Node→dev (même pattern que `frontend/`), port `5174:5174`, `depends_on: backend_admin` |

---

# 7️⃣ PLANNING JOUR PAR JOUR (5 jours)

| Jour | 🟦 Soufiane | 🟨 Yahya | 🟩 Youssef |
|:----:|-------------|----------|------------|
| **J1** | `feature/db-admin` : 2 tables + index (Section 4 init.sql) | `feature/admin-api` : squelette `backend_admin/` + modèles + `create_admin.py` | `feature/admin-ui-auth` : init projet + `adminApi.js` + LoginPage |
| **J2** | Tests intégrité + cascade + README_BDD | Auth complète : login/logout/me + `@require_admin` + anti brute-force | Route guard + DashboardLayout + Logout |
| **J3** | Review croisée BDD↔Backend | CRUD catégories + QAs + validations (400/409) | CategoriesPage complète |
| **J4** | Review croisée finale | Embeddings regenerate + Dockerfile + compose 5001 | QAsPage + modals + toasts + bannière embeddings + Dockerfile 5174 |
| **J5** | **🤝 INTÉGRATION** : `docker compose up --build` de zéro → parcours complet : login admin → créer catégorie → créer QA → régénérer IA → vérifier la QA visible dans le chatbot public (V1 + V2) → logout | | |

---

# 8️⃣ ✅ DEFINITION OF DONE — Checklist finale d'équipe

- [ ] Login avec mauvais mot de passe → 401 message **générique** (aucun indice email/mot de passe)
- [ ] 6ᵉ tentative échouée → 429 *"Trop de tentatives. Réessayez dans 10 minutes."*
- [ ] Logout → le token réutilisé renvoie immédiatement 401
- [ ] Token expiré (12 h) → 401 → redirect login sans perte de données côté UI
- [ ] Suppression d'une catégorie NON vide → **409** + liste du compte de QAs associées
- [ ] Créer une QA dans l'admin → **immédiatement visible** dans le chatbot public en V1 (`POST /api/chat/v1` la trouve)
- [ ] Après "Régénérer l'IA" → la nouvelle QA ressort en **V2 sémantique**
- [ ] Aucune page admin accessible sans token (route guard vérifié à la main)
- [ ] `password_hash` n'apparaît dans **aucune** réponse API ni aucun log
- [ ] Le backend public (`:5000`) n'a **aucune** écriture sur les tables admin (revue de code)
- [ ] `docker compose up --build` depuis un clone vierge = 0 erreur sur les 5 services
- [ ] Toutes les PR mergées sur `develop` après review croisée
- [ ] Ce fichier à jour (⬜ → ✅ réels)

---

> 💡 **Philosophie d'équipe (rappel)** : *"Le contrat avant le code."*
> La Section 2 est figée. Toute évolution = PR validée par les 3 membres.
> L'admin protège la donnée ; le chatbot public reste 100 % fonctionnel pendant tout le chantier.
