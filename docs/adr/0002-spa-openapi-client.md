---
status: superseded by ADR-0007
---

# SPA client over FastAPI with OpenAPI codegen

The Next.js app is a client-side SPA over FastAPI: FastAPI is the only real API. The browser uses a configurable API base URL (`NEXT_PUBLIC_API_BASE_URL` or equivalent). Types and the HTTP client are generated from FastAPI’s OpenAPI document into `frontend/lib/api`.

**Considered options:** Next.js as BFF (Route Handlers / server actions); hand-written fetch types; shared Zod package.

**Why:** Keeps domain and orchestration on the backend (where Loop Session state, judges, and streaming live) while giving the SPA honest, regeneratable contracts without maintaining a second API layer in Next.

Superseded by [0007](./0007-orval-tanstack-query.md): OpenAPI still is the contract, but generation is Orval + TanStack Query instead of openapi-typescript + hand fetch.
