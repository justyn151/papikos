# Papikos Backend Beginner Guide

This guide explains how the Papikos Python backend works. It is written for a beginner, so it explains backend and database ideas slowly instead of assuming you already know the terminology.

Papikos uses a modern Python stack built around **FastAPI** for web routing, **PostgreSQL** for persistent storage, and **Pydantic** for data validation.

---

## 1. The big idea

Unlike the frontend which runs inside the user's browser, the backend runs on a server. It listens for incoming HTTP requests, queries the database, formats the results, and returns them as JSON.

The backend lifecycle follows this flow:

```text
HTTP Request
  -> FastAPI matches URL to a route function (in main.py)
  -> route function borrows a database connection from the pool (in database.py)
  -> function runs a SQL query on PostgreSQL
  -> raw SQL rows are parsed into Pydantic models (in models.py)
  -> FastAPI converts Pydantic models to JSON
  -> HTTP Response returned to browser/client
```

This ensures that the React frontend has a stable and predictable API to fetch lists, search results, and details.

---

## 2. Important vocabulary

### FastAPI

FastAPI is a Python web framework used to build APIs. It is very fast and automatically creates documentation for all endpoints (accessible at `/docs`).

### Route Decorator

A route decorator (like `@app.get("/api/kos")`) tells FastAPI to run the function right below it whenever someone visits that URL path.

### Pydantic Model

Pydantic is used to define the "shape" of our data. A Pydantic model is a Python class representing objects with specific field types (like strings, integers, or lists). FastAPI uses this to check that incoming/outgoing data matches the defined schema.

### Database Connection Pool

Creating a new connection to PostgreSQL takes time. A connection pool (managed via `asyncpg.Pool`) keeps a group of connections open and ready to be used. When a request arrives, it borrows a connection, uses it, and returns it to the pool.

---

## 3. Directory structure

The backend code lives inside the `/backend` folder:

```text
backend/
  ├── app/
  │    ├── __init__.py      # Marks directory as a Python package
  │    ├── config.py        # Settings configuration (reads from environment variables)
  │    ├── database.py      # Database connection pool setup (asyncpg)
  │    ├── models.py        # Pydantic data schemas
  │    └── main.py          # FastAPI application initialization & endpoints
  ├── init-scripts/         # Database migrations (schema and seed data)
  ├── requirements.txt      # Python dependencies
  ├── Dockerfile            # Container build recipe
  └── compose.yaml          # Standalone backend Compose configuration
```

---

## 4. Async and await

You will see `async` and `await` keywords throughout the backend code. 

- `async def` tells Python that this function runs asynchronously (can yield execution while waiting).
- `await` tells Python to temporarily pause this function and work on other incoming tasks while waiting for a slow task (like a database query) to finish.

This allows FastAPI to handle thousands of requests concurrently without blocking.

---

## 5. Database model mapping

When asyncpg returns records from a database query, they are raw rows. To return safe JSON structures matching our types, we translate these rows into Pydantic objects:

```python
# In backend/app/main.py
def row_to_kos_listing(row) -> KosListing:
    # 1. Extract and parse complex structures (e.g. parsing JSON arrays)
    payment_terms = parse_json(row['payment_terms'])
    
    # 2. Build sub-models
    terms = PaymentTerms(
        dpPercentage=payment_terms.get('dpPercentage', 0),
        ...
    )
    
    # 3. Return the complete model
    return KosListing(
        id=row['id'],
        title=row['title'],
        paymentTerms=terms,
        ...
    )
```

FastAPI automatically converts this returned `KosListing` object into a JSON response.

---

## 6. Local development flow

### Prerequisites
Make sure Python 3.13+ and PostgreSQL are installed.

### Setup Virtual Environment
Run these commands inside the `backend` folder:
```bash
python -m venv venv
venv\Scripts\activate      # On Windows
source venv/bin/activate    # On Unix/macOS
pip install -r requirements.txt
```

### Running Directly
Start the development server using Uvicorn:
```bash
uvicorn app.main:app --reload
```
The `--reload` flag automatically restarts the server when any Python file changes.

### Running with Docker (Recommended)
From the project root:
```bash
docker compose up --build
```
This spins up the database, initializes the tables, seeds dummy listings, and launches the API.

---

## 7. Interactive API Documentation (Swagger)

FastAPI automatically generates interactive Swagger documentation. When the backend is running, open:
- [http://localhost:8000/docs](http://localhost:8000/docs)

Here, you can inspect all parameters, try out requests, and see schema structures.

---

## 8. Safe exercises

Try these simple exercises to get comfortable with the codebase:

1. **Change Settings default**: In `backend/app/config.py`, change the default port from `8000` to `8001`.
2. **Add a field to models**: Add a new string field `notes` to `KosListing` in `backend/app/models.py`.
3. **Extend Seed Data**: Open `backend/init-scripts/02-seed.sql` and add a new custom facility or room size.
4. **Modify an API response description**: Change the route summary or tags in `backend/app/main.py` and inspect how it updates in `/docs`.
