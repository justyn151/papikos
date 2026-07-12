# Papikos

Papikos is a responsive full-stack kos-search application built with a React 19 frontend (TypeScript, Tailwind CSS, Vite, React Router, Leaflet) and a Python FastAPI backend (PostgreSQL database, asyncpg).

---

## 1. Run with Docker (Recommended)

You can run the entire application stack (Frontend, Backend API, and Database) with a single command from the project root:

```bash
# Build the containers
docker compose build

# Start the services
docker compose up
```

Once running:
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **PostgreSQL Database**: Exposes port `5433` on host

---

## 2. Run locally (Manual Development)

If you prefer to run services manually without containerizing the frontend or backend:

### Step A: Start the Database
You can spin up only the Postgres container from the root:
```bash
docker compose up db
```
This runs the database on port `5433` and automatically runs initialization/seed scripts in `./backend/init-scripts`.

### Step B: Run the Backend
1. Navigate to the `backend` folder.
2. Set up a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On macOS/Linux
   venv\Scripts\activate     # On Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the API:
   ```bash
   uvicorn app.main:app --reload
   ```

### Step C: Run the Frontend
1. Navigate to the project root directory.
2. Configure your local environment file:
   ```bash
   copy .env.example .env.local
   ```
   Uncomment or set `VITE_API_BASE_URL=http://localhost:8000/api`.
3. Install dependencies and run Vite:
   ```bash
   npm install
   npm run dev
   ```

---

## 3. Code Verification

Run verification tasks before pushing changes:

### Frontend Checks
```bash
npm run lint
npm run build
```

### Backend Checks
Open `http://localhost:8000/docs` to ensure your FastAPI routes and schema generation do not throw errors.

---

## 4. Documentation Index

Detailed guides are available in the repository:

### Frontend Docs
- [Beginner Guide](docs/BEGINNER_GUIDE.md) — React architecture, state, and components.
- [API Calls Guide](docs/API_CALLS_GUIDE.md) — API layer connection and settings.

### Backend Docs
- [Beginner Guide](backend/docs/BEGINNER_GUIDE.md) — FastAPI onboarding and async database querying.
- [API Guide](backend/docs/API_GUIDE.md) — Backend JSON endpoint contracts.
- [Current Implementation](backend/docs/CURRENT_IMPLEMENTATION.md) — Details on databases, CORS, and settings.
