# Email/password Accounts with JWT Bearer

Identity is real Accounts from day one: email + password (hashed). The SPA authenticates with a JWT (or opaque) Bearer token in the `Authorization` header on API and SSE calls.

**Considered options:** anonymous device sessions; magic link only; HTTP-only cookie sessions; access JWT + refresh cookie.

**Why:** Cookie sessions fight configurable cross-origin API base URLs. Bearer tokens keep the SPA↔API boundary simple for a split Next/FastAPI setup while still requiring signed-in ownership of Loop Sessions.
