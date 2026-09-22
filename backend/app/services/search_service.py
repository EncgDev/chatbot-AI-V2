"""
app/services/search_service.py â€” Moteur de recherche textuelle SQL intelligent (V1 NORA)
Auteur : Yahya

Ce service rÃ©alise une recherche 100% locale dans PostgreSQL (0 API externe) :
- TolÃ©rance universelle aux accents franÃ§ais
- Dictionnaire sÃ©mantique de synonymes adaptÃ© Ã  l'ENCG Marrakech
- Racinisation (stemming) pour conjugaisons, fÃ©minins et pluriels
- Scoring contextuel diffÃ©renciant le Sujet (ex: Finance) de l'Intention (ex: DÃ©bouchÃ©s)
"""
import json
import logging
import math
import re
import unicodedata
from pathlib import Path
from typing import List, Tuple, Optional, Dict, Set
from sqlalchemy import or_
from app.models import QA

logger = logging.getLogger("NORA.SearchService")

# â”€â”€â”€ ParamÃ¨tres de la recherche sÃ©mantique (Phase C â€” Option A : API Gemini) â”€â”€
EMBEDDING_MODEL    = "models/gemini-embedding-001"
EMBEDDING_TIMEOUT_S = 8
SEMANTIC_THRESHOLD = 0.55        # Score cosinus minimal pour retenir une QA
EMBEDDINGS_FILE    = Path(__file__).resolve().parents[2] / "data" / "embeddings.json"

# Cache en mÃ©moire du fichier embeddings.json (chargÃ© une seule fois)
_EMBEDDINGS_CACHE: Optional[Dict[int, List[float]]] = None


def cosine_sim(a: List[float], b: List[float]) -> float:
    """SimilaritÃ© cosinus entre deux vecteurs (robuste aux vecteurs non normalisÃ©s)."""
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0.0 or nb == 0.0:
        return 0.0
    return dot / (na * nb)


def load_embeddings_cache() -> Optional[Dict[int, List[float]]]:
    """
    Charge data/embeddings.json (gÃ©nÃ©rÃ© par scripts/embed_qas.py) en mÃ©moire.
    Renvoie None si le fichier est absent ou invalide â€” le repli SQL s'applique.
    """
    global _EMBEDDINGS_CACHE
    if _EMBEDDINGS_CACHE is not None:
        return _EMBEDDINGS_CACHE

    if not EMBEDDINGS_FILE.exists():
        logger.info(f"Cache embeddings absent ({EMBEDDINGS_FILE.name}) â€” mode sÃ©mantique inactif.")
        return None
    try:
        with open(EMBEDDINGS_FILE, "r", encoding="utf-8") as f:
            raw = json.load(f)
        _EMBEDDINGS_CACHE = {int(k): v for k, v in raw.items()}
        logger.info(f"âœ… {len(_EMBEDDINGS_CACHE)} embeddings chargÃ©s en mÃ©moire.")
        return _EMBEDDINGS_CACHE
    except Exception as e:
        logger.error(f"Erreur lecture embeddings cache : {e}")
        return None

# â”€â”€â”€ 1. Mots vides franÃ§ais Ã  ignorer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
FRENCH_STOP_WORDS = {
    "le", "la", "les", "un", "une", "des", "du", "de", "d", "l",
    "au", "aux", "a", "Ã ", "en", "dans", "par", "pour", "sur", "avec", "sans",
    "sous", "chez", "ce", "cet", "cette", "ces", "mon", "ton", "son",
    "qui", "que", "quoi", "dont", "ou", "oÃ¹", "et", "mais", "donc", "or", "ni", "car",
    "est", "sont", "suis", "es", "sommes", "etes", "Ãªtes", "avoir", "etre", "Ãªtre",
    "faire", "comment", "pourquoi", "quand", "quel", "quelle", "quels", "quelles",
    "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles",
    "svp", "bonjour", "salut", "merci", "aide", "nora", "si", "apres", "aprÃ¨s"
}

