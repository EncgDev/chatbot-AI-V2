"""
app/models.py — Modèles SQLAlchemy pour NORA
Auteur : Yahya
Schéma : Category + QA (synchronisé avec init.sql de Soufiane)
V2     : ChatSession + ChatMessage (mémoire conversationnelle — TASKS.md §2.3)
"""
import uuid as uuid_lib

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import UUID

db = SQLAlchemy()


class Category(db.Model):
    """
    TABLE categories
    ─────────────────
    id   INT PRIMARY KEY
    name VARCHAR(80)
    """
    __tablename__ = "categories"

    id   = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)

    # Relation One-to-Many vers QA
    qas = db.relationship("QA", back_populates="category", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        """Sérialisation JSON — utilisée par GET /api/categories."""
        return {
            "id":       self.id,
            "name":     self.name,
            "qa_count": self.qas.count(),
        }

    def __repr__(self):
        return f"<Category {self.id}: {self.name}>"


class QA(db.Model):
    """
    TABLE QAs
    ─────────────────────────────────────────────
    id          SERIAL PRIMARY KEY
    question    TEXT NOT NULL
    response    TEXT NOT NULL
    category_id INT  NOT NULL  FK → categories(id)
    """
    __tablename__ = "qas"

    id          = db.Column(db.Integer, primary_key=True)
    question    = db.Column(db.Text,    nullable=False)
    response    = db.Column(db.Text,    nullable=False)
    category_id = db.Column(
        db.Integer,
        db.ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=False
    )

    # Relation inverse vers Category
    category = db.relationship("Category", back_populates="qas")

    def to_dict(self, include_category=False):
        """
        Sérialisation JSON — utilisée par :
          GET  /api/qas?category_id=N
          POST /api/chat/v1
          POST /api/chat/v2
        """
        data = {
            "id":          self.id,
            "question":    self.question,
            "response":    self.response,
            "category_id": self.category_id,
        }
        if include_category and self.category:
            data["category"] = self.category.to_dict()
        return data

    def __repr__(self):
        return f"<QA {self.id}: {self.question[:60]}>"


class ChatSession(db.Model):
    """
    TABLE chat_sessions  (V2 — mémoire conversationnelle, contrat TASKS.md §2.3)
    ──────────────────────────────────────────────────────────────────────────
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
    created_at  TIMESTAMP DEFAULT NOW()
    last_active TIMESTAMP DEFAULT NOW()
    """
    __tablename__ = "chat_sessions"

    id          = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    created_at  = db.Column(db.DateTime, server_default=db.func.now())
    last_active = db.Column(db.DateTime, server_default=db.func.now(),
                            onupdate=db.func.now())

    # Relation One-to-Many vers ChatMessage
    messages = db.relationship(
        "ChatMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at",
    )

    def __repr__(self):
        return f"<ChatSession {self.id}>"


class ChatMessage(db.Model):
    """
    TABLE chat_messages  (V2 — mémoire conversationnelle, contrat TASKS.md §2.3)
    ──────────────────────────────────────────────────────────────────────────
    id          SERIAL PRIMARY KEY
    session_id  UUID NOT NULL  FK → chat_sessions(id) ON DELETE CASCADE
    role        VARCHAR(10) CHECK (role IN ('user', 'nora'))
    content     TEXT NOT NULL
    version     VARCHAR(4)     -- 'v1' | 'v2' | NULL
    created_at  TIMESTAMP DEFAULT NOW()
    """
    __tablename__ = "chat_messages"

    id         = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    role       = db.Column(db.String(10), nullable=False)
    content    = db.Column(db.Text, nullable=False)
    version    = db.Column(db.String(4))
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # Relation inverse vers ChatSession
    session = db.relationship("ChatSession", back_populates="messages")

    def to_dict(self):
        """Sérialisation JSON — utilisée par GET /api/chat/sessions/<id> (contrat §2.2)."""
        return {
            "id":         self.id,
            "role":       self.role,
            "content":    self.content,
            "version":    self.version,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<ChatMessage {self.id} [{self.role}] {self.content[:40]}>"
