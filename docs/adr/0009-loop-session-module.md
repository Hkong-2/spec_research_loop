# Loop module owns Loop Session orchestration

We add `loop` beside `identity`, `idea`, `research`, `spec`, and `judgement`. It owns Loop Session identity, Cards, Produced vs Valid Spec Version pointers, Decision history, the Working Draft, Stage Revision metadata, stale invalidation, and Context Projection. Workflow modules own typed attachments for their nodes and expose projectors; they reference a Loop Session by id.

SPA calls `loop` for session CRUD, history, confirm, and recompute-prepare. SPA calls `idea` / `research` / `spec` / `judgement` for generate/SSE. Confirm is an in-process transaction in `loop` (freeze → mint Stage Revision → maybe stale downstream → append Decision).

**Considered options:** put this in `idea` (session starts there); put it in `spec` (the Research Spec is the product); a shared kernel with no HTTP module.

**Why:** Invalidation and Context Projection cut across stages. Owning them in `idea` or `spec` inverts dependencies. A thin `loop` module keeps resume, history, and recompute on the backend without turning Judges or citation search into orchestration.
