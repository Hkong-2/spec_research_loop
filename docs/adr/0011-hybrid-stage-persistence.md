# Hybrid persistence for confirmed stage output

Cards, Decisions, the Working Draft, Stage Revision metadata, and the Spec Version document live in `loop`. Queryable or verifiable attachments (Citations, claim–evidence links, experiment steps, Judge Runs) are typed rows in the workflow module that owns them, keyed by Stage Revision (`NULL` revision = working set). Narrative prose is JSONB on the Card or Stage Revision. Context Projection calls module projectors; it does not query another module’s tables. Confirm clones working rows onto a new Stage Revision; history rows are never updated in place.

**Considered options:** opaque JSON blobs in `loop` for every node; every field as a typed table with `loop` holding only pointers.

**Why:** TOPIC needs related-work tables, claim–evidence matrices, citation checks, and Spec Version diffs. Blobs make verification weak. Fully typed tables force every paragraph into schema. Hybrid keeps Cards relational and narrative cheap.
