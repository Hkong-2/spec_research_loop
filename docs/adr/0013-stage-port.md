# StagePort in shared ports

Freeze, reset-working, and Context Projection talk to workflow modules through a `StagePort` protocol in `app/ports/`, with no-op adapters until those modules own typed rows. `loop` passes `session` + Workflow Node + Stage Revision id; it never imports `idea` / `research` / `spec` / `judgement` tables. `main.py` binds each Workflow Node to a port.

**Considered options:** protocol inside `loop` with self-registration; confirm freezes JSONB only and add a port later.

**Why:** Same shape as the LLM and storage ports (ADR 0006, ADR 0003). Invalidation lives in `loop` (ADR 0009) while Citations and Judge Runs stay in workflow modules (ADR 0011). A port keeps that split testable on day one instead of teaching confirm to reach across tables.
