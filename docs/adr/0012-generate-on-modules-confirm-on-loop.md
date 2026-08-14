# Generate on workflow modules, confirm on loop

The SPA calls `idea` / `research` / `spec` / `judgement` for generate/SSE. It calls `loop` for Loop Session CRUD, Decision history, confirm, and recompute-prepare (topo gate, reset working rows from the last valid Stage Revision, set the Working Draft node). `loop.confirm` is one in-process transaction: freeze, mint Stage Revision, compare to the current head, mark downstream Stale only if content changed, append a Decision. Confirming feasibility also mints a Spec Version.

**Considered options:** a `loop` facade that streams every generate; confirm endpoints on each workflow module that then call `loop.mark_stale`.

**Why:** SSE stays next to long-running work (ADR 0004). Snapshot plus invalidation must not split across modules (ADR 0009, ADR 0010).
