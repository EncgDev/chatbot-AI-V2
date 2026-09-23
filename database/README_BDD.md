# 🟦 Rapport BDD — NORA V2 | Soufiane

> **Branche :** `feature/db-sessions`
> **Fichier modifié :** `database/init.sql`
> **Date :** 2026-09-17
> **Statut :** ✅ Schéma V2 complet — prêt pour review

---

## 📌 Résumé des modifications

Ce rapport documente l'ensemble des changements apportés à la base de données PostgreSQL dans le cadre de la **V2 de NORA**, conformément au contrat défini en Section 2.3 du `TASKS.md`.

---

## 1️⃣ Extension PostgreSQL ajoutée

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

**Pourquoi ?** La table `chat_sessions` utilise un UUID généré automatiquement via `gen_random_uuid()`. Cette fonction requiert l'extension `pgcrypto`, qui n'était pas activée en V1.

> ✅ Idempotent grâce à `IF NOT EXISTS` — n'échoue pas si déjà présente.

---

## 2️⃣ Modification de la table existante `QAs`

### Changement : ajout de `ON DELETE CASCADE`

```sql
-- AVANT (V1)
FOREIGN KEY (category_id) REFERENCES categories(id)

-- APRÈS (V2)
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
```

**Pourquoi ?** Le fichier `backend/app/models.py` définit déjà une relation en cascade côté ORM SQLAlchemy. Le schéma SQL était incohérent avec le modèle Python. Ce correctif garantit que :
- Si une catégorie est supprimée → toutes ses QAs sont automatiquement supprimées.
- Le comportement BDD correspond à ce qu'attend le backend.

