# Preparing `backend-dev` for `experimental`

Status: `experimental` now has a parity-complete FastAPI backend. The branches
have **not** been merged.

## What changed before the merge

The Python backend in `backend/` uses the same FastAPI, asyncpg, Pydantic
settings, and Uvicorn foundation as `backend-dev`, then adds everything that
branch was missing:

- Registration, login, sessions, logout, and password reset.
- Featured listings, detail, typo-tolerant search, complete metadata, sorting,
  filters, and radius search.
- Server-authoritative payment quotes.
- Identity-aware survey, owner-contact, and rental workflows.
- Renter activity, owner inbox, ownership checks, and status updates.
- Docker health checks and the Nginx same-origin API proxy.

The former Node `server/` runtime has been removed after API integration tests
passed. Password hashing remains PBKDF2-SHA512 with the same parameters, so
accounts created by the earlier implementation remain valid.

## Database compatibility

Root migrations and seeds are the only schema source. Do not restore the
duplicate `backend/init-scripts` files from `backend-dev`.

Normalized physical tables include:

```text
facility_categories
facility_catalog
kos_facility_assignments
rule_catalog
kos_rule_assignments
kos_campus_assignments
```

Compatibility views preserve the read shapes used by the friend's branch:

```text
kos_facilities
kos_facility_categories
kos_facility_category_items
kos_rules
kos_nearby_campuses
```

## Future merge procedure

Wait for explicit approval. Then create a temporary integration branch and
merge without committing immediately:

```bash
git switch experimental
git switch -c integrate-backend-dev
git merge --no-commit --no-ff origin/backend-dev
```

Resolve conflicts in these directions:

| Area | Resolution |
| --- | --- |
| `backend/app/main.py` | Keep the parity-complete `experimental` routes; selectively incorporate useful docs/models from `backend-dev`. |
| `backend/app/config.py` | Keep all session, cookie, reset, timezone, CORS, and database settings from `experimental`. |
| `backend/app/database.py` | Keep the pooled connection and JSON codecs from `experimental`. |
| `backend/app/models.py` | The branch's response models may be retained if routes are wired to them without changing JSON contracts. |
| `backend/init-scripts/` | Remove; keep root migrations and seed. |
| `backend/compose.yaml` | Remove; root `compose.yaml` is authoritative. |
| Root frontend/Docker/database | Keep `experimental`, then review any genuinely independent changes manually. |

Do not accept either branch wholesale for `backend/`. The friend's branch has
useful response models and documentation, but its `main.py` would remove all
account and write workflows if it replaced the current file.

## Required validation after approval

```bash
npm run lint
npm run build
npm test
docker compose config
docker compose up --build
```

Then repeat typo search, metadata coverage, registration, cookie restoration,
password reset, representative survey, contact question, rental move-in date,
owner visibility, status updates, wrong-role rejection, and a clean database
migration/seed replay.
