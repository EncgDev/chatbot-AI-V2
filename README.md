# 🤖 NORA — Chatbot ENCG Marrakech

> **NORA** est l'assistante virtuelle officielle de l'École Nationale de Commerce et de Gestion de Marrakech.
> Application web complète conteneurisée avec Docker (PostgreSQL + Flask + React 3D).

---

## 👥 Équipe & Répartition des Tâches Détaillées

> ⚠️ **Règle d'or pour éviter tout problème d'intégration (BDD ↔ Backend ↔ Frontend) :**
> - Les noms des tables et colonnes de **Soufiane** sont la source de vérité pour le modèle de **Yahya**.
> - Les formats JSON retournés par **Yahya** sont le contrat strict que **Youssef** consomme dans React.

---

### 🟦 SOUFIANE — Base de Données PostgreSQL & Nettoyage Data

#### 🗄️ Schéma BDD Strict (2 Tables) :
```sql
CREATE TABLE categories (
    id int PRIMARY KEY,
    name VARCHAR(80)
);

CREATE TABLE QAs (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    response TEXT NOT NULL,
    category_id INT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

#### 📋 Tableau des Tâches :
| Statut | Tâche | Fichier / Livrable | Détails & Règles |
|:------:|-------|-------------------|------------------|
| ✅ | **Création de la table `categories`** | `database/init.sql` | Colonnes strictes : `id INT PRIMARY KEY`, `name VARCHAR(80)` |
| ✅ | **Création de la table `QAs`** | `database/init.sql` | Colonnes : `id SERIAL PRIMARY KEY`, `question TEXT`, `response TEXT`, `category_id INT REFERENCES categories(id)` |
| ✅ | **Création de l'index de performance** | `database/init.sql` | `CREATE INDEX idx_qas_category_id ON QAs(category_id);` pour accélérer les filtres |
| ✅ | **Peuplement des 6 Catégories des maquettes** | `database/init.sql` | IDs fixes (1: Formations, 2: Horaires & emploi du temps, 3: Admissions & Concours, 4: Vie estudiantine, 5: Contact & Accès, 6: À propos de l'ENCG) |
| ✅ | **Jeu de données initial QAs (Seed data)** | `database/init.sql` | Minimum 20+ questions/réponses réalistes de l'ENCG Marrakech réparties sur les 6 catégories |
| ⬜ | **Nettoyage & Enrichissement de la Data** | `database/init.sql` | Corriger l'orthographe, syntaxe, accents, et formater des réponses claires et concises pour l'affichage |
| ⬜ | **Ajout de nouvelles QAs fréquentes** | `database/init.sql` | Monter à 50+ questions/réponses pour couvrir un maximum de cas réels (bourses, stages, rattrapages, clubs) |
| ⬜ | **Test d'intégrité SQL** | CLI / psql | Vérifier que les contraintes de clés étrangères `ON DELETE CASCADE` ou `RESTRICT` fonctionnent |

**Commande de démarrage BDD :**
```bash
docker-compose up db
# Vérifier l'initialisation :
docker logs nora_db
```

---

### 🟨 YAHYA — Backend Python Flask (API REST)

> *Dépend directement du schéma SQL de Soufiane et fournit les endpoints à Youssef.*

#### 📋 Tableau des Tâches :
| Statut | Tâche | Fichier / Livrable | Détails & Dépendances |
|:------:|-------|-------------------|----------------------|
| ✅ | **Configuration conteneur Docker** | `backend/Dockerfile` | Image `python:3.10-slim`, non-root user, Gunicorn multi-workers |
| ✅ | **Dépendances Backend** | `backend/requirements.txt` | Flask, Flask-SQLAlchemy, Flask-CORS, psycopg2-binary, google-generativeai |
| ✅ | **Configuration multi-environnements** | `backend/config.py` | Variables d'environnement `DATABASE_URL`, `AI_API_KEY`, CORS origins |
| ✅ | **Modèles SQLAlchemy (`Category`, `QA`)** | `backend/models.py` | Synchronisés à 100% avec les 2 tables de Soufiane (`categories` & `QAs`) |
| ✅ | **Endpoint Santé `GET /api/health`** | `backend/app.py` | Vérifie la connectivité PostgreSQL et renvoie l'état du service |
| ✅ | **Endpoint Catégories `GET /api/categories`** | `backend/app.py` | Renvoie la liste `[{ "id": 1, "name": "Formations" }, ...]` pour l'Écran 2 de Youssef |
| ✅ | **Endpoint QAs par Catégorie `GET /api/qas`** | `backend/app.py` | Paramètre optionnel `?category_id=X`, renvoie `[{ "id": 1, "question": "...", "response": "...", "category_id": 1 }]` |
| ✅ | **Endpoint Chat V1 (SQL) `POST /api/chat/v1`** | `backend/app.py` | Recherche plein texte / LIKE dans `QAs.question` et `QAs.response`. Rapide et sans quota |
| ✅ | **Endpoint Chat V2 (IA RAG) `POST /api/chat/v2`** | `backend/app.py` | Recherche les QAs pertinentes en BDD et les injecte en contexte à Gemini 1.5 Flash |
| ✅ | **Sécurité & CORS** | `backend/app.py` | Activation de `CORS(app)` pour accepter les requêtes de l'application React de Youssef |
| ✅ | **Gestion standardisée des erreurs (JSON)** | `backend/app.py` | Erreurs 400, 404, 500 renvoyées au format `{ "error": "message" }` |
| ⬜ | **Validation des réponses avec Postman / curl** | Tests | Valider tous les contrats JSON avant intégration finale avec Youssef |
| ⬜ | **Configuration de la clé Gemini** | `.env` | Renseigner une clé `AI_API_KEY` valide pour le mode V2 |

**Commandes de test des endpoints :**
```bash
# Tester la santé
curl http://localhost:5000/api/health

