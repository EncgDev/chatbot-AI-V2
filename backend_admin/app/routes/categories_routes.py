"""
backend_admin/app/routes/categories_routes.py — CRUD Admin des Catégories
Auteur : Yahya

Contrat : TASKS_ADMIN.md §2.3
⚠️ Règle §3-7 : DELETE refusé (409) si la catégorie contient des QAs
   → protège l'Écran 2 du chatbot public en production.
"""
import logging

from flask import Blueprint, request, jsonify

from app.models import db, CategoryAdmin
from app.auth import require_admin

logger = logging.getLogger("NORA.AdminCategories")
categories_bp = Blueprint("admin_categories", __name__)


def _validate_name(data):
    """Extrait et valide le champ 'name'. Retourne (name, erreur_400_ou_None)."""
    name = (data.get("name") or "").strip()
    if not name:
        return None, "Le champ 'name' est requis."
    if len(name) > 80:  # VARCHAR(80) — contrat BDD
        return None, "Le nom dépasse 80 caractères."
    return name, None


def _name_exists(name: str, exclude_id: int = None) -> bool:
    q = CategoryAdmin.query.filter(db.func.lower(CategoryAdmin.name) == name.lower())
    if exclude_id is not None:
        q = q.filter(CategoryAdmin.id != exclude_id)
    return q.first() is not None


@categories_bp.route("/api/admin/categories", methods=["GET"])
@require_admin
def list_categories():
    cats = CategoryAdmin.query.order_by(CategoryAdmin.id).all()
    return jsonify({
        "success": True,
        "data":    [c.to_dict() for c in cats],
        "total":   len(cats),
    })


@categories_bp.route("/api/admin/categories", methods=["POST"])
@require_admin
def create_category():
    data = request.get_json(silent=True) or {}
    name, err = _validate_name(data)
    if err:
        return jsonify({"success": False, "error": err}), 400
    if _name_exists(name):
        return jsonify({"success": False, "error": "Une catégorie porte déjà ce nom."}), 409

    # ID entier explicite requis par le schéma (id INT PRIMARY KEY — pas de SERIAL)
    given_id = data.get("id")
    if given_id is not None:
        try:
            given_id = int(given_id)
        except (TypeError, ValueError):
            return jsonify({"success": False, "error": "L'id doit être un entier."}), 400
        if CategoryAdmin.query.get(given_id):
            return jsonify({"success": False, "error": f"L'id {given_id} est déjà utilisé."}), 409
        new_id = given_id
    else:
        max_id = db.session.query(db.func.max(CategoryAdmin.id)).scalar() or 0
        new_id = max_id + 1

    cat = CategoryAdmin(id=new_id, name=name)
    db.session.add(cat)
    db.session.commit()
    logger.info(f"Catégorie créée : id={cat.id} name={cat.name!r}")
    return jsonify({"success": True, "data": cat.to_dict()}), 201


@categories_bp.route("/api/admin/categories/<int:cat_id>", methods=["PUT"])
@require_admin
def update_category(cat_id):
    cat = CategoryAdmin.query.get(cat_id)
    if cat is None:
        return jsonify({"success": False, "error": "Catégorie introuvable."}), 404

    data = request.get_json(silent=True) or {}
    name, err = _validate_name(data)
    if err:
        return jsonify({"success": False, "error": err}), 400
    if _name_exists(name, exclude_id=cat_id):
        return jsonify({"success": False, "error": "Une catégorie porte déjà ce nom."}), 409

    cat.name = name
    db.session.commit()
    logger.info(f"Catégorie modifiée : id={cat.id} name={cat.name!r}")
    return jsonify({"success": True, "data": cat.to_dict()})


@categories_bp.route("/api/admin/categories/<int:cat_id>", methods=["DELETE"])
@require_admin
def delete_category(cat_id):
    cat = CategoryAdmin.query.get(cat_id)
    if cat is None:
        return jsonify({"success": False, "error": "Catégorie introuvable."}), 404

    # Règle §3-7 : on protège le chatbot public
    count = cat.qas.count()
    if count > 0:
        return jsonify({
            "success": False,
            "error":   f"Catégorie non vide : {count} QAs associées.",
        }), 409

    db.session.delete(cat)
    db.session.commit()
    logger.info(f"Catégorie supprimée : id={cat_id}")
    return jsonify({"success": True})
