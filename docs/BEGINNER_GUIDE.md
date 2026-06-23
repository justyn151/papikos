# Papikos React Beginner Guide

This guide explains how this project works from the browser entry point to the individual components. It assumes you are new to React, TypeScript, and Tailwind CSS.

Do not worry if the carousel section feels much harder than the other sections. It uses animation and browser APIs, so it is intentionally the most advanced part of the project.

## 1. The big picture

A traditional website often changes HTML directly. React uses a different mental model:

1. Your components describe what the page should look like.
2. Data is stored in variables called state.
3. An event, such as a click, updates the state.
4. React runs the component again.
5. React updates only the necessary parts of the real browser page.

The Papikos render flow is:

    index.html
        |
        v
    src/main.tsx
        |
        v
    src/App.tsx
        |
        v
    src/pages/HomePage.tsx
        |
        +-- Header
        +-- SearchHero
        +-- KosGallery
        +-- AboutPapikos
        |
        +-- KosDetailPage when a kos is selected

Data flows downward:

    kosListings.ts -> HomePage -> KosGallery -> selected kos
                                  |
                                  v
                              HomePage state
                                  |
                                  v
                            KosDetailPage

Events usually flow upward through callback props. For example, KosGallery calls onShowDetail, which was supplied by HomePage.

## 2. Important vocabulary

### Component

A component is a function that returns JSX. Its name starts with a capital letter.

    function Greeting() {
      return <h1>Hello</h1>
    }

Components let us divide the interface into understandable pieces.

### JSX

JSX looks like HTML but lives inside JavaScript or TypeScript.

    const title = 'Papikos'
    return <h1>{title}</h1>

Curly braces mean: evaluate this JavaScript expression.

JSX differences from HTML include:

- Use className instead of class.
- Event names use camelCase, such as onClick.
- Tags must be closed.
- A component must return one parent element.

### Props

Props are values passed from a parent component to a child component.

    <KosDetailPage kos={selectedKos} onBack={handleBack} />

Here, kos and onBack are props. Props are read-only. A child should not modify them.

### State

State is data that belongs to a component and may change while the app is running.

    const [isOpen, setIsOpen] = useState(false)

- isOpen is the current value.
- setIsOpen changes the value.
- false is the initial value.
- Calling the setter asks React to render the component again.

Never modify React state directly. Use the setter.

Incorrect:

    isOpen = true

Correct:

    setIsOpen(true)

### Hook

A hook is a React function whose name begins with use. Hooks let function components use React features.

Rules:

- Call hooks at the top level of a component.
- Do not call hooks inside if statements, loops, or nested functions.
- Call hooks only from React components or custom hooks.

## 3. Project folders

    src/
      components/    Reusable interface sections
      data/          Temporary local application data
      pages/         Components representing complete screens
      styles/        Global styles
      types/         Shared TypeScript type definitions
      App.tsx        Root application component
      main.tsx       Browser entry point

This structure is not the only correct React structure. It is useful because it separates responsibilities:

- Types describe data.
- Data contains example records.
- Components display or interact with data.
- Pages combine components into screens.

## 4. Configuration files

### package.json

This file describes the project and its installed packages.

Dependencies needed by the running application:

- react: component and state system.
- react-dom: connects React to the browser DOM.

Development dependencies:

- typescript: checks types.
- vite: development server and production builder.
- tailwindcss: utility-based styling.
- eslint: finds suspicious code and style problems.

Scripts:

- npm run dev starts the development server.
- npm run build checks TypeScript and creates production files.
- npm run lint runs ESLint.
- npm run preview serves the production build locally.

### vite.config.ts

Vite is the tool that serves and builds the app.

    export default defineConfig({
      plugins: [react(), tailwindcss()],
    })

The React plugin processes JSX. The Tailwind plugin scans class names and generates the required CSS.

### index.html

This is the only base HTML document.

The important line is:

    <div id="root"></div>

React mounts the entire application inside this empty element.

The module script loads src/main.tsx. The head also contains the browser-tab title, language, viewport rule, favicon, and search-engine description.

The viewport meta tag is essential for correct mobile sizing.

## 5. The application entry point

### src/main.tsx

Imports:

    import { StrictMode } from 'react'
    import { createRoot } from 'react-dom/client'
    import App from './App.tsx'
    import './styles/global.css'

- StrictMode enables extra development checks.
- createRoot creates the React root.
- App is the first application component.
- Importing global.css loads site-wide CSS.

Mounting:

    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

document.getElementById finds the root element from index.html.

The exclamation mark after the expression is a TypeScript non-null assertion. It tells TypeScript: this value will not be null. This is safe here because index.html contains the root element.

render tells React what component tree should appear inside that element.

StrictMode may run some logic twice during development to expose unsafe side effects. It does not double-render the production website.

## 6. The root component

### src/App.tsx

    export default function App() {
      return <HomePage />
    }

App is intentionally small. Its current job is only to render HomePage.

