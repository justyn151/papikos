# Papikos

Papikos is a cross-platform Indonesian kos marketplace in development. The current bilingual web prototype (English by default, light mode only) includes listing discovery, transparent preference matching, and complete kos detail pages with room, cost, location, verification, booking-request, and structured Q&A interactions.

Project tracking:

- [TODO.md](TODO.md) — prioritized upcoming work.
- [PROGRESS.md](PROGRESS.md) — completed milestones and current capabilities.

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

All property data is fictional and stored locally under `apps/web/src/features/listings/`. Locale, favorites, survey preferences, booking requests, questions, and reports use browser storage; search filters use URL parameters. No backend, authentication, payment processing, or external message delivery is connected yet.
