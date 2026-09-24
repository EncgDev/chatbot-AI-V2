"""
backend_admin/app/__init__.py — Application Factory du Back-Office Admin
Auteur : Yahya
"""
import logging
from flask import Flask, jsonify
from flask_cors import CORS

from config import config_map
from app.models import db
from app.routes import admin_health_bp, auth_bp, categories_bp, qas_bp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("NORA.Admin")


def create_app(env: str = "production") -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_map.get(env, config_map["default"]))

    # CORS STRICT : uniquement l'interface admin (5174) — jamais "*"
    CORS(app, resources={r"/api/admin/*": {"origins": app.config["CORS_ORIGINS"]}})
    db.init_app(app)

    with app.app_context():
        try:
            db.engine.connect()
            logger.info("✅ Connexion PostgreSQL (BDD partagée) établie.")
        except Exception as e:
            logger.warning(f"⚠️ BDD non connectée au démarrage : {e}")

    app.register_blueprint(admin_health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(qas_bp)

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

    logger.info(f"✨ NORA Admin initialisé en mode '{env}'.")
    return app
