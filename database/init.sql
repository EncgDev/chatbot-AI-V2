-- ============================================================
--  NORA — Chatbot ENCG Marrakech | Script d'Initialisation SQL
--  Schéma : TABLE categories + TABLE QAs
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
    id   INT PRIMARY KEY,
    name VARCHAR(80) NOT NULL
);

CREATE TABLE IF NOT EXISTS QAs (
    id          SERIAL PRIMARY KEY,
    question    TEXT NOT NULL,
    response    TEXT NOT NULL,
    category_id INT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_qas_category_id ON QAs(category_id);

CREATE INDEX IF NOT EXISTS idx_qas_question_fts
    ON QAs USING gin(to_tsvector('french', question));

CREATE INDEX IF NOT EXISTS idx_qas_response_fts
    ON QAs USING gin(to_tsvector('french', response));
