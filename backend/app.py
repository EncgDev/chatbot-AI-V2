"""
app.py — API REST Flask pour NORA (Chatbot ENCG Marrakech)
Auteur : Yahya

Schéma BDD (Soufiane) :
  TABLE categories : id (INT PK), name (VARCHAR 80)
  TABLE QAs        : id (SERIAL PK), question (TEXT), response (TEXT), category_id (INT FK)

Endpoints :
  GET  /api/health                — Healthcheck API + BDD
  GET  /api/categories            — Liste des 6 catégories
  GET  /api/qas?category_id=<id>  — QAs d'une catégorie
  POST /api/chat/v1               — Recherche SQL LIKE (sans IA)
  POST /api/chat/v2               — RAG + Google Gemini
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import text, or_

from config import config_map
from models import db, Category, QA

# ─── Logging ─────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("NORA")


def create_app(env: str = None) -> Flask:
    """Application Factory Pattern."""
    app = Flask(__name__)

    # ─── Configuration ────────────────────────────────────────
    env = env or os.environ.get("FLASK_ENV", "production")
    cfg = config_map.get(env, config_map["default"])
    app.config.from_object(cfg)

    # ─── Extensions ──────────────────────────────────────────
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    db.init_app(app)

    # ─── Test connexion BDD ───────────────────────────────────
    with app.app_context():
        try:
            db.engine.connect()
            logger.info("✅ Connexion PostgreSQL établie.")
        except Exception as e:
            logger.error(f"❌ Erreur connexion BDD : {e}")

    # ==========================================================
    #  GET /api/health — Healthcheck
    # ==========================================================
    @app.route("/api/health", methods=["GET"])
    def health():
        try:
            db.session.execute(text("SELECT 1"))
            db_status = "ok"
        except Exception:
            db_status = "error"
        return jsonify({
            "status":   "ok",
            "service":  "NORA API",
            "database": db_status,
            "version":  "1.0.0",
        })

    # ==========================================================
    #  GET /api/categories — Liste des catégories
    #
    #  Réponse JSON attendue par le frontend (CategoryGrid) :
    #  {
    #    "success": true,
    #    "data": [
    #      { "id": 1, "name": "Formations",              "qa_count": 4 },
    #      { "id": 2, "name": "Horaires & emploi du temps", "qa_count": 3 },
    #      { "id": 3, "name": "Admission & inscription", "qa_count": 4 },
    #      { "id": 4, "name": "À propos de l'ENCG",     "qa_count": 3 },
    #      { "id": 5, "name": "Vie étudiante & clubs",  "qa_count": 3 },
    #      { "id": 6, "name": "Contact & localisation",  "qa_count": 4 }
    #    ],
    #    "total": 6
    #  }
    # ==========================================================
    @app.route("/api/categories", methods=["GET"])
    def get_categories():
        try:
            categories = Category.query.order_by(Category.id).all()
            return jsonify({
                "success": True,
                "data":    [c.to_dict() for c in categories],
                "total":   len(categories),
            })
        except Exception as e:
            logger.error(f"Erreur get_categories: {e}")
            return jsonify({"success": False, "error": str(e)}), 500

    # ==========================================================
    #  GET /api/qas?category_id=<id> — QAs d'une catégorie
    #
    #  Paramètre : category_id (int, optionnel)
    #  Si absent  → retourne toutes les QAs
    #
    #  Réponse JSON attendue par le frontend :
    #  {
    #    "success": true,
    #    "data": [
    #      {
    #        "id": 1,
    #        "question": "Quelles sont les filières ?",
    #        "response": "L'ENCG propose...",
    #        "category_id": 1,
    #        "category": { "id": 1, "name": "Formations", "qa_count": 4 }
    #      }, ...
    #    ],
    #    "total": 4
    #  }
    # ==========================================================
    @app.route("/api/qas", methods=["GET"])
    def get_qas():
        try:
            category_id = request.args.get("category_id", type=int)
            query = QA.query
            if category_id:
                query = query.filter_by(category_id=category_id)

            qas = query.order_by(QA.id).all()
            return jsonify({
                "success": True,
                "data":    [q.to_dict(include_category=True) for q in qas],
                "total":   len(qas),
            })
        except Exception as e:
            logger.error(f"Erreur get_qas: {e}")
            return jsonify({"success": False, "error": str(e)}), 500

    # ==========================================================
    #  POST /api/chat/v1 — Recherche SQL LIKE (Version sans IA)
    #
    #  Body  : { "message": "comment s inscrire" }
    #
    #  Réponse JSON :
    #  {
    #    "success": true,
    #    "version": "v1",
    #    "response": "Pour s'inscrire à l'ENCG...",
    #    "question_matched": "Comment s'inscrire ?",
    #    "category_id": 3
    #  }
    # ==========================================================
    @app.route("/api/chat/v1", methods=["POST"])
    def chat_v1():
        data    = request.get_json(silent=True) or {}
        message = data.get("message", "").strip()

        if not message:
            return jsonify({"success": False, "error": "Le champ 'message' est requis."}), 400

        try:
            # Tokenisation : mots de longueur > 2
            tokens = [w.lower() for w in message.split() if len(w) > 2]

            if not tokens:
                return jsonify({
                    "success":  True,
                    "version":  "v1",
                    "response": "Je n'ai pas compris votre question. Pouvez-vous reformuler ?",
                })

            # Recherche LIKE sur question ET response (max 5 tokens)
            conditions = []
            for token in tokens[:5]:
                pat = f"%{token}%"
                conditions.append(or_(
                    QA.question.ilike(pat),
                    QA.response.ilike(pat),
                ))

            results = QA.query.filter(or_(*conditions)).limit(3).all()

            if not results:
                return jsonify({
                    "success":  True,
                    "version":  "v1",
                    "response": (
                        "Je suis désolée, je n'ai pas trouvé de réponse à votre question.\n"
                        "Contactez l'ENCG Marrakech directement :\n"
                        "📞 +212 524 33 70 26\n"
                        "📧 contact@encg-marrakech.uca.ma"
                    ),
                })

            best = results[0]
            return jsonify({
                "success":          True,
                "version":          "v1",
                "response":         best.response,
                "question_matched": best.question,
                "category_id":      best.category_id,
            })

        except Exception as e:
            logger.error(f"Erreur chat_v1: {e}")
            return jsonify({"success": False, "error": str(e)}), 500

    # ==========================================================
    #  POST /api/chat/v2 — RAG + Google Gemini (Version IA)
    #
    #  Body  : { "message": "quelles sont les masters ?" }
    #
    #  Réponse JSON :
    #  {
    #    "success": true,
    #    "version": "v2",
    #    "response": "L'ENCG Marrakech propose...",
    #    "context_used": true,
    #    "context_count": 3,
    #    "model": "gemini-1.5-flash"
    #  }
    # ==========================================================
    @app.route("/api/chat/v2", methods=["POST"])
    def chat_v2():
        data    = request.get_json(silent=True) or {}
        message = data.get("message", "").strip()

        if not message:
            return jsonify({"success": False, "error": "Le champ 'message' est requis."}), 400

        api_key = app.config.get("AI_API_KEY", "")
        if not api_key:
            return jsonify({
                "success": False,
                "error":   "Clé API non configurée. Utilisez /api/chat/v1.",
            }), 503

        try:
            # ── ÉTAPE 1 : RAG — Récupération du contexte BDD ──────
            tokens       = [w.lower() for w in message.split() if len(w) > 2]
            context_qas  = []

            if tokens:
                conditions = [
                    or_(
                        QA.question.ilike(f"%{t}%"),
                        QA.response.ilike(f"%{t}%"),
                    )
                    for t in tokens[:5]
                ]
                context_qas = QA.query.filter(or_(*conditions)).limit(5).all()

            # ── ÉTAPE 2 : Construction du prompt enrichi ───────────
            system_prompt = (
                "Tu es NORA, l'assistante virtuelle officielle de l'ENCG Marrakech "
                "(École Nationale de Commerce et de Gestion). "
                "Tu es professionnelle, chaleureuse et tu réponds toujours en français. "
                "Tu aides les étudiants et futurs étudiants. "
                "Si tu ne connais pas la réponse exacte, oriente vers "
                "encg-marrakech.uca.ma ou le +212 524 33 70 26. "
                "Sois concise mais complète."
            )

            if context_qas:
                context_text = "\n\n---\n\n".join(
                    f"Q: {qa.question}\nR: {qa.response}" for qa in context_qas
                )
                full_prompt = (
                    f"{system_prompt}\n\n"
                    f"Informations ENCG Marrakech :\n\n{context_text}\n\n"
                    f"Question : {message}\n\n"
                    f"Réponds clairement en te basant sur le contexte fourni."
                )
            else:
                full_prompt = (
                    f"{system_prompt}\n\n"
                    f"Question : {message}\n\n"
                    f"Réponds de manière générale sur l'ENCG Marrakech."
                )

            # ── ÉTAPE 3 : Appel API Google Gemini ─────────────────
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model    = genai.GenerativeModel(app.config.get("AI_MODEL", "gemini-1.5-flash"))
            response = model.generate_content(
                full_prompt,
                generation_config=genai.GenerationConfig(temperature=0.7, max_output_tokens=1024),
            )

            return jsonify({
                "success":       True,
                "version":       "v2",
                "response":      response.text.strip(),
                "context_used":  len(context_qas) > 0,
                "context_count": len(context_qas),
                "model":         app.config.get("AI_MODEL", "gemini-1.5-flash"),
            })

        except Exception as e:
            logger.error(f"Erreur chat_v2: {e}")
            return jsonify({"success": False, "error": f"Erreur IA : {str(e)}"}), 500

    # ─── Gestionnaires d'erreurs globaux ─────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "error": "Route non trouvée."}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"success": False, "error": "Méthode HTTP non autorisée."}), 405

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"success": False, "error": "Erreur interne du serveur."}), 500

    return app


# ─── Point d'entrée ──────────────────────────────────────────
app = create_app()

if __name__ == "__main__":
    logger.info("🚀 NORA API — Mode développement")
    app.run(host="0.0.0.0", port=5000, debug=True)
