# SpecResearch Loop

A website that turns a vague research idea into a verified research specification through a human-in-the-loop workflow (grilling, related work, contribution, claims/evidence, experiment planning, and independent judges). The system evaluates readiness criteria; it does not guarantee conference acceptance.

## Language

**Research Spec**:
The structured, user-confirmed specification of a research idea (problem, gap, contribution, claims, evidence, experiment plan, and open questions).
_Avoid_: paper, proposal (unless the user explicitly means a submitted paper), document dump

**SpecResearch Loop**:
The product and end-to-end workflow that moves an idea through research and judgement until the user confirms a Research Spec.
_Avoid_: pipeline (alone), agent swarm, autopilot research

**Loop Session**:
One run of the SpecResearch Loop for a single research idea; the durable unit a user opens, saves, and resumes.
_Avoid_: session (alone), project, chat, conversation, thread

**Account**:
A signed-in person who owns Loop Sessions.
_Avoid_: user (when you mean the persisted identity), client, profile

**Spec Artifact**:
An exported or stored binary/document produced from a Loop Session (for example a Final Spec export), kept in object storage and referenced from Postgres.
_Avoid_: file, blob, attachment (when you mean the domain export)

**Decision**:
A recorded user choice in a Loop Session (confirm, edit, pick an option, or revert).
_Avoid_: event, log entry, chat message

**Stage Revision**:
An immutable, user-confirmed snapshot of one workflow node's output.
_Avoid_: commit, checkpoint, save (alone)

**Spec Version**:
An immutable assembled Research Spec taken from valid Stage Revisions at one moment.
_Avoid_: draft (alone), document, latest spec

**Produced Spec Version**:
The most recently minted Spec Version in a Loop Session; it may be stale after an upstream change.
_Avoid_: latest spec (alone)

**Valid Spec Version**:
The Produced Spec Version when it is not stale; otherwise the Loop Session has none until Spec Construction is recomputed and confirmed.
_Avoid_: current spec, head

**Working Draft**:
The session's current editing DAG node plus narrative JSONB. In-progress typed attachments are working rows with no Stage Revision. Navigating away keeps both; confirming a change against the current Stage Revision marks downstream nodes Stale.
_Avoid_: temp, cache, unsaved changes

**Loop Stage**:
A user-facing unit the user confirms or recomputes: Grilling, Related work, Contribution, Claims/evidence, Experiment planning, Independent judges, Readiness.
_Avoid_: step, bước, pipeline stage (when you mean this UI unit)

**Card**:
A first-class piece of the idea that keeps the same identity across Loop Stages (problem, research question, gap, contribution, claim, evidence, constraint, open question). Later stages attach research and spec data to it; a Stage Revision freezes the card body at confirm time.
_Avoid_: sticky note, field, ticket, citation (citations are not Cards)

**Citation**:
A stored source record in a Loop Session, optionally linked to Cards. It is not a Card.
_Avoid_: paper (when you mean this record), source (alone), blob

**Judge Run**:
One Judge's immutable evaluation of a Spec Version.
_Avoid_: review, score, feedback (when you mean this stored run)

**Stale**:
A Stage Revision or Spec Version whose upstream inputs have changed. It remains for history and diff; it is not used as input.
_Avoid_: deleted, invalid, outdated (when you mean this state)

**Context Projection**:
The payload assembled for a generate or Judge run from valid upstream Stage Revisions plus the Working Draft of the node being run.
_Avoid_: context (alone), prompt, RAG dump
