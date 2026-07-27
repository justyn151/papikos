# Project TODO

Last updated: 27 July 2026

This file tracks unfinished product work. Move completed items to [PROGRESS.md](PROGRESS.md) instead of leaving checked tasks here.

## Next: Platform Foundation

- [ ] Scaffold the NestJS API workspace with environment validation and health checks.
- [ ] Add PostgreSQL and Prisma with reviewed migrations for users, roles, properties, rooms, and publication state.
- [ ] Publish an OpenAPI schema and generate the shared TypeScript API client.
- [ ] Extend Docker Compose to run the web app, API, PostgreSQL, and required supporting services.
- [ ] Implement renter, owner, and administrator authentication with server-enforced authorization.

## Core Marketplace Flows

- [ ] Replace mock listing data with published API listings and real availability.
- [ ] Synchronize favorites across authenticated devices.
- [ ] Persist booking requests with pending, approved, rejected, and cancelled status history.
- [ ] Connect structured Q&A submissions to owner responses without introducing real-time chat.
- [ ] Build owner property, room, pricing, facility, rule, photo, and availability management.
- [ ] Build administrator verification, reporting, moderation, audit-history, and basic analytics views.

## Cross-Platform Clients

- [ ] Extract platform-neutral domain logic and generated API access into shared packages.
- [ ] Scaffold the Expo mobile application against the containerized API.
- [ ] Scaffold the Tauri desktop application and keep Rust limited to native integration.
- [ ] Define consistent deep-link and search-state behavior across web, mobile, and desktop.

## Product Quality

- [ ] Add a production media upload, moderation, and responsive-image pipeline.
- [ ] Integrate a privacy-safe map provider with approximate pre-booking locations.
- [ ] Add accessibility audits, performance budgets, error monitoring, and API observability.
- [ ] Add integration coverage for authorization, validation, and meaningful API failure paths.
