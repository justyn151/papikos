# Papikos API Calls Guide

This guide explains how the Papikos React frontend can communicate with a backend. It is written for beginners and does not assume that the backend already exists.

The examples use the browser's built-in fetch function and TypeScript.

## 1. What an API does

The frontend and backend have different jobs.

The frontend:

- Displays forms, buttons, cards, and messages.
- Collects user input.
- Sends requests to the backend.
- Displays returned data.
- Shows loading and error states.

The backend:

- Receives requests.
- Validates data.
- Reads and writes the database.
- Verifies passwords.
- Creates and checks sessions.
- Decides whether a user has permission.
- Returns a response.

The communication flow is:

    React component
        |
        | calls an API function
        v
    fetch sends an HTTP request
        |
        v
    Backend route processes the request
        |
        v
    Backend returns an HTTP response
        |
        v
    API function parses the response
        |
        v
    React updates state
        |
        v
    Interface renders the result

## 2. Agree on the API contract first

An API contract describes what both teammates agree to send and receive.

For every endpoint, decide:

- HTTP method.
- URL path.
- Request body.
- Successful response shape.
- Possible errors.
- Authentication requirement.
- Status codes.

Example login contract:

    Method:
    POST

    Path:
    /api/auth/login

    Request JSON:
    {
      "email": "user@example.com",
      "password": "secret-password"
    }

    Success status:
    200

    Success JSON:
    {
      "user": {
        "id": 12,
        "name": "Alya",
        "email": "user@example.com"
      }
    }

    Invalid login status:
    401

    Invalid login JSON:
    {
      "message": "Email atau password salah."
    }

The frontend and backend property names must match. If the backend returns user_name but the frontend expects name, TypeScript cannot repair the response at runtime.

Write the contract before building both sides. This prevents a great deal of “works on my machine” archaeology.

## 3. HTTP methods

Common methods:

- GET reads data.
- POST creates data or performs an action.
- PUT replaces a complete record.
- PATCH updates part of a record.
- DELETE removes a record.

Papikos examples:

    GET /api/kos
    GET /api/kos/12
    POST /api/auth/login
    POST /api/surveys
    PATCH /api/users/me
    DELETE /api/favorites/12

The method alone does not provide security. The backend must still authenticate and authorize every protected request.

## 4. HTTP status codes

Useful status codes:

- 200 OK: request succeeded.
- 201 Created: a new record was created.
- 204 No Content: success with no response body.
- 400 Bad Request: malformed request.
- 401 Unauthorized: user is not logged in or credentials are invalid.
- 403 Forbidden: user is logged in but lacks permission.
- 404 Not Found: resource does not exist.
- 409 Conflict: request conflicts with existing data.
- 422 Unprocessable Content: validation failed.
- 429 Too Many Requests: rate limit reached.
- 500 Internal Server Error: unexpected backend failure.

Do not return status 200 for every outcome. Correct status codes let the frontend react appropriately.

## 5. JSON

JSON is a text format commonly used for API data.

JavaScript object:

    const loginData = {
      email: 'user@example.com',
      password: 'secret-password',
    }

Convert it to JSON text:

    const jsonText = JSON.stringify(loginData)

Convert response JSON text into a JavaScript value:

    const data = await response.json()

JSON supports objects, arrays, strings, numbers, booleans, and null. It does not directly support functions, Date objects, or undefined.

Dates are normally sent as strings:

    "2026-06-22T14:30:00.000Z"

The frontend may convert one into a Date:

    const date = new Date(apiDateString)

## 6. Your first fetch request

Basic GET request:

    async function getKosList() {
      const response = await fetch('/api/kos')
      const data = await response.json()
      return data
    }

fetch returns a Promise.

async allows a function to use await.

await pauses that async function until the Promise settles. It does not freeze the entire browser.

