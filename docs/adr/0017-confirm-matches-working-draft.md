# Confirm targets the Working Draft Workflow Node

`confirm` body must name the Loop Session’s current Working Draft node, else 409. Confirm freezes that node’s output slice, maybe marks descendants Stale, and appends a Decision. It does not switch the Working Draft to a different Loop Stage. The Grilling handoff after `idea_interpretation` is ADR 0018. Decomposition-owned Cards change through `idea` generate while `idea_decomposition` is the Working Draft, not by patching those Cards from another Loop Stage.

**Considered options:** confirm any node with current upstream; confirm any node and leave Working Draft unchanged.

**Why:** Working Draft is the node being edited (ADR 0010). Confirming a different node would freeze the wrong slice and leave unconfirmed edits stranded. Extends ADR 0012.
