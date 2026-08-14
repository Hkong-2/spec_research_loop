# Orval + TanStack Query for the SPA API client

REST calls are generated from FastAPI OpenAPI with Orval (`client: react-query`) into `frontend/lib/api/generated`. A custom fetch mutator attaches JWT Bearer from localStorage and treats 401 as signed-out. SSE stays a hand-written helper — Orval does not own streaming endpoints.

**Status:** accepted (supersedes [0002](./0002-spa-openapi-client.md))

**Considered options:** keep openapi-typescript + manual fetch; Orval fetch-only without React Query; generate Zod from OpenAPI as well.

**Why:** One regeneratable client with query/mutation hooks matches the SPA-over-FastAPI split, while SSE (grilling/demo) remains a separate in-request stream (ADR 0004).
