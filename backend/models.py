"""
models.py — Modèles SQLAlchemy pour NORA
Auteur : Yahya / Soufiane
"""
from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Category(db.Model):
    """Modèle de catégorie de FAQ."""
    __tablename__ = "categories"

    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    icon        = db.Column(db.String(50))
    color       = db.Column(db.String(20))
    created_at  = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    # Relation avec les FAQs
    faqs = db.relationship(
        "FAQ",
        back_populates="category",
        lazy="dynamic",
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id":          self.id,
            "name":        self.name,
            "description": self.description,
            "icon":        self.icon,
            "color":       self.color,
            "faq_count":   self.faqs.count(),
        }

    def __repr__(self):
        return f"<Category {self.name}>"


class FAQ(db.Model):
    """Modèle de question/réponse."""
    __tablename__ = "faqs"

    id          = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(
        db.Integer,
        db.ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=False
    )
    question    = db.Column(db.Text, nullable=False)
    reponse     = db.Column(db.Text, nullable=False)
    filiere     = db.Column(db.String(100))
    source      = db.Column(db.String(200))
    keywords    = db.Column(db.Text)
    views       = db.Column(db.Integer, default=0)
    created_at  = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    # Relation inverse
    category = db.relationship("Category", back_populates="faqs")

    def to_dict(self, include_category=False):
        data = {
            "id":          self.id,
            "category_id": self.category_id,
            "question":    self.question,
            "reponse":     self.reponse,
            "filiere":     self.filiere,
            "source":      self.source,
            "keywords":    self.keywords,
            "views":       self.views,
        }
        if include_category and self.category:
            data["category"] = self.category.to_dict()
        return data

    def __repr__(self):
        return f"<FAQ {self.id}: {self.question[:50]}>"
