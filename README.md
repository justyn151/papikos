# Papikos

Papikos is a responsive kos-search frontend built with React 19, TypeScript, Tailwind CSS, Vite, React Router, Leaflet, and OpenStreetMap.

## Run locally

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run lint
npm run build
npm run preview
```

Vite listens on the local network because the development command uses `--host`.

## Backend configuration

Copy `.env.example` to `.env.local` and set the backend URL:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

If `VITE_API_BASE_URL` is empty, Papikos automatically uses its local mock service and dummy listings.

## Routes

- `/` — homepage and featured carousel
- `/search?query=Yogyakarta` — location suggestions
- `/results?query=Yogyakarta` — filtered listings and map
- `/kos/:kosId` — full listing detail

Production hosting must redirect unknown frontend paths to `index.html` so BrowserRouter routes continue to work after a refresh.

## Documentation

- [Beginner guide](docs/BEGINNER_GUIDE.md) — current React structure, components, hooks, routing, and data flow.
- [API calls guide](docs/API_CALLS_GUIDE.md) — mock/remote services, endpoint contracts, environment variables, and backend handoff.
- [Current implementation](docs/CURRENT_IMPLEMENTATION.md) — concise inventory of implemented features and remaining placeholders.
