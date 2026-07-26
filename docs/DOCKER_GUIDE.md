# Docker Guide for Papikos

This guide explains Docker from the beginning and then connects every concept
to the files in Papikos. You do not need previous Docker experience.

## 1. Why Papikos uses Docker

Papikos is not one program. It has three parts that need to work together:

1. A React frontend that runs in the browser.
2. A Python/FastAPI API that handles requests and application logic.
3. A PostgreSQL database that stores listings and users.

Without Docker, you install and configure Node for the frontend build, Python
for the API, PostgreSQL, database users, ports, and environment variables
yourself. Different machines can end up with different versions or settings.

Docker packages each part into a predictable environment. Docker Compose then
starts those environments together and connects them on a private network.

```text
Your browser
    |
    | http://localhost:3000
    v
+------------------------+
| frontend container     |
| Nginx + built React app|
+-----------+------------+
            |
            | http://api:8000/api
            v
+------------------------+
| api container          |
| Python + FastAPI       |
+-----------+------------+
            |
            | postgres://...@db:5432/papikos
            v
+------------------------+
| db container           |
| PostgreSQL             |
+-----------+------------+
            |
            v
   postgres-data volume
```

The names `frontend`, `api`, and `db` come from `compose.yaml`. Containers on
the Compose network can use those names like hostnames.

## 2. The essential Docker vocabulary

### Image

An image is a packaged, read-only template for running software. It contains a
filesystem, installed dependencies, and startup instructions.

Examples in Papikos:

- `postgres:17-alpine` is a ready-made PostgreSQL image.
- The API image is built from `backend/Dockerfile`.
- The frontend image is built from the root `Dockerfile`.

An image is similar to a class or a recipe. It is not the running program.

### Container

A container is a running instance of an image. Starting Papikos creates one
frontend container, one API container, and one database container.

An image can exist while no container is running. You can also delete and
recreate a container without deleting its image.

### Dockerfile

A Dockerfile contains instructions for building an image. Common instructions
include:

- `FROM`: choose a starting image.
- `WORKDIR`: choose the working directory inside the image.
- `COPY`: copy project files into the image.
- `RUN`: execute a build-time command.
- `ENV`: define an environment variable.
- `EXPOSE`: document the port used by the program.
- `CMD`: define the default command when a container starts.

Dockerfile instructions create cached layers. If `package-lock.json` has not
changed, Docker can often reuse the dependency-installation layer instead of
running `npm ci` again.

### Docker Compose

Docker Compose describes a group of related containers in `compose.yaml`.
Papikos uses it to define:

- Which images to use or build.
- Environment variables.
- Ports exposed to your machine.
- Database storage.
- Startup dependencies and health checks.
- The private network between services.

The command is `docker compose` with a space. Older tutorials may use the
separate legacy command `docker-compose`.

### Port

A container has its own network. Publishing a port connects a port on your
machine to a port inside a container.

Compose writes this as `HOST:CONTAINER`:

| Service | Mapping | Meaning |
| --- | --- | --- |
| Frontend | `3000:80` | Local port 3000 forwards to Nginx port 80. |
| API | `3001:8000` | Local port 3001 forwards to FastAPI port 8000. |
| Database | `5433:5432` | Local port 5433 forwards to PostgreSQL port 5432. |

Therefore, your browser uses `http://localhost:3000`, even though Nginx listens
on port 80 inside its container.

Containers use their internal addresses when talking to each other. The API
connects to `db:5432`, not `localhost:5433`. Inside the API container,
`localhost` means the API container itself.

### Volume

A container's writable filesystem is disposable. A Docker volume stores data
separately so it survives container replacement.

Papikos stores PostgreSQL data in the named `postgres-data` volume. Running
`docker compose down` removes containers but preserves this volume. Starting
the project again restores the existing database.

Running `docker compose down --volumes` deletes the volume and all local
Papikos database data and owner-uploaded showcase images. Papikos uses
`postgres-data` for PostgreSQL and `media-data` for uploaded images. Treat that
command as a full local data reset.

### Bind mount

