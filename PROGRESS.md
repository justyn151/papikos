# Development Progress

Last updated: 17 August 2026

## Current Prototype

Papikos currently ships as an owner-only deployed Next.js web prototype. It opens in English, switches to Indonesian, and is responsive, Docker-ready, and packaged as a finalized Cloudflare Worker through OpenNext.

There is still no backend. Browser storage acts as a shared prototype store, which is what lets a renter submission become a record the owner and administrator can actually act on.

Completed renter-facing capabilities:

- A dedicated search page with location search, room-type, price-range, availability, verification, and grouped amenity filters, live facet counts, and shareable search URLs.
- Nine fictional kos listings with owner-set discounts and local favorites.
- Animated ID/EN switching, reduced-motion support, and responsive desktop/mobile layouts. Dark mode is switched off but kept in the codebase; see the note in `preferences.tsx`.
- A dynamic detail route for every listing with a gallery, room comparisons, explained cost breakdowns, facilities, rules, approximate location, landmarks, and verification information.
- Browser-local booking requests with preserved status history, structured listing Q&A, reporting, favorites, and related listings.

Completed owner and administrator capabilities:

- An owner console with sidebar navigation, a dashboard covering earnings, occupancy, and demand, a kos list, a request inbox, and a Q&A inbox.
- A kos editor covering basics, stay terms, location privacy, photos, rooms (added, edited, and removed), grouped amenities, standard and custom house rules, and the cost breakdown, with a reset back to the seeded data.
- An administrator console with a sectioned marketplace overview, verification, reports, publication and suspension controls, and an audit trail.

## Completed Milestones

### 17 August 2026 — Homepage Detailing

- Replaced the hero's drawn map with the search field itself. The map promised
  a feature the app does not have, and the page's one job is to start a search.
  The city shortcuts moved in under it, so the separate "popular locations"
  strip and the gap it left are gone.
- Dropped the small blue all-caps eyebrows above the section headings, and the
  helper line under the headline that repeated what the button said.
- Removed the preference survey and rule-based matching. It was a quiz sitting
  in front of the same filters search already exposes, at the bottom of the
  page where nobody reached it, and the match badges it fed had no other
  source. `AGENTS.md` is amended in the same change.
- The header search hides on the homepage until the hero one has scrolled off
  the top, so the same control is never on screen twice, and reappears as the
  reader moves into the listings. Every other page carries it as before.
- The homepage is 2869px instead of 3777px, with the kos it is advertising
  visible without scrolling past a graphic.

### 17 August 2026 — The Kos Editor Reads as a Form, Not a Wall

- Split the editor into six sections shown one at a time — basics, rooms,
  photos, facilities and rules, costs, availability and location — instead of
  eight cards stacked down one page an owner had to scroll past to change a
  price. The tabs carry counts, so an empty photo section is visible without
  opening it.
- A validation failure takes the owner to the section holding the field that
  blocked it, rather than reporting it where they cannot see it.
- Fixed a horizontal overflow the section tabs exposed on mobile: the console's
  content column could not shrink below its widest child, so a scrolling strip
  stretched the whole page past the viewport.

### 17 August 2026 — Photos Say What They Show

- Every uploaded photo carries a tag — bedroom, bathroom, shared area,
  exterior, neighbourhood — picked in the editor from the gallery's own
  categories rather than a new list. It becomes the caption and the icon a
  renter sees, where an upload was previously filed as a bedroom whatever it
  was, and captioned "Owner photo 3".
- The caption chip now draws over real photos too, not only the generated
  artwork, so both look like the same gallery.

### 17 August 2026 — One Photo at a Time

- Raised photo quality: the long edge went from 720px to 1600px and quality
  from 0.6 to 0.82, so a photo holds up when it is opened full size, and the
  per-listing budget went from 1.5MB to 3MB to pay for it. The budget is what a
  listing runs out of now, at roughly a dozen photos rather than twenty.
- Photos that are not 16:9 keep everything they were shot with: the carousel
  frame stays 16:9 so the page does not resize as it steps, and the photo is
  fitted inside it over a blurred copy of itself. The dialog crops nothing
  either, on a frame sized as a slice of the viewport so a portrait shot gets
  the height it needs.

- Replaced the detail page's photo-plus-thumbnail-strip with a single centred
  carousel: arrows on the photo, dots beneath it, and a counter. The strip
  spent a third of the width on images too small to read and left the main one
  no bigger than a card.
- The photo opens full size in a dialog, which keeps its own arrows and closes
  on Escape; the page keeps whichever photo the dialog was left on.

### 17 August 2026 — English First, Light Only

- The app now opens in English rather than Indonesian, and the ID/EN switch
  stays: the second language is copy that is already written, so it costs
  nothing to keep.
- Dark mode is switched off. It was the expensive half of the pair — every
  surface had to be checked twice — and it is kept whole rather than deleted:
  the theme hook, its toggle, and every `dark:` class stay in place, inert,
  behind one commented block in `preferences.tsx`.
- A stored `dark` theme or the system preference is ignored rather than read,
  so a return visit cannot half-apply a theme nobody is maintaining.

### 17 August 2026 — The Kos Editor Becomes Real Management

- Rooms can be added, renamed, resized, re-typed, and removed, not only
  repriced. The override now carries the room list in full rather than a patch
  keyed by seeded ids, which is what a patch could never express.
- A room with a pending or approved request cannot be removed: the request
  stores the room id, and deleting it would leave the renter's record, the
  owner's inbox, and the earnings report pointing at a room that no longer
  exists. A kos also cannot drop to zero rooms.
- The headline price is derived from the cheapest room instead of being typed,
  so a card can no longer advertise a rate no room offers.
- Owners set a discount percentage rather than a discounted amount. The
  percentage is stored, the prices are derived from it, and the same percentage
  now comes off every room rate instead of a fixed rupiah amount that gave the
  pricier rooms a smaller cut than the badge promised.
- Photos went from four per kos to twenty, held inside a 1.5MB per-listing
  budget. The byte budget is the real limit — the count alone cannot keep a
  listing inside a 5MB origin — and both refusals are explained separately.
- Stay terms, city, approximate area, and privacy radius became editable, cost
  rows can be added and removed, and saving rejects an empty name, city,
  district, a room priced at zero, and a discount outside 1–90%.
- Cost rows carry the owner's explanation, which an added charge previously had
  no way to state: Papikos only ships seeded copy for the charges it knows
  about. A charge with neither an amount nor an explanation now says so instead
  of rendering an empty pill, and the note is no longer printed twice.
- Fixed the editor showing seeded data for an already-edited kos: browser
  storage is read after hydration, so the form initialised before the override
  arrived, and saving overwrote edits the owner never re-typed.

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
- Automated journeys cover desktop and mobile search, language switching, detail navigation, booking requests, structured Q&A, and the cross-role flows: a request travelling from renter to owner and back, an owner answer reaching the kos page, an administrator suspension leaving renter search, an owner edit reaching search and filtering, uploaded photos becoming the cover, and custom rules reaching renters.
- Production releases are built from the committed source, saved as Sites versions, and checked through Worker runtime smoke tests and production logs.
