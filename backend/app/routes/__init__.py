"""
Blueprints de l'API NORA
"""
from .health import health_bp
from .categories import categories_bp
from .qas import qas_bp
from .chat import chat_bp

__all__ = ["health_bp", "categories_bp", "qas_bp", "chat_bp"]
