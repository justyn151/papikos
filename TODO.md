# Project TODO

Last updated: 17 August 2026

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
- [ ] Move owner property, room, pricing, facility, rule, photo, and availability management onto the API (the browser-local editor is a prototype stand-in).
- [ ] Move administrator verification, reporting, moderation, audit history, and analytics onto the API with server-enforced authorization.
- [ ] Derive owner earnings and the platform commission on the server from approved bookings, keeping the reporting-not-settlement boundary in `AGENTS.md`.

## Cross-Platform Clients

- [ ] Extract platform-neutral domain logic and generated API access into shared packages.
- [ ] Scaffold the Expo mobile application against the containerized API.
- [ ] Scaffold the Tauri desktop application and keep Rust limited to native integration.
- [ ] Define consistent deep-link and search-state behavior across web, mobile, and desktop.

## Product Quality

- [ ] Add a production media upload, moderation, and responsive-image pipeline, replacing the browser-local downscaled data URLs and their per-listing byte budget (and revisit video, which cannot fit in browser storage).
- [ ] Decide whether the photo dialog should force 16:9 like the carousel does,
      instead of fitting the whole photo: one uniform shape against never
      cropping what an owner shot. The switch is documented in
      `listing-gallery.tsx`.
- [ ] Move search onto the map: results as circles, "search this area" from the
      viewport, and a decision on how map bounds combine with the existing
      filters. The detail page and the owner's pin landed on 17 August 2026.
- [ ] Replace OpenStreetMap's public tiles before this is anything but a
      prototype — their tile policy rules out app traffic. One URL and one
      attribution string in `listing-map.tsx`, plus an API key in the
      environment for a keyed provider.
- [ ] Add accessibility audits, performance budgets, error monitoring, and API observability.
- [ ] Add integration coverage for authorization, validation, and meaningful API failure paths.
