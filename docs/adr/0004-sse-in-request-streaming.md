# SSE with in-request async streaming

Long-running Loop Session work (grilling turns, citation loops, parallel Judges) streams progress and tokens to the SPA with Server-Sent Events (SSE). Day one, events are produced inside the FastAPI request via async generators / `StreamingResponse`. Ordinary commands and reads stay on REST/OpenAPI. A job queue can be extracted later if in-request streaming becomes a bottleneck.

**Considered options:** fully synchronous HTTP; WebSocket as the primary channel; Redis/ARQ/Celery from day one.

**Why:** SSE fits one-way server progress without duplex complexity; in-request production matches student scale while leaving a clear upgrade path to workers.
