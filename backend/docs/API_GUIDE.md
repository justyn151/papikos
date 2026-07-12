# Papikos Backend API Guide

This document defines the REST API endpoints provided by the Papikos backend. The API is hosted on port `8000` by default under the `/api` prefix.

---

## Endpoint Inventory

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/kos` | List all listings (can filter for featured listings). |
| `GET` | `/api/kos/search` | Search and filter listings with complex criteria. |
| `GET` | `/api/kos/{id}` | Retrieve details of a specific listing. |
| `GET` | `/api/search/metadata` | Get lookup data for suggestions (cities, campuses, areas). |

---

## 1. Get Listings

Retrieve a list of kos listings.

- **URL**: `/api/kos`
- **Method**: `GET`
- **Query Parameters**:
  - `featured` (boolean, optional): Set to `true` to fetch featured carousel listings only.

### Example Response (`HTTP 200 OK`)
```json
[
  {
    "id": 101,
    "title": "Kos Putri Pogung Nyaman",
    "location": "Yogyakarta",
    "monthlyPrice": 950000,
    "rating": 4.8,
    "tag": "Putri",
    "address": "Pogung, Sinduadi, Mlati, Sleman, DI Yogyakarta",
    "description": "Kos nyaman dekat kampus UGM dengan parkir motor luas.",
    "facilities": ["Kasur", "Wi-Fi", "Kamar Mandi Dalam"],
    "facilityCategories": [
      {
        "id": "kamar",
        "title": "Fasilitas Kamar",
        "items": ["Kasur", "Lemari", "Meja"]
      }
    ],
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
    "imageUrl": "http://localhost:3000/images/room1.jpg",
    "imageAlt": "Interior kamar kos",
    "media": [
      {
        "id": "m1",
        "category": "Kamar",
        "label": "Kamar Utama",
        "type": "image",
        "url": "http://localhost:3000/images/room1.jpg",
        "thumbnailUrl": null,
        "alt": "Foto detail kamar"
      }
    ]
  }
]
```

---

## 2. Search and Filter Listings

Find listings matching search text, coordinates, tag rules, price ranges, and facilities.

- **URL**: `/api/kos/search`
- **Method**: `GET`
- **Query Parameters**:
  - `query` (string, optional): Matches against titles, cities, addresses, or nearby campuses.
  - `tags` (string, optional): Comma-separated list of gender tags (`Putra`, `Putri`, `Campur`).
  - `duration` (string, optional): Rental period filter (e.g., `Bulanan`).
  - `minPrice` (integer, optional): Minimum monthly price in Rupiah.
  - `maxPrice` (integer, optional): Maximum monthly price in Rupiah.
  - `facilities` (string, optional): Comma-separated list of required facilities.
  - `rules` (string, optional): Comma-separated list of rules.
  - `availableOnly` (boolean, optional): If `true`, returns only listings with `availableRooms > 0`. Default is `false`.

### Example Response (`HTTP 200 OK`)
```json
[
  {
    "record": {
      "id": 101,
      "listingId": 101,
      "name": "Kos Putri Pogung Nyaman",
      "city": "Yogyakarta",
      "area": "Pogung",
      "address": "Pogung, Sinduadi, Mlati, Sleman, DI Yogyakarta",
      "nearbyCampuses": ["Universitas Gadjah Mada"],
      "coordinates": {
        "lat": -7.7562,
        "lng": 110.3721
      },
      "monthlyPrice": 950000,
      "tag": "Putri"
    },
    "listing": {
      "id": 101,
      "title": "Kos Putri Pogung Nyaman",
      "location": "Yogyakarta",
      ...
    }
  }
]
```

---

## 3. Get Listing by ID

Retrieve detailed information of a single listing.

- **URL**: `/api/kos/{id}`
- **Method**: `GET`
- **Path Parameters**:
  - `id` (integer, required): The unique identifier of the listing.

### Example Response (`HTTP 200 OK`)
Returns the complete listing object structure (see `/api/kos` response).

### Error Response (`HTTP 404 Not Found`)
```json
{
  "detail": "Kos tidak ditemukan"
}
```

---

## 4. Get Search Metadata

Get listings metadata representing campus suggestions, area lists, and cities to populate frontend search suggestions.

- **URL**: `/api/search/metadata`
- **Method**: `GET`

### Example Response (`HTTP 200 OK`)
```json
{
  "cities": [
    {
      "city": "Yogyakarta",
      "campuses": ["Universitas Gadjah Mada", "Universitas Negeri Yogyakarta"],
      "areas": ["Pogung", "Kaliurang", "Babarsari"]
    }
  ],
  "popularCampuses": [
    "Universitas Gadjah Mada",
    "Universitas Indonesia",
    "Institut Teknologi Bandung"
  ],
  "searchableLocations": [
    {
      "id": "campus-yogyakarta-universitas-gadjah-mada",
      "label": "Universitas Gadjah Mada",
      "description": "Kampus di Yogyakarta",
      "searchValue": "Universitas Gadjah Mada",
      "keywords": ["Yogyakarta", "UGM"]
    }
  ]
}
```
