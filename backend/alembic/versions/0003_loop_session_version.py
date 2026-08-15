"""add Loop Session aggregate version

Revision ID: 0003_loop_session_version
Revises: 0002_loop_session_tables
Create Date: 2026-08-16
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0003_loop_session_version"
down_revision: str | Sequence[str] | None = "0002_loop_session_tables"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "loop_sessions",
        sa.Column("version", sa.Integer(), server_default=sa.text("1"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("loop_sessions", "version")
