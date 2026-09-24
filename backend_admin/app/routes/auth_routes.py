"""
backend_admin/app/routes/auth_routes.py — Auth Admin (login / logout / me)
Auteur : Yahya

Contrat : TASKS_ADMIN.md §2.2
- Erreurs login TOUJOURS génériques (jamais "email inexistant" / "mauvais mot de passe")
- JAMAIS de password_hash exposé ni loggé
"""
import logging
from datetime import datetime

from flask import Blueprint, request, jsonify, g
from werkzeug.security import check_password_hash

from app.models import db, AdminUser
from app.auth import (
    create_admin_token, resolve_admin, get_bearer_token, require_admin,
    is_blocked, register_failed_attempt, reset_attempts,
)

logger = logging.getLogger("NORA.AdminAuth")
auth_bp = Blueprint("admin_auth", __name__)

# Message volontairement générique (anti-énumération)
INVALID_CREDENTIALS = "Identifiants incorrects."


@auth_bp.route("/api/admin/auth/login", methods=["POST"])
def login():
    """
    Body : { "email": "...", "password": "..." }
    Succès : { success, token, user, expires_at }
    Échec  : 401 générique | 429 après 5 échecs
    """
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"success": False, "error": "Email et mot de passe requis."}), 400

    # Anti force-brute
    if is_blocked(email):
        return jsonify({
            "success": False,
            "error": "Trop de tentatives. Réessayez dans 10 minutes.",
        }), 429

    user = AdminUser.query.filter(
        db.func.lower(AdminUser.email) == email.lower()
    ).first()

    # Vérification identique pour "inexistant" et "mauvais mdp" → réponse générique
    password_ok = user is not None and check_password_hash(user.password_hash, password)
    if not password_ok or not user.is_active:
        register_failed_attempt(email)
        return jsonify({"success": False, "error": INVALID_CREDENTIALS}), 401

    reset_attempts(email)
    user.last_login = datetime.utcnow()
    sess = create_admin_token(user)

    return jsonify({
        "success":    True,
        "token":      sess.token,
        "user":       {"email": user.email, "full_name": user.full_name},
        "expires_at": sess.expires_at.isoformat(),
    })


@auth_bp.route("/api/admin/auth/logout", methods=["POST"])
def logout():
    """Révoque immédiatement le token courant."""
    resolved = resolve_admin(get_bearer_token())
    if resolved is None:
        return jsonify({"success": False, "error": "Session expirée ou invalide."}), 401

    _, sess = resolved
    sess.revoked = True
    db.session.commit()
    return jsonify({"success": True})


@auth_bp.route("/api/admin/auth/me", methods=["GET"])
@require_admin
def me():
    """Vérifie le token et retourne les infos de l'admin connecté."""
    return jsonify({"success": True, "user": g.admin_user.to_dict()})
