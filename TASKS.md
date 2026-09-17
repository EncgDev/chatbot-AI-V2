# 📋 TASKS.md — Gestion des Tâches NORA V2

> **Projet :** NORA — Chatbot ENCG Marrakech
> **Équipe :** Soufiane (BDD) · Yahya (Backend) · Youssef (Frontend)
> **Objectif V2 :** Assistant conversationnel IA (Gemini RAG) avec mémoire, fallback automatique et UX riche.
>
> ⚠️ **Ce document est la référence officielle des tâches et des contrats.**
> Le `README.md` reste la présentation générale du projet ; ce fichier gouverne le travail V2.

---

# 1️⃣ LA CONSTITUTION — Règles d'Intégration Strictes

> Ces règles existent pour **éviter les conflits BDD ↔ Backend ↔ Frontend**.
> Toute violation doit être détectée en code review avant merge.

| # | Contrat | Propriétaire | Règle |
|---|---------|--------------|-------|
| 1 | **Schéma BDD** (tables, colonnes, types) | 🟦 Soufiane | Source de vérité absolue. Toute modification = PR + validation de Yahya ET Youssef. |
| 2 | **Format JSON des réponses API** | 🟨 Yahya | Contrat consommé par Youssef. Aucun renommage/ajout de champ sans accord préalable dans ce document. |
| 3 | **Variables d'environnement** | 🟨 Yahya | `.env.example` TOUJOURS à jour. Jamais de clé API en dur dans le code. Jamais de commit de `.env`. |
| 4 | **Endpoints** (routes + méthodes HTTP) | 🟨 Yahya | Préfixe `/api/` obligatoire. Pas de nouvelle route sans mise à jour de la Section 2. |
| 5 | **Accès API depuis le frontend** | 🟩 Youssef | `frontend/src/api/chatApi.js` = **seul** point d'accès réseau. Aucun appel axios/fetch dans un composant. |
| 6 | **Fichiers SQL de seed** | 🟦 Soufiane | `database/init.sql` (schéma) + `database/encgm_training_dataset_inserts.sql` (données) sont les **seules références valides**. |
| 7 | **Design palette** | 🟩 Youssef | Couleurs hex exactes déjà en place (`#85181A`, `#C85A32`, `#F8F3EA`, `#3D271D`...). Pas de nouvelle teinte sans accord. |

### 🚫 Interdits absolus (valables pour tous)

- ❌ Modifier une table/colonne existante sans PR validée par les 3 membres.
- ❌ Envoyer un champ JSON non documenté dans la Section 2.
- ❌ `git push --force` sur `develop` ou `main`.
- ❌ Merger sa propre PR sans review d'au moins un autre membre.
- ❌ Commiter `node_modules/`, `venv/`, `.env`, `__pycache__/`.

---

# 2️⃣ CONTRAT JSON OFFICIEL (État actuel — à copier tel quel)

> Ces formats existent **déjà** dans le code. Ils ne changent pas sans mise à jour de cette section.

## 2.1 Endpoints existants (V1 + V2)

### `GET /api/health`
```json
{ "status": "ok", "service": "NORA API", "database": "ok", "version": "1.0.0" }
```

### `GET /api/categories`
```json
{
  "success": true,
  "data": [ { "id": 1, "name": "Informations sur l'ENCG Marrakech", "qa_count": 2 } ],
  "total": 10
}
```

### `GET /api/qas` ou `GET /api/qas?category_id=4`
```json
{
  "success": true,
  "data": [
    {
      "id": 9,
      "question": "Qu'est-ce que la filière Finance ?",
      "response": "Analyse financière, marchés, risques...",
      "category_id": 4,
      "category": { "id": 4, "name": "Informations sur les filières", "qa_count": 10 }
    }
  ],
  "total": 100
}
```

### `POST /api/chat/v1` — body : `{ "message": "..." }`
```json
{
  "success": true,
  "version": "v1",
  "source": "sql",
  "response": "Texte de la réponse...",
  "question_matched": "Question la plus proche trouvée",
  "category_id": 4
}
```

