"""
app/services/conversation_service.py — Mémoire conversationnelle NORA (V2)
Auteur : Yahya

Gère les sessions de chat et l'historique des messages (contrat TASKS.md §2.2/§Phase A) :
  - get_or_create_session : réutilise une session existante ou en crée une nouvelle
  - save_message          : persiste un message (user ou nora)
  - get_history           : retourne les N derniers messages en ordre chronologique
"""
import logging
import uuid as uuid_lib
from typing import List, Optional

from app.models import db, ChatSession, ChatMessage

logger = logging.getLogger("NORA.ConversationService")


class ConversationService:
    """Service de gestion des sessions et de la mémoire conversationnelle."""

    # Nombre max de messages injectés dans le prompt Gemini (fenêtre glissante)
    MAX_HISTORY = 6

    # Rôles autorisés par la contrainte CHECK SQL
    VALID_ROLES = ("user", "nora")

    @staticmethod
    def get_or_create_session(session_id: Optional[str]) -> ChatSession:
        """
        Retourne la session correspondant à `session_id` si elle existe,
        sinon en crée une nouvelle (robuste aux UUID mal formés ou inconnus).
        """
        if session_id:
            try:
                parsed = uuid_lib.UUID(str(session_id))
            except (ValueError, AttributeError, TypeError):
                logger.warning(f"session_id invalide reçu : {session_id!r} -> nouvelle session.")
            else:
                session = db.session.get(ChatSession, parsed)
                if session is not None:
                    return session
                logger.info(f"Session {parsed} introuvable en BDD -> nouvelle session.")

        session = ChatSession()
        try:
            db.session.add(session)
            db.session.commit()
            return session
        except Exception as e:
            db.session.rollback()
            logger.error(f"Erreur création ChatSession : {e}")
            raise

    @staticmethod
    def save_message(
        session: ChatSession,
        role: str,
        content: str,
        version: Optional[str] = None,
    ) -> ChatMessage:
        """Persiste un message dans la session donnée."""
        if role not in ConversationService.VALID_ROLES:
            raise ValueError(f"Rôle invalide : {role!r} (attendu : 'user' ou 'nora')")

        try:
            msg = ChatMessage(
                session_id=session.id,
                role=role,
                content=content,
                version=version,
            )
            db.session.add(msg)
            # Rafraîchit last_active de la session
            session.last_active = db.func.now()
            db.session.commit()
            return msg
        except Exception as e:
            db.session.rollback()
            logger.error(f"Erreur sauvegarde ChatMessage : {e}")
            raise

    @staticmethod
    def get_history(session_id, limit: int = MAX_HISTORY) -> List[ChatMessage]:
        """
        Retourne les `limit` derniers messages de la session,
        triés chronologiquement (ordre ASC) pour injection dans le prompt.
        """
        try:
            parsed = uuid_lib.UUID(str(session_id))
        except (ValueError, AttributeError, TypeError):
            return []

        messages = (
            ChatMessage.query.filter_by(session_id=parsed)
            .order_by(ChatMessage.created_at.desc(), ChatMessage.id.desc())
            .limit(limit)
            .all()
        )
        messages.reverse()
        return messages

    @staticmethod
    def get_full_history(session_id) -> Optional[List[ChatMessage]]:
        """
        Retourne l'historique COMPLET d'une session (ordre chronologique).
        Renvoie None si la session n'existe pas (pour distinguer 404 vs vide).
        """
        try:
            parsed = uuid_lib.UUID(str(session_id))
        except (ValueError, AttributeError, TypeError):
            return None

        if db.session.get(ChatSession, parsed) is None:
            return None

        return (
            db.session.query(ChatMessage)
            .filter(ChatMessage.session_id == parsed)
            .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
            .all()
        )
