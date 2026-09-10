"""
app.py — Point d'entrée WSGI & Serveur Flask pour NORA
Auteur : Yahya

Ce fichier sert de point d'entrée pour :
- Le conteneur Docker via Gunicorn : `gunicorn app:app`
- L'exécution directe en développement : `python app.py`
"""
import os
from app import create_app

# Initialisation de l'application via la factory
env = os.environ.get("FLASK_ENV", "production")
app = create_app(env)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = env == "development"
    print(f"🚀 NORA API démarrée sur http://localhost:{port} (mode: {env})")
    app.run(host="0.0.0.0", port=port, debug=debug)
