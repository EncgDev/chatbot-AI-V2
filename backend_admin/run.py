"""
run.py — Lancement rapide du Backend Admin en développement local
Usage : python run.py
"""
import os
from app import create_app

os.environ["FLASK_ENV"] = "development"
app = create_app("development")

if __name__ == "__main__":
    print("==================================================")
    print("🔐 NORA Admin — Serveur de Développement Local")
    print("🌐 URL API : http://localhost:5001")
    print("🩺 Santé   : http://localhost:5001/api/admin/health")
    print("==================================================")
    app.run(host="127.0.0.1", port=5001, debug=True)
