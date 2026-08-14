"""Import every SQLAlchemy model so Alembic sees Base.metadata."""

from app.modules.identity.models import Account

__all__ = ["Account"]
