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
  seeds/
    001_mock_data.sql
```

`001_initial_schema.sql` creates the tables needed by the current frontend data model.

The later migrations add users, secure browser sessions, survey requests,
contact requests, rental applications, expiring password reset tokens, and
listing ownership for owner dashboards.

`001_mock_data.sql` inserts the current dummy data into PostgreSQL-friendly tables.

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

The frontend calls listing, authentication, renter-action, payment-quote, and
owner-management endpoints documented in `docs/API_CALLS_GUIDE.md`.

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

- Add migrations through a migration tool such as Prisma, Drizzle, Knex, node-pg-migrate, or Flyway.
- Add PostGIS if radius search, bounding-box search, or “near me” queries become important.
- Add verified owner onboarding instead of demo name matching.
- Add automated backups and a production migration runner before deployment.
