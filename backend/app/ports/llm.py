"""LLM port — modules depend on this, not on vendor SDKs."""

from typing import Protocol, runtime_checkable


class LlmCompleteError(Exception):
    """A completion could not be produced (missing config or vendor failure)."""


@runtime_checkable
class LlmPort(Protocol):
    async def complete(self, *, system: str, prompt: str, model: str | None = None) -> str:
        """Return a single completion string."""
        ...
