"""
app/models.py — Modèles SQLAlchemy pour NORA
Auteur : Yahya
Schéma : Category + QA (synchronisé avec init.sql de Soufiane)
"""
from flask_sqlalchemy import SQLAlchemy

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