### `POST /api/chat/v2` — body : `{ "message": "..." }`
```json
{
  "success": true,
  "version": "v2",
  "source": "gemini/gemini-1.5-flash",
  "response": "Réponse rédigée par NORA...",
  "context_used": true,
  "context_count": 5,
  "model": "gemini-1.5-flash"
}
```

### Erreurs — TOUJOURS ce format
```json
{ "success": false, "error": "Message d'erreur lisible." }
```

## 2.2 Contrat V2 ÉTENDU (cible de ce sprint — mémoire + fallback)

### `POST /api/chat/v2` (nouvelle version)
**Body :**
```json
{ "message": "et quelles sont ses conditions d'accès ?", "session_id": "uuid-ou-null" }
```

**Réponse succès :**
```json
{
  "success": true,
  "version": "v2",
  "source": "gemini/gemini-1.5-flash",
  "response": "Réponse...",
  "session_id": "3f2a1b...",
  "context_used": true,
  "context_count": 5,
  "model": "gemini-1.5-flash",
  "sources": [ { "id": 13, "question": "Quelles sont les conditions d'accès à Finance ?" } ]
}
```

**Réponse en cas de fallback automatique (Gemini indisponible) :**
```json
{
  "success": true,
  "version": "v1",
  "source": "v1-fallback",
  "response": "Réponse SQL classique...",
  "session_id": "3f2a1b...",
  "fallback_reason": "gemini_unavailable",
  "question_matched": "...",
  "category_id": 8
}
```

### `GET /api/chat/sessions/<session_id>` (nouveau)
```json
{
  "success": true,
  "data": [
    { "id": 1, "role": "user", "content": "C'est quoi la Finance ?", "version": null, "created_at": "..." },
    { "id": 2, "role": "nora", "content": "La filière Finance...", "version": "v2", "created_at": "..." }
  ],
  "total": 2
}
```

> ⚠️ **Règle** : le champ `sources` est **optionnel mais fortement recommandé** en V2 pour alimenter l'accordéon "Sources" du frontend.

## 2.3 Contrat BDD V2 (nouvelles tables)

```sql
CREATE TABLE chat_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at  TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id          SERIAL PRIMARY KEY,
    session_id  UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role        VARCHAR(10) NOT NULL CHECK (role IN ('user', 'nora')),
    content     TEXT NOT NULL,
    version     VARCHAR(4),              -- 'v1', 'v2' ou NULL
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_session_id ON chat_messages(session_id);
```

> ⚠️ Les tables existantes `categories` et `QAs` **ne changent pas de nom ni de structure**.

---

# 3️⃣ 🟦 SOUFIANE — Base de Données & Data

**Branche de travail :** `feature/db-sessions` (depuis `develop`)