A bind mount exposes a file or directory from your machine inside a container.
Papikos mounts the SQL migrations and seed files into PostgreSQL's initialization
directory as read-only files.

PostgreSQL runs these scripts in filename order only when it creates a new,
empty database volume:

1. `001_initial_schema.sql`
2. `002_auth_schema.sql`
3. `003_sessions_schema.sql`
4. `004_renter_actions_schema.sql`
5. `005_password_resets_schema.sql`
6. `006_owner_workflows_schema.sql`
7. `007_normalize_facilities.sql`
8. `008_normalize_locations.sql`
9. `009_renter_request_context.sql`
10. `010_admin_owner_system.sql`
11. `011_owner_listing_content.sql`
12. `012_custom_listing_content_and_demo_login.sql`
13. `013_mock_data.sql` (the mounted seed file)

Changing a migration and restarting an existing database does not run it
again. During early development, reset the volume to replay all scripts. In a
production application, use a proper incremental migration tool instead.

### Network

Compose automatically creates a private network for the project. The services
can find one another using their service names:

- Nginx sends API requests to `api:8000`.
- FastAPI connects to PostgreSQL at `db:5432` through asyncpg.
- The database is not addressed as `localhost` by either container.

### Health check

A running process is not necessarily ready. PostgreSQL may need time to create
tables, and the API cannot answer correctly before PostgreSQL is ready.

Papikos health checks work in sequence:

1. Compose starts PostgreSQL.
2. `pg_isready` waits for PostgreSQL to accept connections.
3. Compose starts the API.
4. The API health check calls `/api/health`, which executes `select 1`.
5. Compose starts the frontend after the API becomes healthy.

`depends_on` controls this startup order. It is not a substitute for retry and
recovery logic in a larger production system, but it makes local startup much
more reliable.

## 3. What each Papikos Docker file does

### `compose.yaml`

This is the entry point for the complete local stack.

The `db` service:

- Uses PostgreSQL 17 on Alpine Linux.
- Creates a database and local development account named `papikos`.
- Publishes PostgreSQL on local port 5433.
- preserves its data in `postgres-data`.
- Runs the schema and mock seed when the volume is first created.

The `api` service:

- Builds from `backend/Dockerfile`.
- Receives a private `DATABASE_URL` using the hostname `db`.
- Publishes the FastAPI service on local port 3001 for debugging.
- Waits for the database health check.

The `frontend` service:

- Builds from the root `Dockerfile`.
- Compiles `VITE_API_BASE_URL=/api` into the browser application.
- Publishes Nginx on local port 3000.
- Waits for the API health check.

The credentials in `compose.yaml` are simple local-development credentials.
Do not reuse them in a public deployment.

### Root `Dockerfile`

The frontend uses a multi-stage build.

The first stage starts from Node, installs dependencies, and runs
`npm run build`. Vite writes the optimized static site into `dist/`.

The second stage starts from a small Nginx image and copies only `dist/` and
the Nginx configuration. Node, source code, TypeScript, and build tools are not
needed in the final frontend image.

This produces a smaller and simpler runtime image.

### `backend/Dockerfile`

The API image starts from Python 3.13 Slim, installs the pinned-compatible
requirements, and copies `backend/app`. It starts with:

```text
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Because both frontend and API builds happen inside containers, running the
complete Compose stack does not require Node or Python to be installed on the
host machine. You only need those local toolchains when running a service
outside Docker.

### `nginx.conf`

Nginx has two jobs.

For `/api/...`, it acts as a reverse proxy and forwards the request to the API
container. The browser only sees one public origin, `localhost:3000`.

For application URLs such as `/results` or `/kos/101`, Nginx falls back to
`index.html`. React Router then reads the URL and displays the correct page.
Without this fallback, refreshing a nested frontend route would return a 404.

### `.dockerignore`

Before a build, Docker sends a build context containing project files. The
`.dockerignore` file excludes unnecessary or sensitive items such as `.git`,
local environment files, `node_modules`, and previous build output.

## 4. First-time setup

### Step 1: install and start Docker

On macOS, install Docker Desktop and open it. Wait until Docker reports that
the engine is running. Docker commands cannot build or start containers while
the Docker Desktop engine is stopped.

Verify it from the project directory:

```bash
docker version
docker compose version
```

`docker version` should show both a Client and Server section. If the Server
section is missing, the Docker engine is not ready.

### Step 2: build and start Papikos

```bash
docker compose up --build
```

On the first run Docker may download base images and install npm dependencies,
so it will take longer than later runs. Keep the terminal open to see combined
logs from all services.

When the services are healthy, open:

- Application: `http://localhost:3000`
- API health endpoint: `http://localhost:3001/api/health`

