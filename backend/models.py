"""
models.py — Rétrocompatibilité d'import
Permet `from models import db, Category, QA` tout en utilisant app/models.py
"""
from app.models import db, Category, QA, ChatSession, ChatMessage

__all__ = ["db", "Category", "QA", "ChatSession", "ChatMessage"]
