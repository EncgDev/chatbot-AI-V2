"""
app/services/search_service.py — Moteur de recherche textuelle SQL (Version 1 NORA)
Auteur : Yahya

Ce service réalise une recherche 100% SQL dans PostgreSQL :
- Aucun appel à une API externe (zéro IA/Gemini en V1)
- Nettoyage et normalisation des requêtes utilisateur
- Recherche multi-niveaux : phrase exacte, mots-clés pondérés, racines de mots
- Priorité accordée aux correspondances dans la question (poids x3) vs réponse (poids x1)
"""
import re
import unicodedata
from typing import List, Tuple, Optional
from sqlalchemy import or_
from app.models import QA

# Mots vides français à ignorer dans l'extraction des mots-clés
FRENCH_STOP_WORDS = {
    "le", "la", "les", "un", "une", "des", "du", "de", "d", "l",
    "au", "aux", "a", "à", "en", "dans", "par", "pour", "sur", "avec", "sans",
    "sous", "chez", "ce", "cet", "cette", "ces", "mon", "ton", "son",
    "qui", "que", "quoi", "dont", "ou", "où", "et", "mais", "donc", "or", "ni", "car",
    "est", "sont", "suis", "es", "sommes", "etes", "êtes", "avoir", "etre", "être",
    "faire", "comment", "pourquoi", "quand", "quel", "quelle", "quels", "quelles",
    "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles",
    "svp", "bonjour", "salut", "merci", "aide", "nora"
}


def normalize_text(text: str) -> str:
    """Normalise le texte : minuscules, suppression des accents et de la ponctuation."""
    if not text:
        return ""
    # Décomposition Unicode pour enlever les accents
    nfkd = unicodedata.normalize("NFKD", text)
    sans_accents = "".join([c for c in nfkd if not unicodedata.combining(c)])
    # Minuscules et remplacement ponctuation par des espaces
    clean = re.sub(r"[^\w\s]", " ", sans_accents.lower())
    return " ".join(clean.split())


def extract_keywords(text: str) -> List[str]:
    """Extrait les mots-clés significatifs d'une phrase."""
    normalized = normalize_text(text)
    words = normalized.split()
    keywords = [w for w in words if len(w) >= 3 and w not in FRENCH_STOP_WORDS]
    return keywords


class SearchService:
    """Service de recherche SQL pure pour la Version 1."""

    @staticmethod
    def search_qas(query_text: str, limit: int = 5) -> List[QA]:
        """
        Recherche intelligente dans PostgreSQL basée sur les correspondances SQL.
        Retourne les QAs classées par pertinence décroissante.
        """
        if not query_text or not query_text.strip():
            return []

        raw_query = query_text.strip()
        clean_query = normalize_text(raw_query)
        keywords = extract_keywords(raw_query)

        candidates: dict[int, Tuple[QA, int]] = {}

        # ─── NIVEAU 1 : Correspondance exacte de la phrase entière ───
        if len(clean_query) >= 3:
            exact_matches = QA.query.filter(
                or_(
                    QA.question.ilike(f"%{raw_query}%"),
                    QA.response.ilike(f"%{raw_query}%"),
                )
            ).all()

            for qa in exact_matches:
                score = 50  # Forte priorité
                if raw_query.lower() in qa.question.lower():
                    score += 50
                candidates[qa.id] = (qa, candidates.get(qa.id, (qa, 0))[1] + score)

        # ─── NIVEAU 2 : Correspondance pondérée par mots-clés ───────
        if keywords:
            # Construire la requête avec au maximum 6 mots-clés principaux
            selected_keywords = keywords[:6]
            conditions = []
            for kw in selected_keywords:
                pattern = f"%{kw}%"
                conditions.append(or_(
                    QA.question.ilike(pattern),
                    QA.response.ilike(pattern),
                ))

            # Exécution de la requête SQL PostgreSQL
            keyword_matches = QA.query.filter(or_(*conditions)).all()

            for qa in keyword_matches:
                q_lower = normalize_text(qa.question)
                r_lower = normalize_text(qa.response)
                score = 0

                for kw in selected_keywords:
                    # Mot dans la question = 15 points
                    if kw in q_lower:
                        score += 15
                    # Mot dans la réponse = 5 points
                    if kw in r_lower:
                        score += 5

                if score > 0:
                    current_score = candidates.get(qa.id, (qa, 0))[1]
                    candidates[qa.id] = (qa, current_score + score)

        # ─── NIVEAU 3 : Tri des résultats par score ──────────────────
        if not candidates:
            return []

        sorted_results = sorted(candidates.values(), key=lambda item: item[1], reverse=True)
        return [item[0] for item in sorted_results[:limit]]

    @staticmethod
    def get_fallback_message() -> str:
        """Message officiel lorsque la recherche SQL ne trouve aucun résultat."""
        return (
            "Je suis désolée, je n'ai pas trouvé de réponse exacte à votre question dans la base de données de l'ENCG.\n\n"
            "Vous pouvez contacter directement l'ENCG Marrakech :\n"
            "📞 Téléphone : +212 524 33 70 26\n"
            "📧 Email : contact@encg-marrakech.uca.ma\n"
            "🌐 Site web : http://www.encg-marrakech.uca.ma\n"
            "📍 Adresse : Avenue Allal El Fassi, B.P. 3720 Amerchich, Marrakech"
        )
