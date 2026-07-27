# Development Progress

Last updated: 27 July 2026

## Current Prototype

Papikos currently ships as an owner-only deployed Next.js web prototype. It is bilingual, responsive, Docker-ready, and packaged as a finalized Cloudflare Worker through OpenNext.

Completed renter-facing capabilities:

- Location search, popular-city shortcuts, room-type filtering, and shareable search URLs.
- Eight fictional kos listings with local favorites and transparent rule-based preference matching.
- Subtle motion, reduced-motion support, responsive desktop/mobile layouts, and map-contour visual texture.
- A dynamic detail route for every listing with an abstract gallery, room comparisons, transparent cost breakdowns, facilities, rules, approximate location, landmarks, and verification information.
- Browser-local booking requests, structured listing Q&A, reporting, related listings, and preserved return-to-search navigation.

## Completed Milestones

### 27 July 2026 — Kos Detail Experience

- Added reusable `/kos/[id]` routes for all eight listings.
- Added room-level availability, costs, location privacy, owner verification, booking requests, Q&A, reports, and related alternatives.
- Refined room comparison, availability copy, CTA feedback, and private prototype-safe Q&A confirmation.
- Reference: `b1fb53c` (`feat(web): add kos detail experience`).

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
- Automated journeys cover desktop and mobile search, language switching, preference matching, detail navigation, booking requests, and structured Q&A.
- Production releases are built from the committed source, saved as Sites versions, and checked through Worker runtime smoke tests and production logs.
