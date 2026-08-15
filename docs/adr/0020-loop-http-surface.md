# Loop HTTP surface this increment

`loop` exposes session CRUD (no delete), Working Draft PATCH, Cards, Decisions, confirm, and recompute-prepare under `/api/loop`. Bearer on every route except `/health`. Another Account’s Loop Session id is **404**, same as missing. Card POST/PATCH is allowed only when the Working Draft is that Card kind’s owning Workflow Node (else 409). Confirm does not call `idea`; the response carries the new Working Draft. No `/context`, revert, or Spec Artifact upload this increment.

**Considered options:** Card writes in-process only until `idea` exists; 403 for cross-Account ids; session CRUD without confirm/prepare.

**Why:** Tests must freeze a decomposition slice without a real generate. 404 avoids leaking that a Loop Session exists. Confirm staying off the LLM keeps ADR 0012. Extends ADR 0009.
