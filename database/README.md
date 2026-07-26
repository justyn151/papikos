# Papikos PostgreSQL transition

This folder prepares the database side of Papikos.

The important architecture is:

```text
React frontend
  -> HTTP API
  -> backend server
  -> PostgreSQL
```

Do not connect the React app directly to PostgreSQL. Database credentials must stay on the backend.

## Files

```text
database/
  migrations/
    001_initial_schema.sql
    002_auth_schema.sql
    003_sessions_schema.sql
    004_renter_actions_schema.sql
    005_password_resets_schema.sql
    006_owner_workflows_schema.sql
    007_normalize_facilities.sql
    008_normalize_locations.sql
    009_renter_request_context.sql
    010_admin_owner_system.sql
    011_owner_listing_content.sql
    012_custom_listing_content_and_demo_login.sql
  seeds/
    001_mock_data.sql
```

`001_initial_schema.sql` creates the tables needed by the current frontend data model.

The later migrations add users, secure browser sessions, survey requests,
contact requests, rental applications, expiring password reset tokens, and
listing ownership for owner dashboards, and normalized facility/rule catalogs.
Migration 008 completes area/campus relationships and normalizes nearby-campus
assignments while preserving the existing read shape. Migration 009 adds the
visitor, contact, and move-in context owners need to evaluate requests.
Migration 010 adds the admin role, owner verification, account activation, and
the draft/review/publish lifecycle for owner-managed listings.
Migration 011 adds one-room-type inventory, location notes, and inventory
timestamps. It builds on the existing ordered media, facility, rule, duration,
and payment tables used by the guided owner listing workflow.
Migration 012 adds per-listing custom facilities/rules and the development
pencari-kos account used by the unified demo login.

See [SCHEMA.md](SCHEMA.md) for the current physical model, normalization
decisions, and compatibility views.

`001_mock_data.sql` inserts the current dummy listings and development-only
admin/owner accounts into PostgreSQL-friendly tables.

## Run locally with psql

Create a database:

```bash
createdb papikos
```

Run every migration in order (the npm script uses `DATABASE_URL`):

```bash
DATABASE_URL=postgres://localhost/papikos npm run db:migrate
```

Run the seed:

```bash
psql papikos -f database/seeds/001_mock_data.sql
```

## Backend environment example

The backend, not Vite, should have a private database URL:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/papikos
```

The React frontend should only know the backend API URL:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Mapping to frontend types

The backend should transform SQL rows into the existing frontend shapes:

- `KosListing`
- `KosSearchRecord`
- `KosSearchResult`
- `SearchMetadata`

The frontend calls listing, authentication, renter-action, payment-quote,
owner-management, and admin-moderation endpoints documented in
`docs/API_CALLS_GUIDE.md`.

Core listing endpoints include:

- `GET /kos?featured=true`
- `GET /kos/:id`
- `GET /kos/search?...`
- `GET /search/metadata`

Set `VITE_API_BASE_URL` to switch listing reads from mock mode to the backend.

## Location data

The seed includes province-level Indonesia locations plus the current demo cities, areas, and campuses.

For production, the backend should own location data in PostgreSQL and periodically sync official administrative regions. The frontend should receive locations from `GET /search/metadata`, not from hardcoded mock files.

## Future improvements

- Add migrations through a migration tool such as Alembic or Flyway.
- Add PostGIS if radius search, bounding-box search, or “near me” queries become important.
- Add identity-document upload and a private review history for owner verification.
- Add automated backups and a production migration runner before deployment.
