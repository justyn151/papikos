# Development Progress

Last updated: 16 August 2026

## Current Prototype

Papikos currently ships as an owner-only deployed Next.js web prototype. It is bilingual, responsive, Docker-ready, and packaged as a finalized Cloudflare Worker through OpenNext.

There is still no backend. Browser storage acts as a shared prototype store, which is what lets a renter submission become a record the owner and administrator can actually act on.

Completed renter-facing capabilities:

- A dedicated search page with location search, room-type, price-range, availability, verification, and grouped amenity filters, live facet counts, and shareable search URLs.
- Nine fictional kos listings with owner-set discounts, local favorites, and transparent rule-based preference matching.
- Persistent light/dark themes, animated language switching, reduced-motion support, responsive desktop/mobile layouts, and map-contour visual texture.
- A dynamic detail route for every listing with a gallery, room comparisons, explained cost breakdowns, facilities, rules, approximate location, landmarks, and verification information.
- Browser-local booking requests with preserved status history, structured listing Q&A, reporting, favorites, and related listings.

Completed owner and administrator capabilities:

- An owner console with sidebar navigation, a dashboard covering earnings, occupancy, and demand, a kos list, a request inbox, and a Q&A inbox.
- A kos editor covering basics, photos, rooms, grouped amenities, standard and custom house rules, and the cost breakdown, with a reset back to the seeded data.
- An administrator console with a sectioned marketplace overview, verification, reports, publication and suspension controls, and an audit trail.

## Completed Milestones

### 16 August 2026 — Console Kos Cards

- Replaced the owner and administrator kos rows with the card renters already
  see on the homepage and in search: cover artwork, room type, verification,
  location, and price, with the console's own controls in the footer.
- Extracted the card artwork into one shared component, so the same kos cannot
  look like two different places depending on which surface renders it. The
  row thumbnail added the day before went with the rows it anchored.

### 15 August 2026 — Console Depth, Media, and Taxonomy

- Added owner earnings reporting: gross rent, the platform commission, and the net the owner receives, derived from approved requests and published prices. Papikos still collects no money and stores no payment method; `AGENTS.md` was amended in the same change.
- Added occupancy and demand summaries to the owner dashboard, and split the administrator overview into catalogue, requests, and moderation sections.
- Added photo upload to the kos editor: files are downscaled and re-encoded to fit browser storage, capped at four per listing, with cover selection and a full-storage guard. No video — one clip would exhaust the whole budget.
- Expanded amenities from six to twenty-two, grouped by facility category in both search and the editor, and added free-text custom house rules that sit alongside the standard set.
- Removed the "Kembali ke hasil" link: it always rendered whatever `?from=` said, so reaching the page from a console dropped the renter on the homepage. Browser back handles every entry point correctly.
- Added console list thumbnails and tighter row hierarchy.

### 14 August 2026 — Owner and Administrator Consoles

- Added the shared browser-local prototype store behind renter, owner, and administrator surfaces, with legacy-record migration.
- Added owner dashboard, kos list, request inbox, and Q&A inbox; administrator overview, verification, reports, moderation, and audit trail.
- Added the kos editor, owner-set discounts as a real price concept, per-cost explanations, sidebar console navigation, and the prototype role bar on every surface.
- References: `8205012` through `be280f1`.

### 13 August 2026 — Search and Accounts

- Added the dedicated `/kos` search page, the persistent header search bar, and the sign-in and registration pages.
- Reference: `234dd90` (`feat(web): add kos search page, shared header, and auth pages`).

### 27 July 2026 — Kos Detail Experience

- Added reusable `/kos/[id]` routes for all eight listings.
- Added room-level availability, costs, location privacy, owner verification, booking requests, Q&A, reports, and related alternatives.
- Refined room comparison, availability copy, animated booking-dialog feedback, and private prototype-safe Q&A confirmation.
- Reference: `b1fb53c` (`feat(web): add kos detail experience`).

### 27 July 2026 — Display Preferences and Motion

- Added a system-aware, browser-persisted light/dark theme across the homepage and detail experience.
- Added a sliding ID/EN selector with a reduced-motion-safe copy transition.
- Added complete booking-dialog entrance and delayed exit motion with trigger-focus restoration.

### 26 July 2026 — Discovery and Visual Refinement

- Built the interactive homepage prototype with local filtering, favorites, bilingual copy, and preference matching.
- Simplified the search hero and top navigation, standardized “Semua,” and added subtle motion and texture.
- References: `570c9df`, `3acd7f2`, and `90bf963`.

### 26 July 2026 — Hosting Reliability

- Added the OpenNext Cloudflare Worker build and finalized Wrangler bundle workflow.
- Resolved the previous Worker Error 1101 deployment failure.
- References: `b1b9594` and `d29b1e0`.

## Quality Baseline

- Strict TypeScript, ESLint, Vitest, Testing Library, and Playwright are wired into root commands.
- Automated journeys cover desktop and mobile search, language switching, preference matching, detail navigation, booking requests, structured Q&A, and the cross-role flows: a request travelling from renter to owner and back, an owner answer reaching the kos page, an administrator suspension leaving renter search, an owner edit reaching search and filtering, uploaded photos becoming the cover, and custom rules reaching renters.
- Production releases are built from the committed source, saved as Sites versions, and checked through Worker runtime smoke tests and production logs.