# Récupérer les catégories (pour Youssef - Écran 2)
curl http://localhost:5000/api/categories

# Récupérer les QAs de la catégorie 1 (Formations)
curl http://localhost:5000/api/qas?category_id=1

# Tester le chat V1 (recherche SQL)
curl -X POST http://localhost:5000/api/chat/v1 \
     -H "Content-Type: application/json" \
     -d "{\"message\": \"comment s inscrire au concours\"}"

# Tester le chat V2 (IA Gemini)
curl -X POST http://localhost:5000/api/chat/v2 \
     -H "Content-Type: application/json" \
     -d "{\"message\": \"quelles sont les filières disponibles\"}"
```

---

### 🟩 YOUSSEF — Frontend React.js + Tailwind CSS (Fidèle aux Maquettes)

> *Dépend des endpoints API de Yahya et respecte fidèlement les maquettes graphiques.*

#### 🎨 Spécifications Design (Basées sur les Maquettes) :
- **Palette de couleurs :**
  - Fond principal : Crème / Beige chaleureux (`#F8F5EE` ou `bg-amber-50/40`)
  - Accent / Boutons : Terre cuite / Orange brûlé (`#C85A32` ou `#D96B43`)
  - Secondaire / Navigation : Marron foncé chaleureux (`#3D271D`)
  - Cartes & Bulles : Blanc pur (`#FFFFFF`) avec ombres douces (`shadow-sm`, bords arrondis `rounded-2xl`)
- **Mascotte NORA :** Robot bienveillant blanc et bleu/orange avec écran affichant des expressions amicales.

#### 📋 Tableau des Tâches :
| Statut | Tâche | Fichier / Composant | Détails & Interaction Maquette |
|:------:|-------|---------------------|--------------------------------|
| ✅ | **Configuration conteneur Nginx** | `frontend/Dockerfile` | Multi-stage build (Node 18 -> Nginx Alpine) |
| ⬜ | **Serveur Web Nginx SPA** | `frontend/nginx.conf` | Configuration du routage SPA (`try_files $uri $uri/ /index.html;`) |
| ⬜ | **Initialisation du projet Vite + React** | `frontend/package.json` | React 18, Lucide-react (icônes), Axios, Tailwind CSS |
| ⬜ | **Configuration Tailwind CSS & Thème** | `frontend/tailwind.config.js` | Définition des couleurs exactes de la maquette (beige, terracotta, brown) |
| ⬜ | **Client API Axios / Fetch** | `frontend/src/api/chatApi.js` | Fonctions : `getCategories()`, `getQAs(catId)`, `sendChatV1(msg)`, `sendChatV2(msg)` |
| ⬜ | **Écran 1 : Page d'Accueil (Welcome)** | `frontend/src/components/WelcomeScreen.jsx` | - Logo ENCG Marrakech en haut<br>- Mascotte Robot NORA animée<br>- Message : *"Touchez l'écran pour commencer"*<br>- Clic n'importe où -> transition vers Écran 2 |
| ⬜ | **Écran 2 : Grille des Catégories** | `frontend/src/components/CategoryGrid.jsx` | - Header avec avatar NORA + message d'accueil<br>- Grille des 6 thématiques (Formations, Horaires, Admissions...)<br>- Consomme `GET /api/categories`<br>- Clic sur catégorie -> ouvre le chat filtré sur cette thématique |
| ⬜ | **Écran 3 : Interface de Chat NORA** | `frontend/src/components/ChatInterface.jsx` | - Header avec bouton retour vers les catégories<br>- Switch V1 (SQL rapide) / V2 (IA intelligente)<br>- Suggestions de questions cliquables<br>- Bulles de discussion (Utilisateur vs NORA)<br>- Barre de saisie avec bouton d'envoi et loader (typing indicator) |
| ⬜ | **Modèle / Mascotte 3D ou SVG animé** | `frontend/src/components/MascotAvatar.jsx` | Affichage du robot NORA interactif (Three.js / Canvas ou illustration SVG haute fidélité avec micro-animations) |
| ⬜ | **Gestion des États d'Erreur & Offline** | `frontend/src/components/` | Afficher un message convivial si le backend ou la BDD est injoignable |
| ⬜ | **Tests UI & Rendu Responsive** | Navigateur | Vérification sur format Borne tactile, Desktop et Mobile |

