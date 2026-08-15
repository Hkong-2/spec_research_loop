# recompute-prepare resets only Stale or empty Workflow Nodes

`recompute-prepare(Loop Stage)` topo-gates on upstream Node Heads (all current). Inside the stage it resets working data only for **Stale or empty** Workflow Nodes from each node’s Node Head snapshot (a Stale Stage Revision is still that node’s last snapshot). Current nodes are left alone. Working Draft becomes the first Stale or empty Workflow Node in topo order. If every node in the stage is current, prepare returns 409.

**Considered options:** reset every node in the stage and always land on the first (rejected after Q16 A; that would force re-prompting interpretation to edit decomposition Cards); reject prepare unless the whole stage is Stale.

**Why:** Re-entering Grilling to change decomposition Cards should not throw away a current interpretation. Empty counts as “needs work,” so the same command also moves the Working Draft from a just-confirmed interpretation to an empty `idea_decomposition`. Extends ADR 0012. Supersedes the in-session pick that prepare replayed the whole Loop Stage.
