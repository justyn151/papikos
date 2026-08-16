# Repository Guidelines

## Project Structure & Architecture

This repository is currently unscaffolded. Build it as an npm-workspaces monorepo:

- `apps/web/` — Next.js and React web application.
- `apps/mobile/` — Expo and React Native mobile application.
- `apps/desktop/` — Tauri and React desktop application; keep Rust limited to native integration.
- `apps/api/` — NestJS REST API with Prisma and PostgreSQL.
- `packages/` — shared domain types, generated API client, configuration, and platform-neutral logic.

Organize application code by product feature, not technical layer. Keep unit and integration tests beside their features; place cross-application end-to-end tests in `tests/`. Store platform-specific static files in each application's `public/` or `assets/` directory.

## Product Features & Scope

The first release is a kos rental marketplace for renters, property owners, and platform administrators. Implement only the following product areas unless a pull request explicitly approves a scope change.

### Included Features

- **Accounts and roles:** Support renter, owner, and administrator accounts. Enforce role-based authorization in the API and interfaces; hiding a client control is not sufficient authorization.
- **Properties and rooms:** Owners can create and manage properties, room types, prices, photos, amenities, house rules, locations, room availability, and listing publication state. Renters see only currently published listings.
- **Search and discovery:** Renters can browse listing details and search or filter by location, map area, budget, room type, amenities, and availability. Search state should be shareable across supported clients where platform conventions allow.
- **Favorites:** Renters can save and remove listings and view their saved set across devices.
- **Structured Q&A:** Renters can submit listing-related questions, and owners can answer them asynchronously inside the application. Keep questions attached to the relevant listing and preserve their status. This is not an unrestricted or real-time chat channel.
- **Booking requests:** Renters can request an available room. Owners can approve or reject a pending request, and permitted participants can cancel it. Preserve the status history (`pending`, `approved`, `rejected`, or `cancelled`) without charging the renter inside the application.
- **Owner earnings reporting:** Owners can see what an approved booking is worth to them: gross rent, the platform commission deducted, and the resulting net. These figures are reported from approved booking requests and published prices. Papikos still collects no money and stores no payment method, so this is reporting, not settlement — the renter always arranges payment directly with the owner.
- **Preference survey and matching:** Ask renters about budget, preferred location, room type, amenities, and house rules. Rank eligible listings with transparent, rule-based weighted scoring and show the main matching reasons. Do not use machine learning or behavioral profiling.
- **Administration and operations:** Administrators can verify users and listings, review moderation queues and reports, publish or suspend listings, inspect audit history, and view basic marketplace analytics. Record privileged changes so the responsible administrator and timestamp are traceable.

Phone, email, or WhatsApp contact links may be shown when product requirements allow, but they remain external contact methods and are not messaging integrations.

### Explicitly Out of Scope

Do not add the following without an approved product-scope change:

- Payment processing, deposits, refunds, invoices, or stored payment methods. Reporting owner earnings and the platform commission is in scope (see above); collecting, holding, or moving money is not, and no payment instrument may be stored.
- Real-time chat, direct messaging, presence indicators, or message delivery/read receipts.
- Ratings and reviews.
- Lease generation, recurring rent collection, tenant management, or property-maintenance workflows.
- Paid promotions, advertisements, sponsored ranking, or owner subscription plans.
- Machine-learning recommendations, behavioral profiling, or opaque ranking.
- Synchronization with third-party rental or booking marketplaces.

When an approved change adds, removes, or redefines a feature, update this section in the same pull request.

## Build, Test, and Development Commands

Once scaffolded, maintain these root commands as the contributor interface:

- `npm install` — install all workspace dependencies.
- `npm run dev` — run the standard development stack.
- `npm run dev:web`, `dev:mobile`, `dev:desktop`, or `dev:api` — run one application.
- `npm run build` — build all workspaces.
- `npm test` — run automated tests.
- `npm run lint` and `npm run typecheck` — enforce code quality.
- `docker compose up --build` — start the web app, API, PostgreSQL, and supporting services.

Run Expo and Tauri on the host against the containerized API. Native execution, signing, and packaging do not occur in runtime containers.

## Coding Style & API Contracts

Use strict TypeScript and two-space indentation. Use `kebab-case` file names, `PascalCase` for components and types, and `camelCase` for functions and variables. Keep modules focused and avoid unrelated refactors.

REST endpoints and their OpenAPI schema are the source of truth. Generate the shared TypeScript API client from that schema; never edit generated files manually. Make database changes through reviewed Prisma migrations.

## Testing Guidelines

Use Vitest for client and shared-package unit tests, Jest with Supertest for API tests, and Playwright for critical web journeys. Name tests `*.test.ts` or `*.spec.ts`. Cover success, validation, authorization, and meaningful failure paths. Every bug fix requires a regression test. Tests must not depend on production services or credentials.

## Commits, Pull Requests & Security

Use Conventional Commits, such as `feat(search): add price filtering`. Keep pull requests focused, explain behavior and verification, link related issues, and include screenshots for UI changes. Never commit secrets or local `.env` files. Maintain sanitized `.env.example` files and validate required variables at startup.
