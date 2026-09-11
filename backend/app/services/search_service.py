"""
app/services/search_service.py — Moteur de recherche textuelle SQL intelligent (V1 NORA)
Auteur : Yahya

Ce service réalise une recherche 100% locale dans PostgreSQL (0 API externe) :
- Tolérance universelle aux accents français
- Dictionnaire sémantique de synonymes adapté à l'ENCG Marrakech
- Racinisation (stemming) pour conjugaisons, féminins et pluriels
- Scoring contextuel différenciant le Sujet (ex: Finance) de l'Intention (ex: Débouchés)
"""
import re
import unicodedata
from typing import List, Tuple, Optional, Dict, Set
from sqlalchemy import or_
from app.models import QA

# ─── 1. Mots vides français à ignorer ─────────────────────────
FRENCH_STOP_WORDS = {
    "le", "la", "les", "un", "une", "des", "du", "de", "d", "l",
    "au", "aux", "a", "à", "en", "dans", "par", "pour", "sur", "avec", "sans",
    "sous", "chez", "ce", "cet", "cette", "ces", "mon", "ton", "son",
    "qui", "que", "quoi", "dont", "ou", "où", "et", "mais", "donc", "or", "ni", "car",
    "est", "sont", "suis", "es", "sommes", "etes", "êtes", "avoir", "etre", "être",
    "faire", "comment", "pourquoi", "quand", "quel", "quelle", "quels", "quelles",
    "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles",
    "svp", "bonjour", "salut", "merci", "aide", "nora", "si", "apres", "après"
}

# ─── 2. Dictionnaire sémantique ENCG Marrakech ─────────────────
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
        "frais", "prix", "cout", "coût", "payer", "combien", "gratuit",
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
    """Normalise une chaîne : minuscules, suppression des accents et de la ponctuation."""
    if not text:
        return ""
    nfkd = unicodedata.normalize("NFKD", text)
    sans_accents = "".join([c for c in nfkd if not unicodedata.combining(c)])
    clean = re.sub(r"[^\w\s]", " ", sans_accents.lower())
    return " ".join(clean.split())


def get_stem(word: str) -> str:
    """Extrait la racine (stem) d'un mot de plus de 4 lettres pour tolérer les flexions."""
    w = normalize_text(word)
    if len(w) <= 4:
        return w
    # Troncature des terminaisons courantes françaises
    suffixes = ("tion", "tions", "ique", "iques", "iers", "ière", "ier",
                "able", "ables", "eux", "euse", "ment", "ent", "ant",
                "er", "ir", "es", "s", "e")
    for s in suffixes:
        if w.endswith(s) and len(w) - len(s) >= 4:
            return w[:-len(s)]
    return w


def extract_keywords(text: str) -> List[str]:
    """Extrait les mots significatifs normalisés."""
    normalized = normalize_text(text)
    words = normalized.split()
    return [w for w in words if len(w) >= 3 and w not in FRENCH_STOP_WORDS]


def detect_intents(keywords: List[str], raw_text: str) -> Set[str]:
    """Détecte les intentions de la question de l'utilisateur."""
    intents = set()
    norm_text = normalize_text(raw_text)
    words_set = set(norm_text.split())

    # Détection par expressions clés multi-mots
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
                    # Mot unique : vérification exacte sur mot ou racine
                    if syn_norm in words_set or stem == get_stem(syn_norm):
                        intents.add(intent_name)
    return intents


