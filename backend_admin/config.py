"""
config.py — Configuration du Backend Admin NORA
Auteur : Yahya

Back-office séparé : même BDD PostgreSQL que le chatbot public,
mais SECRET_KEY_ADMIN et CORS restreints à l'UI admin (port 5174).
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Charge le .env de backend_admin/ puis celui de la racine
_admin_dir = Path(__file__).resolve().parent
_admin_env = _admin_dir / ".env"
_root_env = _admin_dir.parent / ".env"

if _admin_env.exists():
    load_dotenv(dotenv_path=_admin_env)
elif _root_env.exists():
    load_dotenv(dotenv_path=_root_env)
else:
    load_dotenv()


class Config:
    """Configuration de base."""

    # ─── Flask ───────────────────────────────────────────────
    # Clé DISTINCTE du backend public (séparation des contextes)
    SECRET_KEY = os.environ.get("SECRET_KEY_ADMIN", "dev-admin-secret-change-in-production")
    DEBUG = False
    TESTING = False

    # ─── PostgreSQL partagé (même BDD que le chatbot public) ──
    SQLALCHEMY_DATABASE_URI = (
        f"postgresql://{os.environ.get('DB_USER','nora_user')}:"
        f"{os.environ.get('DB_PASSWORD','nora_secret_password')}@"
        f"{os.environ.get('DB_HOST','localhost')}:"
        f"{os.environ.get('DB_PORT','5432')}/"
        f"{os.environ.get('DB_NAME','nora_db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_timeout": 20,
        "max_overflow": 10,
    }

    # ─── Auth admin ──────────────────────────────────────────
    SESSION_TTL_HOURS        = int(os.environ.get("ADMIN_SESSION_TTL_HOURS", "12"))
    LOGIN_MAX_ATTEMPTS       = int(os.environ.get("ADMIN_LOGIN_MAX_ATTEMPTS", "5"))
    LOGIN_BLOCK_MINUTES      = int(os.environ.get("ADMIN_LOGIN_BLOCK_MINUTES", "10"))

    # ─── Embeddings (partagé avec le backend public via volume) ──
    AI_API_KEY      = os.environ.get("AI_API_KEY", "")
    EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "models/text-embedding-004")

    # ─── CORS : restreint à l'interface admin UNIQUEMENT ──────
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS_ADMIN", "http://localhost:5174").split(",")


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_map = {
    "development": DevelopmentConfig,
    "production":  ProductionConfig,
    "default":     DevelopmentConfig,
}
