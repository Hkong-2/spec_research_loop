# Frontend (Next.js SPA)

Client SPA over the FastAPI API. See root `README.md`, [ADR 0007](../docs/adr/0007-orval-tanstack-query.md), and [ADR 0008](../docs/adr/0008-shadcn-tailwind.md).

## Layout

```
app/                 # thin App Router routes (client-heavy)
components/ui/       # shadcn/ui (Tailwind, zinc)
features/
  identity/          # sign-in / account UI
  idea/              # grilling UI + SSE demo panel
  research/
  spec/
  judgement/
lib/
  api/
    generated/       # Orval + TanStack Query (pnpm codegen)
    mutator.ts       # JWT Bearer fetch
    sse.ts           # hand-written SSE
```

## Run

```powershell
Copy-Item .env.example .env.local
pnpm install
pnpm dev
pnpm codegen   # backend must be up
```

## Tooling

- pnpm + Next.js App Router + Tailwind + shadcn/ui
- Orval generates React Query hooks from FastAPI OpenAPI
- SSE uses `fetch` + stream parse so Bearer JWT can be sent
