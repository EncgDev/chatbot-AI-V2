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