# â”€â”€â”€ 2. Dictionnaire sÃ©mantique ENCG Marrakech â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INTENT_SYNONYMS: Dict[str, List[str]] = {
    "debouches": [
        "debouche", "debouches", "metier", "metiers", "travail", "travaille", "travailler",
        "carriere", "carrieres", "poste", "postes", "emploi", "emplois", "futur", "embauche",
        "devenir", "profession", "professions", "opportunite", "opportunites", "boulot"
    ],
    "conditions_acces": [
        "acces", "condition", "conditions", "entrer", "integrer", "admission",
        "admissions", "inscription", "inscriptions", "inscrire", "concours",
        "tafem", "postuler", "candidater", "selection", "seuil", "bac", "prepa"
    ],
    "competences": [
        "competence", "competences", "apprendre", "matiere", "matieres",
        "programme", "programmes", "module", "modules", "enseigne",
        "acquerir", "savoir", "formation"
    ],
    "langue": [
        "langue", "langues", "francais", "anglais", "arabe", "enseignement",
        "parle", "dispense", "bilingue"
    ],
    "presentation": [
        "definition", "presentation", "presenter", "info", "informations",
        "expliquer", "quest ce que", "cest quoi", "parle moi"
    ],
    "profil": [
        "profil", "pour qui", "correspond", "chiffres", "personnalite",
        "adapte", "interet", "interets"
    ],
    "pourquoi_choisir": [
        "pourquoi", "choisir", "choix", "avantage", "avantages", "raison",
        "raisons", "hesite"
    ],
    "frais": [
        "frais", "prix", "cout", "coÃ»t", "payer", "combien", "gratuit",
        "bourse", "scolarite", "tarif", "tarifs"
    ],
    "horaires": [
        "horaire", "horaires", "temps", "calendrier", "date", "dates",
        "vacances", "rentree", "semestre"
    ],
    "contact": [
        "contact", "telephone", "numero", "email", "mail", "adresse",
        "ou", "situer", "localisation", "trouver", "plan"
    ]
}

SUBJECT_SYNONYMS: Dict[str, List[str]] = {
    "finance": ["finance", "financier", "financiere", "banque", "fintech", "bourse"],
    "audit": ["audit", "controle", "cac", "conseil", "comptabilite", "comptable"],
    "marketing_action": ["marketing", "vente", "commercial", "commerciale", "mac"],
    "marketing_digital": ["digital", "web", "social", "crm", "ia", "influence", "big data"],
    "commerce_international": ["international", "multiculturel", "export", "echange"],
    "prepa": ["preparatoire", "preparatoires", "prepa", "tronc commun"],
    "encg": ["encg", "encgm", "ecole", "universite", "cadi ayyad", "uca", "valeurs"]
}


def normalize_text(text: str) -> str:
    """Normalise une chaÃ®ne : minuscules, suppression des accents et de la ponctuation."""
    if not text:
        return ""
    nfkd = unicodedata.normalize("NFKD", text)
    sans_accents = "".join([c for c in nfkd if not unicodedata.combining(c)])
    clean = re.sub(r"[^\w\s]", " ", sans_accents.lower())
    return " ".join(clean.split())


def get_stem(word: str) -> str:
    """Extrait la racine (stem) d'un mot de plus de 4 lettres pour tolÃ©rer les flexions."""
    w = normalize_text(word)
    if len(w) <= 4:
        return w
    # Troncature des terminaisons courantes franÃ§aises
    suffixes = ("tion", "tions", "ique", "iques", "iers", "iÃ¨re", "ier",
                "able", "ables", "eux", "euse", "ment", "ent", "ant",
                "er", "ir", "es", "s", "e")
    for s in suffixes:
        if w.endswith(s) and len(w) - len(s) >= 4:
            return w[:-len(s)]
    return w


def extract_keywords(text: str) -> List[str]:
    """Extrait les mots significatifs normalisÃ©s."""
    normalized = normalize_text(text)
    words = normalized.split()
    return [w for w in words if len(w) >= 3 and w not in FRENCH_STOP_WORDS]


def detect_intents(keywords: List[str], raw_text: str) -> Set[str]:
    """DÃ©tecte les intentions de la question de l'utilisateur."""
    intents = set()
    norm_text = normalize_text(raw_text)
    words_set = set(norm_text.split())

    # DÃ©tection par expressions clÃ©s multi-mots
    if "quest ce que" in norm_text or "cest quoi" in norm_text or "c est quoi" in norm_text:
        intents.add("presentation")

    for kw in keywords:
        stem = get_stem(kw)
        for intent_name, synonym_list in INTENT_SYNONYMS.items():
            for syn in synonym_list:
                syn_norm = normalize_text(syn)
                # Si le synonyme est multi-mots (ex: "quest ce que")
                if " " in syn_norm:
                    if syn_norm in norm_text:
                        intents.add(intent_name)
                else:
                    # Mot unique : vÃ©rification exacte sur mot ou racine
                    if syn_norm in words_set or stem == get_stem(syn_norm):
                        intents.add(intent_name)
    return intents


