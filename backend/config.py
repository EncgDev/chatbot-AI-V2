"""
config.py — Configuration de l'application Flask NORA
Auteur : Yahya
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Charge le fichier .env du dossier backend/ ou de la racine
_backend_dir = Path(__file__).resolve().parent
_backend_env = _backend_dir / ".env"
_root_env = _backend_dir.parent / ".env"

if _backend_env.exists():
    load_dotenv(dotenv_path=_backend_env)
elif _root_env.exists():
    load_dotenv(dotenv_path=_root_env)
else:
    load_dotenv()


class Config:
    """Configuration de base."""

    # ─── Flask ───────────────────────────────────────────────
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
    DEBUG = False
    TESTING = False

    # ─── PostgreSQL via SQLAlchemy ────────────────────────────
    DB_HOST     = os.environ.get("DB_HOST", "localhost")
    DB_PORT     = os.environ.get("DB_PORT", "5432")
    DB_NAME     = os.environ.get("DB_NAME", "nora_v2_db")
    DB_USER     = os.environ.get("DB_USER", "nora_user")
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "nora_secret_password")

    SQLALCHEMY_DATABASE_URI = (
        f"postgresql://{os.environ.get('DB_USER','nora_user')}:"
        f"{os.environ.get('DB_PASSWORD','nora_secret_password')}@"
        f"{os.environ.get('DB_HOST','localhost')}:"
        f"{os.environ.get('DB_PORT','5432')}/"
        f"{os.environ.get('DB_NAME','nora_v2_db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_timeout": 20,
        "max_overflow": 10,
    }

    # ─── IA — Google Gemini ───────────────────────────────────
    AI_API_KEY  = os.environ.get("AI_API_KEY", "")
    AI_PROVIDER = os.environ.get("AI_PROVIDER", "gemini")
    AI_MODEL    = os.environ.get("AI_MODEL", "gemini-2.5-flash")

    # ─── CORS ────────────────────────────────────────────────
    _raw_cors   = os.environ.get("CORS_ORIGINS", "*")
    CORS_ORIGINS = [orig.strip() for orig in _raw_cors.split(",") if orig.strip()]


class DevelopmentConfig(Config):
    """Configuration pour le développement local."""
    DEBUG = True


class ProductionConfig(Config):
    """Configuration pour la production."""
    DEBUG = False


# Mapping des configurations
config_map = {
    "development": DevelopmentConfig,
    "production":  ProductionConfig,
    "default":     DevelopmentConfig,
}