**Démarrage frontend en local :**
```bash
cd frontend
npm install
npm run dev
# Accessible sur http://localhost:5173
```

---

### 🤝 Contrat d'Interface Strict (Pour éviter les bugs d'équipe)

```
       [SOUFIANE]                       [YAHYA]                         [YOUSSEF]
     PostgreSQL BDD                   Backend Flask                   Frontend React
 ┌────────────────────┐          ┌──────────────────────┐          ┌────────────────────┐
 │ TABLE categories   │  SQLAlchemy │ GET /api/categories  │  JSON Axios │ Écran 2 : Grille   │
 │   - id (int)       │ ────────>│   -> [{id, name}]    │ ─────────>│ 6 cartes à cliquer │
 │   - name (varchar) │          │                      │          │                    │
 ├────────────────────┤          ├──────────────────────┤          ├────────────────────┤
 │ TABLE QAs          │  SQLAlchemy │ GET /api/qas?cat=X   │  JSON Axios │ Écran 3 : Chat     │
 │   - id (serial)    │ ────────>│   -> [{id,question,  │ ─────────>│ Suggestions de     │
 │   - question (text)│          │        response}]    │          │ questions & réponses│
 │   - response (text)│          │                      │          │                    │
 │   - category_id(FK)│          │ POST /api/chat/v1-v2 │          │ Envoi message      │
 └────────────────────┘          │   -> {reply, source} │ <────────│ saisie clavier     │
                                 └──────────────────────┘          └────────────────────┘
```

---

## 🏗️ Architecture Docker

```
docker-compose up --build
```

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| `db` | postgres:15-alpine | 5432 | Base de données PostgreSQL |
| `backend` | python:3.10-slim | 5000 | API REST Flask |
| `frontend` | nginx:1.25-alpine | 3000 | Interface React servie par Nginx |

---

## 📁 Structure du Projet

```
Chatboot/
├── docker-compose.yml          ✅ Orchestration des 3 services
├── .env.example                ✅ Template des variables d'environnement
├── .env                        ⬜ À créer (copier .env.example)
│
├── database/                   ── Soufiane ──
│   └── init.sql                ✅ Schéma + Seed data ENCG
│
├── backend/                    ── Yahya ──
│   ├── Dockerfile              ✅
│   ├── requirements.txt        ✅
│   ├── config.py               ✅
│   ├── models.py               ✅
│   └── app.py                  ✅
│
└── frontend/                   ── Youssef ──
    ├── Dockerfile              ✅
    ├── nginx.conf              ⬜
    ├── package.json            ⬜
    ├── vite.config.js          ⬜
    ├── tailwind.config.js      ⬜
    └── src/
        ├── main.jsx            ⬜
        ├── App.jsx             ⬜
        ├── index.css           ⬜
        ├── api/
        │   └── chatApi.js      ⬜
        └── components/
            ├── WelcomeScreen.jsx ⬜
            ├── CategoryGrid.jsx  ⬜
            ├── ChatInterface.jsx ⬜
            ├── Avatar3D.jsx      ⬜
            ├── Sidebar.jsx       ⬜
            └── VersionToggle.jsx ⬜
```

---

## ⚙️ Configuration Initiale

### 1. Créer le fichier `.env`
```bash
cp .env.example .env
# Editez .env et ajoutez votre clé Gemini dans AI_API_KEY
```

### 2. Obtenir une clé Google Gemini (gratuite)
👉 https://aistudio.google.com/app/apikey

### 3. Lancer tout le projet
```bash
docker-compose up --build
```

| URL | Service |
|-----|---------|
| http://localhost:3000 | 🎨 Interface NORA (Frontend) |
| http://localhost:5000/api/health | 🔧 API Flask (Backend) |
| localhost:5432 | 🐘 PostgreSQL (BDD) |

---

## 🛠️ Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 24.x
- [Docker Compose](https://docs.docker.com/compose/) ≥ 2.x
- (Optionnel dev local) Node.js ≥ 18, Python ≥ 3.10

---

> 💡 **Note pip** : Le backend tourne dans Docker, pas besoin d'installer pip en local.
> Si vous voulez tester localement : `python -m pip install -r backend/requirements.txt`
