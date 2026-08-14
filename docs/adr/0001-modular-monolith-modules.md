# Modular monolith with five modules

Extended by [0009](./0009-loop-session-module.md): day-one modules also include `loop`.

We ship one FastAPI process as a modular monolith. Day-one modules are `identity`, `loop`, `idea`, `research`, `spec`, and `judgement`, each owning its HTTP API, services, and models under `backend/app/modules/<name>/`, with shared `core`, `db`, and optional `workers`.

**Considered options:** layered CRUD without module boundaries; fine-grained module-per-card; hexagonal-per-module from day one.

**Why:** The product workflow already splits into Idea / Research / Spec Construction / Judgement stages (`docs/for-human/loop.mmd`). Module folders keep those boundaries visible without the overhead of multiple deployable services for a student deliverable.
