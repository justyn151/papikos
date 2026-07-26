# Papikos Current Implementation

Updated: 24 July 2026.

## Architecture

Papikos runs as three services:

```text
React browser app -> Nginx /api proxy -> FastAPI/asyncpg -> PostgreSQL
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
| `/login` | Unified password login with role-aware redirect |
| `/register/:role` | Account registration |
| `/forgot-password` | Request a reset link |
| `/reset-password` | Set a password using a one-time token |
| `/activity` | Renter request history |
| `/owner` | Owner properties, availability, and requests |
| `/admin` | Listing moderation, owner verification, and users |
| `/legal/:document` | Terms or privacy information |

## Backend API

The FastAPI API uses parameterized asyncpg queries and central JSON error
responses. Implemented endpoints cover:

- Health and database connectivity.
- Featured listings, detail records, filtering, location search, and nearby
  coordinates.
- Search metadata.
- Server-calculated payment quotes.
- Account registration, login, current session, and logout.
- Password-reset request and completion.
- Identity-aware survey, owner-contact, and rental-application creation.
- Renter activity history.
- Owner listing creation/editing, review submission, availability, and request handling.
- Admin marketplace summaries, listing moderation, owner verification, and account activation.

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
- Owner management endpoints require a verified `pemilik-kos` account and
  verify listing ownership.
- Admin endpoints require the non-publicly-registrable `admin` role.
- Deactivated accounts cannot log in and lose active sessions.

Local Docker exposes password reset links in the UI for development. Public
deployments must leave `EXPOSE_RESET_TOKEN=false` and deliver links through a
configured email or SMS provider.

## Persistent renter workflows

The detail page persists these actions:

- Survey request with requester identity, actual visitor identity, relationship,
  phone number, notes, and a future date/time.
- Owner question with a required message and preferred reply channel.
- Rental application with move-in date, notes, duration, payment method, total,
  and a complete JSON snapshot of the server quote.

The renter can inspect these records and their statuses on `/activity`.

## Owner workflow

The seeded Ibu Sari account is explicitly linked to its listings by user ID.
Verified owners create listings through five guided stages: identity/location,
room inventory and pricing, an ordered showcase gallery, facilities/rules, and
a final review. A listing represents one room type. Owners can save incomplete
drafts, upload and reorder photos or MP4 video tours, choose a photo cover, add
and edit listing-specific facilities/rules, see missing photo categories,
preview the renter-facing result, and submit only after the readiness checklist
reaches 100%. Availability remains a separate quick update.

Admins can approve or reject owner verification, disable accounts, inspect
platform requests, inspect full galleries, addresses, inventory, commercial
terms, facilities, rules, and shared readiness checks, then move listings
through draft, pending, published, rejected, and archived states. Rejections
require a readable, actionable reason. Readiness is advisory for admins: an
admin can explicitly publish an incomplete listing as an override, while owner
submission still requires 100% completion.

## Database migrations

1. Initial kos, location, media, facility, rules, and payment schema.
2. User accounts.
3. Browser sessions.
4. Renter actions.
5. Password resets.
6. Listing ownership and owner workflows.
7. Normalized facility/rule catalogs and backend compatibility views.
8. Completed location hierarchy and normalized nearby-campus assignments.
9. Added visitor identity, contact preference, and move-in context to renter requests.
10. Added admin access, owner verification, account activation, and listing moderation.
11. Added room-type inventory, address notes, inventory timestamps, and the
    structured owner listing workflow.
12. Added owner-editable custom facilities/rules and the unified demo login data.

## Intentionally excluded integrations

- Google, Facebook, and Apple login are not displayed until OAuth provider
  credentials and callback URLs are configured.
- Fake CAPTCHA controls were removed. Production can add a verified CAPTCHA or
  another abuse-prevention mechanism.
- Password reset delivery needs an email or SMS provider in production.
- Actual payment collection needs a payment gateway; the current backend
  creates trusted quotes and applications but does not charge money.
- Local Docker upload is implemented for JPG, PNG, and WebP files up to 5 MB
  and MP4 video tours up to 50 MB. Files persist in the `media-data` volume;
  production still needs object
  storage, malware scanning, and image resizing. Papikos stores gallery
  ordering, category, labels, and accessibility metadata in PostgreSQL.
- Identity-document collection and a permanent admin audit log are still future work.

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
