# Papikos API Calls Guide

Papikos already has a frontend API boundary. The application uses mock data by default and automatically switches to HTTP when a backend URL is configured.

## 1. Current service structure

```text
React page
  -> kosService method
       -> mockKosService -> local TypeScript data
       or
       -> remoteKosService -> apiRequest -> backend
```

Relevant files:

```text
src/services/apiClient.ts
src/services/kosService.ts
src/types/kos.ts
src/types/search.ts
src/data/kosListings.ts
src/data/searchData.ts
```

Pages should not call `fetch` directly and should not import mock arrays. They call `kosService`, which keeps transport details out of components.

## 2. Selecting mock or remote mode

Create `.env.local` from `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Restart Vite after changing environment variables.

- Empty URL: use local mock data.
- Configured URL: call the remote backend.

Only variables beginning with `VITE_` are exposed to frontend code. Never put database passwords, JWT signing secrets, private API keys, or service credentials in a Vite variable.

## 3. API client

`apiRequest<T>()` provides shared HTTP behavior:

- Prefixes paths with `VITE_API_BASE_URL`.
- Sends JSON headers.
- Parses JSON responses.
- Throws `ApiError` for unsuccessful status codes.
- Supports normal `RequestInit` options.

The generic `T` describes the expected response:

```ts
apiRequest<KosListing[]>('/kos?featured=true')
```

TypeScript does not validate untrusted JSON at runtime. A production project should eventually add schema validation with a library such as Zod or validate DTOs manually.

## 4. KosService contract

```ts
interface KosService {
  getFeatured(): Promise<KosListing[]>
  getById(id: number): Promise<KosListing | null>
  search(request: SearchKosRequest): Promise<KosSearchResult[]>
  getSearchMetadata(): Promise<SearchMetadata>
}
```

Both mock and remote implementations must follow this contract. That is why the UI can switch data sources without being rewritten.

## 5. Prepared endpoints

### Featured listings

```http
GET /kos?featured=true
```

Response: `KosListing[]`.

### Listing detail

```http
GET /kos/:id
```

Response: `KosListing`. Prefer HTTP 404 when it does not exist. The current frontend also accepts `null` if the backend contract chooses that approach.

### Search

```http
GET /kos/search?query=Yogyakarta&tags=Putri&duration=Bulanan&minPrice=500000&maxPrice=2000000&facilities=Wi-Fi,AC&rules=&availableOnly=true
```

Response: `KosSearchResult[]`.

```ts
type KosSearchResult = {
  record: KosSearchRecord
  listing: KosListing
}
```

The backend should normalize case and aliases or accept the canonical suggestion value sent by the frontend.

### Search metadata

```http
GET /search/metadata
```

Response:

```json
{
  "cities": [
    {
      "city": "Yogyakarta",
      "campuses": ["Universitas Gadjah Mada"],
      "areas": ["Pogung", "Kaliurang"]
    }
  ],
  "popularCampuses": ["Universitas Gadjah Mada"]
}
```

## 6. Listing response shape

A complete listing must include data used by the detail page:

```json
{
  "id": 101,
  "title": "Kos Putri Pogung Nyaman",
  "location": "Yogyakarta",
  "monthlyPrice": 950000,
  "rating": 4.8,
  "tag": "Putri",
  "address": "Pogung, Sinduadi, Mlati, Sleman, DI Yogyakarta",
  "description": "Kos nyaman dekat kampus.",
  "facilities": ["Kasur", "Wi-Fi"],
  "facilityCategories": [],
  "rules": ["Tidak merokok di dalam kamar"],
  "roomSize": "3 x 4 m",
  "availableRooms": 2,
  "rentalDurations": ["Bulanan", "6 Bulan", "Tahunan"],
  "owner": "Ibu Sari",
  "paymentTerms": {
    "dpPercentage": 30,
    "serviceFee": 15000,
    "adminFee": 25000,
    "deposit": 200000,
    "discountPercentage": 7
  },
  "imageUrl": "https://example.com/cover.jpg",
  "imageAlt": "Interior kos",
  "media": []
}
```

Money should be sent as integer rupiah, not formatted strings. Coordinates should be numeric latitude and longitude.

## 7. Search and map data

`KosSearchRecord` includes:

- Searchable name, city, area, and complete address.
- Nearby campuses used for matching.
- Monthly price and gender tag.
- `listingId` linking to detail data.
- Real latitude and longitude for Leaflet markers.

PostgreSQL can store coordinates as decimal columns or with PostGIS when radius and map-bound queries become important.

## 8. Loading, cancellation, and errors

Route pages display loading skeletons and readable error states. Effects use an `isCurrentRequest` guard so a slower old search cannot overwrite a newer result.

For real HTTP cancellation, the next improvement is an `AbortController`:

```ts
const controller = new AbortController()
apiRequest('/kos', { signal: controller.signal })

return () => controller.abort()
```

Do not show raw database errors to users. The backend should return a stable error body, for example:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Harga minimum tidak valid",
  "fields": {
    "minPrice": "Must be zero or greater"
  }
}
```

## 9. Authentication boundary

The frontend may render login forms and send credentials, but the backend must own:

- Password hashing.
- Session or token creation.
- Authorization.
- Owner/listing ownership checks.
- Trusted price calculations.

For browser applications, secure `HttpOnly`, `Secure`, `SameSite` cookies are generally safer than storing long-lived tokens in localStorage.

If cookies are used across origins, configure CORS precisely and add `credentials: 'include'` to requests.

## 10. Media uploads

Large images and videos should normally be stored in object storage. PostgreSQL stores URLs and metadata rather than the binary video.

A future owner flow could use:

```http
POST /owner/kos/:id/media
Content-Type: multipart/form-data
```

Each media row should have its own ID, category, label, type, URL, thumbnail, alt text, and ordering value. Multiple images may share one category.

## 11. Payment calculations

The current frontend calculates payment previews for demonstration. Production totals, discounts, deposits, and service fees must come from an authoritative backend quote endpoint:

```http
POST /kos/:id/payment-quote
```

Request:

```json
{
  "rentalMonths": 6,
  "paymentMethod": "full"
}
```

The backend response should contain line items and the final total. Never trust a total submitted by the browser.

## 12. Backend handoff checklist

1. Agree on endpoint paths and JSON field names.
2. Match the TypeScript contract or add DTO conversion functions.
3. Return complete media and facility arrays.
4. Support all search query parameters.
5. Configure CORS for the frontend origin.
6. Set `VITE_API_BASE_URL` locally.
7. Test loading, empty, 404, validation, and server-error cases.
8. Add runtime response validation.
9. Move payment authority to the backend.
10. Add pagination before the listing dataset becomes large.
