# Papikos React Beginner Guide

This guide explains how the current Papikos frontend works. It is written for a beginner, so it explains React ideas slowly instead of assuming you already know the words.

Papikos is currently a frontend-only React app. It uses local TypeScript mock data for now, but it is already shaped so a backend API can later return the same kind of JSON from PostgreSQL.

## 1. The big idea

React does not usually edit the page manually one element at a time. Instead:

1. Components describe what the screen should look like.
2. State stores values that can change.
3. Events, like clicks and typing, update state or change the route.
4. React runs the component again.
5. React updates the browser page to match the new result.

The current app flow is roughly:

```text
Browser URL
  -> App.tsx chooses a route
  -> route page asks kosService for data
  -> page stores loading / success / error in state
  -> page passes data to components
  -> components render the UI
```

The important difference from the older version is this:

Before, `HomePage` used state like `selectedKos` to decide whether to show the detail page.

Now, React Router controls the main page changes. For example:

```text
/             -> homepage
/search       -> search suggestion page
/results?...  -> search results page
/kos/101      -> detail page for kos 101
```

That is better because refreshing `/kos/101` still opens the same kos detail page.

## 2. Important vocabulary

### Component

A component is a function that returns JSX.

```tsx
function Greeting() {
  return <h1>Hello</h1>
}
```

Component names start with a capital letter. Components let us split the interface into smaller pieces such as `Header`, `SearchHero`, `KosGallery`, and `KosDetailPage`.

### JSX

JSX looks like HTML, but it lives inside TypeScript/JavaScript.

```tsx
const appName = 'Papikos'

return <h1>{appName}</h1>
```

Curly braces mean “run this JavaScript expression here.”

Useful JSX rules:

- Use `className`, not `class`.
- Use `onClick`, not `onclick`.
- Components must return one parent value.
- Tags must be closed.

### Props

Props are values passed from a parent component to a child component.

```tsx
<KosGallery
  listings={featuredListings}
  onShowDetail={(listing) => navigate(`/kos/${listing.id}`)}
/>
```

Here:

- `listings` is data.
- `onShowDetail` is a function.

The child receives them and uses them, but the child does not own them.

### State

State is data that belongs to a component and can change while the app is running.

```tsx
const [isLoading, setIsLoading] = useState(true)
```

This creates two things:

- `isLoading`: the current value.
- `setIsLoading`: the function used to change it.

When you call a setter, React renders again.

Do this:

```tsx
setIsLoading(false)
```

Do not do this:

```tsx
isLoading = false
```

React needs the setter so it knows the screen should update.

### Hook

A hook is a React function that starts with `use`, such as:

- `useState`
- `useEffect`
- `useRef`
- `useNavigate`
- `useParams`
- `useSearchParams`

Hooks must be called at the top level of a component, not inside `if`, loops, or nested functions.

## 3. Project folders

The project is organized like this:

```text
src/
  components/   Reusable UI pieces
  data/         Temporary mock data
  pages/        Route-level screens
  services/     API/mock service layer
  styles/       Global CSS
  types/        TypeScript data shapes
  utils/        Small helper functions
```

This separation helps you know where things belong:

- A component displays UI.
- A page combines components into a screen.
- A service loads data.
- A type describes the shape of data.
- A utility does a small reusable calculation.

## 4. Application startup

The app starts in `src/main.tsx`.

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

What this means:

- `document.getElementById('root')` finds the `<div id="root"></div>` in `index.html`.
- `createRoot(...)` tells React this is where the app should live.
- `<App />` is the first component.
- `StrictMode` enables extra development checks.

The `!` after `getElementById('root')` is a TypeScript non-null assertion. It means: “I know this element exists.” It is safe here because `index.html` contains it.

## 5. Routing in App.tsx

`src/App.tsx` decides which page appears for each URL.

```tsx
<BrowserRouter>
  <ScrollToTop />
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/search" element={<SearchRoutePage />} />
    <Route path="/results" element={<SearchResultsRoutePage />} />
    <Route path="/kos/:kosId" element={<KosDetailRoutePage />} />
    <Route path="*" element={<Navigate replace to="/" />} />
  </Routes>
</BrowserRouter>
```

`BrowserRouter` lets React Router watch the browser URL. `Routes` checks the current URL and chooses one matching `Route`.

For `/kos/101`, the route `/kos/:kosId` matches and `kosId` is `"101"`.

```tsx
const { kosId } = useParams()
const listingId = Number(kosId)
```

URL parameters are strings, so the code converts the ID into a number.

`ScrollToTop` watches the URL and smoothly scrolls to the top when the route changes.

## 6. HomePage.tsx

`HomePage` coordinates the homepage. It loads data, tracks a few UI states, and passes props to child components.

Important state:

