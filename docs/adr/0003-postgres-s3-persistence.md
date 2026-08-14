# Postgres plus S3-compatible object storage

Relational state (Accounts, Loop Sessions, cards, decision history, metadata) lives in PostgreSQL. Spec Artifacts and other binary/export payloads live in an S3-compatible object store (MinIO locally; R2/S3 in deploy), accessed through a storage port/adapter.

**Considered options:** SQLite-only; Postgres BYTEA for artifacts; filesystem-only blobs.

**Why:** Separates queryable workflow state from large artifacts early, matches a production-shaped student architecture, and keeps local/dev interchangeable via the S3 API.
