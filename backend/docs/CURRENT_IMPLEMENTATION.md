# Papikos Current Backend Implementation

This document describes the current architecture and technical implementations of the Python backend.

---

## Technical Stack

- **FastAPI**: Asynchronous web framework for building APIs.
- **Uvicorn**: High-performance ASGI server for running the FastAPI application.
- **asyncpg**: Fast, asynchronous PostgreSQL driver.
- **PostgreSQL**: Relational database store.
- **Pydantic & Pydantic-Settings**: For schema validation and configurations.

---

## Core Components

### 1. Settings Configuration

Settings are declared in [config.py](../app/config.py) using Pydantic's `BaseSettings`.
- Exposes:
  - `DATABASE_URL` (defaults to localhost PostgreSQL)
  - `CORS_ORIGINS` (comma-separated origins allowed to make API calls)
  - `PORT` (port to run Uvicorn on, defaults to 8000)
- The settings module automatically reads from a local `.env` file or environment variables.

### 2. Database Connection Pooling

The database connections are managed in [database.py](../app/database.py).
- Creates an `asyncpg.create_pool` with `min_size=2` and `max_size=10`.
- Implements an async context manager `connection()` which acquires a connection from the pool and releases it when finished.
- Lifespan events in [main.py](../app/main.py) trigger `connect()` on startup and `disconnect()` on shutdown.

### 3. Database Schema

The database is initialized by scripts in `backend/init-scripts/`:
- **`01-schema.sql`**: Configures PostgreSQL schema, creating the following tables:
  - `admin_locations`: Stores provinces, cities, campuses, areas, and their aliases.
  - `kos_listings`: Stores main details of each kos property.
  - `kos_payment_terms`: Stores financial/booking rules.
  - `kos_facilities` and `kos_facility_category_items`: Stores simple and nested facilities lists.
  - `kos_rules`: Stores custom house rules.
  - `kos_rental_durations`: Stores allowed rental periods.
  - `kos_media`: Stores images/videos associated with the listing.
  - `kos_nearby_campuses`: Stores campus mapping.
- **`02-seed.sql`**: Populates the database with default entries matching the mock data structure.

### 4. CORS Middleware

To allow the frontend running on separate origins to communicate with the FastAPI service, CORS is configured in [main.py](../app/main.py):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
Origins are parsed as a list of strings by splitting `CORS_ORIGINS` on commas.