| Statut | Tâche | Fichier / Livrable | Règle d'intégration |
|:------:|-------|--------------------|---------------------|
| ⬜ | **Activer l'extension UUID** | `database/init.sql` | Ajouter `CREATE EXTENSION IF NOT EXISTS pgcrypto;` en haut du fichier (requis pour `gen_random_uuid()`). |
| ⬜ | **Créer `chat_sessions` + `chat_messages`** | `database/init.sql` | Schéma **exact** de la Section 2.3. Ajouter à la fin du fichier. Ne pas toucher aux tables existantes. |
| ⬜ | **Index `idx_messages_session_id`** | `database/init.sql` | Index sur `chat_messages(session_id)` — indispensable pour la lecture de l'historique. |
| ⬜ | **FK cascade sur QAs** | `database/init.sql` | Ajouter explicitement `ON DELETE CASCADE` sur `QAs.category_id` (cohérence avec `models.py` qui l'attend déjà). |
| ⬜ | **Nettoyage data : orthographe & accents** | `database/encgm_training_dataset_inserts.sql` | Relecture complète : apostrophes typographiques cohérentes, pas de doubles espaces, ponctuation française. |
| ⬜ | **Nettoyage data : supprimer les placeholders** | `database/encgm_training_dataset_inserts.sql` | Remplacer les réponses type *"doivent être repris du descriptif institutionnel validé ; ne pas les inventer"* par du contenu réel ou supprimer la QA (l'IA ne doit jamais lire ça en contexte RAG). |
| ⬜ | **Ajout de nouvelles QAs fréquentes** | `database/encgm_training_dataset_inserts.sql` | Monter à 100+ QAs : bourses, stages, rattrapages, clubs, rentrée, calendrier des concours, mobilité internationale. IDs de catégories **existants uniquement** (1 à 10). |
| ⬜ | **Test d'intégrité total** | `docker-compose down -v && docker-compose up db` | Depuis un volume vierge : vérifier dans `docker logs nora_db` que les 3 scripts s'exécutent sans erreur. Puis `psql -c "SELECT count(*) FROM \"QAs\";"`. |
| ⬜ | **Test de suppression en cascade** | psql | `DELETE FROM categories WHERE id = 1;` → toutes ses QAs disparaissent ; `DELETE FROM chat_sessions ...` → ses messages disparaissent. Restaurer les données ensuite (réimport). |

> 🔒 **Rappel Soufiane** : les **noms des catégories** visibles sur l'écran 2 viennent de TA table. Si tu renommes une catégorie, préviens Youssef (icônes par mots-clés dans `CategoryGrid.jsx`).

---

# 4️⃣ 🟨 YAHYA — Backend Flask (API + IA)

**Branches de travail :** `feature/api-v2-memory` puis `feature/fallback-v1` puis `feature/rag-semantic`

## Phase A — Mémoire conversationnelle

| Statut | Tâche | Fichier | Détails & règles |
|:------:|-------|---------|------------------|
| ⬜ | **Modèle `ChatSession`** | `backend/app/models.py` | Miroir exact du SQL de Soufiane. `id = db.Column(UUID(as_uuid=True), ...)`. |
| ⬜ | **Modèle `ChatMessage`** | `backend/app/models.py` | Colonnes : `session_id` (FK cascade), `role`, `content`, `version`, `created_at`. Méthode `to_dict()` conforme à la Section 2.2. |
| ⬜ | **Service `ConversationService`** | `backend/app/services/conversation_service.py` (nouveau) | Fonctions : `get_or_create_session(session_id)`, `save_message(session_id, role, content, version)`, `get_history(session_id, limit=6)`. **Limiter à 6 derniers messages** (ordre chronologique) pour le prompt. |
| ⬜ | **Modifier `POST /api/chat/v2`** | `backend/app/routes/chat.py` | Accepter `session_id` optionnel dans le body. Créer la session si absente. Sauvegarder message user + réponse NORA en BDD. Retourner `session_id` dans la réponse. |
| ⬜ | **Modifier `POST /api/chat/v1`** | `backend/app/routes/chat.py` | Même logique de session (version `"v1"`). |
| ⬜ | **Nouvelle route `GET /api/chat/sessions/<uuid>`** | `backend/app/routes/chat.py` (ou nouveau `sessions.py`) | Retourne l'historique complet, format §2.2. 404 au format `{ "success": false, "error": "Session introuvable." }`. |
| ⬜ | **Enrichir le prompt Gemini avec l'historique** | `backend/app/services/gemini_service.py` | Nouveau paramètre `history: List[ChatMessage]`. Format injecté : `### HISTORIQUE DE LA CONVERSATION : user: ... / NORA: ...`. L'historique passe AVANT le contexte RAG. |
| ⬜ | **Instruction anti-hallucination dans SYSTEM_PROMPT** | `gemini_service.py` | Ajouter : *"Appuie-toi sur l'historique pour comprendre les relances (reformule les pronoms : 'ses', 'il', 'elle' → le sujet réel). Réponds uniquement à partir du contexte fourni ; sinon oriente vers encg-marrakech.uca.ma."* |

## Phase B — Fallback automatique V2 → V1

| Statut | Tâche | Fichier | Détails & règles |
|:------:|-------|---------|------------------|
| ⬜ | **Chaîne de fallback** | `backend/app/routes/chat.py` | `try: GeminiService (timeout 12s)` → `except (quota, 5xx, timeout, non configuré):` → appeler `SearchService.search_qas` et renvoyer le format fallback de §2.2. **Jamais de 503 visible pour l'utilisateur final quand la V1 peut répondre.** |
| ⬜ | **`fallback_reason` normalisé** | `chat.py` | Valeurs autorisées : `"no_api_key"`, `"quota_exceeded"`, `"gemini_timeout"`, `"gemini_error"`. Rien d'autre (le frontend s'appuie dessus). |
| ⬜ | **Header de diagnostic** | `chat.py` | Ajouter `X-Nora-Fallback: true` sur la réponse fallback (utile pour les tests et les logs). |
| ⬜ | **Gemini call avec timeout** | `gemini_service.py` | `request_options={"timeout": 12}` sur `generate_content`. Ne jamais bloquer le worker Flask indéfiniment. |
| ⬜ | **Test manuel du fallback** | curl/Postman | Lancer avec `AI_API_KEY=` vide → V2 doit renvoyer `source: "v1-fallback"`. Puis avec une fausse clé → idem. Documenter les 2 réponses curl dans la PR. |

## Phase C — Recherche sémantique (anti-nettoyage manuel)

| Statut | Tâche | Fichier | Détails & règles |
|:------:|-------|---------|------------------|
| ⬜ | **Décision embeddings validée en équipe** | Discussion équipe | Option A : Gemini Embeddings API (simple, payant/quota). Option B : `sentence-transformers` local avec `paraphrase-multilingual-MiniLM-L12-v2` (0 coût, +~400 Mo dans l'image Docker). ➜ **Recommandé : Option A au début.** |
| ⬜ | **Colonne `embedding`** | Demande à Soufiane (PR croisée) | `ALTER TABLE QAs ADD COLUMN embedding VECTOR(768);` + extension `pgvector`. Requiert mise à jour image Postgres **OU** stockage hors BDD (fichier JSON d'embeddings généré au build) si changement BDD trop lourd. |
| ⬜ | **Script de vectorisation** | `backend/scripts/embed_qas.py` (nouveau) | Lit toutes les QAs, calcule l'embedding de `question + " " + response`, sauvegarde. Rejouable à chaque changement de dataset. |
| ⬜ | **`SearchService.search_qas_semantic()`** | `backend/app/services/search_service.py` | Top-5 par similarité cosinus. **Conserver l'ancienne recherche SQL** comme secours (robustesse). |
| ⬜ | **Retourner `sources` au frontend** | `chat.py` | Liste `[{id, question}]` des QAs utilisées comme contexte — alimente l'accordéon Sources de Youssef. |

## Phase D — Qualité

| Statut | Tâche | Fichier | Détails |
|:------:|-------|---------|---------|
| ⬜ | **`.env.example` à jour** | `backend/.env.example` | Ajouter toute nouvelle variable (ex: `EMBEDDING_PROVIDER`, `GEMINI_TIMEOUT_S=12`). |
| ⬜ | **Tests API complets** | curl / Postman | Collection documentée dans la PR : health, categories, qas, chat v1, chat v2 (succès), chat v2 (fallback), v2 avec relance, session history. |
| ⬜ | **Logs propres** | `app/services/*.py` | `logger.info` sur chaque fallback (avec `fallback_reason`), `logger.error` sur exceptions. Pas de `print` en production. |

---

# 5️⃣ 🟩 YOUSSEF — Frontend React (UX V2)

**Branches de travail :** `feature/api-contract-v2` puis `feature/ux-chat-v2`

## Phase A — Couche API

| Statut | Tâche | Fichier | Règle d'intégration |
|:------:|-------|---------|---------------------|
| ✅ | **`sendChatV2(msg, sessionId, signal)`** | `frontend/src/api/chatApi.js` | Envoie `{ message, session_id }`, supporte `AbortSignal` (annulation). Retourne l'objet normalisé : `{ reply, source, sessionId, isFallback, sources, fallbackReason }`. |
| ✅ | **`sendChatV1(msg, sessionId)`** | `chatApi.js` | Même extension `session_id`. |
| ✅ | **`getSessionHistory(sessionId)`** | `chatApi.js` | GET `/api/chat/sessions/<id>`, retourne `data` (tableau de messages). Gère 404 → `[]`. |
| ✅ | **Ne rien casser** | `chatApi.js` | Les fonctions existantes conservent leur comportement par défaut (session null possible). Aucun autre fichier ne doit importer axios. |

## Phase B — Interface de chat

| Statut | Tâche | Fichier | Détails UX |
|:------:|-------|---------|-----------|
| ✅ | **État `sessionId` persisté** | `ChatInterface.jsx` | `useState` + `sessionStorage` (survit au rechargement, pas au redémarrage borne). Initialisé null → première réponse le fixe. |
| ✅ | **Rechargement de l'historique** | `ChatInterface.jsx` | Au mount : si `sessionId` existe → `getSessionHistory` → reconstruire les bulles. |
| ✅ | **Bouton "Annuler"** | `ChatInterface.jsx` | Visible pendant `isLoading`. `AbortController.abort()`. Message : *"Requête annulée."* (bulle système légère, pas d'erreur rouge). |
| ✅ | **Bouton "Régénérer"** | `MessageBubble` (NORA uniquement) | Icône `RotateCcw` sur la dernière bulle NORA. Renvoie le dernier message utilisateur → remplace la bulle (pas de doublon). Désactivé pendant `isLoading`. |
| ✅ | **Accordéon "Sources"** | `MessageBubble` | Si `sources.length > 0` : section repliable *"NORA s'est appuyée sur N questions fréquentes"* avec la liste des questions (chevron animé, même style que `KnowledgeBase.jsx`). |
| ✅ | **Badge fallback discret** | `MessageBubble` | Si `isFallback` : petit tag gris *"Mode économisé"* sous la bulle. **Jamais** de message d'erreur technique visible. |
| ✅ | **Indicateur V1/V2 conservé** | `VersionToggle.jsx` | Mode IA 100% transparent avec fallback automatique vers la BDD en cas d'erreur. |
| ✅ | **Timeout UI réaliste** | `chatApi.js` | `timeout: 20000` côté axios (Gemini peut prendre 5-12 s). |

## Phase C — Tests et finition

| Statut | Tâche | Détails |
|:------:|-------|---------|
| ⬜ | **Test relance conversationnelle** | Envoyer *"C'est quoi la filière Finance ?"* puis *"et ses débouchés ?"* → à valider en intégration avec le backend de Yahya. |
| ⬜ | **Test fallback réel** | Clé Gemini vide côté backend → à valider en intégration avec le backend de Yahya. |
| ✅ | **Responsive borne tactile** | Vérifier accordéon, boutons ≥ 44px de hauteur tactile, scroll fluide. |
| ✅ | **Build de production** | `npm run build` sans warning bloquant (testé et validé avec succès). |

---

# 6️⃣ WORKFLOW GIT — Organisation des Branches

```bash
# 0. Une seule fois — création de la branche d'intégration
git checkout -b develop && git push -u origin develop

# Chaque tâche = une branche depuis develop
git checkout develop && git pull
git checkout -b feature/<sujet>          # ex: feature/db-sessions

# Conventions de commits (français)
git commit -m "feat(db): ajout tables chat_sessions et chat_messages"
git commit -m "fix(api): fallback automatique sur erreur quota gemini"
git commit -m "feat(ui): accordéon des sources dans les bulles NORA"
```

| Branche | Auteur | Contenu | Merge vers |
|---------|--------|---------|------------|
| `feature/db-sessions` | 🟦 Soufiane | Phase BDD complète | `develop` |
| `feature/api-v2-memory` | 🟨 Yahya | Phase A backend | `develop` (après merge de Soufiane) |
| `feature/fallback-v1` | 🟨 Yahya | Phase B backend | `develop` |
| `feature/rag-semantic` | 🟨 Yahya + 🟦 Soufiane | Phase C (décision commune) | `develop` |
| `feature/api-contract-v2` | 🟩 Youssef | Phase A frontend | `develop` |
| `feature/ux-chat-v2` | 🟩 Youssef | Phase B frontend | `develop` (après `api-contract-v2`) |

**Règles de merge :** 1 PR = 1 fonctionnalité · review par au moins 1 autre membre · CI/`npm run build` + tests curl verts avant merge.

---

# 7️⃣ PLANNING JOUR PAR JOUR (6 jours)

| Jour | 🟦 Soufiane | 🟨 Yahya | 🟩 Youssef |
|:----:|-------------|----------|------------|
| **J1** | `feature/db-sessions` : extension UUID, 2 tables, index, FK cascade | Setup : lecture du code actuel, branche `feature/api-v2-memory`, squelette `conversation_service.py` | `feature/api-contract-v2` : extension de `chatApi.js` (session, abort) |
| **J2** | Nettoyage data (placeholders, orthographe) + nouvelles QAs | Modèles + routes session + sauvegarde des messages | `feature/ux-chat-v2` : rechargement historique, badge fallback |
| **J3** | Tests d'intégrité BDD (volume vierge, cascades) + review PR | Historique injecté dans le prompt Gemini + test relance | Bouton Annuler + Régénérer |
| **J4** | Support embeddings (colonne + extension, si Option A/B validée) | `feature/fallback-v1` : chaîne complète + tests curl documentés | Accordéon Sources + polish responsive |
| **J5** | Review croisée des PR | `feature/rag-semantic` : script embeddings + recherche cosinus + `sources` | Tests E2E frontend + `npm run build` propre |
| **J6** | **🤝 INTÉGRATION : merge `develop` → `main`, `docker-compose up --build` depuis zéro, démo complète (V2 + relance + fallback)** | | |

---

# 8️⃣ ✅ DEFINITION OF DONE — Checklist finale d'équipe

Avant de déclarer la V2 terminée, **tout** doit être coché :

- [ ] `docker-compose up --build` fonctionne depuis un clone vierge (0 erreur dans les logs des 3 conteneurs).
- [ ] Le contrat JSON de la Section 2 est respecté **à la lettre** (vérifié par curl sur chaque endpoint).
- [ ] Relance conversationnelle démontrée : *"C'est quoi la Finance ?"* → *"et ses conditions d'accès ?"* donne une réponse cohérente sur Finance.
- [ ] Fallback démontré : `AI_API_KEY` supprimée → la V2 répond via V1 sans erreur visible côté UI (badge "Mode économisé").
- [ ] Bouton Annuler fonctionne pendant une génération Gemini.
- [ ] Bouton Régénérer produit une réponse différente sans dupliquer la bulle.
- [ ] Accordéon Sources affiche les QAs réellement utilisées comme contexte.
- [ ] Aucune clé API dans le dépôt ; `.env.example` à jour.
- [ ] Toutes les PR mergées ont eu une review croisée.
- [ ] Ce fichier `TASKS.md` est à jour (statuts ⬜ → ✅ réels).

---

> 💡 **Philosophie d'équipe :** *"Le contrat avant le code."*
> Chaque membre peut avancer en confiance tant que les Sections 1 et 2 ne bougent pas sans PR validée par tous.
> En cas de doute → on documente ici **avant** de coder.
