"""
app/__init__.py — Application Factory Pattern pour NORA
Auteur : Yahya
"""
import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS

from config import config_map
from app.models import db
from app.routes import health_bp, categories_bp, qas_bp, chat_bp

# ─── Logging ─────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("NORA")


def create_app(env: str = None) -> Flask:
    """
    Application Factory Pattern pour initialiser l'application Flask.
    """
    app = Flask(__name__)

    # ─── 1. Chargement de la configuration ───────────────────
    env = env or os.environ.get("FLASK_ENV", "production")
    cfg = config_map.get(env, config_map["default"])
    app.config.from_object(cfg)

    # ─── 2. Initialisation des extensions ────────────────────
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    db.init_app(app)

    # ─── 3. Vérification de la connexion PostgreSQL ───────────
    with app.app_context():
        try:
            db.engine.connect()
            logger.info("✅ Connexion PostgreSQL établie avec succès.")
        except Exception as e:
            logger.warning(f"⚠️ Base de données non connectée au démarrage : {e}")

    # ─── 4. Enregistrement des Blueprints (Routes) ───────────
    app.register_blueprint(health_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(qas_bp)
    app.register_blueprint(chat_bp)

    # ─── 5. Gestionnaires d'erreurs globaux ───────────────────
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"success": False, "error": "Requête invalide."}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "error": "Route introuvable."}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"success": False, "error": "Méthode HTTP non autorisée."}), 405

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"success": False, "error": "Erreur interne du serveur."}), 500

    logger.info(f"✨ Application NORA initialisée en mode '{env}'.")
    return app
