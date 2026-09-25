-- ============================================================
--  NORA — Chatbot ENCG Marrakech | Script d'Initialisation SQL
--  V1 : TABLE categories + TABLE QAs
--  V2 : TABLE chat_sessions + TABLE chat_messages (mémoire conversationnelle)
-- ============================================================

-- ------------------------------------------------------------
-- Extension : pgcrypto (requis pour gen_random_uuid())
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- SECTION 1 — Tables existantes (V1)
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
    id   INT PRIMARY KEY,
    name VARCHAR(80) NOT NULL
);

-- Note : ON DELETE CASCADE ajouté pour cohérence avec models.py
CREATE TABLE IF NOT EXISTS "QAs" (
    id          SERIAL PRIMARY KEY,
    question    TEXT NOT NULL,
    response    TEXT NOT NULL,
    category_id INT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_qas_category_id ON "QAs"(category_id);

CREATE INDEX IF NOT EXISTS idx_qas_question_fts
    ON "QAs" USING gin(to_tsvector('french', question));

CREATE INDEX IF NOT EXISTS idx_qas_response_fts
    ON "QAs" USING gin(to_tsvector('french', response));

-- ============================================================
-- SECTION 2 — Tables de mémoire conversationnelle (V2)
-- ============================================================

-- Représente une session de chat (une fenêtre de conversation)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    last_active TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Stocke chaque message échangé dans une session
CREATE TABLE IF NOT EXISTS chat_messages (
    id          SERIAL      PRIMARY KEY,
    session_id  UUID        NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role        VARCHAR(10) NOT NULL CHECK (role IN ('user', 'nora')),
    content     TEXT        NOT NULL,
    version     VARCHAR(4),                        -- 'v1', 'v2' ou NULL (pour messages user)
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Index de performance pour la lecture de l'historique par session
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON chat_messages(session_id);
  
CREATE OR REPLACE VIEW qas AS SELECT * FROM "QAs"; 

-- ============================================================
-- SECTION 4 — Back-Office Admin (V2.1 — Soufiane)
-- ============================================================

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

-- Compte administrateur par défaut (admin@encg.ac.ma / AdminNora2026!)
INSERT INTO admin_users (email, password_hash, full_name, is_active)
VALUES (
    'admin@encg.ac.ma',
    'pbkdf2:sha256:1000000$eBQgxULNRHYYs5Bn$4b274e6b259f26af85eba37ad4e7348019fd379e983fd60ad74fc815a03c837f',
    'Administrateur NORA',
    TRUE
)
ON CONFLICT (email) DO NOTHING;
