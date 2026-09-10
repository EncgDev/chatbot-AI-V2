"""
app/routes/chat.py — Blueprint du Chatbot NORA (V1 SQL & V2 IA RAG)
Auteur : Yahya
"""
import logging
from flask import Blueprint, request, jsonify, current_app
from app.services import SearchService, GeminiService

logger = logging.getLogger("NORA.Chat")
chat_bp = Blueprint("chat", __name__)


# ==========================================================
#  POST /api/chat/v1 — Recherche SQL Pure (Version 1 NORA)
# ==========================================================
@chat_bp.route("/api/chat/v1", methods=["POST"])
def chat_v1():
    """
    Endpoint principal Version 1 : 100% requêtes SQL dans la base PostgreSQL.
    Aucune API externe requise.

    Body JSON attendu (envoyé par le Frontend de Youssef) :
      { "message": "texte de la question" }

    Réponse JSON normalisée :
      {
        "success": true,
        "version": "v1",
        "source": "sql",
        "response": "...",
        "reply": "...",
        "question_matched": "...",
        "category_id": 1
      }
    """
    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()

    if not message:
        return jsonify({
            "success": False,
            "error": "Le champ 'message' est requis."
        }), 400

    try:
        # Exécution de la recherche SQL intelligente
        results = SearchService.search_qas(message, limit=3)

        if not results:
            fallback = SearchService.get_fallback_message()
            return jsonify({
                "success":          True,
                "version":          "v1",
                "source":           "sql",
                "response":         fallback,
                "reply":            fallback,
                "question_matched": None,
                "category_id":      None,
            })

        best = results[0]
        return jsonify({
            "success":          True,
            "version":          "v1",
            "source":           "sql",
            "response":         best.response,
            "reply":            best.response,
            "question_matched": best.question,
            "category_id":      best.category_id,
        })

    except Exception as e:
        logger.error(f"Erreur chat_v1: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# ==========================================================
#  POST /api/chat/v2 — RAG + Google Gemini (Version 2 IA)
#  (Réservé pour après validation de la V1)
# ==========================================================
@chat_bp.route("/api/chat/v2", methods=["POST"])
def chat_v2():
    """
    Endpoint Version 2 : RAG avec contexte PostgreSQL + Google Gemini.
    Activé uniquement si une clé AI_API_KEY est fournie.
    """
    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()

    if not message:
        return jsonify({"success": False, "error": "Le champ 'message' est requis."}), 400

    api_key = current_app.config.get("AI_API_KEY", "")
    model_name = current_app.config.get("AI_MODEL", "gemini-1.5-flash")

    gemini_svc = GeminiService(api_key=api_key, model_name=model_name)

    if not gemini_svc.is_available:
        return jsonify({
            "success": False,
            "error":   "Version 2 désactivée : Clé Google Gemini non configurée. Utilisez /api/chat/v1 (Mode SQL).",
        }), 503

    try:
        context_qas = SearchService.search_qas(message, limit=5)
        result = gemini_svc.generate_response(message, context_qas)

        return jsonify({
            "success":       True,
            "version":       "v2",
            "source":        f"gemini/{result['model']}",
            "response":      result["response"],
            "reply":         result["response"],
            "context_used":  result["context_used"],
            "context_count": result["context_count"],
            "model":         result["model"],
        })

    except Exception as e:
        logger.error(f"Erreur chat_v2: {e}")
        return jsonify({"success": False, "error": f"Erreur IA : {str(e)}"}), 500