A healthy API returns:

```json
{"ok": true}
```

The local seed also creates dashboard accounts for development:

| Role | Phone | Password |
| --- | --- | --- |
| Admin | `081111111111` | `admin12345` |
| Pemilik Kos | `082222222222` | `owner12345` |
| Pencari Kos | `083333333333` | `renter12345` |

These credentials are intentionally local/demo data and must be replaced for
any public deployment. The Docker frontend is built with
`VITE_SHOW_DEMO_ACCOUNTS=true`, so the Admin and Pemilik Kos login pages also
show three direct demo-login buttons on the unified `/login` page. A public
build must set this flag to `false`.

Press `Ctrl+C` to stop the foreground Compose process. Then run this to remove
the stopped containers while retaining database data:

```bash
docker compose down
```

### Running in the background

Use detached mode when you do not want logs to occupy the terminal:

```bash
docker compose up --build --detach
```

The short form of `--detach` is `-d`.

Check the services afterward:

```bash
docker compose ps
docker compose logs --follow
```

## 5. Everyday workflow

Start existing containers, rebuilding images if source files changed:

```bash
docker compose up --build
```

Start without requesting a rebuild:

```bash
docker compose up
```

Stop and remove containers while keeping database data:

```bash
docker compose down
```

See service status and health:

```bash
docker compose ps
```

Follow all logs:

```bash
docker compose logs --follow
```

Follow one service:

```bash
docker compose logs --follow api
docker compose logs --follow db
docker compose logs --follow frontend
```

Show the last 100 API log lines:

```bash
docker compose logs --tail 100 api
```

Restart one service:

```bash
docker compose restart api
```

Rebuild only the API after changing backend code:

```bash
docker compose up --build api
```

This project currently builds production-style images rather than mounting
source code into development containers. Source edits do not appear instantly;
rebuild the affected image. For rapid frontend work, it is often easier to run
Vite directly with `npm run dev` and use Docker only for PostgreSQL/API.

## 6. Working with the database

Open a PostgreSQL shell inside the database container:

```bash
docker compose exec db psql -U papikos -d papikos
```

Useful commands inside `psql`:

```text
\dt                    list tables
\d kos_listings        describe a table
select count(*) from kos_listings;
select * from users;
\q                     quit
```

Run a single query without opening an interactive shell:

```bash
docker compose exec db psql -U papikos -d papikos -c "select count(*) from kos_listings;"
```

Connect from a database application on your Mac with:

```text
Host: localhost
Port: 5433
Database: papikos
Username: papikos
Password: papikos
```

These values differ from the API's internal connection address. The API uses
`db:5432` because it is inside the Compose network.

### Resetting the database

To delete all local database contents and replay the schema and seed:

```bash
docker compose down --volumes
docker compose up --build
```

The first command is destructive. It deletes registered users and any other
local changes stored in the database volume.

## 7. Inspecting containers

Run a shell inside the API container:

```bash
docker compose exec api sh
```

Run a command without opening a shell:

```bash
docker compose exec api node --version
```

See low-level information about a container:

```bash
docker compose ps --quiet api
docker inspect <container-id>
```

Most normal Papikos debugging only needs `docker compose ps`, `logs`, and
`exec`. `docker inspect` is useful when investigating networking, mounts, or
environment configuration.

## 8. What happens during `docker compose up --build`

The command performs several related operations:

