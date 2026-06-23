# Papikos Current Frontend Implementation

Updated: 23 June 2026.

## Technology

- React 19 and TypeScript.
- Vite and Tailwind CSS.
- React Router with browser URLs.
- Leaflet, React-Leaflet, and OpenStreetMap.
- Mock/remote API service boundary.

## Routes

| URL | Screen |
| --- | --- |
| `/` | Homepage, search hero, and featured carousel |
| `/search?query=...` | Suggestion-first location search |
| `/results?query=...` | Listing results, filters, and resizable map |
| `/kos/:kosId` | Complete kos detail page |

Unknown routes redirect home. `ScrollToTop` smoothly returns route changes to the top. Hosting requires an SPA rewrite to `index.html`.

## Homepage

- Responsive Papikos header with a login placeholder.
- Search launcher moves into the sticky header after scrolling past the hero.
- Infinite draggable featured carousel with mouse momentum and arrow navigation.
- Expandable Papikos information section.
- Featured data loads through `kosService.getFeatured()`.

## Search

- Users select a suggestion instead of submitting arbitrary text.
- City, campus, and area suggestions come from service metadata.
- Aliases include examples such as Jogja, Jogjakarta, Yogya, UGM, and ITB.
- Canonical values are stored in the result URL.

## Results and filters

Results load through `kosService.search({ query, filters })`.

Implemented filters:

- Multiple gender/type selections.
- Rental duration.
- Minimum and maximum price with formatted fields and one dual-handle slider.
- Multiple facility selections.
- Multiple kos-rule selections.
- Available rooms only.

Filter panels have staged values, **Hapus** and **Simpan** actions, backdrop animation, and responsive modals for larger lists.

Cards display the complete address, availability, clickable facility chips, monthly price, and detail navigation.

## Map

- Uses OpenStreetMap tiles through Leaflet.
- No Google Maps API key is required.
- Dummy listings contain real approximate coordinates.
- Marker colors identify Putra, Putri, and Campur listings.
- Marker labels display compact prices.
- Popups show address, price, and a detail button.
- Visible markers update with filters.
- The map fits filtered results automatically.
- A draggable desktop divider resizes list and map panels.

## Detail page

- Loads a listing by URL ID through `kosService.getById()`.
- Large image/video viewer with navigation arrows.
- Horizontally scrollable thumbnail strip.
- Fullscreen media lightbox including video.
- Listing tag, rating, address, description, facilities, rules, owner, and availability.
- Sticky desktop price/payment card.
- Rental periods, full payment, DP, settlement, discounts, fees, and deposits.
- Animated payment breakdown modals.
- Survey, owner contact, and rental buttons currently provide frontend feedback only.

## Data model

`KosListing` is the detail-ready object. It includes categorized facilities, rental durations, payment terms, cover media, and an arbitrary media array. Multiple media items can use the same category.

`KosSearchRecord` contains search and map fields. `KosSearchResult` joins a search record to its complete listing.

All money values are integer rupiah. Coordinates are numeric latitude and longitude.

## API layer

`src/services/apiClient.ts` handles base URLs, JSON, and HTTP errors.

`src/services/kosService.ts` defines:

- `getFeatured()`
- `getById(id)`
- `search({ query, filters })`
- `getSearchMetadata()`

When `VITE_API_BASE_URL` is empty, the mock implementation reads local data. When configured, the remote implementation calls prepared backend endpoints.

## Loading and failures

- Homepage, results, and detail routes show loading skeletons.
- Request failures show readable messages.
- Search requests guard against stale async responses.
- Invalid and missing detail IDs have dedicated states.

## Responsive behavior

- Mobile layouts avoid horizontal page overflow.
- Search results and map stack vertically on smaller screens.
- Desktop uses a draggable split view.
- Filter controls wrap and facility/rule modals fit small screens.
- Detail columns collapse into a mobile layout.

## Current placeholders

- Login and registration are not implemented.
- Buttons do not yet create surveys, chats, or rental applications.
- Payment calculations are frontend demonstrations, not authoritative quotes.
- Dummy listings reuse a small image set and one local tour video.
- Search has no pagination or map-bound query.
- Map/card hover synchronization is not implemented.
- Remote responses have TypeScript expectations but no runtime schema validation.

## Validation

```bash
npm run lint
npm run build
```
