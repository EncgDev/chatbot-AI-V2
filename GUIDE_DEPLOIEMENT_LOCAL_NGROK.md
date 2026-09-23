# 🌐 Guide Déploiement Local sur PC avec Ngrok (WSL Ubuntu)

> **Projet :** NORA — Chatbot ENCG Marrakech  
> **Environnement :** PC Local (Windows + WSL2 Ubuntu + Docker Desktop)  
> **Exposition Internet :** Ngrok (URL publique HTTPS sécurisée)  

---

## 🎯 Ce que nous allons faire

Vos conteneurs Docker tournent déjà sur votre machine (`nora_db`, `nora_backend`, `nora_frontend`).  
Nous allons :
1. Corriger la communication interne entre le frontend et le backend dans Docker.
2. Installer **ngrok** dans votre terminal Ubuntu WSL (`soufiane@DESKTOP-6HP71ES`).
3. Générer un lien public HTTPS accessible à toute personne sur Internet (professeurs, jury, étudiants).

```
[ Utilisateur externe sur Internet ]
               │
               ▼  (Lien HTTPS ngrok)
       [ Tunnel Ngrok ]
               │
               ▼
[ Votre PC : Port 5173 (Frontend React / Vite) ]
               │
               ▼  (Proxy interne Docker)
[ Votre PC : Port 5000 (Backend Flask API) ]
               │
               ▼
[ Votre PC : Port 5432 (PostgreSQL) ]
```

---

## Étape 1 : Ajustement Essentiel dans `docker-compose.yml`

Actuellement, dans le conteneur `nora_frontend`, Vite essaie de contacter `localhost:5000`. Or, à l'intérieur du conteneur Docker, `localhost` désigne le frontend lui-même et non le backend !

Dans votre fichier `docker-compose.yml`, sous le service `frontend`, ajoutez la variable `VITE_API_URL: http://backend:5000` :

```yaml
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: builder             
    container_name: nora_frontend
    restart: unless-stopped
    command: npm run dev -- --host 0.0.0.0  
    ports:
      - "5173:5173"              
    environment:
      - VITE_USE_POLLING=true
      - VITE_API_URL=http://backend:5000    # <--- AJOUTER CETTE LIGNE
    volumes:
      - ./frontend:/app          
      - /app/node_modules        
    depends_on:
      - backend
    networks:
      - nora_network
```

Puis redémarrez le conteneur frontend :
```bash
docker compose up -d frontend
```

---

## Étape 2 : Créer un Compte Gratuit Ngrok

1. Rendez-vous sur **[https://ngrok.com/](https://ngrok.com/)** et créez un compte gratuit (ou connectez-vous avec GitHub / Google).
2. Rendez-vous sur la page de votre jeton d'authentification :  
   👉 **[https://dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)**
3. Copiez votre **Authtoken** (une chaîne de caractères unique).

---

## Étape 3 : Installer Ngrok dans votre Terminal Ubuntu WSL

Ouvrez votre terminal Ubuntu (`soufiane@DESKTOP-6HP71ES`) visible sur votre capture d'écran, et collez ces commandes :

```bash
# 1. Ajouter la clé GPG et le dépôt officiel ngrok
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
  | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null

echo "deb https://ngrok-agent.s3.amazonaws.com buster main" \
  | sudo tee /etc/apt/sources.list.d/ngrok.list

# 2. Mettre à jour et installer ngrok
sudo apt update
sudo apt install -y ngrok
```

Vérifiez l'installation :
```bash
ngrok version
```

---

## Étape 4 : Configurer votre Token Ngrok

Dans le terminal Ubuntu, exécutez la commande suivante en remplaçant `<VOTRE_TOKEN>` par le jeton copié à l'Étape 2 :

```bash
ngrok config add-authtoken <VOTRE_TOKEN>
```

---

## Étape 5 : Lancer le Tunnel Ngrok

Lancez la commande suivante :

```bash
ngrok http 5173 --host-header="localhost:5173"
```

> 💡 **Pourquoi l'option `--host-header="localhost:5173"` est obligatoire ?**  
> Vite bloque par défaut les requêtes dont le nom d'hôte ne correspond pas à `localhost` (sécurité DNS rebinding). Cette option permet à Ngrok de réécrire le header pour que Vite accepte les connexions externes sans aucune erreur !

### Résultat dans votre terminal :

```text
ngrok                                                           (Ctrl+C to quit)

Session Status                online
Account                       Soufiane (Plan: Free)
Version                       3.x.x
Region                        Europe (eu)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://a1b2-c3d4.ngrok-free.app -> http://localhost:5173
```

Copiez l'adresse publique HTTPS (exemple : `https://a1b2-c3d4.ngrok-free.app`).

---

## Étape 6 : Tester le Lien Public

1. Ouvrez l'URL `https://xxxx.ngrok-free.app` sur votre smartphone ou envoyez-la à un ami/collègue.
2. Si un écran d'avertissement ngrok apparaît (*"You are about to visit..."*), cliquez simplement sur **"Visit Site"**.
3. Testez :
   - L'écran d'accueil avec le logo et la mascotte NORA.
   - Le clic pour accéder à la grille des 10 catégories (Formations, Parcours...).
   - L'envoi d'un message dans le chat (Mode V1 SQL et Mode V2 IA).

---

## 🛠️ Commandes Utiles au Quotidien

| Action | Commande |
|---|---|
| Vérifier les conteneurs actifs | `docker ps` |
| Voir les logs du frontend | `docker logs -f nora_frontend` |
| Voir les logs du backend | `docker logs -f nora_backend` |
| Voir les requêtes reçues par ngrok | Ouvrir `http://localhost:4040` dans le navigateur |
| Arrêter ngrok | Appuyer sur `CTRL + C` dans le terminal Ubuntu |