def detect_subjects(keywords: List[str], raw_text: str) -> Set[str]:
    """Détecte les sujets / spécialités mentionnés dans la question."""
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
    """Moteur de recherche SQL tolérant aux reformulations pour la Version 1."""

    @staticmethod
    def search_qas(query_text: str, limit: int = 5) -> List[QA]:
        """
        Recherche multicritère dans PostgreSQL :
        1. Récupération des candidats par SQL (combinaison de mots & racines)
        2. Évaluation et classement précis par Intentions + Sujets + Similarité
        """
        if not query_text or not query_text.strip():
            return []

        raw_query = query_text.strip()
        clean_query = normalize_text(raw_query)
        keywords = extract_keywords(raw_query)

        if not keywords and len(clean_query) < 3:
            return []

        # Détection sémantique
        user_intents = detect_intents(keywords, raw_query)
        user_subjects = detect_subjects(keywords, raw_query)

        # ─── ÉTAPE 1 : Requête SQL PostgreSQL pour extraire les candidats ───
        # On construit un ensemble de motifs de recherche SQL pour maximiser le rappel
        search_terms: Set[str] = set(keywords[:6])
        for kw in keywords[:4]:
            stem = get_stem(kw)
            if len(stem) >= 3:
                search_terms.add(stem)

        # Ajouter les mots clés des sujets détectés pour ne rien rater
        for subj in user_subjects:
            for syn in SUBJECT_SYNONYMS.get(subj, [])[:3]:
                search_terms.add(syn)

        conditions = []
        for term in search_terms:
            pattern = f"%{term}%"
            conditions.append(QA.question.ilike(pattern))
            conditions.append(QA.response.ilike(pattern))

        # Récupération de tous les candidats potentiels en BDD
        if conditions:
            candidates = QA.query.filter(or_(*conditions)).all()
        else:
            candidates = QA.query.all()

        if not candidates:
            # Recherche de repli globale si les filtres spécifiques n'ont rien donné
            candidates = QA.query.limit(50).all()

        # ─── ÉTAPE 2 : Scoring précis de chaque candidat ───────────────
        scored_candidates: List[Tuple[QA, float]] = []

        for qa in candidates:
            q_norm = normalize_text(qa.question)
            r_norm = normalize_text(qa.response)
            score: float = 0.0

            # A. Correspondance exacte de la phrase entière
            if clean_query in q_norm:
                score += 90.0
            elif clean_query in r_norm:
                score += 35.0

            # B. Score d'Adéquation de l'Intention (TRÈS DISCRIMINANT : +45 pts)
            qa_intents = detect_intents(extract_keywords(qa.question), qa.question)
            common_intents = user_intents.intersection(qa_intents)
            if common_intents:
                score += 45.0 * len(common_intents)
            else:
                qa_r_intents = detect_intents(extract_keywords(qa.response), qa.response)
                common_r_intents = user_intents.intersection(qa_r_intents)
                if common_r_intents:
                    score += 20.0 * len(common_r_intents)

            # C. Score d'Adéquation du Sujet (ex: Finance, Audit, ENCG : +35 pts)
            qa_subjects = detect_subjects(extract_keywords(qa.question), qa.question)
            common_subjects = user_subjects.intersection(qa_subjects)
            if common_subjects:
                score += 35.0 * len(common_subjects)
            else:
                # Vérifier si le sujet est présent au moins dans la réponse
                qa_r_subjects = detect_subjects(extract_keywords(qa.response), qa.response)
                common_r_subjects = user_subjects.intersection(qa_r_subjects)
                if common_r_subjects:
                    score += 15.0 * len(common_r_subjects)

            # D. Recouvrement des mots-clés et des racines
            q_words = q_norm.split()
            r_words = r_norm.split()
            q_stems = [get_stem(w) for w in q_words]
            r_stems = [get_stem(w) for w in r_words]

            for kw in keywords:
                kw_stem = get_stem(kw)
                # Présence exacte dans le titre de la question
                if kw in q_words or kw in q_norm:
                    score += 15.0
                elif kw_stem in q_stems:
                    score += 10.0

                # Présence dans le corps de la réponse
                if kw in r_words or kw in r_norm:
                    score += 5.0
                elif kw_stem in r_stems:
                    score += 3.0

            # E. Bonus de proximité Jaccard sur les mots du titre
            user_word_set = set(keywords)
            qa_word_set = set(extract_keywords(qa.question))
            if user_word_set and qa_word_set:
                overlap = len(user_word_set.intersection(qa_word_set))
                jaccard = overlap / float(len(user_word_set.union(qa_word_set)))
                score += jaccard * 25.0

            # Ne retenir que les candidats ayant un score significatif
            if score >= 15.0:
                scored_candidates.append((qa, score))

        if not scored_candidates:
            return []

        # ─── ÉTAPE 3 : Tri par score décroissant ─────────────────────────
        scored_candidates.sort(key=lambda item: item[1], reverse=True)
        return [item[0] for item in scored_candidates[:limit]]

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
