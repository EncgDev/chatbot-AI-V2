"""
backend_admin/app/routes/qas_routes.py — CRUD Admin des QAs
Auteur : Yahya

Contrat : TASKS_ADMIN.md §2.3
Validations serveur obligatoires :
- question / response non vides           → 400
- category_id doit exister en BDD         → 400
"""
import logging

from flask import Blueprint, request, jsonify
from sqlalchemy import or_

from app.models import db, QAAdmin, CategoryAdmin
from app.auth import require_admin

logger = logging.getLogger("NORA.AdminQAs")
qas_bp = Blueprint("admin_qas", __name__)


def _validate_qa_payload(data):
    """Valide {question, response, category_id}. Retourne (dict_validé, erreur)."""
    question = (data.get("question") or "").strip()
    response = (data.get("response") or "").strip()
    category_id = data.get("category_id")

    if not question:
        return None, "Le champ 'question' est requis."
    if not response:
        return None, "Le champ 'response' est requis."
    if category_id is None:
        return None, "Le champ 'category_id' est requis."
    try:
        category_id = int(category_id)
    except (TypeError, ValueError):
        return None, "Le champ 'category_id' doit être un entier."
    if CategoryAdmin.query.get(category_id) is None:
        return None, f"La catégorie {category_id} n'existe pas."

    return {"question": question, "response": response, "category_id": category_id}, None


@qas_bp.route("/api/admin/qas", methods=["GET"])
@require_admin
def list_qas():
    """
    GET /api/admin/qas?category_id=X&search=mot
    Réponse : { success, data: [...], total }
    """
    query = QAAdmin.query

    category_id = request.args.get("category_id", type=int)
    if category_id is not None:
        query = query.filter_by(category_id=category_id)

    search = (request.args.get("search") or "").strip()
    if search:
        pattern = f"%{search}%"
        query = query.filter(or_(
            QAAdmin.question.ilike(pattern),
            QAAdmin.response.ilike(pattern),
        ))

    qas = query.order_by(QAAdmin.id).all()
    return jsonify({
        "success": True,
        "data":    [q.to_dict() for q in qas],
        "total":   len(qas),
    })


@qas_bp.route("/api/admin/qas", methods=["POST"])
@require_admin
def create_qa():
    data = request.get_json(silent=True) or {}
    payload, err = _validate_qa_payload(data)
    if err:
        return jsonify({"success": False, "error": err}), 400

    qa = QAAdmin(**payload)
    db.session.add(qa)
    db.session.commit()
    logger.info(f"QA créée : id={qa.id} category_id={qa.category_id}")
    return jsonify({"success": True, "data": qa.to_dict()}), 201


@qas_bp.route("/api/admin/qas/<int:qa_id>", methods=["PUT"])
@require_admin
def update_qa(qa_id):
    qa = QAAdmin.query.get(qa_id)
    if qa is None:
        return jsonify({"success": False, "error": "QA introuvable."}), 404

    data = request.get_json(silent=True) or {}
    payload, err = _validate_qa_payload(data)
    if err:
        return jsonify({"success": False, "error": err}), 400

    qa.question    = payload["question"]
    qa.response    = payload["response"]
    qa.category_id = payload["category_id"]
    db.session.commit()
    logger.info(f"QA modifiée : id={qa.id}")
    return jsonify({"success": True, "data": qa.to_dict()})


@qas_bp.route("/api/admin/qas/<int:qa_id>", methods=["DELETE"])
@require_admin
def delete_qa(qa_id):
    qa = QAAdmin.query.get(qa_id)
    if qa is None:
        return jsonify({"success": False, "error": "QA introuvable."}), 404

    db.session.delete(qa)
    db.session.commit()
    logger.info(f"QA supprimée : id={qa_id}")
    return jsonify({"success": True})
