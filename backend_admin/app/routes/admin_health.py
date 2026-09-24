"""
backend_admin/app/routes/admin_health.py — Santé + Régénération des embeddings
Auteur : Yahya

- GET  /api/admin/health                : état service + BDD partagée
- POST /api/admin/embeddings/regenerate : reconstruit data/embeddings.json
- GET  /api/admin/embeddings/status     : état de la dernière régénération

Le fichier embeddings.json est ÉCRIT dans le même dossier que celui lu par le
backend public (volume partagé ./backend/data) → cohérence RAG garantie.

La régénération tourne en thread d'arrière-plan : l'API répond immédiatement,
le frontend admin peut suivre l'avancement via /status.
"""
import json
import logging
import os
import threading
import time
from datetime import datetime
from pathlib import Path

from flask import Blueprint, jsonify, current_app
from sqlalchemy import text

from app.models import db, QAAdmin
from app.auth import require_admin

logger = logging.getLogger("NORA.AdminEmbeddings")
admin_health_bp = Blueprint("admin_health", __name__)

# ─── Fichier partagé avec le backend public (./backend/data) ────────────────
DATA_DIR = Path(os.environ.get(
    "DATA_DIR",
    str(Path(__file__).resolve().parents[2] / "data"),
))
EMBEDDINGS_FILE = DATA_DIR / "embeddings.json"

# ─── État de la régénération (mono-worker — simple et suffisant) ────────────
_STATE = {"state": "idle", "count": 0, "last_run": None, "error": None}
_STATE_LOCK = threading.Lock()


def _set_state(**kwargs):
    with _STATE_LOCK:
        _STATE.update(kwargs)


def count_orphan_ids() -> int:
    """Nombre d'IDs vectorisés qui ne correspondent plus à aucune QA en BDD."""
    if not EMBEDDINGS_FILE.exists():
        return 0
    try:
        ids = {int(k) for k in json.loads(EMBEDDINGS_FILE.read_text("utf-8")).keys()}
    except Exception:
        return 0
    existing = {qa.id for qa in QAAdmin.query.with_entities(QAAdmin.id).all()}
    return len(ids - existing)


def _run_regeneration(api_key: str, model: str):
    """Tâche d'arrière-plan : vectorise TOUTES les QAs et réécrit le cache."""
    from app import create_app  # import tardif (contexte Flask requis)

    app = create_app(os.environ.get("FLASK_ENV", "production"))
    vectors = {}
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)

        with app.app_context():
            qas = QAAdmin.query.order_by(QAAdmin.id).all()
            for i, qa in enumerate(qas, start=1):
                try:
                    result = genai.embed_content(
                        model=model,
                        content=f"{qa.question}\n{qa.response}",
                        task_type="retrieval_document",
                        request_options={"timeout": 20},
                    )
                    vectors[str(qa.id)] = result["embedding"]
                except Exception as e:
                    logger.warning(f"QA {qa.id} non vectorisée : {e}")
                if i % 10 == 0:
                    time.sleep(0.3)  # politesse quota

        DATA_DIR.mkdir(parents=True, exist_ok=True)
        with open(EMBEDDINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(vectors, f)

        _set_state(state="done", count=len(vectors),
                   last_run=datetime.utcnow().isoformat(), error=None)
        logger.info(f"✅ Régénération embeddings terminée : {len(vectors)} entrées.")
    except Exception as e:
        _set_state(state="error", error=str(e))
        logger.error(f"Échec régénération embeddings : {e}")


@admin_health_bp.route("/api/admin/health", methods=["GET"])
def health():
    try:
        db.session.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"
    return jsonify({
        "status":   "ok",
        "service":  "NORA Admin API",
        "database": db_status,
        "version":  "1.0.0",
    })


@admin_health_bp.route("/api/admin/embeddings/regenerate", methods=["POST"])
@require_admin
def regenerate_embeddings():
    """Lance la régénération complète (thread d'arrière-plan)."""
    with _STATE_LOCK:
        if _STATE["state"] == "running":
            return jsonify({
                "success": False,
                "error": "Une régénération est déjà en cours.",
            }), 409

    api_key = current_app.config.get("AI_API_KEY", "")
    if not api_key:
        return jsonify({
            "success": False,
            "error": "AI_API_KEY absente — régénération impossible côté admin.",
        }), 503

    model = current_app.config["EMBEDDING_MODEL"]
    _set_state(state="running", error=None)

    thread = threading.Thread(
        target=_run_regeneration, args=(api_key, model), daemon=True,
    )
    thread.start()

    return jsonify({"success": True, "status": "running"})


@admin_health_bp.route("/api/admin/embeddings/status", methods=["GET"])
@require_admin
def embeddings_status():
    """État de la régénération + nombre d'embeddings orphelins (QAs supprimées)."""
    try:
        orphans = count_orphan_ids()
    except Exception:
        orphans = None
    with _STATE_LOCK:
        return jsonify({
            "success":   True,
            **_STATE,
            "file":      str(EMBEDDINGS_FILE),
            "file_exists": EMBEDDINGS_FILE.exists(),
            "orphan_ids": orphans,
        })
