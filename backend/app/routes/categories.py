"""
app/routes/categories.py — Blueprint des Catégories ENCG
Auteur : Yahya
"""
import logging
from flask import Blueprint, jsonify
from app.models import Category

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
        return jsonify({
            "success": True,
            "data":    [c.to_dict() for c in categories],
            "total":   len(categories),
        })
    except Exception as e:
        logger.error(f"Erreur get_categories: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