Why keep it? Later App could contain a router, authentication provider, theme provider, or other application-wide behavior.

default export means another file may import it using any local name. Named exports, such as HomePage, must use the exported name inside curly braces.

## 7. Shared TypeScript data

### src/types/kos.ts

KosListing defines the required shape of a kos object.

    export type KosListing = {
      id: number
      title: string
      facilities: string[]
      ...
    }

Benefits:

- TypeScript reports a missing field.
- Editors provide autocomplete.
- A number cannot accidentally be used where text is required.
- Every component agrees about what a kos contains.

The brackets in string[] mean an array of strings.

This type disappears after compilation. It helps developers but does not exist in the browser JavaScript.

### src/data/kosListings.ts

featuredKosListings is an array of example kos objects.

    export const featuredKosListings: KosListing[] = [...]

The KosListing[] annotation requires every array item to follow the KosListing type.

In a larger app this data would probably come from an API:

    const response = await fetch('/api/kos')

Keeping fake data in a separate file makes the components cleaner and makes replacing it with server data easier later.

imageAlt describes the photo for screen readers and when the image cannot load.

## 8. Page composition and lifted state

### src/pages/HomePage.tsx

HomePage is the coordinator for the main screen. It does not draw every button and card itself. Instead, it imports smaller components, gives them data, and decides whether the user should see the home content or a kos detail page.

Here is the complete file:

    import { useState } from 'react'
    import { AboutPapikos } from '../components/AboutPapikos/AboutPapikos'
    import { KosGallery } from '../components/KosGallery/KosGallery'
    import { KosDetailPage } from '../components/KosDetailPage/KosDetailPage'
    import { Header } from '../components/Header/Header'
    import { SearchHero } from '../components/SearchHero/SearchHero'
    import { featuredKosListings } from '../data/kosListings'
    import type { KosListing } from '../types/kos'

    export function HomePage() {
      const [selectedKos, setSelectedKos] = useState<KosListing | null>(null)

      return (
        <>
          <Header />
          <main>
            {selectedKos ? (
              <KosDetailPage kos={selectedKos} onBack={() => setSelectedKos(null)} />
            ) : (
              <>
                <SearchHero />
                <KosGallery
                  listings={featuredKosListings}
                  onShowDetail={setSelectedKos}
                />
                <AboutPapikos />
              </>
            )}
          </main>
        </>
      )
    }

### Step 1: imports

    import { useState } from 'react'

HomePage needs changing data, so it imports the useState hook from React.

    import { Header } from '../components/Header/Header'

This imports one of our own components. The two dots mean go up one directory from pages, then enter components.

All of these component imports have different visual responsibilities:

- Header displays the logo and profile menu.
- SearchHero displays the heading and search form.
- KosGallery displays the interactive carousel.
- AboutPapikos displays the expandable information section.
- KosDetailPage displays the full details for one selected kos.

    import { featuredKosListings } from '../data/kosListings'

This imports actual runtime data. featuredKosListings is an array used by the gallery.

    import type { KosListing } from '../types/kos'

This imports only a TypeScript type. It is used to tell TypeScript what kind of value selectedKos may contain. Because it is a type-only import, it will not become part of the browser JavaScript.