Important: fetch does not reject automatically for HTTP errors such as 404 or 500. Check response.ok:

    async function getKosList() {
      const response = await fetch('/api/kos')

      if (!response.ok) {
        throw new Error('Gagal mengambil daftar kos.')
      }

      return response.json()
    }

response.ok is true for status codes from 200 through 299.

## 7. Sending JSON with POST

Login example:

    type LoginInput = {
      email: string
      password: string
    }

    async function login(input: LoginInput) {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        throw new Error('Login gagal.')
      }

      return response.json()
    }

Content-Type tells the backend that the body contains JSON.

Never send a password through a query string:

    Incorrect:
    /api/login?password=secret

Query strings may appear in browser history, logs, and analytics.

Send credentials only over HTTPS in production.

## 8. Suggested project structure

When API calls are added, a useful structure is:

    src/
      api/
        apiClient.ts
        authApi.ts
        kosApi.ts
        surveyApi.ts
      components/
      data/
      pages/
      types/
        auth.ts
        kos.ts
        survey.ts

Responsibilities:

- apiClient.ts contains shared request behavior.
- authApi.ts contains login, logout, and current-user calls.
- kosApi.ts contains kos listing and detail calls.
- surveyApi.ts contains survey scheduling calls.
- types contains request and response types.

Do not place every API call directly inside large JSX components. Keeping network details separate makes components easier to read and test.

## 9. Environment variables

Development and production APIs may use different URLs.

Create a local environment file:

    .env.local

Example:

    VITE_API_URL=http://localhost:3000/api

Read it in TypeScript:

    const API_URL = import.meta.env.VITE_API_URL

Vite exposes only variables beginning with VITE_ to frontend code.

Important: frontend environment variables are not secret. They are included in browser JavaScript.

Never put these values in a Vite environment variable:

- Database passwords.
- Private API keys.
- Session-signing secrets.
- Password hashing secrets.

Those belong on the backend.

Add local environment files containing machine-specific values to .gitignore.

## 10. A reusable API client

A shared helper can handle repeated work.

Suggested src/api/apiClient.ts:

    const API_URL =
      import.meta.env.VITE_API_URL ?? '/api'

    type ApiErrorBody = {
      message?: string
    }

    export class ApiError extends Error {
      status: number

      constructor(message: string, status: number) {
        super(message)
        this.name = 'ApiError'
        this.status = status
      }
    }

    export async function apiRequest<T>(
      path: string,
      options: RequestInit = {},
    ): Promise<T> {
      const response = await fetch(API_URL + path, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorBody =
          (await response.json().catch(() => ({}))) as ApiErrorBody

        throw new ApiError(
          errorBody.message ?? 'Terjadi kesalahan.',
          response.status,
        )
      }

      if (response.status === 204) {
        return undefined as T
      }

      return response.json() as Promise<T>
    }

The generic T means the caller chooses the expected successful result type.

The helper:

- Adds the API base URL.
- Sends cookies.
- Adds a JSON header.
- Checks error statuses.
- Extracts backend error messages.
- Supports 204 responses.
- Parses successful JSON.

TypeScript types do not validate actual server data. If runtime validation is important, use a validation library or write validation functions.

## 11. Authentication recommendation

For a browser application, a secure HttpOnly session cookie is often a strong choice.

Typical flow:

1. Frontend sends email and password to POST /api/auth/login.
2. Backend verifies the password hash.
3. Backend creates a session.
4. Backend sends a Secure, HttpOnly cookie.
5. Browser stores the cookie.
6. Future requests include it with credentials: include.
7. Backend reads the session and identifies the user.

HttpOnly means frontend JavaScript cannot read the cookie. This reduces token theft from some cross-site scripting attacks.

The backend should configure cookies appropriately:

- HttpOnly.
- Secure in production.
- SameSite based on deployment architecture.
- A suitable Path.
- Expiry or maximum age.

The frontend should not store passwords.

Avoid storing long-lived authentication tokens in localStorage unless the team understands and accepts the security tradeoffs.

Authentication design should be reviewed with your backend teammate.

