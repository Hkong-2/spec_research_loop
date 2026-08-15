# PATCH Working Draft onto a current Workflow Node

`PATCH` Working Draft may point at a current Workflow Node when that node’s upstream Node Heads are current. It does not reset working rows, does not mark Stale, and does not generate. After the pointer moves, `idea` generate and `confirm` work as usual. `recompute-prepare` stays “first Stale or empty node in this Loop Stage” (ADR 0016) and still 409s when the whole stage is current.

**Considered options:** `prepare(..., force=true)` to replay the whole Loop Stage; no way to reopen a current node this increment.

**Why:** A finished Grilling Loop Stage is otherwise write-once: interpretation has no upstream, so it never becomes Stale by itself, and prepare will not land on a current node. The PATCH itself is not a change.
