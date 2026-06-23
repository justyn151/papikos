# Papikos React Beginner Guide

This guide describes the project as it exists now. Papikos is a frontend application built with React, TypeScript, Tailwind CSS, React Router, Leaflet, and Vite.

## 1. The mental model

React builds the screen from components. Data normally travels downward through props, while user actions travel upward through callback functions.

```text
URL
  -> React Router chooses a page
  -> page asks kosService for data
  -> page stores the response in state
  -> page passes data to components
  -> components render the interface
```

The URL, rather than `HomePage` state, now decides which large page is visible. This means refreshing `/kos/101` still opens kos 101.

## 2. Important folders

```text
src/
  components/       Reusable interface pieces
  data/             Local mock data
  pages/            Route-level screens
  services/         API and mock-service boundary
  styles/           Global CSS
  types/            Shared TypeScript types
  utils/            Small reusable functions
```

Some important files are:

```text
src/App.tsx
src/pages/HomePage.tsx
src/pages/SearchRoutePage.tsx
src/pages/SearchResultsRoutePage.tsx
src/pages/KosDetailRoutePage.tsx
src/services/apiClient.ts
src/services/kosService.ts
```

## 3. Application startup

`src/main.tsx` finds the HTML element with ID `root` and asks React to render `App` inside it.

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`StrictMode` helps expose unsafe development behavior. It can intentionally run some logic twice during development, but it does not do that in a production build.

## 4. Routing in App.tsx

`BrowserRouter` observes the browser URL. `Routes` selects the matching `Route`.

```tsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/search" element={<SearchRoutePage />} />
  <Route path="/results" element={<SearchResultsRoutePage />} />
  <Route path="/kos/:kosId" element={<KosDetailRoutePage />} />
</Routes>
```

`/kos/:kosId` contains a URL parameter. For `/kos/101`, `useParams()` returns `kosId` as the string `"101"`.

`useNavigate()` returns a function for changing pages without reloading the website:

```tsx
const navigate = useNavigate()
navigate('/kos/' + listing.id)
```

`useSearchParams()` reads query strings. In `/results?query=Yogyakarta`, it reads the `query` value.

## 5. HomePage

`HomePage` coordinates the homepage only. It no longer renders the detail page conditionally.

Its important state includes:

- `featuredListings`: listings returned by the service.
- `isFeaturedLoading`: whether the request is still running.
- `featuredError`: a message if loading fails.
- `searchLocation`: text shown by the search launcher.
- `showHeaderSearch`: whether the compact header search is visible.

State is created with `useState`:

```tsx
const [featuredListings, setFeaturedListings] = useState<KosListing[]>([])
```

The first value is the current data. The second is the function that replaces it and asks React to render again.

## 6. Loading data with useEffect

`HomePage` loads featured listings after it mounts:

```tsx
useEffect(() => {
  let isCurrentRequest = true

  kosService.getFeatured().then((listings) => {
    if (isCurrentRequest) setFeaturedListings(listings)
  })

  return () => {
    isCurrentRequest = false
  }
}, [])
```

An empty dependency array means the effect begins once when this component is mounted. The cleanup prevents an old request from updating a component after the user leaves the page.

The UI has four useful states:

1. Loading: show a skeleton.
2. Error: show a readable failure message.
3. Empty: explain that no result was found.
4. Success: render the returned data.

## 7. Props and callbacks

`KosGallery` receives data and a callback:

```tsx
<KosGallery
  listings={featuredListings}
  onShowDetail={(listing) => navigate(`/kos/${listing.id}`)}
/>
```

`listings` is data flowing downward. `onShowDetail` is behavior supplied by the parent. When a card calls it, the route changes to the detail URL.

The gallery does not need to know how routing works. This makes it reusable and easier to test.

## 8. Search flow

The current flow is:

```text
Click search launcher
  -> /search
Type a location alias
  -> suggestions appear
Click a suggestion
  -> /results?query=canonical-value
kosService.search(...)
  -> cards and map markers render
Click a card or marker
  -> /kos/:kosId
```

Aliases are handled in `src/utils/searchSuggestions.ts`. For example, `jogja`, `jogjakarta`, and `yogya` can suggest `Yogyakarta`.

## 9. Search filters

`SearchFilters` owns temporary draft values while a panel is open. Pressing **Simpan** sends the draft to `SearchResultsPage` through `onChange`.

The applied filter type is `KosSearchFilters`:

```ts
type KosSearchFilters = {
  tags: string[]
  duration: RentalDuration | null
  minPrice: number | null
  maxPrice: number | null
  facilities: string[]
  rules: string[]
  availableOnly: boolean
}
```

Price inputs and the two-handle slider update the same `minPrice` and `maxPrice` values.

## 10. API service boundary

Pages do not import listing arrays directly. They call `kosService`:

```tsx
const results = await kosService.search({ query, filters })
```

`kosService` exposes the same methods in mock and remote modes. With no backend URL it reads `src/data`. With `VITE_API_BASE_URL` it sends HTTP requests.

This boundary is useful because components do not need to change when PostgreSQL and the backend become available.

## 11. Detail route

`KosDetailRoutePage` reads the ID, requests the listing, and handles invalid, loading, error, and success states.

`KosDetailPage` then owns interface-only state such as:

- Selected media.
- Lightbox visibility.
- Rental duration.
- Full-payment or DP selection.
- Payment breakdown modal.

This state belongs in the detail component because other pages do not need it.

## 12. Leaflet and OpenStreetMap

`KosResultsMap` uses:

- Leaflet as the map engine.
- React-Leaflet as React bindings.
- OpenStreetMap as the tile source.

Each dummy search record contains latitude and longitude. Filtered records become colored price markers. `MapViewport` uses `useMap()` to fit the view to visible markers and calls `invalidateSize()` when the draggable page split changes width.

No Google Maps API key is required.

## 13. TypeScript types

`KosListing` describes a complete detail-ready listing. `KosSearchRecord` contains search and map information. `KosSearchResult` joins both:

```ts
type KosSearchResult = {
  record: KosSearchRecord
  listing: KosListing
}
```

TypeScript checks that components and services agree about these shapes before the application is built.

`import type` imports a type for checking but removes it from the browser JavaScript.

## 14. Tailwind CSS

Most styling is written as utility classes:

```tsx
className="rounded-full bg-green-600 px-4 py-2 text-white"
```

Read them from left to right: rounded shape, green background, horizontal and vertical padding, then white text.

`src/styles/global.css` contains behavior that is awkward to express as utilities, including modal keyframes, the dual price slider, Leaflet markers, and global cursor rules.

## 15. Hooks used in this project

- `useState`: remembers changing UI data.
- `useEffect`: synchronizes with requests, observers, and browser APIs.
- `useRef`: keeps DOM elements or mutable drag values without rendering.
- `useNavigate`: changes routes.
- `useParams`: reads path parameters.
- `useSearchParams`: reads URL query parameters.
- `useMap`: accesses the Leaflet map instance.

Hooks must be called at the top level of a component, not inside conditions or loops.

## 16. Safe exercises

1. Add another search alias.
2. Add one facility to a dummy listing and filter by it.
3. Add a new route such as `/about`.
4. Add a retry button to an API error state.
5. Highlight a map marker when its listing card is hovered.

Run these after changes:

```bash
npm run lint
npm run build
```
