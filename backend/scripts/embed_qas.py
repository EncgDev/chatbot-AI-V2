"""
scripts/embed_qas.py — Vectorisation des QAs via Gemini Embeddings API (Phase C)
Auteur : Yahya

Génère backend/data/embeddings.json :
    { "<qa_id>": [0.0123, ...], ... }   (768 dimensions, clé = QA.id)

Usage (idempotent — rejouable après chaque mise à jour du dataset de Soufiane) :
    python scripts/embed_qas.py                 # depuis backend/
    docker exec nora_v2_backend python scripts/embed_qas.py
    python scripts/embed_qas.py --if-missing    # ne génère que si le fichier est absent
"""
import argparse
import json
import logging
import os
import sys
import time
from pathlib import Path

# Permet `python scripts/embed_qas.py` depuis backend/ (import de app.* et config)
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app import create_app  # noqa: E402
from app.models import QA  # noqa: E402
from config import Config  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("NORA.EmbedQAs")

EMBEDDING_MODEL = "models/gemini-embedding-001"
DATA_FILE = BACKEND_DIR / "data" / "embeddings.json"


def embed_qas(force: bool = False) -> int:
    """Vectorise toutes les QAs en BDD et écrit le cache JSON. Retourne le nombre d'entrées."""
    if DATA_FILE.exists() and not force:
        logger.info(f"Cache déjà présent ({DATA_FILE}) — aucune régénération.")
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return len(json.load(f))

    api_key = Config.AI_API_KEY
    if not api_key:
        logger.error("AI_API_KEY absente — impossible de générer les embeddings.")
        return 0

    import google.generativeai as genai
    genai.configure(api_key=api_key)

    env = os.environ.get("FLASK_ENV", "production")
    app = create_app(env)
    vectors = {}

    with app.app_context():
        qas = QA.query.order_by(QA.id).all()
        logger.info(f"{len(qas)} QAs à vectoriser...")

        for i, qa in enumerate(qas, start=1):
            text = f"{qa.question}\n{qa.response}"
            try:
                result = genai.embed_content(
                    model=EMBEDDING_MODEL,
                    content=text,
                    task_type="retrieval_document",
                )
                vectors[str(qa.id)] = result["embedding"]
            except Exception as e:
                logger.warning(f"QA {qa.id} non vectorisée ({e}) — ignorée.")
            # Politesse API : petite pause toutes les 10 requêtes
            if i % 10 == 0:
                time.sleep(0.3)

    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(vectors, f)

    logger.info(f"✅ {len(vectors)} embeddings écrits dans {DATA_FILE}")
    return len(vectors)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Vectorisation des QAs NORA (Gemini Embeddings)")
    parser.add_argument("--if-missing", action="store_true",
                        help="Ne génère que si le cache est absent (utilisé au démarrage)")
    args = parser.parse_args()

    count = embed_qas(force=not args.if_missing)
    sys.exit(0 if count > 0 else 1)
