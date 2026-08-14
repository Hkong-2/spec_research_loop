# Frontend (Next.js SPA)

Client SPA over the FastAPI API. See root `README.md` and `docs/adr/0002-spa-openapi-client.md`.

## Layout

```
app/                 # thin App Router routes (client-heavy)
features/
  identity/          # sign-in / account UI
  idea/              # grilling UI + SSE demo panel
  research/          # related-work UI
  spec/              # Research Spec construction UI
  judgement/         # Judges / aggregator UI
lib/
  api/               # fetch helpers + generated OpenAPI types
scripts/
  codegen.mjs        # openapi-typescript against running backend
```

## Run

```powershell
Copy-Item .env.example .env.local
pnpm install
pnpm dev
pnpm codegen   # backend must be up
```

## Tooling

- pnpm + Next.js App Router
- `NEXT_PUBLIC_API_BASE_URL` points at FastAPI (no Next rewrite BFF)
- SSE uses `fetch` + stream parse so Bearer JWT can be sent (EventSource cannot)
