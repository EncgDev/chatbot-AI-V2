"""
Blueprints de l'API Admin NORA (préfixe /api/admin uniquement)
"""
from .admin_health import admin_health_bp
from .auth_routes import auth_bp
from .categories_routes import categories_bp
from .qas_routes import qas_bp

__all__ = ["admin_health_bp", "auth_bp", "categories_bp", "qas_bp"]
