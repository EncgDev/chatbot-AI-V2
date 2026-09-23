"""
app/routes/health.py — Blueprint Santé API & BDD
Auteur : Yahya
"""
from flask import Blueprint, jsonify
from sqlalchemy import text
from app.models import db

health_bp = Blueprint("health", __name__)


@health_bp.route("/api/health", methods=["GET"])
def health_check():
    """
    Vérification de l'état de l'API et de la connexion PostgreSQL.
    """
    try:
        db.session.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db.session.rollback()
        db_status = "error"

    status_code = 200 if db_status == "ok" else 503
    return jsonify({
        "status":   "ok" if db_status == "ok" else "degraded",
        "service":  "NORA API",
        "database": db_status,
        "version":  "1.0.0",
    }), status_code
