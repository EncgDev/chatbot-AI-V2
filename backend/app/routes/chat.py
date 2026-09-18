"""
app/routes/chat.py — Blueprint du Chatbot NORA (V1 SQL & V2 IA RAG + Mémoire)
Auteur : Yahya

V2 (contrat TASKS.md §2.2) :
- session_id optionnel dans le body de /api/chat/v1 et /api/chat/v2
- Chaque échange (user + nora) est persisté en BDD (chat_messages)
- Historique (6 derniers messages) injecté dans le prompt Gemini
- /api/chat/v2 : fallback AUTOMATIQUE vers la recherche V1 en cas de
  clé absente, quota dépassé, timeout (>12s) ou erreur Gemini — jamais de
  503 exposé à l'utilisateur final.
- GET /api/chat/sessions/<uuid> : historique complet d'une session
"""
import logging
import uuid as uuid_lib

from flask import Blueprint, request, jsonify, current_app

from app.services import SearchService, GeminiService, ConversationService

logger = logging.getLogger("NORA.Chat")
chat_bp = Blueprint("chat", __name__)

# Exceptions Gemini / google-api-core (installées avec google-generativeai)
try:
    from google.api_core import exceptions as gexc
    _QUOTA_EXC = (gexc.ResourceExhausted,)
    _TIMEOUT_EXC = (gexc.DeadlineExceeded,)
except Exception:  # pragma: no cover — sécurité si la lib n'est pas installée
    _QUOTA_EXC = ()
    _TIMEOUT_EXC = ()


def _extract_request():
    """Extrait message + session_id du body JSON (tolérant)."""
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    session_id = data.get("session_id")
    return message, session_id


def _respond_v1(message, session, source="sql", fallback_reason=None):
    """
    Recherche SQL V1 + construction de la réponse au contrat §2.2.
    Réutilisée par /api/chat/v1 ET par le fallback de /api/chat/v2.
    """
    results = SearchService.search_qas(message, limit=3)

    if not results:
        answer = SearchService.get_fallback_message()
        ConversationService.save_message(session, "nora", answer, "v1")
        payload = {
            "success":          True,
            "version":          "v1",
            "source":           source,
            "response":         answer,
            "reply":            answer,
            "question_matched": None,
            "category_id":      None,
            "session_id":       str(session.id),
        }
    else:
        best = results[0]
        ConversationService.save_message(session, "nora", best.response, "v1")
        payload = {
            "success":          True,
            "version":          "v1",
            "source":           source,
            "response":         best.response,
            "reply":            best.response,
            "question_matched": best.question,
            "category_id":      best.category_id,
            "session_id":       str(session.id),
        }

    if fallback_reason:
        payload["fallback_reason"] = fallback_reason

    resp = jsonify(payload)
    if fallback_reason:
        resp.headers["X-Nora-Fallback"] = "true"
    return resp


# ==========================================================
#  POST /api/chat/v1 — Recherche SQL Pure (Version 1 NORA)
# ==========================================================
@chat_bp.route("/api/chat/v1", methods=["POST"])
def chat_v1():
    """
    Body : { "message": "...", "session_id": "uuid ou null" }
    Réponse : contrat §2.1 + champ "session_id".
    """
    message, session_id = _extract_request()
    if not message:
        return jsonify({"success": False, "error": "Le champ 'message' est requis."}), 400

    try:
        session = ConversationService.get_or_create_session(session_id)
        ConversationService.save_message(session, "user", message)
        return _respond_v1(message, session, source="sql")
    except Exception as e:
        logger.error(f"Erreur chat_v1: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# ==========================================================
#  POST /api/chat/v2 — RAG + Gemini avec FALLBACK AUTO V1
# ==========================================================
@chat_bp.route("/api/chat/v2", methods=["POST"])
def chat_v2():
    """
    Body : { "message": "...", "session_id": "uuid ou null" }
    Réponse succès : contrat §2.2 (session_id, sources, ...)
    Réponse fallback : source="v1-fallback" + fallback_reason + X-Nora-Fallback.
    """
    message, session_id = _extract_request()
    if not message:
        return jsonify({"success": False, "error": "Le champ 'message' est requis."}), 400

    try:
        session = ConversationService.get_or_create_session(session_id)
        ConversationService.save_message(session, "user", message)

        api_key = current_app.config.get("AI_API_KEY", "")
        model_name = current_app.config.get("AI_MODEL", "gemini-1.5-flash")
        gemini_svc = GeminiService(api_key=api_key, model_name=model_name)

        # ── Cas 1 : service non configuré → fallback direct ──────────────
        if not gemini_svc.is_available:
            logger.info("Fallback V1 déclenché : no_api_key")
            return _respond_v1(message, session, source="v1-fallback",
                               fallback_reason="no_api_key")

        # ── Cas 2 : tentative Gemini, fallback sur échec ─────────────────
        history = ConversationService.get_history(session.id,
                                                  limit=ConversationService.MAX_HISTORY)
        context_qas = SearchService.search_qas(message, limit=5)

        try:
            result = gemini_svc.generate_response(message, context_qas, history)
        except _QUOTA_EXC as e:
            logger.info(f"Fallback V1 déclenché : quota_exceeded ({e})")
            return _respond_v1(message, session, source="v1-fallback",
                               fallback_reason="quota_exceeded")
        except _TIMEOUT_EXC as e:
            logger.info(f"Fallback V1 déclenché : gemini_timeout ({e})")
            return _respond_v1(message, session, source="v1-fallback",
                               fallback_reason="gemini_timeout")
        except Exception as e:
            logger.info(f"Fallback V1 déclenché : gemini_error ({e})")
            return _respond_v1(message, session, source="v1-fallback",
                               fallback_reason="gemini_error")

        # ── Succès Gemini : persistance + réponse V2 ──────────────────────
        ConversationService.save_message(session, "nora", result["response"], "v2")
        return jsonify({
            "success":       True,
            "version":       "v2",
            "source":        f"gemini/{result['model']}",
            "response":      result["response"],
            "reply":         result["response"],
            "session_id":    str(session.id),
            "context_used":  result["context_used"],
            "context_count": result["context_count"],
            "model":         result["model"],
            "sources": [
                {"id": qa.id, "question": qa.question} for qa in context_qas
            ],
        })

    except Exception as e:
        logger.error(f"Erreur chat_v2: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# ==========================================================
#  GET /api/chat/sessions/<uuid> — Historique d'une session
# ==========================================================
@chat_bp.route("/api/chat/sessions/<uuid:session_id>", methods=["GET"])
def get_session_history(session_id: uuid_lib.UUID):
    """
    Retourne l'historique complet d'une session (ordre chronologique).
    Réponse : contrat §2.2. 404 si la session n'existe pas.
    """
    try:
        messages = ConversationService.get_full_history(session_id)
        if messages is None:
            return jsonify({"success": False, "error": "Session introuvable."}), 404

        return jsonify({
            "success": True,
            "data":    [m.to_dict() for m in messages],
            "total":   len(messages),
        })
    except Exception as e:
        logger.error(f"Erreur get_session_history: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
