"""
app/routes/qas.py — Blueprint des Questions/Réponses
Auteur : Yahya
"""
import logging
from flask import Blueprint, request, jsonify
from sqlalchemy.orm import joinedload
from app.models import db, QA

logger = logging.getLogger("NORA.QAs")
qas_bp = Blueprint("qas", __name__)


@qas_bp.route("/api/qas", methods=["GET"])
def get_qas():
    """
    GET /api/qas?category_id=<id> — Récupère les QAs (optionnellement par catégorie).
    Réponse :
    {
      "success": true,
      "data": [
        {
          "id": 1,
          "question": "Quelles sont les filières ?",
          "response": "...",
          "category_id": 1,
          "category": { "id": 1, "name": "Formations" }
        }
      ],
      "total": 4
    }
    """
    try:
        category_id = request.args.get("category_id", type=int)
        query = QA.query.options(joinedload(QA.category))
        if category_id:
            query = query.filter_by(category_id=category_id)

        qas = query.order_by(QA.id).all()
        return jsonify({
            "success": True,
            "data":    [q.to_dict(include_category=True) for q in qas],
            "total":   len(qas),
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erreur get_qas: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
