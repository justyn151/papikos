# Papikos Database Design

This document describes the current schema after all migrations, including the
normalization introduced by migrations 007 and 008 and workflow context added
by migration 009.

## Design goals

- Keep business data readable in SQL.
- Avoid storing the same label or rule hundreds of times.
- Keep relationships enforceable with foreign keys.
- Preserve the frontend JSON contract.
- Keep the current FastAPI and `backend-dev` read contracts compatible.

## Why categories are separate

A category and a facility are different concepts:

```text
Fasilitas kamar
  -> Kasur
  -> Lemari
  -> AC
```

If every facility assignment stored the text `Fasilitas kamar`, changing that
title would require updating many rows and inconsistent spellings could appear.
A separate category row stores the meaning once and lets facilities reference
it with a foreign key.

The original schema went too far in the other direction: it repeated the same
three category rows for every kos, repeated every facility name for every kos,
and stored highlighted facilities a second time. Migration 007 replaces that
duplication with shared catalogs.

## Facility model

```text
facility_categories
  id: kamar
  title: Fasilitas kamar
           |
           v
facility_catalog
  id: 1
  category_id: kamar
  name: Kasur
           |
           v
kos_facility_assignments
  kos_id: 101
  facility_id: 1
  is_highlighted: true
  sort_order: 1
  highlight_sort_order: 1
```

Tables:

- `facility_categories` stores each display category once.
- `facility_catalog` stores each facility name once.
- `kos_facility_assignments` is the many-to-many relationship between kos and
  facilities. `sort_order` controls its position inside the category, while
  `is_highlighted` and `highlight_sort_order` control the compact summary list.

For the 15-row demo dataset this changes the physical data from approximately:

```text
45 repeated category rows
150 repeated category-item rows
105 duplicate highlighted-facility rows
```

to:

```text
3 shared display categories (+ one fallback category)
10 shared facility definitions
150 lightweight assignments
```

The assignment rows are necessary: they express which facilities belong to
which kos. The repeated names and titles are not.

## Rule model

Rules follow the same pattern:

- `rule_catalog` stores each rule text once.
- `kos_rule_assignments` connects rules to kos and preserves display order.

This avoids repeating identical rule text for every listing.

## Compatibility views

Migration 007 exposes these read-only views:

- `kos_facilities`
- `kos_facility_categories`
- `kos_facility_category_items`
- `kos_rules`

Migration 008 also exposes `kos_nearby_campuses` as a compatibility view.

They reproduce the old column shapes from the normalized catalogs. The current
FastAPI and `backend-dev` `SELECT` queries can use them without duplicating
physical data.

New write code should use the normalized catalog and assignment tables. The
compatibility views are intentionally a transition boundary, not the preferred
write API.

## Other table groups

### Listings

- `kos_listings`: primary listing and map/search fields.
- `kos_payment_terms`: one authoritative payment policy per listing.
- `kos_rental_durations`: allowed rental periods.
- `kos_media`: ordered image/video metadata.
- `kos_campus_assignments`: ordered links between listings and campus records.

Payment terms remain separate because they form one cohesive policy that is
read and changed independently from listing presentation fields.

### Locations

`admin_locations` is a self-referencing hierarchy for provinces, cities,
areas, and campuses. Migration 008 completes the seeded campus catalog and
repairs missing city parents for areas and campuses. Nearby-campus data then
uses `kos_campus_assignments` foreign keys instead of repeating campus names.
The `kos_nearby_campuses` view keeps the previous readable output for existing
backend queries.

The expression uniqueness index treats a missing parent consistently;
migration 007 removes the older redundant uniqueness constraint.

### Accounts and workflows

- `users`, `user_sessions`, and `password_reset_tokens` handle accounts.
- `survey_requests`, `contact_requests`, and `rental_applications` persist
  renter actions.
- `owner_user_id` connects verified owner accounts to listings.

Session and password-reset tables store only token hashes. Workflow records
retain historical quote/status data instead of recalculating old submissions.
Migration 009 snapshots the actual survey visitor identity, reply preference,
and planned move-in context so owners can evaluate requests without guessing.

## Index policy

Indexes are kept for foreign-key traversal, listing filters, session/token
expiry, ownership, and ordered request history. Migration 007 removes explicit
email and phone indexes because their `UNIQUE` constraints already create
equivalent indexes.

Extra indexes should be justified with real query plans. More indexes are not
automatically faster: every index also increases storage and write cost.