## 12. CORS and cookies

If frontend and backend use different origins during development, for example:

    Frontend:
    http://localhost:5173

    Backend:
    http://localhost:3000

The backend must configure Cross-Origin Resource Sharing, commonly called CORS.

For credentialed cookie requests:

- Frontend fetch uses credentials: include.
- Backend allows the exact frontend origin.
- Backend allows credentials.
- Backend cannot use a wildcard origin with credentials.

CORS is configured on the backend. It is not fixed by adding random headers to frontend fetch calls.

Another option is configuring a Vite development proxy so frontend code can request /api while Vite forwards requests to the backend.

## 13. Authentication types

Suggested src/types/auth.ts:

    export type User = {
      id: number
      name: string
      email: string
      role: 'tenant' | 'owner' | 'admin'
    }

    export type LoginInput = {
      email: string
      password: string
    }

    export type LoginResponse = {
      user: User
    }

Suggested src/api/authApi.ts:

    import { apiRequest } from './apiClient'
    import type {
      LoginInput,
      LoginResponse,
      User,
    } from '../types/auth'

    export function login(input: LoginInput) {
      return apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    }

    export function logout() {
      return apiRequest<void>('/auth/logout', {
        method: 'POST',
      })
    }

    export function getCurrentUser() {
      return apiRequest<{ user: User }>('/auth/me')
    }

The /auth/me endpoint lets the frontend ask whether an existing browser session is valid.

## 14. Login form state

A login form normally needs:

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

Submit flow:

    async function handleSubmit(
      event: FormEvent<HTMLFormElement>,
    ) {
      event.preventDefault()
      setIsLoading(true)
      setError(null)

      try {
        const result = await login({ email, password })
        setCurrentUser(result.user)
      } catch (error) {
        if (error instanceof ApiError) {
          setError(error.message)
        } else {
          setError('Tidak dapat terhubung ke server.')
        }
      } finally {
        setIsLoading(false)
      }
    }

try contains work that may fail.

catch handles failures.

finally runs whether the request succeeds or fails.

While loading:

- Disable the submit button.
- Show a loading label.
- Prevent duplicate submissions.

Example:

    <button disabled={isLoading} type="submit">
      {isLoading ? 'Memproses...' : 'Masuk'}
    </button>

Do not reveal whether a specific email exists if the backend intentionally returns a general invalid-credentials message.

## 15. Loading data with useEffect

A simple page may fetch a list after mounting:

    const [kosList, setKosList] = useState<KosListing[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
      const controller = new AbortController()

      async function loadKos() {
        try {
          const data = await getKosList(controller.signal)
          setKosList(data)
        } catch (error) {
          if (error instanceof DOMException &&
              error.name === 'AbortError') {
            return
          }

          setError('Gagal mengambil data kos.')
        } finally {
          setIsLoading(false)
        }
      }

      loadKos()

      return () => {
        controller.abort()
      }
    }, [])

AbortController cancels the request when the component unmounts.

The corresponding API function accepts the signal:

    export function getKosList(signal?: AbortSignal) {
      return apiRequest<KosListing[]>('/kos', {
        signal,
      })
    }

For larger applications, a server-state library can handle caching, retries, refetching, and stale data. Learn plain fetch first so the abstraction makes sense.

## 16. Rendering loading, error, empty, and success states

Every data request has more than a success state.

    if (isLoading) {
      return <p>Memuat kos...</p>
    }

    if (error) {
      return <p role="alert">{error}</p>
    }

    if (kosList.length === 0) {
      return <p>Belum ada kos yang tersedia.</p>
    }

    return <KosGallery listings={kosList} ... />

The four common states are:

1. Loading.
2. Error.
3. Empty.
4. Success.

Ignoring the first three makes an interface feel broken even when the happy path works.

## 17. Suggested kos endpoints

List and search:

    GET /api/kos?location=Depok&page=1&limit=20

