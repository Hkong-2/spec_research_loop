# SpecResearch Loop

A website that turns a vague research idea into a verified research specification through a human-in-the-loop workflow (grilling, related work, claims/evidence, experiment planning, and independent judges). The system evaluates readiness criteria; it does not guarantee conference acceptance.

## Language

**Research Spec**:
The structured, user-confirmed specification of a research idea (problem, gap, contribution, claims, evidence, experiment plan, and open questions).
_Avoid_: paper, proposal (unless the user explicitly means a submitted paper), document dump

**SpecResearch Loop**:
The product and end-to-end workflow that moves an idea through research and judgement until the user confirms a Research Spec.
_Avoid_: pipeline (alone), agent swarm, autopilot research

**Loop Session**:
One run of the SpecResearch Loop for a single research idea; the durable unit a user opens, saves, and resumes (cards, decision history, and draft Spec versions).
_Avoid_: session (alone), project, chat, conversation, thread

**Account**:
A signed-in person who owns Loop Sessions.
_Avoid_: user (when you mean the persisted identity), client, profile

**Spec Artifact**:
An exported or stored binary/document produced from a Loop Session (for example a Final Spec export), kept in object storage and referenced from Postgres.
_Avoid_: file, blob, attachment (when you mean the domain export)
