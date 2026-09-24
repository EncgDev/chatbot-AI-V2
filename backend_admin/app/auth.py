"""
backend_admin/app/auth.py — Authentification Admin (tokens BDD révocables)
Auteur : Yahya

Principes (TASKS_ADMIN.md §2.2 / contrat) :
- Token opaque 64 hex stocké en BDD (NOT JWT) → révocable via revoked=TRUE
- Transmis UNIQUEMENT via header : Authorization: Bearer <token>
- Expiration 12 h (ADMIN_SESSION_TTL_HOURS)
- Anti force-brute : 5 échecs consécutifs / email → 429 pendant 10 min
"""
import logging
import secrets
import time
from datetime import datetime, timedelta
from functools import wraps

from flask import request, jsonify, g, current_app

from app.models import db, AdminUser, AdminSession

logger = logging.getLogger("NORA.AdminAuth")

# ─── Anti force-brute (en mémoire — suffisant pour un back-office) ──────────
# { "email": {"count": int, "blocked_until": float_timestamp} }
_LOGIN_ATTEMPTS: dict = {}


def _attempts_key(email: str) -> str:
    return (email or "").strip().lower()


def is_blocked(email: str) -> bool:
    info = _LOGIN_ATTEMPTS.get(_attempts_key(email))
    if not info:
        return False
    return time.time() < info.get("blocked_until", 0)


def register_failed_attempt(email: str) -> None:
    key = _attempts_key(email)
    info = _LOGIN_ATTEMPTS.setdefault(key, {"count": 0, "blocked_until": 0.0})
    info["count"] += 1
    max_attempts = current_app.config["LOGIN_MAX_ATTEMPTS"]
    if info["count"] >= max_attempts:
        block_s = current_app.config["LOGIN_BLOCK_MINUTES"] * 60
        info["blocked_until"] = time.time() + block_s
        info["count"] = 0
        logger.warning(f"Login bloqué {current_app.config['LOGIN_BLOCK_MINUTES']} min pour : {key}")


def reset_attempts(email: str) -> None:
    _LOGIN_ATTEMPTS.pop(_attempts_key(email), None)


# ─── Tokens ──────────────────────────────────────────────────────────────────
def create_admin_token(user: AdminUser) -> AdminSession:
    """Génère un token opaque et purge les sessions expirées au passage."""
    ttl = current_app.config["SESSION_TTL_HOURS"]
    session = AdminSession(
        user_id=user.id,
        token=secrets.token_hex(32),  # 64 caractères hex — contrat §2.2
        expires_at=datetime.utcnow() + timedelta(hours=ttl),
    )
    db.session.add(session)

    # Purge automatique des sessions expirées
    AdminSession.query.filter(AdminSession.expires_at < datetime.utcnow()).delete(
        synchronize_session=False
    )
    db.session.commit()
    return session


def resolve_admin(token: str):
    """
    Valide un token : existe, non révoqué, non expiré, user actif.
    Retourne (AdminUser, AdminSession) ou None.
    """
    if not token:
        return None
    sess = (
        AdminSession.query
        .filter_by(token=token, revoked=False)
        .filter(AdminSession.expires_at > datetime.utcnow())
        .first()
    )
    if sess is None or sess.user is None or not sess.user.is_active:
        return None
    return sess.user, sess


def get_bearer_token() -> str:
    auth = request.headers.get("Authorization", "")
    parts = auth.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return ""


def require_admin(view):
    """Décorateur : protège une route admin. 401 contrat §2.2 si invalide."""
    @wraps(view)
    def wrapper(*args, **kwargs):
        resolved = resolve_admin(get_bearer_token())
        if resolved is None:
            return jsonify({
                "success": False,
                "error": "Session expirée ou invalide.",
            }), 401
        g.admin_user, g.admin_session = resolved
        return view(*args, **kwargs)
    return wrapper