def detect_subjects(keywords: List[str], raw_text: str) -> Set[str]:
    """DÃ©tecte les sujets / spÃ©cialitÃ©s mentionnÃ©s dans la question."""
    subjects = set()
    norm_text = normalize_text(raw_text)
    words_set = set(norm_text.split())

    for kw in keywords:
        stem = get_stem(kw)
        for subj_name, synonym_list in SUBJECT_SYNONYMS.items():
            for syn in synonym_list:
                syn_norm = normalize_text(syn)
                if " " in syn_norm:
                    if syn_norm in norm_text:
                        subjects.add(subj_name)
                else:
                    if syn_norm in words_set or stem == get_stem(syn_norm):
                        subjects.add(subj_name)
    return subjects


class SearchService:
    """Moteur de recherche SQL tolÃ©rant aux reformulations pour la Version 1."""

    @staticmethod
    def search_qas(query_text: str, limit: int = 5) -> List[QA]:
        """
        Recherche multicritÃ¨re dans PostgreSQL :
        1. RÃ©cupÃ©ration des candidats par SQL (combinaison de mots & racines)
        2. Ã‰valuation et classement prÃ©cis par Intentions + Sujets + SimilaritÃ©
        """
        if not query_text or not query_text.strip():
            return []

        raw_query = query_text.strip()
        clean_query = normalize_text(raw_query)
        keywords = extract_keywords(raw_query)

        if not keywords:
            if len(clean_query) < 2:
                return []
            keywords = [clean_query]  # Utiliser le mot brut si aucun keyword extrait

        # DÃ©tection sÃ©mantique
        user_intents = detect_intents(keywords, raw_query)
        user_subjects = detect_subjects(keywords, raw_query)

        # â”€â”€â”€ Ã‰TAPE 1 : RequÃªte SQL PostgreSQL pour extraire les candidats â”€â”€â”€
        # On construit un ensemble de motifs de recherche SQL pour maximiser le rappel
        search_terms: Set[str] = set(keywords[:6])
        for kw in keywords[:4]:
            stem = get_stem(kw)
            if len(stem) >= 3:
                search_terms.add(stem)

        # Ajouter les mots clÃ©s des sujets dÃ©tectÃ©s pour ne rien rater
        for subj in user_subjects:
            for syn in SUBJECT_SYNONYMS.get(subj, [])[:3]:
                search_terms.add(syn)

        conditions = []
        for term in search_terms:
            pattern = f"%{term}%"
            conditions.append(QA.question.ilike(pattern))
            conditions.append(QA.response.ilike(pattern))

        # RÃ©cupÃ©ration de tous les candidats potentiels en BDD
        if conditions:
            candidates = QA.query.filter(or_(*conditions)).all()
        else:
            candidates = QA.query.all()

        if not candidates:
            # Recherche de repli globale si les filtres spÃ©cifiques n'ont rien donnÃ©
            candidates = QA.query.limit(50).all()

        # â”€â”€â”€ Ã‰TAPE 2 : Scoring prÃ©cis de chaque candidat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        scored_candidates: List[Tuple[QA, float]] = []

        for qa in candidates:
            q_norm = normalize_text(qa.question)
            r_norm = normalize_text(qa.response)
            score: float = 0.0

            # A. Correspondance exacte de la phrase entiÃ¨re
            if clean_query in q_norm:
                score += 90.0
            elif clean_query in r_norm:
                score += 35.0

            # B. Score d'AdÃ©quation de l'Intention (TRÃˆS DISCRIMINANT : +45 pts)
            qa_intents = detect_intents(extract_keywords(qa.question), qa.question)
            common_intents = user_intents.intersection(qa_intents)
            if common_intents:
                score += 45.0 * len(common_intents)
            else:
                qa_r_intents = detect_intents(extract_keywords(qa.response), qa.response)
                common_r_intents = user_intents.intersection(qa_r_intents)
                if common_r_intents:
                    score += 20.0 * len(common_r_intents)

            # C. Score d'AdÃ©quation du Sujet (ex: Finance, Audit, ENCG : +35 pts)
            qa_subjects = detect_subjects(extract_keywords(qa.question), qa.question)
            common_subjects = user_subjects.intersection(qa_subjects)
            if common_subjects:
                score += 35.0 * len(common_subjects)
            else:
                # VÃ©rifier si le sujet est prÃ©sent au moins dans la rÃ©ponse
                qa_r_subjects = detect_subjects(extract_keywords(qa.response), qa.response)
                common_r_subjects = user_subjects.intersection(qa_r_subjects)
                if common_r_subjects:
                    score += 15.0 * len(common_r_subjects)

            # D. Recouvrement des mots-clÃ©s et des racines
            q_words = q_norm.split()
            r_words = r_norm.split()
            q_stems = [get_stem(w) for w in q_words]
            r_stems = [get_stem(w) for w in r_words]

            for kw in keywords:
                kw_stem = get_stem(kw)
                # PrÃ©sence exacte dans le titre de la question
                if kw in q_words or kw in q_norm:
                    score += 15.0
                elif kw_stem in q_stems:
                    score += 10.0

                # PrÃ©sence dans le corps de la rÃ©ponse
                if kw in r_words or kw in r_norm:
                    score += 5.0
                elif kw_stem in r_stems:
                    score += 3.0

            # E. Bonus de proximitÃ© Jaccard sur les mots du titre
            user_word_set = set(keywords)
            qa_word_set = set(extract_keywords(qa.question))
            if user_word_set and qa_word_set:
                overlap = len(user_word_set.intersection(qa_word_set))
                jaccard = overlap / float(len(user_word_set.union(qa_word_set)))
                score += jaccard * 25.0

            # Ne retenir que les candidats ayant un score significatif
            if score >= 8.0:
                scored_candidates.append((qa, score))

        if not scored_candidates:
            return []

        # â”€â”€â”€ Ã‰TAPE 3 : Tri par score dÃ©croissant â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        scored_candidates.sort(key=lambda item: item[1], reverse=True)
        return [item[0] for item in scored_candidates[:limit]]

    @staticmethod
    def search_qas_semantic(query_text: str, limit: int = 5) -> Optional[List[QA]]:
        """
        Recherche sÃ©mantique par embeddings Gemini (Phase C â€” Option A).

        - Vectorise la requÃªte via l'API Gemini Embeddings
        - Classe les QAs par similaritÃ© cosinus (seuil SEMANTIC_THRESHOLD)
        - Retourne None en cas d'indisponibilitÃ© (cache absent, clÃ© invalide,
          quota dÃ©passÃ©, timeout) â†’ l'appelant replie sur search_qas() (SQL).
        - Retourne une liste Ã©ventuellement vide si tout va bien mais qu'aucune
          QA ne dÃ©passe le seuil.
        """
        if not query_text or not query_text.strip():
            return []

        cache = load_embeddings_cache()
        if not cache:
            return None  # Pas de cache â†’ repli SQL

        try:
            import google.generativeai as genai
            from flask import current_app

            api_key = current_app.config.get("AI_API_KEY", "")
            if not api_key:
                return None

            genai.configure(api_key=api_key)
            result = genai.embed_content(
                model=EMBEDDING_MODEL,
                content=query_text.strip(),
                task_type="retrieval_query",
                request_options={"timeout": EMBEDDING_TIMEOUT_S},
            )
            query_vec = result["embedding"]
        except Exception as e:
            logger.info(f"Embedding requÃªte indisponible ({e}) â€” repli recherche SQL.")
            return None

        scored: List[Tuple[int, float]] = []
        for qa_id, vec in cache.items():
            score = cosine_sim(query_vec, vec)
            if score >= SEMANTIC_THRESHOLD:
                scored.append((qa_id, score))

        scored.sort(key=lambda item: item[1], reverse=True)
        top_ids = [qa_id for qa_id, _ in scored[:limit]]
        if not top_ids:
            logger.info("Recherche sÃ©mantique : aucune QA au-dessus du seuil.")
            return []

        # PrÃ©serve l'ordre de pertinence (order by FIELD Ã©quivalent, en Python)
        qas_by_id = {qa.id: qa for qa in QA.query.filter(QA.id.in_(top_ids)).all()}
        ordered = [qas_by_id[i] for i in top_ids if i in qas_by_id]

        logger.info(
            f"Recherche sÃ©mantique : {len(ordered)} QAs "
            f"(meilleur score={scored[0][1]:.3f}, seuil={SEMANTIC_THRESHOLD})"
        )
        return ordered

    @staticmethod
    def get_fallback_message() -> str:
        """Message officiel lorsque la recherche SQL ne trouve aucun rÃ©sultat."""
        return (
            "Je suis dÃ©solÃ©e, je n'ai pas trouvÃ© de rÃ©ponse exacte Ã  votre question dans la base de donnÃ©es de l'ENCG.\n\n"
            "Vous pouvez contacter directement l'ENCG Marrakech :\n"
            "ðŸ“ž TÃ©lÃ©phone : +212 5 24 30 46\n"
            "ðŸ“§ Email : encg@uca.ac.ma\n"
            "ðŸŒ Site web : https://www.uca.ma/encg/fr\n"
            "ðŸ“ Adresse : Avenue Allal El Fassi, B.P. 3720 Amerchich, Marrakech"
        )

