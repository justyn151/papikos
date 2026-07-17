# Papikos Product Review

Updated: 17 July 2026.

This review compares the existing Papikos journeys with current public Mamikos
product guidance. It uses interaction patterns as a reference; Papikos keeps
its own branding, implementation, and data.

## Reference findings

Mamikos describes location search across cities, areas, campuses, stations,
stops, and addresses, followed by list/map results, filters, and sorting:

- https://help.mamikos.com/post/bagaimana-cara-cari-kos-di-mamikos
- https://help.mamikos.com/post/bagaimana-cara-menggunakan-filter-pencarian

Its survey guidance requires personal data and supports a representative with
their identity and relationship to the requester:

- https://help.mamikos.com/post/bagaimana-cara-mengajukan-survei-di-kos

It also recommends keeping owner communication inside the platform for safety:

- https://help.mamikos.com/post/bagaimana-jika-saya-ingin-survey-kos-yang-akan-disewa

## Problems found and decisions made

### Survey

Previously, clicking the action stored only a timestamp. The new workflow:

- Shows the authenticated requester's name, phone, and email.
- Records whether the requester or a representative will attend.
- Requires representative name, phone, and relationship when applicable.
- Requires at least two hours of notice.
- Accepts visit notes and exposes all relevant details to the authorized owner.

### Contact owner

Previously, the button created an empty request immediately. It now requires a
meaningful question and a preferred reply channel. The request and status stay
visible in Papikos. A real-time chat system is not claimed or simulated; that
would require conversation/message tables, delivery, unread state, moderation,
and notifications.

### Rental application

Previously, only duration and payment method were submitted. It now includes a
future move-in date, optional notes, visible requester identity, and an explicit
confirmation step. The server remains authoritative for the price quote.

### Search

Previously, the browse screen exposed only campus and area groups for eight demo
cities, even though the catalog also contained provinces and other locations.
It now exposes every `admin_locations` record using Province, City, Campus, and
Area tabs with progressive loading.

Suggestion and result matching now tolerate common aliases, punctuation, and
small spelling mistakes. Results can be sorted by recommendation, lowest price,
or highest price. Near-me results remain ordered by distance.

The current database contains 38 provinces plus the demo cities, areas, and
campuses. Nationwide city/regency coverage should come from a maintained
official administrative-data import, not a manually copied frontend list.

## Deliberately not added

- Fake owner chat or fake payment collection.
- Social login buttons without configured OAuth providers.
- Stations and transit stops without a maintained source and listing-distance
  relationships.
- Nationwide administrative names hardcoded in React.
- Automatic owner verification based only on a display name for production.

These would create misleading UI or unreliable data. They remain valid future
features once their backend and operational requirements exist.