### Step 2: declaring and exporting the component

    export function HomePage() {

This creates a function named HomePage and exports it so App.tsx can import it.

React components are regular JavaScript functions with two important conventions:

1. Their names begin with a capital letter.
2. They return JSX describing the interface.

Do not call this function yourself with HomePage(). React calls it when it needs to render the component.

### Step 3: creating state

    const [selectedKos, setSelectedKos] =
      useState<KosListing | null>(null)

This single line contains several ideas.

useState returns an array with exactly two values:

    [currentValue, setterFunction]

Array destructuring gives those two values useful names:

    selectedKos
    setSelectedKos

selectedKos is the current state value.

setSelectedKos is the function used to request a new state value.

The part inside angle brackets is a TypeScript generic:

    KosListing | null

The vertical bar means “or”. Therefore selectedKos may be:

- A complete KosListing object.
- null, meaning no kos is selected.

The final null is the initial value:

    useState<KosListing | null>(null)

When HomePage first appears, selectedKos is null. The user has not opened a kos yet.

A simplified version of the state over time looks like this:

    Initial:
    selectedKos = null

    User clicks “Lihat detail”:
    selectedKos = {
      id: 1,
      title: 'Kamar Kos Minimalis',
      ...
    }

    User clicks “Kembali ke beranda”:
    selectedKos = null

### Why HomePage owns selectedKos

KosGallery knows which card the user clicked. KosDetailPage needs the selected object so it can display its information.

These two components are siblings. One sibling should not directly reach into another sibling.

Their shared parent, HomePage, owns the value and connects them:

    KosGallery
        |
        | sends selected kos upward
        v
    HomePage selectedKos state
        |
        | sends selected kos downward
        v
    KosDetailPage

This pattern is called lifting state up.

### Step 4: returning JSX

    return (
      <>
        ...
      </>
    )

A component returns JSX. HomePage needs to return Header and main as siblings, so they are wrapped in a React fragment.

The fragment syntax is:

    <>
      <FirstThing />
      <SecondThing />
    </>

A fragment groups JSX without producing an extra HTML element. The actual browser DOM receives header and main, not a meaningless wrapper div.

### Step 5: rendering Header

    <Header />

Header is outside the selectedKos condition. This is important.

It means the header appears in both situations:

- On the normal home screen.
- On the kos detail screen.

If Header were placed inside the home-only branch, it would disappear when a detail page opened.

The slash closes a component that has no JSX children:

    <Header />

This is equivalent to opening and immediately closing it.

### Step 6: using the main HTML element

    <main>
      ...
    </main>

main is a semantic HTML element. It tells browsers and assistive technology that this area contains the page's primary content.

Only the content inside main changes. The header remains stable above it.

### Step 7: conditional rendering

Inside main is a ternary expression:

    {selectedKos ? (
      detail content
    ) : (
      home content
    )}

Curly braces switch from JSX into JavaScript.

The ternary pattern is:

    condition ? valueWhenTrue : valueWhenFalse

React treats null as false. A KosListing object is treated as true.

Therefore:

- selectedKos is an object: render KosDetailPage.
- selectedKos is null: render SearchHero, KosGallery, and AboutPapikos.

This is not React Router navigation. No new URL is created. HomePage is simply choosing which component tree to return based on state.

### Step 8: rendering the detail page

    <KosDetailPage
      kos={selectedKos}
      onBack={() => setSelectedKos(null)}
    />

HomePage passes two props.

The first prop passes data:

    kos={selectedKos}

KosDetailPage receives the selected KosListing object under the prop name kos.

The second prop passes behavior:

    onBack={() => setSelectedKos(null)}

The value is an arrow function. HomePage is not calling it during rendering. It is handing the function to KosDetailPage.

Later, KosDetailPage uses it:

    <button onClick={onBack}>

When the user clicks that button:

1. KosDetailPage calls onBack.
2. The arrow function runs.
3. setSelectedKos(null) requests a state update.
4. React runs HomePage again.
5. selectedKos is now null.
6. The false branch of the ternary is rendered.
7. The home content appears again.

Why not write this?

    onBack={setSelectedKos(null)}

That would call the setter immediately while HomePage is rendering. The prop needs a function, not the result of calling a function.

### Step 9: rendering the normal home content

The false branch contains three siblings:

    <>
      <SearchHero />
      <KosGallery ... />
      <AboutPapikos />
    </>

They need another fragment because a ternary branch must produce one JSX value.

SearchHero does not need props because it currently manages its own search input and feedback.

AboutPapikos also manages its own expanded state.

KosGallery needs data and a way to report a selection:

    <KosGallery
      listings={featuredKosListings}
      onShowDetail={setSelectedKos}
    />

listings is a data prop. It contains the KosListing array imported from kosListings.ts.

onShowDetail is a function prop. Here we pass setSelectedKos directly.

Passing it directly works because both functions have compatible shapes:

    KosGallery expects:
    (kos: KosListing) => void

    setSelectedKos can accept:
    KosListing | null

KosGallery calls:

    onShowDetail(listing)

Because onShowDetail refers to setSelectedKos, this behaves like:

    setSelectedKos(listing)

That state update makes HomePage render KosDetailPage.

### The complete click-to-detail sequence

Suppose the user clicks “Lihat detail” on the Depok kos.

1. The button exists inside KosGallery.
2. Its click handler calls onShowDetail(listing).
3. listing is the Depok KosListing object.
4. onShowDetail refers to HomePage's setSelectedKos function.
5. React schedules selectedKos to become that object.
6. HomePage runs again.
7. The ternary sees that selectedKos is not null.
8. KosGallery is removed from the rendered tree.
9. KosDetailPage is added to the rendered tree.
10. The selected object is passed as the kos prop.
11. KosDetailPage reads fields such as kos.title and kos.facilities.

### What “render again” does not mean

React running HomePage again does not mean the browser reloads the website.

There is:

- No full page refresh.
- No new index.html download.
- No loss of the React application.

React creates new JSX, compares it with the previous JSX, and updates the necessary DOM.

### Parent state versus child state

HomePage owns only the state needed to coordinate the main screens.

It does not own:

- The search input, because SearchHero can manage it alone.
- The profile dropdown, because Header can manage it alone.
- The About section's expanded state, because AboutPapikos can manage it alone.
- Detail-page media selection, because KosDetailPage can manage it alone.

This is a useful state-placement rule:

> Put state in the lowest component that contains every component needing that state.

selectedKos must be shared between gallery and detail view, so HomePage owns it. The profile menu is used only by Header, so Header owns it.

### A beginner-friendly alternative without a ternary

The current version is compact. The same idea could be written more explicitly:

    export function HomePage() {
      const [selectedKos, setSelectedKos] =
        useState<KosListing | null>(null)

      if (selectedKos) {
        return (
          <>
            <Header />
            <main>
              <KosDetailPage
                kos={selectedKos}
                onBack={() => setSelectedKos(null)}
              />
            </main>
          </>
        )
      }

      return (
        <>
          <Header />
          <main>
            <SearchHero />
            <KosGallery
              listings={featuredKosListings}
              onShowDetail={setSelectedKos}
            />
            <AboutPapikos />
          </main>
        </>
      )
    }

This version repeats Header and main, so the project uses the ternary version instead. However, reading this alternative may help you understand the decision being made.

### Summary of HomePage's responsibility

HomePage has three jobs:

1. Compose the main page from smaller components.
2. Store which kos is selected.
3. Switch between the home content and detail content.

It deliberately does not contain the internal markup or behavior of every child. That separation keeps each component focused and makes the project easier to change.

## 9. Header and login button

### src/components/Header/Header.tsx

The header displays the Papikos brand and a “Masuk” button for guests.

Its props type is:

    type HeaderProps = {
      onLogin?: () => void
    }

The question mark makes onLogin optional. Header can be rendered before the login page or authentication behavior is implemented:

    <Header />

Later, a parent can pass a function:

    <Header onLogin={() => openLoginPage()} />

The button receives the function without calling it immediately:

    <button onClick={onLogin} type="button">
      Masuk
    </button>

If onLogin is undefined, React safely renders the button without a click action. This is useful as a temporary frontend placeholder, but production code should connect it to a login page or dialog.

The header itself does not validate passwords or determine whether a user is authenticated. Those responsibilities should be divided:

- Frontend: login form, validation feedback, loading state, calling the API, storing safe session state, and displaying logged-in versus logged-out UI.
- Backend: password hashing, credential verification, database records, authorization, secure cookies or tokens, session expiry, and authentication endpoints.

The frontend and backend should agree on an API contract. For example:

    POST /api/auth/login

    Request:
    {
      email: string,
      password: string
    }

    Success response:
    {
      user: {
        id: number,
        name: string
      }
    }

Passwords must never be stored or verified only in frontend code. Frontend code is delivered to the user's browser and cannot keep authentication secrets.

Useful header styling details:

- shrink-0 prevents the button from being squeezed on mobile.
- border-green-600 creates the outlined appearance.
- hover:bg-green-50 provides pointer feedback.
- active:scale-[0.98] provides pressed feedback.
- aria-label on the logo link gives it an accessible name.

## 10. Search hero

### src/components/SearchHero/SearchHero.tsx

This component uses two state values:

- location stores the input text.
- message stores user feedback.

Controlled text input:

    value={location}
    onChange={(event) => setLocation(event.target.value)}

The browser emits a change event. event.target.value contains the latest text. React stores it and renders the input with that state value.

Form submission:

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      ...
    }