```tsx
const [searchLocation, setSearchLocation] = useState('')
const [searchMessage, setSearchMessage] = useState(
  'Coba cari lokasi kampus, kantor, atau area favoritmu.',
)
const [showHeaderSearch, setShowHeaderSearch] = useState(false)
const [featuredListings, setFeaturedListings] = useState<KosListing[]>([])
const [isFeaturedLoading, setIsFeaturedLoading] = useState(true)
const [featuredError, setFeaturedError] = useState('')
```

Each state has one clear job:

- `searchLocation`: text shown in the search launcher.
- `searchMessage`: helper message under the hero search.
- `showHeaderSearch`: whether compact header search is visible.
- `featuredListings`: featured kos data for the carousel.
- `isFeaturedLoading`: whether featured data is still loading.
- `featuredError`: error text if loading fails.

`HomePage` loads featured listings with:

```tsx
useEffect(() => {
  let isCurrentRequest = true

  kosService
    .getFeatured()
    .then((listings) => {
      if (isCurrentRequest) setFeaturedListings(listings)
    })
    .catch(() => {
      if (isCurrentRequest) setFeaturedError('Rekomendasi kos belum dapat dimuat.')
    })
    .finally(() => {
      if (isCurrentRequest) setIsFeaturedLoading(false)
    })

  return () => {
    isCurrentRequest = false
  }
}, [])
```

The empty dependency array `[]` means this effect runs once when `HomePage` appears.

The `isCurrentRequest` variable prevents an old request from updating state after the component is gone.

## 7. How “Lihat detail” opens the detail page

`HomePage` renders:

```tsx
<KosGallery
  listings={featuredListings}
  onShowDetail={(listing) => navigate(`/kos/${listing.id}`)}
/>
```

`KosGallery` receives `onShowDetail` as a prop.

Inside `KosGallery`, the button calls:

```tsx
onShowDetail(listing)
```

The click sequence is:

```text
User clicks "Lihat detail"
  -> KosGallery calls onShowDetail(listing)
  -> HomePage's function runs
  -> navigate(`/kos/${listing.id}`)
  -> URL changes to /kos/101
  -> App.tsx route matches /kos/:kosId
  -> KosDetailRoutePage renders
  -> KosDetailRoutePage loads data for ID 101
  -> KosDetailPage displays the listing
```

So `useState` does not magically know that a button was clicked. The click handler explicitly calls a function. That function changes either state or the route.

## 8. KosDetailRoutePage.tsx

`KosDetailRoutePage` is the route-level loader for the detail page.

It mainly:

1. Reads the ID from the URL.
2. Loads the matching kos.
3. Handles loading/error/not-found states.
4. Passes the result to `KosDetailPage`.

It has state:

```tsx
const [listing, setListing] = useState<KosListing | null>(null)
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState('')
```

When successful:

```tsx
<KosDetailPage kos={listing} onBack={() => navigate(-1)} />
```

`kos` is data passed downward. `onBack` is behavior passed downward.

## 9. KosDetailPage.tsx

`KosDetailPage` displays one complete kos.

Its props are:

```tsx
type KosDetailPageProps = {
  kos: KosListing
  onBack: () => void
}
```

Local state inside `KosDetailPage` controls only the detail page:

- `activeMediaId`: selected image/video.
- `actionStatus`: feedback after survey/contact buttons.
- `rentalStatus`: feedback after “Ajukan sewa”.
- `rentalMonths`: selected rental duration.
- `paymentChoice`: full payment or DP.
- `breakdownType`: which payment modal is open.
- `isLightboxOpen`: whether big media preview is open.

This is a useful React rule:

> Put state in the lowest component that needs it.

The homepage does not need to know which thumbnail is selected, so that state stays inside `KosDetailPage`.

## 10. KosGallery.tsx

`KosGallery` is the carousel on the homepage.

It receives:

```tsx
type KosGalleryProps = {
  listings: KosListing[]
  onShowDetail: (kos: KosListing) => void
}
```

The gallery does not load data itself. It only receives `listings`.

The gallery also does not decide how detail navigation works. It only calls `onShowDetail(listing)`.

Important gallery state includes:

- `activeIndex`: which listing is currently centered.
- `selectedKosTitle`: helper text shown under the section title.
- `baseOffset`: base horizontal position of the carousel track.
- `slideStep`: distance between cards.
- `dragOffset`: temporary movement while dragging.
- `isDragging`: whether the mouse/pointer is dragging.
- `shouldAnimate`: whether CSS transition should be active.
- `pendingDirection`: whether a next/previous/reset animation is in progress.
- `emphasizedCardIndex`: which visible card is visually “closer”.

The carousel also uses refs for DOM elements and pointer values. Refs can change without rerendering, which is useful for drag speed and pointer positions.

## 11. Search flow

The current search flow is:

