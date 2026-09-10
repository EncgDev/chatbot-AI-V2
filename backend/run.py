"""
run.py — Script de lancement rapide en développement local
Usage : python run.py
"""
import os
from app import create_app

# Forcer l'environnement de développement pour le rechargement à chaud
os.environ["FLASK_ENV"] = "development"
app = create_app("development")

if __name__ == "__main__":
    print("==================================================")
    print("🤖 NORA — Serveur de Développement Local")
    print("🌐 URL API  : http://localhost:5000")
    print("🩺 Santé    : http://localhost:5000/api/health")
    print("📂 Catégories: http://localhost:5000/api/categories")
    print("==================================================")
    app.run(host="127.0.0.1", port=5000, debug=True)
