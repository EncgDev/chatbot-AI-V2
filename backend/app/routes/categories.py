"""
app/routes/categories.py — Blueprint des Catégories ENCG
Auteur : Yahya
"""
import logging
from flask import Blueprint, jsonify
from sqlalchemy import func
from app.models import db, Category, QA

logger = logging.getLogger("NORA.Categories")
categories_bp = Blueprint("categories", __name__)


@categories_bp.route("/api/categories", methods=["GET"])
def get_categories():
    """
    GET /api/categories — Récupère les thématiques (pour l'Écran 2 de Youssef).
    Réponse :
    {
      "success": true,
      "data": [
        { "id": 1, "name": "Formations", "qa_count": 4 }, ...
      ],
      "total": 6
    }
    """
    try:
        categories = Category.query.order_by(Category.id).all()
        # Calcul groupé pour éliminer le problème N+1 requêtes
        qa_counts = dict(
            db.session.query(QA.category_id, func.count(QA.id))
            .group_by(QA.category_id)
            .all()
        )
        data = [
            {
                "id":       c.id,
                "name":     c.name,
                "qa_count": qa_counts.get(c.id, 0),
            }
            for c in categories
        ]
        return jsonify({
            "success": True,
            "data":    data,
            "total":   len(categories),
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erreur get_categories: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
