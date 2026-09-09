"""
app.py — API REST Flask pour NORA (Chatbot ENCG Marrakech)
Auteur : Yahya

Endpoints :
  GET  /api/health              — Healthcheck
  GET  /api/categories          — Liste des catégories
  GET  /api/faqs?category_id=N  — FAQs d'une catégorie
  POST /api/chat/v1             — Chat par recherche SQL (mots-clés LIKE)
  POST /api/chat/v2             — Chat IA avec RAG + Google Gemini
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import text, or_

from config import config_map
from models import db, Category, FAQ

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
            logger.error(f"❌ Erreur de connexion BDD : {e}")

    # ==========================================================
    #  ROUTE : Healthcheck
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
    #  ROUTE : GET /api/categories
    # ==========================================================
    @app.route("/api/categories", methods=["GET"])
    def get_categories():
        """Renvoie la liste de toutes les thématiques."""
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
    #  ROUTE : GET /api/faqs?category_id=<id>
    # ==========================================================
    @app.route("/api/faqs", methods=["GET"])
    def get_faqs():
        """Renvoie les FAQs d'une catégorie (ou toutes si pas de filtre)."""
        try:
            category_id = request.args.get("category_id", type=int)
            query = FAQ.query
            if category_id:
                query = query.filter_by(category_id=category_id)

            faqs = query.order_by(FAQ.id).all()
            return jsonify({
                "success": True,
                "data":    [f.to_dict(include_category=True) for f in faqs],
                "total":   len(faqs),
            })
        except Exception as e:
            logger.error(f"Erreur get_faqs: {e}")
            return jsonify({"success": False, "error": str(e)}), 500

    # ==========================================================
    #  ROUTE : POST /api/chat/v1  — Recherche SQL LIKE
    # ==========================================================
    @app.route("/api/chat/v1", methods=["POST"])
    def chat_v1():
        """
        Version 1 — Recherche par mots-clés (SQL LIKE).
        Body JSON : {"message": "..."}

        Algorithme :
          1. Tokenise le message en mots-clés (longueur > 2)
          2. Recherche LIKE sur question, reponse et keywords
          3. Retourne la meilleure correspondance
        """
        data    = request.get_json(silent=True) or {}
        message = data.get("message", "").strip()

        if not message:
            return jsonify({"success": False, "error": "Le champ 'message' est requis."}), 400

        try:
            # Tokenisation
            tokens = [w.lower() for w in message.split() if len(w) > 2]

            if not tokens:
                return jsonify({
                    "success":  True,
                    "version":  "v1",
                    "response": "Je n'ai pas compris votre question. Pouvez-vous reformuler ?",
                    "source":   "default",
                    "faqs":     [],
                })

            # Construction des conditions LIKE (max 5 tokens)
            conditions = []
            for token in tokens[:5]:
                pat = f"%{token}%"
                conditions.append(or_(
                    FAQ.question.ilike(pat),
                    FAQ.reponse.ilike(pat),
                    FAQ.keywords.ilike(pat),
                ))

            results = FAQ.query.filter(or_(*conditions)).limit(3).all()

            if not results:
                return jsonify({
                    "success":  True,
                    "version":  "v1",
                    "response": (
                        "Je suis désolée, je n'ai pas trouvé de réponse à votre question.\n"
                        "Contactez l'administration de l'ENCG Marrakech :\n"
                        "📞 +212 (0)5 24 33 85 12\n"
                        "📧 contact@encg-marrakech.ac.ma"
                    ),
                    "source":   "default",
                    "faqs":     [],
                })

            # Incrémenter les vues de la meilleure réponse
            best       = results[0]
            best.views += 1
            db.session.commit()

            return jsonify({
                "success":          True,
                "version":          "v1",
                "response":         best.reponse,
                "question_matched": best.question,
                "category_id":      best.category_id,
                "faqs":             [f.to_dict() for f in results],
            })

        except Exception as e:
            logger.error(f"Erreur chat_v1: {e}")
            return jsonify({"success": False, "error": str(e)}), 500

    # ==========================================================
    #  ROUTE : POST /api/chat/v2  — RAG + Google Gemini
    # ==========================================================
    @app.route("/api/chat/v2", methods=["POST"])
    def chat_v2():
        """
        Version 2 — RAG (Retrieval-Augmented Generation) + Gemini.
        Body JSON : {"message": "..."}

        Algorithme :
          1. Recherche du contexte pertinent dans la BDD (RAG)
          2. Construction d'un prompt enrichi avec le contexte
          3. Appel à l'API Google Gemini
          4. Retour de la réponse générée
        """
        data    = request.get_json(silent=True) or {}
        message = data.get("message", "").strip()

        if not message:
            return jsonify({"success": False, "error": "Le champ 'message' est requis."}), 400

        api_key = app.config.get("AI_API_KEY", "")
        if not api_key:
            return jsonify({
                "success": False,
                "error":   "Clé API non configurée. Utilisez /api/chat/v1 à la place.",
            }), 503

        try:
            # ── ÉTAPE 1 : RAG — Récupération du contexte ──────────
            tokens       = [w.lower() for w in message.split() if len(w) > 2]
            context_faqs = []

            if tokens:
                conditions = [
                    or_(
                        FAQ.question.ilike(f"%{t}%"),
                        FAQ.reponse.ilike(f"%{t}%"),
                        FAQ.keywords.ilike(f"%{t}%"),
                    )
                    for t in tokens[:5]
                ]
                context_faqs = FAQ.query.filter(or_(*conditions)).limit(5).all()

            # ── ÉTAPE 2 : Construction du prompt ──────────────────
            system_prompt = (
                "Tu es NORA, l'assistante virtuelle officielle de l'ENCG Marrakech "
                "(École Nationale de Commerce et de Gestion). "
                "Tu es professionnelle, chaleureuse et tu réponds toujours en français. "
                "Tu aides les étudiants et futurs étudiants avec leurs questions sur l'école. "
                "Si tu ne connais pas la réponse exacte, oriente vers le site officiel "
                "www.encg-marrakech.ac.ma ou le secrétariat. "
                "Sois concise mais complète."
            )

            if context_faqs:
                context_parts = [
                    f"Q: {faq.question}\nR: {faq.reponse}"
                    for faq in context_faqs
                ]
                context_text = "\n\n---\n\n".join(context_parts)
                full_prompt  = (
                    f"{system_prompt}\n\n"
                    f"Informations de référence ENCG Marrakech :\n\n{context_text}\n\n"
                    f"Question : {message}\n\n"
                    f"Réponds de manière claire basée sur le contexte fourni."
                )
            else:
                full_prompt = (
                    f"{system_prompt}\n\n"
                    f"Question : {message}\n\n"
                    f"Réponds de manière générale sur l'ENCG Marrakech."
                )

            # ── ÉTAPE 3 : Appel Google Gemini ─────────────────────
            import google.generativeai as genai

            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(
                app.config.get("AI_MODEL", "gemini-1.5-flash")
            )
            response    = model.generate_content(
                full_prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=1024,
                ),
            )
            ai_response = response.text.strip()

            return jsonify({
                "success":       True,
                "version":       "v2",
                "response":      ai_response,
                "context_used":  len(context_faqs) > 0,
                "context_count": len(context_faqs),
                "model":         app.config.get("AI_MODEL", "gemini-1.5-flash"),
            })

        except Exception as e:
            logger.error(f"Erreur chat_v2: {e}")
            return jsonify({
                "success": False,
                "error":   f"Erreur IA : {str(e)}. Essayez /api/chat/v1.",
            }), 500

    # ─── Gestionnaires d'erreurs ──────────────────────────────
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
