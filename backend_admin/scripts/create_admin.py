"""
scripts/create_admin.py — Création / mise à jour du compte admin
Auteur : Yahya

Lit ADMIN_EMAIL / ADMIN_PASSWORD depuis l'environnement (.env) et insère
le compte en BDD avec un hash sécurisé (werkzeug PBKDF2).
Idempotent : si l'email existe déjà, son mot de passe est mis à jour.

Usage :
    docker exec nora_v2_backend_admin python scripts/create_admin.py
    python scripts/create_admin.py            # depuis backend_admin/
"""
import logging
import os
import sys
from pathlib import Path

# Permet `python scripts/create_admin.py` depuis backend_admin/
_ADMIN_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ADMIN_DIR))

from werkzeug.security import generate_password_hash  # noqa: E402


def _env_or_dotfile(name: str) -> str:
    """
    Lit une variable d'environnement avec repli sur le .env.
    ⚠️ docker compose injecte ADMIN_EMAIL="" / ADMIN_PASSWORD="" (chaînes vides)
    quand la racine ne les définit pas → on bascule alors sur backend_admin/.env.
    Sans override global : les vars Docker (DB_HOST=db, etc.) restent prioritaires.
    """
    val = (os.environ.get(name) or "").strip()
    if val:
        return val
    for env_path in (_ADMIN_DIR / ".env", _ADMIN_DIR.parent / ".env"):
        if not env_path.exists():
            continue
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith(f"{name}="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""

from app import create_app  # noqa: E402
from app.models import db, AdminUser  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("NORA.CreateAdmin")


def main() -> int:
    email = _env_or_dotfile("ADMIN_EMAIL").strip()
    password = _env_or_dotfile("ADMIN_PASSWORD")

    if not email or not password:
        logger.error("ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis dans l'environnement.")
        return 1
    if len(password) < 8:
        logger.error("ADMIN_PASSWORD trop court (minimum 8 caractères).")
        return 1

    app = create_app(os.environ.get("FLASK_ENV", "production"))
    with app.app_context():
        user = AdminUser.query.filter(
            db.func.lower(AdminUser.email) == email.lower()
        ).first()

        if user is None:
            user = AdminUser(
                email=email,
                full_name=os.environ.get("ADMIN_FULL_NAME", "Administrateur NORA"),
                is_active=True,
            )
            db.session.add(user)
            action = "créé"
        else:
            action = "mis à jour"

        user.password_hash = generate_password_hash(password)
        db.session.commit()

    logger.info(f"✅ Compte admin {action} : {email}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
