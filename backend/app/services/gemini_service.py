"""
app/services/gemini_service.py — Intégration IA Google Gemini (RAG)
Auteur : Yahya
"""
import logging
from typing import List, Dict, Any
from app.models import QA

logger = logging.getLogger("NORA.GeminiService")


class GeminiService:
    """Service d'orchestration RAG et génération de réponses via Google Gemini."""

    SYSTEM_PROMPT = (
        "Tu es NORA, l'assistante virtuelle officielle de l'ENCG Marrakech "
        "(École Nationale de Commerce et de Gestion). "
        "Tu es professionnelle, bienveillante et tu réponds toujours en français. "
        "Tu aides les étudiants, candidats et visiteurs à trouver des informations fiables. "
        "Si tu ne connais pas la réponse exacte, oriente vers le site officiel "
        "encg-marrakech.uca.ma ou le standard téléphonique (+212 524 33 70 26). "
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

    def build_prompt(self, user_message: str, context_qas: List[QA]) -> str:
        """Construit le prompt final injectant le contexte RAG extrait de PostgreSQL."""
        if context_qas:
            context_text = "\n\n---\n\n".join(
                f"Question : {qa.question}\nRéponse : {qa.response}" for qa in context_qas
            )
            return (
                f"{self.SYSTEM_PROMPT}\n\n"
                f"### INFORMATIONS OFFICIELLES ENCG MARRAKECH (BASE DE CONNAISSANCES) :\n"
                f"{context_text}\n\n"
                f"### QUESTION DE L'UTILISATEUR :\n"
                f"{user_message}\n\n"
                f"### TA RÉPONSE EN TANT QUE NORA :"
            )
        else:
            return (
                f"{self.SYSTEM_PROMPT}\n\n"
                f"### QUESTION DE L'UTILISATEUR :\n"
                f"{user_message}\n\n"
                f"### TA RÉPONSE EN TANT QUE NORA :"
            )

    def generate_response(self, user_message: str, context_qas: List[QA]) -> Dict[str, Any]:
        """Génère la réponse avec Gemini et renvoie les métadonnées RAG."""
        if not self.is_available:
            raise ValueError("Service Gemini non configuré. Veuillez définir AI_API_KEY.")

        import google.generativeai as genai

        prompt = self.build_prompt(user_message, context_qas)

        generation_config = genai.GenerationConfig(
            temperature=0.7,
            max_output_tokens=1024,
        )

        response = self.model.generate_content(
            prompt,
            generation_config=generation_config
        )

        return {
            "response":      response.text.strip(),
            "context_used":  len(context_qas) > 0,
            "context_count": len(context_qas),
            "model":         self.model_name,
        }
