# Papikos

Papikos is a cross-platform Indonesian kos marketplace in development. This first prototype implements a polished, bilingual web homepage with local mock listings, on-page search, favorites, and transparent preference matching.

## Prerequisites

- Node.js 24 or newer
- npm 11 or newer
- Docker with Compose (optional)

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root scripts operate across npm workspaces:

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Install the Playwright browser once before running end-to-end tests:

```bash
npx playwright install chromium
```

## Docker

Build and run the production Next.js server:

```bash
docker compose up --build
```

The web container is available on port `3000`. Expo, Tauri, the NestJS API, and PostgreSQL will be added in later milestones.

## Prototype Notes

All property data is fictional and stored locally under `apps/web/src/features/home/`. Locale, favorites, and survey preferences use browser storage; search filters use URL parameters. No backend, authentication, payments, or real booking flow is connected yet.