Possible response:

    {
      "items": [
        {
          "id": 1,
          "title": "Kamar Kos Minimalis",
          "price": 891000,
          "location": "Depok",
          "rating": 4.8,
          "imageUrl": "https://..."
        }
      ],
      "page": 1,
      "limit": 20,
      "total": 42
    }

Detail:

    GET /api/kos/1

Possible response:

    {
      "kos": {
        "id": 1,
        "title": "Kamar Kos Minimalis",
        "address": "Jl. Margonda Raya No. 24, Depok",
        "facilities": ["Kasur", "Wi-Fi"],
        "rules": ["Wajib jaga kebersihan"],
        "availableRooms": 4
      }
    }

Use numeric values for machine-readable prices. The frontend can format them:

    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price)

## 18. Search query parameters

Query parameters are appropriate for filters and pagination.

Build them safely with URLSearchParams:

    const params = new URLSearchParams({
      location: 'Jakarta Selatan',
      type: 'putri',
      page: '1',
    })

    const path = '/kos?' + params.toString()

Do not manually join unescaped user text into a URL.

The backend must still validate every query parameter.

## 19. Favorite endpoints

Possible contract:

    GET /api/favorites
    POST /api/favorites/12
    DELETE /api/favorites/12

The backend determines the current user from the session. The frontend should not send a trusted user ID and expect that to provide authorization.

Example:

    export function addFavorite(kosId: number) {
      return apiRequest<void>('/favorites/' + kosId, {
        method: 'POST',
      })
    }

Optimistic updates can change the heart immediately and roll it back if the request fails. For a first implementation, waiting for the successful response is simpler.

## 20. Survey scheduling endpoint

Possible request:

    POST /api/surveys

    {
      "kosId": 12,
      "scheduledAt": "2026-06-28T03:00:00.000Z",
      "message": "Saya ingin melihat kamar yang tersedia."
    }

Possible response:

    {
      "survey": {
        "id": 88,
        "status": "pending",
        "scheduledAt": "2026-06-28T03:00:00.000Z"
      }
    }

Validate the date on both frontend and backend. Frontend validation improves usability. Backend validation provides actual security and data integrity.

## 21. Validation errors

A useful 422 response may look like:

    {
      "message": "Data tidak valid.",
      "errors": {
        "email": ["Format email tidak valid."],
        "password": ["Password minimal 8 karakter."]
      }
    }

Suggested type:

    type ValidationErrorBody = {
      message: string
      errors: Record<string, string[]>
    }

The frontend can display field-specific messages.

Never trust frontend validation alone. A user can bypass frontend code and call the API directly.

## 22. Handling 401 responses

A 401 may mean the session expired.

Possible frontend response:

1. Clear current user state.
2. Show a session-expired message.
3. Open or navigate to login.
4. Optionally remember the page the user wanted.

Do not retry an invalid login request forever.

A centralized API client can recognize status 401, but navigation decisions may belong in an authentication context or page layer.

## 23. Avoid exposing sensitive information

Never log or display:

- Passwords.
- Session cookies.
- Raw access tokens.
- Database errors.
- Password hashes.
- Secret environment variables.

Frontend source code is visible to users. Anything shipped to the browser must be considered public.

The backend should return safe error messages rather than database stack traces.

## 24. Preventing duplicate requests

Disable action buttons while their request is running.

    const [isSaving, setIsSaving] = useState(false)

    async function handleSave() {
      if (isSaving) return

      setIsSaving(true)

      try {
        await addFavorite(kos.id)
      } finally {
        setIsSaving(false)
      }
    }

The backend should also handle duplicate or repeated requests safely where appropriate.

## 25. API data versus UI data

The current KosListing type mixes display-ready strings with data.

Example:

    price: 'Mulai Rp891rb / bulan'

An API should often return structured values:

    {
      "monthlyPrice": 891000,
      "currency": "IDR"
    }

The frontend formats the display text.

Structured data is easier to sort, filter, calculate, translate, and validate.