HTML forms reload the page by default. preventDefault stops that behavior so React can handle the submission.

trim removes whitespace from the beginning and end of text.

The popular location buttons reuse map. Clicking one updates both the input value and feedback message.

The city drawing is an inline SVG. SVG is a vector graphic described with elements such as path. aria-hidden hides decorative artwork from screen readers.

The sr-only label is visually hidden but still makes the search input understandable to screen readers.

## 11. Kos carousel

### src/components/KosGallery/KosGallery.tsx

This is the most advanced file. Learn the other components first.

### Props

    type KosGalleryProps = {
      listings: KosListing[]
      onShowDetail: (kos: KosListing) => void
    }

onShowDetail is a function prop. It accepts one KosListing and returns nothing.

### How KosGallery receives HomePage's setter

HomePage renders KosGallery like this:

    <KosGallery
      listings={featuredKosListings}
      onShowDetail={setSelectedKos}
    />

This does not call setSelectedKos. There are no parentheses after its name.

It passes the function itself as a value.

You can imagine the prop object looking roughly like this:

    {
      listings: featuredKosListings,
      onShowDetail: setSelectedKos
    }

React calls KosGallery and supplies those props. The function declaration uses object destructuring:

    export function KosGallery({
      listings,
      onShowDetail,
    }: KosGalleryProps) {

After destructuring:

- listings refers to featuredKosListings.
- onShowDetail refers to HomePage's setSelectedKos function.

The functions have different names because the parent and child describe them from different viewpoints:

- HomePage calls it setSelectedKos because it updates state.
- KosGallery calls it onShowDetail because it should run when details are requested.

They still refer to the same function.

This is similar to assigning a function to another variable:

    const originalFunction = setSelectedKos
    const anotherName = originalFunction

    anotherName(listing)

Calling anotherName still calls the original setter.

### The exact “Lihat detail” button code

Inside renderCard, the button contains:

    <button
      onClick={() => {
        onShowDetail(listing)
        setSelectedKosTitle(
          listing.title + ': membuka halaman detail.',
        )
      }}
      type="button"
    >
      Lihat detail
    </button>

onClick is a React event prop. It tells React which function should run when the browser reports a click.

The arrow function is not run during rendering:

    () => {
      ...
    }

It is stored by React as the click handler.

Later, when the user clicks:

1. The browser produces a click event.
2. React sees that this button has an onClick handler.
3. React calls the arrow function.
4. The arrow function calls onShowDetail(listing).
5. onShowDetail is really HomePage's setSelectedKos.
6. HomePage's selectedKos state becomes listing.
7. React renders HomePage again.
8. HomePage's ternary now chooses KosDetailPage.

The second call:

    setSelectedKosTitle(...)

updates text owned by KosGallery. However, KosGallery is about to be removed because HomePage switches to the detail page. This feedback text is therefore less important than onShowDetail.

### What the listing variable contains

renderCard receives one listing:

    function renderCard(
      listing: KosListing,
      index: number,
      logicalIndex: number,
    ) {

listing is the complete KosListing object, not only an image:

    {
      id: 1,
      title: 'Kamar Kos Minimalis',
      address: 'Jl. Margonda Raya No. 24, Depok',
      facilities: [...],
      rules: [...],
      ...
    }

Therefore this call:

    onShowDetail(listing)

stores the complete object in HomePage, not only its ID or image URL. KosDetailPage can immediately read every field.

### Why KosGallery cannot call setSelectedKos by name

setSelectedKos was created inside HomePage:

    export function HomePage() {
      const [selectedKos, setSelectedKos] = useState(...)
    }

JavaScript scope means that local variables are available only inside the function where they were created, unless they are passed somewhere.

KosGallery lives in another function and another file. It cannot directly access HomePage's local variable.

The prop is the bridge:

    HomePage local setter
          |
          | passed as onShowDetail prop
          v
    KosGallery click handler

This keeps KosGallery reusable. A different parent could pass a different onShowDetail function without changing KosGallery.

### State used inside KosGallery

KosGallery has several state values of its own:

    const [activeIndex, setActiveIndex] = useState(0)
    const [savedKosIds, setSavedKosIds] = useState<number[]>([])
    const [selectedKosTitle, setSelectedKosTitle] = useState(...)
    const [baseOffset, setBaseOffset] = useState(0)
    const [slideStep, setSlideStep] = useState(846)
    const [dragOffset, setDragOffset] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [shouldAnimate, setShouldAnimate] = useState(false)
    const [pendingDirection, setPendingDirection] =
      useState<SlideDirection>(null)
    const [emphasizedCardIndex, setEmphasizedCardIndex] =
      useState(2)

Each state value has a focused purpose:

- activeIndex identifies the center kos.
- savedKosIds stores IDs whose heart buttons are active.
- selectedKosTitle stores feedback text.
- baseOffset centers the track.
- slideStep stores the distance between card positions.
- dragOffset stores the current horizontal movement.
- isDragging controls the cursor appearance.
- shouldAnimate enables or disables CSS transition.
- pendingDirection remembers which animation must finish.
- emphasizedCardIndex identifies the card visually closest to the user.

None of these replaces HomePage's selectedKos.

This distinction matters:

- Gallery state controls how the carousel behaves.
- HomePage state controls which large page is displayed.

### Two state updates can affect different components

When “Lihat detail” is clicked, its handler calls setters belonging to two components:

    onShowDetail(listing)
    setSelectedKosTitle(...)

onShowDetail updates HomePage.

setSelectedKosTitle updates KosGallery.

React batches state updates from the same event when possible. HomePage then stops rendering KosGallery, so the gallery's local state disappears with that component.

This is called unmounting. When the user returns, KosGallery mounts again and its local state starts from its initial values.

### useRef

useRef stores a mutable value that survives renders without causing a new render when changed.

Examples in the carousel:

- viewportRef points to the clipping element.
- trackRef points to the moving row.
- dragStartRef remembers where the pointer started.
- dragOffsetRef always contains the latest drag distance.
- velocityRef remembers drag speed.

DOM refs are attached like this:

    <div ref={viewportRef}>

After the element mounts, viewportRef.current refers to the real HTML element.

Use state when changing a value should update the screen. Use a ref for DOM access or rapidly changing bookkeeping that should not independently render the component.

### useEffect

    useEffect(() => {
      // synchronize with browser
      return () => {
        // cleanup
      }
    }, [])

The carousel effect measures element widths and subscribes to browser resize events.

The empty dependency array means the effect runs after the component first mounts. Its cleanup runs when the component is removed.

window.addEventListener subscribes to a browser event. removeEventListener is important cleanup; otherwise old listeners can remain in memory.

requestAnimationFrame waits until the browser is ready to draw another frame. The carousel uses it so elements exist and have measurable dimensions before calculating offsets.

### Infinite indexing

getWrappedIndex converts any integer into a valid array index.

    ((index % length) + length) % length

If the index moves beyond the last photo, it wraps to zero. Negative indexes wrap to the end.

activeIndex is intentionally allowed to keep increasing or decreasing. The displayed photo is found with getWrappedIndex. This avoids a visual discontinuity when cycling.

### Visible slides

The component renders five logical positions:

    [-2, -1, 0, 1, 2]

Position zero relative to activeIndex is the center. Extra cards on both sides prevent blank space during animation.

Each logical index is used as a React key. This gives React a stable understanding of which card moved, reducing image flicker.

### Positioning

The viewport has overflow hidden, so it acts like a window.

The track is a wide flex row inside that window. Its transform moves it:

    translate3d(horizontalPixels, 0, 0)

Transforms are commonly used for animation because browsers can render them efficiently.

The center card uses positive translateZ and side cards use negative translateZ. The viewport supplies perspective. This makes the center feel closer without giving it a different CSS width.

### Button animation

showPrevious and showNext call animateTo.

animateTo:

1. Marks animation as enabled.
2. Records the pending direction.
3. Moves the track by exactly one measured card step.
4. Changes which card receives the depth emphasis.

When the transition finishes, handleTransitionEnd advances activeIndex and resets the track offset without animation.

The handler checks:

    event.target !== event.currentTarget

Transition events bubble. Without this guard, an image hover transition could incorrectly finish the entire carousel.

flushSync asks React DOM to apply a state update immediately. It is used here only for the invisible post-animation reset. Most React code should not need flushSync.

### Pointer dragging

Pointer events work for mouse, pen, and touch-like pointers.

On pointer down:

- The initial X coordinate is saved.
- Drag velocity resets.
- Window-level move and release listeners are attached.

Window-level listeners let dragging continue after the pointer leaves the card.

On pointer move:

- Current distance is calculated.
- Distance is clamped to a safe maximum.
- Velocity is calculated using distance divided by elapsed time.
- The track follows the pointer.

On pointer release:

- Listeners are removed.
- A projected position combines distance and velocity.
- A sufficient left movement shows the next card.
- A sufficient right movement shows the previous card.
- A small movement returns to the center.

The special near-zero check prevents a simple click from starting a transition that never moves.

### Why state and refs are both used for drag offset

dragOffset state updates the visible transform.

dragOffsetRef gives event handlers the newest value immediately. React state updates are scheduled and may not be available in a previously registered browser callback yet.

### Rendering cards

renderCard is a helper function that returns JSX for one card.

The active card is keyboard-focusable. Save buttons update savedKosIds.

Array update patterns:

Add:

    [...currentIds, id]

Remove:

    currentIds.filter((currentId) => currentId !== id)

The spread syntax creates a new array. React state should be treated as immutable.

## 12. Full-page kos details

### src/components/KosDetailPage/KosDetailPage.tsx

KosDetailPage displays one complete kos. It receives the selected data and a function for returning to the home content.

### Props type

    type KosDetailPageProps = {
      kos: KosListing
      onBack: () => void
    }

kos must be a KosListing object.

onBack must be a function that:

- Accepts no arguments, shown by empty parentheses.
- Returns no meaningful value, shown by void.

The component receives and destructures those props:

    export function KosDetailPage({
      kos,
      onBack,
    }: KosDetailPageProps) {

Inside the component:

- kos refers to the object stored in HomePage's selectedKos state.
- onBack refers to the arrow function created by HomePage.

### Where the props come from

HomePage creates KosDetailPage like this:

    <KosDetailPage
      kos={selectedKos}
      onBack={() => setSelectedKos(null)}
    />

The first prop carries data downward.

The second prop carries a function downward.

This creates two different paths:

    Data:
    HomePage selectedKos -> KosDetailPage kos

    User action:
    KosDetailPage onBack -> HomePage setSelectedKos

Props always travel from parent to child. The child communicates upward by calling a function that arrived through props.

### The exact “Kembali” button code

KosDetailPage renders:

    <button
      onClick={onBack}
      type="button"
    >
      ← Kembali ke beranda
    </button>

Notice that onClick receives onBack without parentheses.

Correct:

    onClick={onBack}

This means “call onBack later when clicked.”

Incorrect:

    onClick={onBack()}

This means “call onBack immediately while rendering.” The detail page would instantly close.

### What onBack actually is

KosDetailPage calls it onBack, but HomePage supplied this value:

    () => setSelectedKos(null)

Therefore the button click is effectively:

    onClick={() => setSelectedKos(null)}

The detail component does not know:

- That the parent uses useState.
- That the state variable is named selectedKos.
- That null causes the home content to render.

It only knows: when the button is clicked, call onBack.

This separation is a major React idea. Child components request actions; parents decide what those actions mean.

### The exact return-to-home sequence

1. The detail page is visible because selectedKos contains an object.
2. The user clicks “Kembali ke beranda.”
3. React calls the button's onClick function.
4. That function is onBack.
5. onBack runs setSelectedKos(null) inside HomePage.
6. React schedules HomePage to render again.
7. HomePage runs with selectedKos equal to null.
8. The ternary condition is now false.
9. KosDetailPage is unmounted.
10. SearchHero, KosGallery, and AboutPapikos are mounted.

Again, useState did not detect a click. The event handler explicitly called its setter.

### The complete round trip

The entire navigation-like behavior can be summarized as:

    HOME SCREEN

    User clicks “Lihat detail”
            |
            v
    KosGallery calls onShowDetail(listing)
            |
            v
    onShowDetail is setSelectedKos
            |
            v
    selectedKos becomes a KosListing object
            |
            v
    HomePage renders KosDetailPage

    DETAIL SCREEN

    User clicks “Kembali”
            |
            v
    KosDetailPage calls onBack()
            |
            v
    onBack calls setSelectedKos(null)
            |
            v
    selectedKos becomes null
            |
            v
    HomePage renders the home components

This behaves like page navigation visually, but it is state-based conditional rendering. A production application often uses React Router instead so the detail screen also receives its own URL.

### Local state inside KosDetailPage

The detail page also has its own state:

    const [activeMediaId, setActiveMediaId] =
      useState(mediaItems[0].id)

    const [actionStatus, setActionStatus] =
      useState('Pilih aksi untuk lanjut.')

    const [rentalStatus, setRentalStatus] = useState(...)
    const [rentalMonths, setRentalMonths] = useState(1)
    const [paymentChoice, setPaymentChoice] =
      useState<'full' | 'dp'>('full')
    const [breakdownType, setBreakdownType] = useState(null)
    const [isLightboxOpen, setIsLightboxOpen] =
      useState(false)

These values do not decide whether the detail page exists.

They control only content inside the detail page:

- activeMediaId decides which media thumbnail is selected.
- actionStatus displays feedback for survey and contact actions.
- rentalStatus displays rental-application feedback.
- rentalMonths stores the selected rental duration.
- paymentChoice stores full or DP payment.
- breakdownType selects the open payment modal.
- isLightboxOpen controls the fullscreen media viewer.

This is another example of placing state in the lowest component that needs it.

HomePage does not need to know which thumbnail is selected, so activeMediaId stays in KosDetailPage.

### Selecting media

The component reads media from the selected listing:

    const mediaItems =
      kos.media.length > 0
        ? kos.media
        : [coverImageFallback]

It finds the selected object:

    const activeMedia =
      mediaItems.find(
        (item) => item.id === activeMediaId,
      ) ?? mediaItems[0]

find checks items until the arrow function returns true.

The double question mark is the nullish coalescing operator:

    foundItem ?? fallbackItem

If find returns undefined, the first media item is used as a fallback.

Thumbnail buttons call:

    setActiveMediaId(media.id)

That changes local state, renders KosDetailPage again, and gives the chosen thumbnail the active border.

It does not render HomePage again because this state belongs to KosDetailPage, although React still keeps the component inside the existing parent tree.

### Reading kos data

KosDetailPage displays fields from the kos prop:

    kos.imageUrl
    kos.title
    kos.address
    kos.description
    kos.monthlyPrice
    kos.facilities
    kos.facilityCategories
    kos.rules
    kos.owner
    kos.paymentTerms
    kos.media

The object came from the exact carousel card that was clicked.

Facilities are rendered with map:

    kos.facilities.map((facility) => (
      <span key={facility}>{facility}</span>
    ))

Rules and categorized facilities use the same map pattern to create list items.

### Action feedback

Buttons such as “Jadwalkan survey” call:

    setActionStatus(
      'Jadwal survey disiapkan...',
    )

React renders the component again and displays the new message.

These buttons currently simulate actions. They do not send data to a server.

### Media viewer and lightbox

The main viewer supports image and video records from kos.media.

The supplied video is served as a browser-compatible MP4 from public/videos. Images and video use a fixed 16:9 frame and object-contain so they are not cropped.

Clicking an image sets isLightboxOpen to true. MediaLightbox displays images or video, supports arrow keys, and calculates its index from activeMediaIndex and mediaItems.length.

### What is destroyed when going back

When selectedKos becomes null, HomePage no longer returns KosDetailPage. React unmounts it.

Its local state is destroyed:

- activeMediaId returns to its initial value next time.
- actionStatus returns to its initial message next time.
- rental selection returns to one month and full payment.
- open payment or media modals are removed.

HomePage's state survives because HomePage itself remains mounted.

### The most important distinction

HomePage state:

    selectedKos

Controls which screen is visible.

KosDetailPage state:

    activeMediaId
    actionStatus
    rentalStatus
    rentalMonths
    paymentChoice
    breakdownType
    isLightboxOpen

Controls details inside the visible screen.

The buttons connect to the correct state through their event handlers:

    Button click
        -> event handler
        -> state setter
        -> React render
        -> updated interface

## 13. Expandable information section

### src/components/AboutPapikos/AboutPapikos.tsx

isExpanded controls the accordion.

The content always exists in the DOM, but its grid row changes:

- grid-rows-[0fr] collapses it.
- grid-rows-[1fr] expands it.
- overflow-hidden hides content during collapse.
- opacity produces a fade.

aria-expanded and aria-controls describe the relationship for assistive technology.

String.fromCharCode creates the labels a, b, c, and so on from numeric character codes.

## 14. Global CSS and Tailwind

### src/styles/global.css

    @import "tailwindcss";

This loads Tailwind.

The remaining rules set global defaults:

- Prevent horizontal document overflow.
- Ensure the root fills the width and height.
- Remove the browser body margin.
- Set the default font stack.
- Improve font rendering.

### Reading Tailwind classes

Tailwind classes each describe a small CSS rule.

Examples:

- flex means display: flex.
- grid means display: grid.
- px-4 adds horizontal padding.
- mt-4 adds top margin.
- text-sm sets a small font size.
- font-black sets a heavy font weight.
- rounded-full creates a pill or circle.
- overflow-hidden clips overflowing children.
- w-full sets width to 100 percent.
- min-w-0 allows a flex or grid child to shrink.

Responsive prefixes apply a class above a breakpoint:

- sm: applies from the small breakpoint.
- lg: applies from the large breakpoint.

Example:

    text-sm sm:text-base lg:text-lg

The text is small on phones, base-sized on small screens, and large on desktop.

State variants:

- hover: applies while the pointer hovers.
- active: applies while pressed.
- focus: applies when keyboard-focused.
- peer-checked: reacts to a nearby checked input.

Arbitrary values use square brackets:

    w-[680px]
    [perspective:1600px]

Use arbitrary values when Tailwind does not have the exact value required.

## 15. React render behavior

When a state setter is called:

1. React schedules an update.
2. The component function runs again.
3. New JSX is produced.
4. React compares it with the previous JSX.
5. Only changed DOM parts are updated.

Local variables are recreated on every render. State and refs survive renders.

A parent render normally causes its child components to be evaluated again. This is expected. Do not reach for performance optimization until measurement shows a real problem.

## 16. Type-only imports

This project uses imports such as:

    import type { FormEvent } from 'react'

FormEvent is used only by TypeScript. import type makes it clear that nothing needs to be included in the browser JavaScript.

Common event types here include:

- FormEvent<HTMLFormElement>
- PointerEvent<HTMLDivElement>
- TransitionEvent<HTMLDivElement>

The generic value describes the element associated with the event.

## 17. Common beginner mistakes

### Calling a setter during rendering

Incorrect:

    onClick={setIsOpen(true)}

This calls the function immediately.

Correct:

    onClick={() => setIsOpen(true)}

### Mutating arrays

Incorrect:

    savedIds.push(id)

Correct:

    setSavedIds((current) => [...current, id])

### Forgetting keys

Items created with map need a stable key.

### Using an array index as a key

An index can be acceptable for a truly static list, but a database ID is usually better when items can move.

The carousel uses logical indexes because duplicate wrapped photos may appear simultaneously.

### Forgetting cleanup

If an effect or interaction adds a browser event listener, remove it when it is no longer needed.

### Making everything global

Keep state in the lowest component that needs to own it. Lift it upward only when multiple components need to coordinate.

## 18. Suggested learning order

Read and experiment in this order:

1. App.tsx
2. kos.ts
3. kosListings.ts
4. HomePage.tsx
5. SearchHero.tsx
6. Header.tsx
7. AboutPapikos.tsx
8. KosDetailPage.tsx
9. KosGallery.tsx

The carousel should be last because it combines state, refs, effects, DOM measurement, pointer events, transitions, velocity, and accessibility.

## 19. Safe exercises

Try these one at a time:

1. Change the title and description of one kos in kosListings.ts.
2. Add a fourth kos object. TypeScript will show which fields are required.
3. Add a new popular location in SearchHero.
4. Change AboutPapikos so it starts expanded.
5. Add a new facility chip to a kos.
6. Add a new profile action.
7. Replace one remote image URL.
8. Add a reset button to the search form.
9. Show the selected location above the gallery.
10. Only after the others: adjust carousel perspective or drag threshold.

After each change, run:

    npm run lint
    npm run build

## 20. Where to go next

Good next React topics for this project:

- React Router for real URLs such as /kos/2.
- Fetching kos data from an API.
- Loading and error states.
- Form validation.
- Context for shared saved-kos state.
- localStorage for persistence.
- Component testing.
- A real video player.
- Authentication and owner/customer accounts.

The most important idea is this:

    UI = a function of state

Instead of manually telling the browser how to change every element, store the correct state and let React describe the resulting interface.
