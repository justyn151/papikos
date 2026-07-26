# Papikos

Papikos is a responsive kos-search frontend built with React 19, TypeScript, Tailwind CSS, Vite, React Router, Leaflet, and OpenStreetMap.

The repository also includes a FastAPI/Python API backed by PostgreSQL. The complete
application can run locally with Docker Compose.

## Run with Docker

Build and start the frontend, API, and seeded PostgreSQL database:

```bash
docker compose up --build
```

Open `http://localhost:3000`. The frontend sends `/api` requests through Nginx
to the API container. For direct API inspection, use
`http://localhost:3001/api/health`. PostgreSQL is exposed on local port `5433`.

The schema and mock seed are applied automatically the first time the database
volume is created. To discard local container data and initialize it again:

```bash
docker compose down --volumes
docker compose up --build
```

Stop the containers without deleting database data with `docker compose down`.

## Run locally

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run lint
npm run build
npm test
npm run preview
```

Vite listens on the local network because the development command uses `--host`.

## Backend configuration

Copy `.env.example` to `.env.local` and set the backend URL:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

If `VITE_API_BASE_URL` is empty, Papikos automatically uses its local mock service and dummy listings.

To run the backend outside Docker, create a Python virtual environment, install
the backend requirements, configure `DATABASE_URL`, and start Uvicorn:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --app-dir backend --reload --port 8000
```

The Vite frontend reads its API URL from `.env.local`; the Python backend reads
its private database settings from `.env`.

## Routes

- `/` — homepage and featured carousel
- `/search?query=Yogyakarta` — location suggestions
- `/results?query=Yogyakarta` — filtered listings and map
- `/kos/:kosId` — full listing detail
- `/login` — unified renter, owner, or admin login
- `/register/:role` — renter or owner registration
- `/forgot-password` and `/reset-password` — password recovery
- `/activity` — renter request history
- `/owner` — owner property and request dashboard
- `/admin` — admin moderation and account dashboard
- `/legal/:document` — terms and privacy information

Production hosting must redirect unknown frontend paths to `index.html` so BrowserRouter routes continue to work after a refresh.

## Development demo accounts

The local seed creates two non-production accounts for testing the role
dashboards:

| Role | Phone | Password |
| --- | --- | --- |
| Admin | `081111111111` | `admin12345` |
| Pemilik Kos (Ibu Sari) | `082222222222` | `owner12345` |
| Pencari Kos | `083333333333` | `renter12345` |

The `Admin`, `Pemilik Kos`, and `Masuk` buttons in the header open their
respective login pages. Admin accounts cannot be created from the public
registration endpoint. The Docker demo build shows these credentials and an
three direct role buttons on the unified demo login page. Set
`VITE_SHOW_DEMO_ACCOUNTS=false` for any public production build.

## Documentation

- [Docker guide](docs/DOCKER_GUIDE.md) — beginner-friendly explanation of images, containers, Compose, ports, volumes, networking, daily commands, and troubleshooting.
- [Database design](database/SCHEMA.md) — normalized catalogs, relationships, compatibility views, and indexing decisions.
- [Backend-dev merge guide](docs/BACKEND_DEV_MERGE_GUIDE.md) — compatibility status and the future no-surprises merge procedure.
- [Product review](docs/PRODUCT_REVIEW.md) — Mamikos-informed workflow audit and the decisions implemented in Papikos.
- [Beginner guide](docs/BEGINNER_GUIDE.md) — current React structure, components, hooks, routing, and data flow.
- [API calls guide](docs/API_CALLS_GUIDE.md) — mock/remote services, endpoint contracts, environment variables, and backend handoff.
- [Current implementation](docs/CURRENT_IMPLEMENTATION.md) — concise inventory of implemented features and remaining placeholders.