Consider separate types:

    type KosApiRecord = {
      id: number
      monthlyPrice: number
      ...
    }

    type KosCardViewModel = {
      id: number
      displayPrice: string
      ...
    }

Do not add this complexity until it solves a real problem, but understand why API and UI shapes may differ.

## 26. Mocking before the backend is ready

Frontend work can continue using:

- The existing kosListings.ts data.
- A temporary Promise that returns fake data.
- A mock server agreed upon by the team.

Simple fake API:

    export async function getKosListMock() {
      await new Promise((resolve) => {
        setTimeout(resolve, 500)
      })

      return featuredKosListings
    }

Keep the fake function's return type compatible with the real API function. Replacing it later will then require fewer component changes.

Do not silently ship mock authentication as real authentication.

## 27. Testing an endpoint manually

Before connecting React, test the backend endpoint with:

- The browser for simple GET requests.
- curl.
- An API client application.
- Automated backend tests.

Example curl login request:

    curl -i \
      -X POST \
      -H "Content-Type: application/json" \
      -d '{"email":"user@example.com","password":"secret"}' \
      http://localhost:3000/api/auth/login

Check:

- Status code.
- Response headers.
- JSON shape.
- Cookie behavior.
- Validation failures.

If the endpoint itself does not work, debugging React first will send you on a scenic but unhelpful journey.

## 28. Recommended implementation order

Work with your backend teammate in this order:

1. Write endpoint contracts.
2. Decide cookie or token authentication.
3. Implement and test GET /api/kos.
4. Replace local gallery data with API data.
5. Implement GET /api/kos/:id.
6. Build login UI.
7. Implement login, logout, and current-user endpoints.
8. Connect the Masuk button.
9. Add favorites.
10. Add survey scheduling.
11. Add owner-only management features.
12. Add automated tests.

Build one complete vertical feature at a time. For example, finish kos listing from database to UI before starting five unfinished endpoints.

## 29. Questions to ask your backend teammate

Before integration, ask:

- What is the backend base URL?
- Which endpoints exist?
- What are the exact request and response shapes?
- Which fields are required?
- Which status codes can be returned?
- Are sessions cookie-based or token-based?
- Is the frontend on the same origin?
- How is CORS configured?
- How are validation errors formatted?
- How is pagination represented?
- How are uploaded image URLs returned?
- Which roles exist?
- Which endpoints require authentication?

Write the answers in shared documentation.

## 30. Debugging checklist

When a request fails:

1. Open browser developer tools.
2. Open the Network tab.
3. Find the request.
4. Check the URL.
5. Check the HTTP method.
6. Check request headers.
7. Check request JSON.
8. Check response status.
9. Check response JSON.
10. Check whether cookies were sent.
11. Check the backend logs.
12. Compare everything with the agreed contract.

Common causes:

- Wrong API URL.
- Backend is not running.
- Wrong property name.
- Missing Content-Type.
- Missing credentials: include.
- CORS configuration error.
- Invalid JSON.
- Session expired.
- Frontend expects a different response shape.

## 31. Final mental model

An API call is not a special React feature.

fetch performs the network request. React state stores the request result and controls what the user sees.

    User event or component mount
        |
        v
    Set loading state
        |
        v
    Call API function
        |
        v
    Await fetch response
        |
        +-- success -> store returned data
        |
        +-- failure -> store error message
        |
        v
    Clear loading state
        |
        v
    React renders the new state

Keep these responsibilities separate:

- Components manage presentation and interaction.
- API modules manage HTTP requests.
- Backend routes manage trusted business logic and data.
- Shared contracts keep both teammates aligned.

## 32. Current listing-detail contract