> ⚠️ Les noms des catégories (visibles dans l'UI de Youssef via `CategoryGrid.jsx`) restent inchangés. Aucun `DELETE` n'est effectué sur les données existantes.

---

## 3️⃣ Nouvelle table : `chat_sessions`

```sql
CREATE TABLE IF NOT EXISTS chat_sessions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    last_active TIMESTAMP   NOT NULL DEFAULT NOW()
);
```

| Colonne | Type | Rôle |
|---------|------|------|
| `id` | `UUID` | Identifiant unique de session, généré automatiquement |
| `created_at` | `TIMESTAMP` | Date de création de la session |
| `last_active` | `TIMESTAMP` | Dernière activité (mise à jour à chaque message) |

**Pourquoi UUID ?** L'UUID est non-séquentiel et non-devinable, ce qui est essentiel pour isoler les sessions des utilisateurs sans authentification (borne tactile publique).

---

## 4️⃣ Nouvelle table : `chat_messages`

```sql
CREATE TABLE IF NOT EXISTS chat_messages (
    id          SERIAL      PRIMARY KEY,
    session_id  UUID        NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role        VARCHAR(10) NOT NULL CHECK (role IN ('user', 'nora')),
    content     TEXT        NOT NULL,
    version     VARCHAR(4),
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);
```

| Colonne | Type | Rôle |
|---------|------|------|
| `id` | `SERIAL` | Identifiant auto-incrémenté du message |
| `session_id` | `UUID` FK | Lien vers la session parente (cascade delete) |
| `role` | `VARCHAR(10)` | `'user'` ou `'nora'` — validé par contrainte `CHECK` |
| `content` | `TEXT` | Contenu textuel du message |
| `version` | `VARCHAR(4)` | `'v1'`, `'v2'` ou `NULL` (messages utilisateur) |
| `created_at` | `TIMESTAMP` | Horodatage du message |

**Contrainte `CHECK` sur `role` :** garantit l'intégrité des données — aucune valeur invalide ne peut être insérée.

**`ON DELETE CASCADE` :** si une session est supprimée, tous ses messages disparaissent automatiquement (pas de messages orphelins).

---

## 5️⃣ Index ajouté

```sql
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON chat_messages(session_id);
```

**Pourquoi ?** La route `GET /api/chat/sessions/<uuid>` filtre les messages par `session_id`. Sans index, cette requête effectuerait un **full table scan** sur `chat_messages`, ce qui est inacceptable en production. Cet index rend la lecture de l'historique instantanée.

---

## 🗂️ État final du schéma complet

```
categories
├── id (INT, PK)
└── name (VARCHAR)

QAs  ← dépend de categories
├── id (SERIAL, PK)
├── question (TEXT)
├── response (TEXT)
└── category_id (INT, FK → categories.id  ON DELETE CASCADE)
    Indexes: idx_qas_category_id, idx_qas_question_fts, idx_qas_response_fts

chat_sessions
├── id (UUID, PK)
├── created_at (TIMESTAMP)
└── last_active (TIMESTAMP)

chat_messages  ← dépend de chat_sessions
├── id (SERIAL, PK)
├── session_id (UUID, FK → chat_sessions.id  ON DELETE CASCADE)
├── role (VARCHAR CHECK IN ('user','nora'))
├── content (TEXT)
├── version (VARCHAR nullable)
└── created_at (TIMESTAMP)
    Index: idx_messages_session_id
```

---

## 🧪 Tests à effectuer

### Test 1 — Intégrité depuis un volume vierge

```bash
docker-compose down -v
docker-compose up db
docker logs nora_db
```

✅ Attendu : les 2 scripts SQL s'exécutent sans erreur dans les logs.

### Test 2 — Vérification des tables

```bash
docker exec -it nora_db psql -U nora_user -d nora_db -c "\dt"
```

✅ Attendu : 4 tables visibles : `categories`, `QAs`, `chat_sessions`, `chat_messages`.

### Test 3 — Vérification du count QAs

```bash
docker exec -it nora_db psql -U nora_user -d nora_db -c 'SELECT count(*) FROM "QAs";'
```

✅ Attendu : nombre ≥ 1 (données de `encgm_training_dataset_inserts.sql`).

### Test 4 — Cascade QAs → categories

```sql
-- Dans psql :
DELETE FROM categories WHERE id = 1;
SELECT count(*) FROM "QAs" WHERE category_id = 1;  -- Doit retourner 0
-- Restaurer ensuite avec réimport du dataset
```

### Test 5 — Cascade chat_messages → chat_sessions

```sql
-- Insérer une session test
INSERT INTO chat_sessions DEFAULT VALUES RETURNING id;
-- Utiliser l'UUID retourné dans <uuid>
INSERT INTO chat_messages (session_id, role, content, version)
  VALUES ('<uuid>', 'user', 'Test message', NULL);
-- Supprimer la session
DELETE FROM chat_sessions WHERE id = '<uuid>';
-- Vérifier que le message a disparu
SELECT count(*) FROM chat_messages WHERE session_id = '<uuid>';  -- Doit retourner 0
```

---

## 6️⃣ Back-Office Admin — Tables V2.1 (Soufiane)

Conformément à `TASKS_ADMIN.md` (§2.1 & §4), deux tables d'administration et leurs index ont été ajoutés à la fin de `database/init.sql` (Section 4).

### Table `admin_users`
Stocke les comptes des administrateurs du back-office.

```sql
CREATE TABLE IF NOT EXISTS admin_users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    full_name     VARCHAR(80),
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    last_login    TIMESTAMP
);
```

| Colonne | Type | Rôle |
|---------|------|------|
| `id` | `SERIAL PK` | Identifiant unique de l'administrateur |
| `email` | `VARCHAR(120) UNIQUE NOT NULL` | Email de connexion |
| `password_hash` | `VARCHAR(255) NOT NULL` | Hash de mot de passe (Werkzeug / Argon2 / bcrypt) |
| `full_name` | `VARCHAR(80)` | Nom complet de l'administrateur |
| `is_active` | `BOOLEAN NOT NULL DEFAULT TRUE` | Compte actif ou désactivé |
| `created_at` | `TIMESTAMP NOT NULL DEFAULT NOW()` | Date de création du compte |
| `last_login` | `TIMESTAMP` | Horodatage de la dernière connexion réussie |

### Table `admin_sessions`
Gère les sessions d'authentification par token révocable (durée 12 h).

```sql
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

| Colonne | Type | Rôle |
|---------|------|------|
| `id` | `SERIAL PK` | Identifiant de session |
| `user_id` | `INT NOT NULL FK` | Référence `admin_users(id)` avec `ON DELETE CASCADE` |
| `token` | `VARCHAR(64) UNIQUE NOT NULL` | Token hexadécimal sécurisé (32 octets = 64 caractères) |
| `created_at` | `TIMESTAMP NOT NULL DEFAULT NOW()` | Date de création de la session |
| `expires_at` | `TIMESTAMP NOT NULL` | Date d'expiration de la session |
| `revoked` | `BOOLEAN NOT NULL DEFAULT FALSE` | Statut de révocation (déconnexion) |

### 🔒 Règle de sécurité stricte
> ⚠️ **Chatbot public = LECTURE SEULE / ISOLATION TOTALE** :
> L'application publique NORA (chatbot port 5000) n'a **JAMAIS** accès en écriture ni en lecture aux tables `admin_users` et `admin_sessions`. Seule l'API d'administration (`backend_admin/`, port 5001) interagit avec ces tables.

### Test de suppression en cascade vérifié :
```sql
-- Suppression de l'admin id = 1 entraîne la suppression automatique de toutes ses sessions :
DELETE FROM admin_users WHERE id = 1;
SELECT count(*) FROM admin_sessions WHERE user_id = 1; -- Retourne 0
```

---

## ⏳ Tâches restantes (hors schéma)

| Statut | Tâche |
|:------:|-------|
| ⬜ | Nettoyage data : orthographe & accents dans `encgm_training_dataset_inserts.sql` |
| ⬜ | Supprimer les QAs placeholder (contenu type "à remplir...") |
| ⬜ | Ajouter 100+ nouvelles QAs (bourses, stages, clubs, calendrier concours…) |
| ⬜ | Support embeddings (colonne `VECTOR(768)` + `pgvector`) — après décision équipe |

---

## 🔗 Fichiers liés

- [`database/init.sql`](./init.sql) — Schéma complet V1 + V2 + V2.1 Admin
- [`database/encgm_training_dataset_inserts.sql`](./encgm_training_dataset_inserts.sql) — Dataset officiel ENCGM
- [`TASKS.md`](../TASKS.md) — Spécifications du Chatbot public
- [`TASKS_ADMIN.md`](../TASKS_ADMIN.md) — Spécifications officielles du Back-Office Admin

---

> 💡 **Rappel contrat** : Les tables `categories` et `QAs` ne changent pas de nom ni de structure.
> Toute modification future du schéma = PR validée par Yahya ET Youssef avant merge.

