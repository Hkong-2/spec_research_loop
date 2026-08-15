"""Stage freeze / reset / project port (ADR 0013)."""

from typing import Protocol, runtime_checkable
from uuid import UUID


@runtime_checkable
class StagePort(Protocol):
    async def freeze(self, *, session_id: UUID, node: str, revision_id: UUID) -> None:
        """Clone working typed rows onto the new Stage Revision."""
        ...

    async def reset_working(
        self,
        *,
        session_id: UUID,
        node: str,
        from_revision_id: UUID | None,
    ) -> None:
        """Reset working typed rows from a Stage Revision (None = empty)."""
        ...

    async def project(self, *, session_id: UUID, node: str) -> dict:
        """Projector payload for Context Projection."""
        ...


class NoOpStagePort:
    async def freeze(self, *, session_id: UUID, node: str, revision_id: UUID) -> None:
        return None

    async def reset_working(
        self,
        *,
        session_id: UUID,
        node: str,
        from_revision_id: UUID | None,
    ) -> None:
        return None

    async def project(self, *, session_id: UUID, node: str) -> dict:
        return {}