The current frontend expects a complete listing shape similar to:

    {
      "id": 1,
      "title": "Kamar Kos Minimalis",
      "location": "Depok",
      "monthlyPrice": 891000,
      "rating": 4.8,
      "tag": "Putri",
      "address": "Jl. Margonda Raya No. 24, Depok",
      "description": "Kamar minimalis...",
      "facilities": [
        "Kasur",
        "Wi-Fi"
      ],
      "facilityCategories": [
        {
          "id": "kamar",
          "title": "Fasilitas kamar",
          "items": [
            "Kasur",
            "Lemari",
            "Meja belajar"
          ]
        }
      ],
      "rules": [
        "Maksimal 1 orang/kamar"
      ],
      "roomSize": "3 x 4 m",
      "availableRooms": 4,
      "owner": {
        "id": 9,
        "name": "Ibu Ratna"
      },
      "paymentTerms": {
        "dpPercentage": 30,
        "serviceFee": 15000,
        "adminFee": 25000,
        "deposit": 200000,
        "discountPercentage": 7
      },
      "imageUrl": "https://...",
      "imageAlt": "Kamar kos minimalis",
      "media": [
        {
          "id": "media-101",
          "label": "Video tour",
          "type": "video",
          "url": "https://...",
          "thumbnailUrl": "https://...",
          "alt": "Video tour interior kos",
          "position": 0
        }
      ]
    }

The current local TypeScript model stores owner as a string for simplicity. A backend response should preferably return an owner object with an ID.

Suggested endpoints:

    GET /api/kos
    GET /api/kos/:kosId

The list endpoint may return only card fields for efficiency:

    {
      "id": 1,
      "title": "Kamar Kos Minimalis",
      "location": "Depok",
      "monthlyPrice": 891000,
      "rating": 4.8,
      "tag": "Putri",
      "discountPercentage": 7,
      "imageUrl": "https://..."
    }

The detail endpoint can return facilities, rules, owner, media, and payment terms.

## 33. Listing media API

Media should belong to a listing and have a stable display order.

Suggested media record:

    type KosMediaResponse = {
      id: string
      kosId: number
      label: string
      type: 'image' | 'video'
      url: string
      thumbnailUrl?: string
      alt: string
      position: number
    }

position determines thumbnail and lightbox order.

Suggested owner endpoints:

    POST /api/owner/kos/:kosId/media
    PATCH /api/owner/kos/:kosId/media/:mediaId
    DELETE /api/owner/kos/:kosId/media/:mediaId
    PATCH /api/owner/kos/:kosId/media-order

Uploads normally use multipart/form-data rather than JSON.

Example frontend upload:

    export async function uploadKosMedia(
      kosId: number,
      file: File,
      metadata: {
        label: string
        alt: string
        type: 'image' | 'video'
      },
    ) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('label', metadata.label)
      formData.append('alt', metadata.alt)
      formData.append('type', metadata.type)

      const response = await fetch(
        API_URL + '/owner/kos/' + kosId + '/media',
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        },
      )

      if (!response.ok) {
        throw new Error('Gagal mengunggah media.')
      }

      return response.json()
    }

Do not manually set Content-Type for FormData. The browser adds the required multipart boundary.

The backend should validate:

- Authenticated owner.
- Listing ownership.
- Allowed MIME types.
- File size.
- Image dimensions.
- Video duration and codecs.
- Media-count limits.
- Safe generated filenames.

Large media files are usually stored in object storage or a media service. PostgreSQL stores the media URL and metadata rather than the entire video binary.

Possible response:

    {
      "media": {
        "id": "media-101",
        "kosId": 1,
        "label": "Video tour",
        "type": "video",
        "url": "https://cdn.example.com/kos/1/tour.mp4",
        "thumbnailUrl": "https://cdn.example.com/kos/1/tour.jpg",
        "alt": "Video tour interior kos",
        "position": 0
      }
    }

For video, the backend or media service may need to:

- Transcode to browser-compatible H.264/AAC MP4.
- Generate a thumbnail.
- Move fast-start metadata to the beginning.
- Optionally create adaptive streaming versions.

## 34. Facility-category API

Facility categories are owner-extensible.

