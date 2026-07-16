# Papikos Current Implementation

Updated: 16 July 2026.

## Architecture

Papikos runs as three services:

```text
React browser app -> Nginx /api proxy -> Express API -> PostgreSQL
```

Docker Compose builds the frontend and API, initializes PostgreSQL migrations
and seed data, waits for health checks, and preserves data in a named volume.

## Frontend

- React 19, TypeScript, Vite, Tailwind CSS, and React Router.
- Homepage, location search, listing filters, Leaflet map, kos details, and
  responsive media galleries.
- Loading, empty, missing-record, and request-error states.
- Local mock listing mode when `VITE_API_BASE_URL` is empty.
- PostgreSQL-backed remote mode when the API URL is configured.

Routes include:

| Route | Purpose |
| --- | --- |
| `/` | Homepage and featured kos |
| `/search` | Location/campus/area search |
| `/results` | Filtered results and map |
| `/kos/:id` | Listing details and renter actions |
| `/login/:role` | Password login |
| `/register/:role` | Account registration |
| `/forgot-password` | Request a reset link |
| `/reset-password` | Set a password using a one-time token |
| `/activity` | Renter request history |
| `/owner` | Owner request dashboard |
| `/legal/:document` | Terms or privacy information |

## Backend API

The Express API uses parameterized PostgreSQL queries and central JSON error
responses. Implemented endpoints cover:

- Health and database connectivity.
- Featured listings, detail records, filtering, location search, and nearby
  coordinates.
- Search metadata.
- Server-calculated payment quotes.
- Account registration, login, current session, and logout.
- Password-reset request and completion.
- Survey, owner-contact, and rental-application creation.
- Renter activity history.
- Owner inbox and authorized request status changes.

## Authentication and authorization

- Passwords use PBKDF2-SHA512 with a unique random salt.
- Login and registration create random server-side sessions.
- Only a SHA-256 hash of each session token is stored in PostgreSQL.
- The browser token uses an `HttpOnly`, `SameSite=Lax` cookie.
- Logout deletes the database session and expires the cookie.
- Password reset tokens are random, hashed in storage, one-time use, and expire
  after 30 minutes.
- Resetting a password invalidates all active sessions.
- Renter endpoints require a `pencari-kos` account.
- Owner inbox/status endpoints require a `pemilik-kos` account and verify that
  the request belongs to one of that owner's listings.

Local Docker exposes password reset links in the UI for development. Public
deployments must leave `EXPOSE_RESET_TOKEN=false` and deliver links through a
configured email or SMS provider.

## Persistent renter workflows

The detail page persists these actions:

- Survey request with a future date/time.
- Request to contact the owner.
- Rental application with duration, payment method, total, and a complete JSON
  snapshot of the server quote.

The renter can inspect these records and their statuses on `/activity`.

## Owner workflow

Owner accounts are linked to seeded listings when the account's full name
matches the listing's `owner_name`. The owner dashboard shows only requests for
linked listings and allows valid status transitions for surveys, contacts, and
rental applications.

This name-based link is suitable for the current demo dataset. A production
onboarding flow should verify ownership and assign `owner_user_id` explicitly.

## Database migrations

1. Initial kos, location, media, facility, rules, and payment schema.
2. User accounts.
3. Browser sessions.
4. Renter actions.
5. Password resets.
6. Listing ownership and owner workflows.

## Intentionally excluded integrations

- Google, Facebook, and Apple login are not displayed until OAuth provider
  credentials and callback URLs are configured.
- Fake CAPTCHA controls were removed. Production can add a verified CAPTCHA or
  another abuse-prevention mechanism.
- Password reset delivery needs an email or SMS provider in production.
- Actual payment collection needs a payment gateway; the current backend
  creates trusted quotes and applications but does not charge money.
- Owner listing creation/editing and media upload are not yet product screens.

## Validation

```bash
npm run lint
npm run build
npm test
docker compose config
```

End-to-end database validation additionally requires a running Docker engine:

```bash
docker compose up --build
```
