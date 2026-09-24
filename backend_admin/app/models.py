"""
backend_admin/app/models.py — Modèles SQLAlchemy du Back-Office Admin
Auteur : Yahya

⚠️ Règle d'intégration (TASKS_ADMIN.md §3) :
   - Le schéma BDD de Soufiane est la source de vérité — miroir EXACT ici.
   - CategoryAdmin / QAAdmin pointent vers les MÊMES tables que le chatbot
     public ("categories" / "QAs") — read/write CRUD gouverné par l'admin.
   - password_hash n'est JAMAIS exposé dans to_dict().
"""
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class AdminUser(db.Model):
    """TABLE admin_users (SQL : database/init.sql Section 4)."""
    __tablename__ = "admin_users"

    id            = db.Column(db.Integer, primary_key=True)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name     = db.Column(db.String(80))
    is_active     = db.Column(db.Boolean, nullable=False, default=True)
    created_at    = db.Column(db.DateTime, server_default=db.func.now())
    last_login    = db.Column(db.DateTime)

    sessions = db.relationship(
        "AdminSession", back_populates="user",
        cascade="all, delete-orphan", lazy="dynamic",
    )

    def to_dict(self):
        """Sérialisation publique — JAMAIS password_hash."""
        return {
            "id":         self.id,
            "email":      self.email,
            "full_name":  self.full_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }

    def __repr__(self):
        return f"<AdminUser {self.id}: {self.email}>"


class AdminSession(db.Model):
    """TABLE admin_sessions — token opaque stocké en BDD (révocable)."""
    __tablename__ = "admin_sessions"

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer,
                           db.ForeignKey("admin_users.id", ondelete="CASCADE"),
                           nullable=False)
    token      = db.Column(db.String(64), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    expires_at = db.Column(db.DateTime, nullable=False)
    revoked    = db.Column(db.Boolean, nullable=False, default=False)

    user = db.relationship("AdminUser", back_populates="sessions")

    def __repr__(self):
        return f"<AdminSession {self.id} user={self.user_id} revoked={self.revoked}>"


class CategoryAdmin(db.Model):
    """
    TABLE categories — PARTAGÉE avec le chatbot public.
    La lecture/écriture CRUD est gouvernée par cette API admin.
    """
    __tablename__ = "categories"

    id   = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)

    qas = db.relationship("QAAdmin", back_populates="category", lazy="dynamic")

    def to_dict(self):
        return {
            "id":       self.id,
            "name":     self.name,
            "qa_count": self.qas.count(),
        }


class QAAdmin(db.Model):
    """
    TABLE QAs — PARTAGÉE avec le chatbot public.
    ⚠️ Nom exact "QAs" (casse préservée dans init.sql → SQLAlchemy le cite).
    """
    __tablename__ = "QAs"

    id          = db.Column(db.Integer, primary_key=True)
    question    = db.Column(db.Text, nullable=False)
    response    = db.Column(db.Text, nullable=False)
    category_id = db.Column(db.Integer,
                            db.ForeignKey("categories.id", ondelete="CASCADE"),
                            nullable=False)

    category = db.relationship("CategoryAdmin", back_populates="qas")

    def to_dict(self):
        return {
            "id":          self.id,
            "question":    self.question,
            "response":    self.response,
            "category_id": self.category_id,
        }