```text
Click search launcher
  -> /search
Type a location
  -> suggestions appear
Click a suggestion
  -> /results?query=...
SearchResultsPage loads matching kos
Click card / map marker / facility tag
  -> /kos/:kosId
```

The user chooses a suggestion instead of submitting random text directly. This allows aliases like `jogja`, `jogjakarta`, and `yogya`.

The current frontend search metadata is still mock data. Later, the backend should provide complete administrative-location metadata from PostgreSQL.

## 12. Search results and filters

`SearchResultsRoutePage` reads the URL query:

```tsx
const [searchParams] = useSearchParams()
const query = searchParams.get('query')?.trim() ?? ''
```

If there is no query, it redirects to `/search`.

The results page applies filters using:

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

When filters change, the page requests results again through:

```tsx
kosService.search({ query, filters })
```

## 13. API service layer

Components do not import database data directly. They call `kosService`.

```tsx
const listings = await kosService.getFeatured()
const listing = await kosService.getById(101)
const results = await kosService.search({ query, filters })
```

The service has two modes:

- Mock mode: with no `VITE_API_BASE_URL`, it reads local `src/data`.
- Remote API mode: with `VITE_API_BASE_URL`, it calls backend endpoints.

Later, your backend can read PostgreSQL and return JSON matching the TypeScript types.

Important point:

> The React frontend should not connect directly to PostgreSQL.

The normal structure is:

```text
React frontend
  -> HTTP JSON API
  -> backend server
  -> PostgreSQL
```

## 14. TypeScript types

`src/types/kos.ts` describes a full kos listing.

`id` is important because it gives each kos a stable identity. It is used for:

- URLs like `/kos/101`.
- React list keys.
- Finding one listing from an array.
- Matching search records to detail records.
- Later matching frontend data to PostgreSQL rows.

In PostgreSQL, this would usually map to a primary key.

## 15. Leaflet and OpenStreetMap

The results page uses Leaflet with OpenStreetMap tiles.

The map receives filtered search results. Each result has coordinates:

```ts
coordinates: {
  lat: number
  lng: number
}
```

Those coordinates become map markers.

The app does not need a Google Maps API key because OpenStreetMap tiles are used.

## 16. Tailwind CSS

Most styling is written using Tailwind classes.

```tsx
className="rounded-full bg-green-600 px-5 py-3 text-sm font-black text-white"
```

Read the classes like small CSS instructions:

- `rounded-full`: pill/circle shape.
- `bg-green-600`: green background.
- `px-5`: horizontal padding.
- `py-3`: vertical padding.
- `text-sm`: small text.
- `font-black`: very bold.
- `text-white`: white text.

Responsive prefixes:

```tsx
className="text-sm sm:text-base lg:text-lg"
```

Meaning:

- phone/default: small text
- `sm` and up: base text
- `lg` and up: large text

## 17. Common beginner mistakes

### Calling a function immediately

Wrong:

```tsx
onClick={setIsOpen(true)}
```

Correct:

```tsx
onClick={() => setIsOpen(true)}
```

### Mutating arrays

Wrong:

```tsx
items.push(newItem)
setItems(items)
```

Correct:

```tsx
setItems((current) => [...current, newItem])
```

### Putting state too high

Not all state belongs in `App.tsx`.

Good rule:

> Put state in the lowest component that contains every component needing that state.

## 18. Suggested learning order

1. `src/main.tsx`
2. `src/App.tsx`
3. `src/types/kos.ts`
4. `src/services/kosService.ts`
5. `src/pages/HomePage.tsx`
6. `src/components/SearchHero/SearchHero.tsx`
7. `src/components/Header/Header.tsx`
8. `src/components/AboutPapikos/AboutPapikos.tsx`
9. `src/pages/KosDetailRoutePage.tsx`
10. `src/components/KosDetailPage/KosDetailPage.tsx`
11. `src/pages/SearchRoutePage.tsx`
12. `src/pages/SearchResultsPage.tsx`
13. `src/components/KosGallery/KosGallery.tsx`

`KosGallery` is last because carousel logic is naturally harder.

## 19. Safe exercises

Try these one at a time:

1. Change one kos title in `src/data/kosListings.ts`.
2. Add one facility to a listing.
3. Add one new media item to a listing.
4. Change the text in `AboutPapikos`.
5. Add a new popular search in `src/data/searchData.ts`.
6. Change the discount percentage of one listing.
7. Add one new rule to a listing.
8. Change the loading text or error message.
9. Add a new route that renders a simple page.
10. Only after the others: adjust carousel timing or drag threshold.

After changes, run:

```bash
npm run lint
npm run build
```

## 20. The most important idea

React becomes easier when you remember this:

```text
UI = function of state + props + route
```

If the state changes, the UI changes.

If props change, the UI changes.

If the route changes, a different page component appears.