Possible request when updating listing facilities:

    PATCH /api/owner/kos/:kosId/facilities

    {
      "highlights": [
        "AC",
        "Wi-Fi",
        "Kamar mandi dalam"
      ],
      "categories": [
        {
          "title": "Fasilitas kamar",
          "position": 0,
          "items": [
            {
              "name": "AC",
              "position": 0
            },
            {
              "name": "Kasur",
              "position": 1
            }
          ]
        }
      ]
    }

The backend should not trust category IDs created by the browser. It should create or validate records and verify listing ownership.

If the product needs standardized search filters, distinguish:

- Standard facility IDs used for filtering.
- Owner-written display labels used for flexible descriptions.

Otherwise two owners may enter AC, A/C, and Air Conditioner as three unrelated filter values.

## 35. Authoritative payment-quote endpoint

The frontend currently calculates estimates for demonstration. The backend must calculate the real payable totals.

Suggested endpoint:

    POST /api/kos/:kosId/quotes

Request:

    {
      "rentalMonths": 6,
      "paymentMethod": "dp",
      "startDate": "2026-07-01"
    }

Possible response:

    {
      "quoteId": "quote-abc123",
      "currency": "IDR",
      "expiresAt": "2026-06-22T06:30:00.000Z",
      "rentalMonths": 6,
      "paymentMethod": "dp",
      "baseRent": 5346000,
      "discount": {
        "percentage": 7,
        "amount": 374220
      },
      "dp": {
        "percentage": 30,
        "rentAmount": 1603800,
        "serviceFee": 15000,
        "firstPayment": 1618800
      },
      "settlement": {
        "remainingRent": 3742200,
        "adminFee": 25000,
        "deposit": 200000,
        "serviceFee": 15000,
        "discountAmount": 374220,
        "total": 3607980
      },
      "totalUntilPaid": 5226780,
      "lines": [
        {
          "code": "base_rent",
          "label": "Biaya sewa",
          "amount": 5346000
        }
      ]
    }

The quote response should contain display-ready breakdown lines or enough structured data to create them.

The rental application should submit quoteId rather than a frontend-calculated total:

    POST /api/rental-applications

    {
      "kosId": 1,
      "quoteId": "quote-abc123",
      "startDate": "2026-07-01"
    }

The backend then:

1. Loads the quote.
2. Checks that it belongs to the current user and listing.
3. Checks that it has not expired.
4. Revalidates room availability.
5. Recalculates or verifies all totals.
6. Creates the rental application.

Never accept these as trusted request values:

- Total payment.
- Discount amount.
- Deposit.
- Admin fee.
- DP amount.

The browser can be modified by the user.

## 36. Suggested PostgreSQL relationships

A possible relational model:

    users
      id
      name
      email
      password_hash
      role

    kos_listings
      id
      owner_id -> users.id
      title
      city
      address
      description
      monthly_price
      room_size
      available_rooms
      tag
      status

    kos_media
      id
      kos_id -> kos_listings.id
      media_type
      label
      url
      thumbnail_url
      alt_text
      position

    facility_categories
      id
      kos_id -> kos_listings.id
      title
      position

    facility_items
      id
      category_id -> facility_categories.id
      name
      position

    kos_rules
      id
      kos_id -> kos_listings.id
      description
      position

    payment_terms
      kos_id -> kos_listings.id
      dp_percentage
      service_fee
      admin_fee
      deposit
      discount_percentage

    payment_quotes
      id
      user_id -> users.id
      kos_id -> kos_listings.id
      request_snapshot
      result_snapshot
      expires_at

Exact table design depends on backend requirements.

Money should use an integer smallest unit or an appropriate fixed-precision numeric type. Do not use floating-point types for currency.

Useful constraints:

- monthly_price must not be negative.
- available_rooms must not be negative.
- percentages should remain between 0 and 100.
- media position should be unique per listing where practical.
- foreign keys should define deliberate deletion behavior.
