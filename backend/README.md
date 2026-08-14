# Backend (FastAPI)

Modular monolith for SpecResearch Loop. See root `README.md` and `docs/adr/`.

## Layout

```
app/
  main.py                 # FastAPI app factory / router includes
  core/                   # settings, security helpers
  db/                     # engine, session
  ports/                  # LLM (and shared ports)
  adapters/
    llm/                  # concrete model providers
    storage/              # S3-compatible object store
  workers/                # reserved; SSE is in-request for now
  modules/
    identity/             # Accounts, auth (JWT)
    idea/                 # grilling / idea workflow (+ SSE demo)
    research/             # citations, related work
    spec/                 # Research Spec construction + artifacts metadata
    judgement/            # Judges + aggregator
alembic/                  # schema migrations
```

Each module: `api.py`, `service.py`, `models.py` (+ `ports/` when module-local).

## Run

```powershell
Copy-Item .env.example .env
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Requires `docker compose up -d` from the repo root (Postgres + MinIO). Schema is applied **only** via Alembic — the app does not `create_all`.

## Migrations

After changing SQLAlchemy models:

```powershell
uv run alembic revision --autogenerate -m "describe the change"
# review alembic/versions/*.py
uv run alembic upgrade head
```

## Tooling

- Python ≥ 3.12 + [uv](https://github.com/astral-sh/uv)
- PostgreSQL + S3-compatible store (MinIO locally)
- OpenAPI from FastAPI is the contract source for `frontend` codegen
