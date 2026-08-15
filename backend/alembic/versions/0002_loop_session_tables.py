"""loop session tables

Revision ID: 0002_loop_session_tables
Revises: 0001_create_accounts
Create Date: 2026-08-15
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002_loop_session_tables"
down_revision: Union[str, Sequence[str], None] = "0001_create_accounts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "loop_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=True),
        sa.Column("working_draft_node", sa.String(length=64), nullable=False),
        sa.Column("working_draft_narrative", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("produced_spec_version_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("valid_spec_version_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_loop_sessions_account_id"), "loop_sessions", ["account_id"], unique=False)

    op.create_table(
        "loop_cards",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("kind", sa.String(length=64), nullable=False),
        sa.Column("body", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["session_id"], ["loop_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_loop_cards_session_id"), "loop_cards", ["session_id"], unique=False)

    op.create_table(
        "loop_stage_revisions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("node", sa.String(length=64), nullable=False),
        sa.Column("revision_n", sa.Integer(), nullable=False),
        sa.Column("narrative", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("card_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("freeze_hash", sa.String(length=64), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["session_id"], ["loop_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_loop_stage_revisions_session_id"),
        "loop_stage_revisions",
        ["session_id"],
        unique=False,
    )

    op.create_table(
        "loop_node_heads",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("node", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("stage_revision_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["session_id"], ["loop_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["stage_revision_id"], ["loop_stage_revisions.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id", "node", name="uq_loop_node_heads_session_node"),
    )
    op.create_index(op.f("ix_loop_node_heads_session_id"), "loop_node_heads", ["session_id"], unique=False)

    op.create_table(
        "loop_decisions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("kind", sa.String(length=16), nullable=False),
        sa.Column("node", sa.String(length=64), nullable=True),
        sa.Column("stage_revision_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["session_id"], ["loop_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_loop_decisions_session_id"), "loop_decisions", ["session_id"], unique=False)

    op.create_table(
        "loop_spec_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("document", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["session_id"], ["loop_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_loop_spec_versions_session_id"),
        "loop_spec_versions",
        ["session_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_loop_spec_versions_session_id"), table_name="loop_spec_versions")
    op.drop_table("loop_spec_versions")
    op.drop_index(op.f("ix_loop_decisions_session_id"), table_name="loop_decisions")
    op.drop_table("loop_decisions")
    op.drop_index(op.f("ix_loop_node_heads_session_id"), table_name="loop_node_heads")
    op.drop_table("loop_node_heads")
    op.drop_index(op.f("ix_loop_stage_revisions_session_id"), table_name="loop_stage_revisions")
    op.drop_table("loop_stage_revisions")
    op.drop_index(op.f("ix_loop_cards_session_id"), table_name="loop_cards")
    op.drop_table("loop_cards")
    op.drop_index(op.f("ix_loop_sessions_account_id"), table_name="loop_sessions")
    op.drop_table("loop_sessions")