1. Compose reads and validates `compose.yaml`.
2. Docker builds the API and frontend images.
3. Docker creates the project's private network.
4. Docker creates the named database volume if it does not exist.
5. Compose creates and starts the database container.
6. PostgreSQL initializes an empty volume and runs the mounted SQL scripts.
7. The database health check becomes healthy.
8. Compose creates and starts the API container.
9. The API connects to PostgreSQL, and its health check becomes healthy.
10. Compose creates and starts the frontend container.
11. Your browser reaches Nginx through local port 3000.

The `--build` flag requests image builds before containers start. Docker still
uses cached layers when their inputs have not changed.

## 9. Common problems

### Cannot connect to the Docker daemon

Typical message:

```text
Cannot connect to the Docker daemon
```

Start Docker Desktop and wait for the engine to become ready. Confirm that
`docker version` displays a Server section.

### A port is already in use

Typical message:

```text
port is already allocated
```

Another program is using port 3000, 3001, or 5433. Stop that program or change
the host side of the mapping in `compose.yaml`. For example, `3002:80` exposes
the frontend at `http://localhost:3002` without changing Nginx's internal port.

### Code changes do not appear

The images contain copies of the source code from build time. Rebuild:

```bash
docker compose up --build
```

If Docker cache appears stale, force a clean image rebuild:

```bash
docker compose build --no-cache
docker compose up
```

Do not delete the database volume merely to refresh frontend or API code.

### A changed migration does not run

PostgreSQL initialization scripts only run for a new empty volume. Reset the
development database if losing its data is acceptable:

```bash
docker compose down --volumes
docker compose up --build
```

### The frontend loads but API calls fail

Check service status and API logs:

```bash
docker compose ps
docker compose logs --tail 100 api
curl http://localhost:3001/api/health
```

If the API is unhealthy, also inspect database logs:

```bash
docker compose logs --tail 100 db
```

### A service exits immediately

List all services, including stopped containers, and read its logs:

```bash
docker compose ps --all
docker compose logs <service-name>
```

The earliest error in the log is usually more useful than later cascading
errors.

### Starting from a completely clean application stack

For Papikos only:

```bash
docker compose down --volumes --remove-orphans
docker compose build --no-cache
docker compose up
```

This deletes Papikos database data and rebuilds both local images. It does not
delete unrelated Docker projects.

## 10. Commands that are safe versus destructive

| Command | Effect on database data |
| --- | --- |
| `docker compose stop` | Preserved |
| `docker compose restart` | Preserved |
| `docker compose down` | Preserved |
| `docker compose up --build` | Preserved |
| `docker compose build --no-cache` | Preserved |
| `docker compose down --volumes` | **Deleted** |

Be careful with broad cleanup commands copied from the internet, especially
`docker system prune` and `docker volume prune`. They can affect other Docker
projects, not just Papikos. The Compose commands in this guide stay scoped to
this project.

## 11. Local containers versus production deployment

The current configuration is designed for local development and demonstration.
A public production deployment still needs decisions such as:

- Strong database credentials stored as secrets.
- HTTPS and a real domain.
- Database backups and restore testing.
- A migration process that does not depend on an empty volume.
- Resource limits, monitoring, and centralized logs.
- A managed database or carefully maintained PostgreSQL host.
- Secure authentication sessions and authorization.
- Image version pinning and vulnerability updates.

Docker makes the application portable, but it does not automatically provide
production security, backups, or availability.

## 12. Quick reference

```bash
# Build and run in the foreground
docker compose up --build

# Build and run in the background
docker compose up --build -d

# Show service health
docker compose ps

# Follow logs
docker compose logs -f

# Follow API logs
docker compose logs -f api

# Stop containers and preserve database data
docker compose down

# Open PostgreSQL
docker compose exec db psql -U papikos -d papikos

# Reset all Papikos database data
docker compose down --volumes

# Validate the Compose file without starting anything
docker compose config
```

The most useful habit while learning Docker is to ask four questions:

1. Am I dealing with an image or a running container?
2. Is this address viewed from my Mac or from inside a container?
3. Is the data in a disposable container filesystem or a persistent volume?
4. Does this change require a restart, an image rebuild, or a database reset?

Those four questions explain most Docker behavior you will encounter in this
project.
