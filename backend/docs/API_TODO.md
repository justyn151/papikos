# Papikos Backend API TODO

This document tracks which features from the API contract (originally from the frontend `API_CALLS_GUIDE.md`) have been implemented on the backend and which remain to be built.

---

## Implemented

### 4. KosService contract — read endpoints (DONE)

The backend implements three of the four operations described in the `KosService` contract:

- `getFeatured()` → `GET /api/kos?featured=true`
- `getById(id)` → `GET /api/kos/{id}`
- `search(request)` → `GET /api/kos/search?…`
- `getSearchMetadata()` → `GET /api/search/metadata`

Contract reference: [`../app/main.py`](../app/main.py)

### 5. Prepared endpoints (DONE)

All four read-only API endpoints from the contract are implemented.

#### Featured listings

```
GET /api/kos?featured=true
```

Returns `List[KosListing]`. Filters by `is_featured` column when the query parameter is provided.

Implementation: [`../app/main.py:139`](../app/main.py#L139)

#### Listing detail

```
GET /api/kos/{id}
```

Returns a single `KosListing`. Returns HTTP 404 with `{"detail": "Kos tidak ditemukan"}` when the ID does not exist.

Implementation: [`../app/main.py:433`](../app/main.py#L433)

#### Search

```
GET /api/kos/search?query=Yogyakarta&tags=Putri&duration=Bulanan&minPrice=500000&maxPrice=2000000&facilities=Wi-Fi,AC&rules=&availableOnly=true
```

Supports all query parameters from the contract. Returns `List[KosSearchResult]`, where each result bundles a `KosSearchRecord` (with coordinates) and the full `KosListing`. Search matches against title, city, address, nearby campuses, and area aliases.

Implementation: [`../app/main.py:234`](../app/main.py#L234)

#### Search metadata

```
GET /api/search/metadata
```

Returns `SearchMetadata` containing:
- `cities` — city names with nested campus and area arrays (from `admin_locations`)
- `popularCampuses` — hardcoded list of well-known universities
- `searchableLocations` — flattened index of all locations (provinces, cities, areas, campuses) with normalized IDs, labels, descriptions, and alias-based keywords for autocomplete

Implementation: [`../app/main.py:532`](../app/main.py#L532)
SearchMetadata model: [`../app/models.py:78`](../app/models.py#L78)
SearchableLocation model: [`../app/models.py:71`](../app/models.py#L71)

### 6. Listing response shape (DONE)

The backend `KosListing` response matches all fields from the contract:

```json
{
  "id": 101,
  "title": "Kos Putri Pogung Nyaman",
  "location": "Yogyakarta",
  "monthlyPrice": 950000,
  "rating": 4.8,
  "tag": "Putri",
  "address": "…",
  "description": "…",
  "facilities": ["Kasur", "Wi-Fi"],
  "facilityCategories": [{ "id": "kamar", "title": "Fasilitas kamar", "items": […] }],
  "rules": ["Tidak merokok di dalam kamar"],
  "roomSize": "3 x 4 m",
  "availableRooms": 2,
  "rentalDurations": ["Bulanan", "3 Bulan", "6 Bulan", "Tahunan"],
  "owner": "Ibu Sari",
  "paymentTerms": {
    "dpPercentage": 30,
    "serviceFee": 15000,
    "adminFee": 25000,
    "deposit": 200000,
    "discountPercentage": 7
  },
  "imageUrl": "https://…",
  "imageAlt": "Interior kos",
  "media": [
    { "id": "m1", "category": "Kamar", "label": "…", "type": "image", "url": "…", "thumbnailUrl": null, "alt": "…" }
  ]
}
```

All monetary values use integer rupiah. Coordinates use numeric decimal columns for Leaflet map markers.

Model: [`../app/models.py:25`](../app/models.py#L25)
Row-to-listing mapping: [`../app/main.py:51`](../app/main.py#L51)
PaymentTerms model: [`../app/models.py:4`](../app/models.py#L4)
KosMedia model: [`../app/models.py:11`](../app/models.py#L11)
FacilityCategory model: [`../app/models.py:20`](../app/models.py#L20)
Database schema: [`../init-scripts/01-schema.sql`](../init-scripts/01-schema.sql)

### 7. Search and map data (DONE)

`KosSearchRecord` includes all search-specific fields:

- `id`, `listingId` — references the full listing
- `name`, `city`, `area` — search-display fields (area is heuristically deduced from address or mapped via `admin_locations`)
- `address` — full street address
- `nearbyCampuses` — array of campus names
- `coordinates` — `{ lat, lng }` for Leaflet markers
- `monthlyPrice`, `tag` — filter values

Coordinates are stored as `numeric(10,7)` columns in `kos_listings` to support geospatial queries and PostGIS upgrades.

KosSearchRecord model: [`../app/models.py:50`](../app/models.py#L50)
KosSearchResult model: [`../app/models.py:62`](../app/models.py#L62)
Coordinates model: [`../app/models.py:46`](../app/models.py#L46)
Row-to-record mapping: [`../app/main.py:112`](../app/main.py#L112)
Seed coordinates: [`../init-scripts/02-seed.sql`](../init-scripts/02-seed.sql)

### 8. Error response format (DONE)

The backend returns structured HTTP errors:

- **404** — `{"detail": "Kos tidak ditemukan"}` when a listing does not exist
- **422** — automatic Pydantic validation errors for invalid query parameters
- **500** — FastAPI default for unhandled server errors

Pydantic models (`KosListing`, `KosSearchResult`, etc.) provide request/response validation on every endpoint via FastAPI's `response_model` parameter.

404 handler: [`../app/main.py:527`](../app/main.py#L527)
CORS configuration: [`../app/main.py:36`](../app/main.py#L36)
Model validation: [`../app/models.py`](../app/models.py)

---

## Not Implemented

### 9. Authentication boundary

The frontend may render login forms and send credentials, but the backend must own:

- Password hashing.
- Session or token creation.
- Authorization.
- Owner/listing ownership checks.
- Trusted price calculations.

For browser applications, secure `HttpOnly`, `Secure`, `SameSite` cookies are generally safer than storing long-lived tokens in localStorage.

If cookies are used across origins, configure CORS precisely and add `credentials: 'include'` to requests.

### 10. Media uploads

Large images and videos should normally be stored in object storage. PostgreSQL stores URLs and metadata rather than the binary video.

A future owner flow could use:

```http
POST /owner/kos/:id/media
Content-Type: multipart/form-data
```

Each media row should have its own ID, category, label, type, URL, thumbnail, alt text, and ordering value. Multiple images may share one category.

### 11. Payment calculations

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

### 12. Backend handoff checklist

1. ✅ Agree on endpoint paths and JSON field names.
2. ✅ Match the TypeScript contract or add DTO conversion functions.
3. ✅ Return complete media and facility arrays.
4. ✅ Support all search query parameters.
5. ✅ Configure CORS for the frontend origin.
6. ✅ Set `VITE_API_BASE_URL` locally.
7. ❌ Test loading, empty, 404, validation, and server-error cases.
8. ❌ Add runtime response validation.
9. ❌ Move payment authority to the backend.
10. ❌ Add pagination before the listing dataset becomes large.
