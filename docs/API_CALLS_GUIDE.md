# Papikos Frontend API Calls Guide

Papikos has a frontend API boundary that handles all remote network requests. By default, if the backend URL is not configured, the client throws a setup error. When configured, it connects directly to the Python FastAPI backend.

---

## 1. Current service structure

Components never fetch endpoints directly. Instead, pages make calls to the unified service layer:

```text
React page
  -> kosService method (in kosService.ts)
       -> apiRequest function (in apiClient.ts)
            -> FastAPI backend (on http://localhost:8000/api)
```

The relevant frontend files are:

* [apiClient.ts](../src/services/apiClient.ts) — Sets up the fetch wrapper, base URL, and HTTP headers.
* [kosService.ts](../src/services/kosService.ts) — Maps React requests to API paths and query parameters.
* [types/kos.ts](../src/types/kos.ts) — Frontend TypeScript interfaces for listings.
* [types/search.ts](../src/types/search.ts) — Frontend TypeScript interfaces for search records.

---

## 2. Selecting the API target

Configure the backend API URL by copying `.env.example` to `.env.local` in the project root:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

> [!NOTE]
> Vite injects environment variables beginning with `VITE_` at build time. When using Docker, this is configured via the compose build argument `VITE_API_BASE_URL` pointing to the backend's address.

---

## 3. Backend API contracts

For detailed information on the backend JSON endpoints, query parameter schemas, and response examples, refer directly to the backend documentation:

👉 **[Backend API Guide](../backend/docs/API_GUIDE.md)**

All backend schemas and Swagger configurations are automatically generated at:
- `http://localhost:8000/docs` (Swagger UI)
