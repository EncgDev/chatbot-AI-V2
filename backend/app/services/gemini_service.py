"""
app/services/gemini_service.py — Intégration IA Google Gemini (RAG + Mémoire)
Auteur : Yahya

V2 :
- Injection de l'historique conversationnel (relances : « et ses conditions ? »)
- Prompt anti-hallucination renforcé (contrat TASKS.md Phase A)
- Timeout réseau explicite sur l'appel Gemini (fallback V1 en cas de lenteur)
"""
import logging
from typing import List, Dict, Any, Optional
from app.models import QA, ChatMessage

logger = logging.getLogger("NORA.GeminiService")

# Timeout réseau (secondes) appliqué à l'appel Gemini — au-delà : fallback V1
GEMINI_TIMEOUT_S = 12


class GeminiService:
    """Service d'orchestration RAG et génération de réponses via Google Gemini."""

    SYSTEM_PROMPT = (
        "Tu es NORA, l'assistante virtuelle officielle de l'ENCG Marrakech "
        "(École Nationale de Commerce et de Gestion). "
        "Tu es professionnelle, bienveillante et tu réponds toujours en français. "
        "Tu aides les étudiants, candidats et visiteurs à trouver des informations fiables. "
        "Appuie-toi sur l'historique de la conversation pour comprendre les relances : "
        "reformule mentalement les pronoms (ex : « ses », « il », « elle ») vers le vrai sujet "
        "évoqué précédemment avant de répondre. "
        "Réponds uniquement à partir du contexte de la base de connaissances fournie ci-dessous. "
        "Si le contexte ne contient pas la réponse, dis-le simplement et oriente vers le site "
        "officiel encg-marrakech.uca.ma ou le standard téléphonique (+212 524 33 70 26). "
        "Reste concise, polie et directe."
    )

    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model_name = model_name
        self._configured = False

        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(self.model_name)
                self._configured = True
            except Exception as e:
                logger.error(f"Erreur configuration Gemini : {e}")

    @property
    def is_available(self) -> bool:
        """Vérifie si le service Gemini est opérationnel."""
        return bool(self.api_key and self._configured)

    @staticmethod
    def _format_history(history: List[ChatMessage]) -> str:
        """Formate l'historique conversationnel pour le prompt (ordre chronologique)."""
        lines = []
        for msg in history:
            speaker = "Utilisateur" if msg.role == "user" else "NORA"
            lines.append(f"{speaker} : {msg.content}")
        return "\n".join(lines)

    def build_prompt(
        self,
        user_message: str,
        context_qas: List[QA],
        history: Optional[List[ChatMessage]] = None,
    ) -> str:
        """
        Construit le prompt final :
        1. System prompt (persona + anti-hallucination + gestion des relances)
        2. Historique conversationnel (mémoire V2)
        3. Contexte RAG extrait de PostgreSQL
        4. Question actuelle
        """
        parts = [self.SYSTEM_PROMPT]

        if history:
            parts.append(
                "### HISTORIQUE DE LA CONVERSATION :\n"
                f"{self._format_history(history)}"
            )

        if context_qas:
            context_text = "\n\n---\n\n".join(
                f"Question : {qa.question}\nRéponse : {qa.response}" for qa in context_qas
            )
            parts.append(
                "### INFORMATIONS OFFICIELLES ENCG MARRAKECH (BASE DE CONNAISSANCES) :\n"
                f"{context_text}"
            )

        parts.append(
            f"### QUESTION DE L'UTILISATEUR :\n"
            f"{user_message}\n\n"
            f"### TA RÉPONSE EN TANT QUE NORA :"
        )
        return "\n\n".join(parts)

    def generate_response(
        self,
        user_message: str,
        context_qas: List[QA],
        history: Optional[List[ChatMessage]] = None,
    ) -> Dict[str, Any]:
        """Génère la réponse avec Gemini (timeout réseau 12s) et renvoie les métadonnées RAG."""
        if not self.is_available:
            raise ValueError("Service Gemini non configuré. Veuillez définir AI_API_KEY.")

        import google.generativeai as genai

        prompt = self.build_prompt(user_message, context_qas, history)

        generation_config = genai.GenerationConfig(
            temperature=0.7,
            max_output_tokens=1024,
        )

        response = self.model.generate_content(
            prompt,
            generation_config=generation_config,
            request_options={"timeout": GEMINI_TIMEOUT_S},
        )

        return {
            "response":      response.text.strip(),
            "context_used":  len(context_qas) > 0,
            "context_count": len(context_qas),
            "model":         self.model_name,
        }
