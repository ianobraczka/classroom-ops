# Classroom Ops

**Classroom Ops** is a small but deliberate **full-stack classroom operations** playground: a teacher-oriented workspace for creating and maintaining **classroom records**, with **audited changes**, a **typed REST API**, and a **Next.js** UI that talks to it over HTTP. It is built as an **evolving personal project**—strong on backend structure and local ergonomics, not a finished SaaS product.

```mermaid
flowchart TB
  subgraph client ["Web (Next.js)"]
    UI["App Router · dashboard / classrooms / login"]
  end
  subgraph server ["Backend (FastAPI)"]
    R["HTTP routers"]
    S["Services · ownership rules · audit orchestration"]
    REP["Repositories · SQLAlchemy async"]
  end
  DB[("PostgreSQL (Compose / CI) or SQLite (default dev)")]
  UI -->|"REST · optional X-User-Id (mock user)"| R
  R --> S --> REP --> DB
```

---

## Overview

School and training programs run on **repeatable operational units**—rooms, cohorts, terms, owners. This repo models a **narrow slice** of that reality: a **teacher-owned “classroom”** entity with descriptive fields (subject, grade level, academic year), **active vs archived** lifecycle, and an **append-only audit trail** for mutations.

The **Next.js** app is a thin client: it lists and edits classrooms and uses a **development-only mock identity** (stored user id + `X-User-Id` header) so you can exercise the API without wiring OIDC first. The **FastAPI** side holds the rules: **who may see or change which classroom**, when updates are allowed, and **what gets logged**.

---

## Features

Only items that exist **in code today**:

| Area | What ships |
|------|----------------|
| **REST API** | CRUD-style **classroom** endpoints with JSON request/response models (Pydantic v2). |
| **Access control** | **Owner-based** checks on classroom read/update/archive (`403` for non-owners). |
| **Lifecycle** | **Soft archive** (`archived_at`, `status`); **active-only** list for the dashboard flow. |
| **Auditability** | **Audit log** rows on classroom **create**, **update**, and **archive** (actor, entity, action, JSON metadata). |
| **Users** | `User` model with **role enum** (teacher / student / admin) and **seeded demo users**; `GET /users` lists users for the **mock login** screen (intentionally **unauthenticated** for local/demo). |
| **Persistence** | **SQLAlchemy 2.x async** repositories; **PostgreSQL** via Alembic in Docker/CI, **SQLite file** as the default for frictionless local API runs. |
| **Containers** | **Docker Compose** for `postgres`, `api`, and `web` with health-checked database and documented host port mapping. |
| **Testing** | **pytest** + **httpx** async client tests against the ASGI app (SQLite temp DB by default; Postgres URL matches CI). |
| **CI** | **GitHub Actions** workflow runs the **backend** test suite against a **Postgres 16** service. |
| **Frontend** | **Next.js 15** (App Router), **TanStack Query**, **React Hook Form** + **Zod**, **Tailwind CSS**—dashboard, classroom detail/edit/create, mock sign-in. |

**Not claimed here:** production authentication, school-wide RBAC, student workflows, notifications, or frontend CI jobs—those belong in **Roadmap** or future work.

---

## Architecture

The backend follows a **layered layout** that keeps HTTP thin and pushes decisions into **services**:

1. **`app/api`** — FastAPI routers, dependencies (`get_db`, `get_current_user` from `X-User-Id`), and HTTP status mapping. Routers live under `app/api/v1/` for organization; they are mounted at the **root** of the app (e.g. `/classrooms`, not `/api/v1/classrooms`).
2. **`app/services`** — **ClassroomService** applies ownership rules, archive invariants, and coordinates **commits** after writes.
3. **`app/repositories`** — Async SQLAlchemy access for **users**, **classrooms**, and **audit logs**—keeps ORM queries out of route handlers.
4. **`app/models` / `app/schemas`** — ORM entities vs API boundary types.
5. **`alembic/`** — Versioned schema for **PostgreSQL** (used in Docker entrypoint and recommended for “real” Postgres workflows).

**Dual database story (intentional trade-off):**

- **Default local API (`DATABASE_URL` unset):** **SQLite** under `backend/data/`. On startup the app runs `create_all` and **seeds** demo users—**no Alembic step** on this path, optimized for fast feedback.
- **Docker / CI / explicit Postgres:** **`alembic upgrade head`** (see `backend/Dockerfile`) then **seed**, then **uvicorn**.

The **web** app reads `NEXT_PUBLIC_API_URL` and sends `X-User-Id` on mutating and authenticated reads via a small **`apiFetch`** helper—**not** a security model for the internet, but enough to develop the backend contract cleanly.

---

## Tech Stack

| Layer | Choices |
|--------|---------|
| **Backend** | Python **3.12**, **FastAPI**, **Uvicorn**, **Pydantic Settings**, **SQLAlchemy 2** (async), **Alembic**, **pytest** + **pytest-asyncio** + **httpx**. |
| **Frontend** | **Next.js 15**, **React 19**, **TypeScript**, **Tailwind CSS**, **TanStack Query**, **React Hook Form**, **Zod**. |
| **Database** | **PostgreSQL 16** (Compose + CI) or **SQLite** + **aiosqlite** (default dev). |
| **Infrastructure** | **Docker Compose** (`postgres`, `api`, `web`); **GitHub Actions** for backend tests. |
| **Tooling** | **npm** / **Node 20** for the web image; **pip** + `requirements.txt` for the API. |

---

## Development setup

### Prerequisites

- **Docker** + Docker Compose plugin *or* **Python 3.12+** and **Node 20+** installed locally.
- Ports **3000** (web), **8000** (API), and **5433→5432** (Postgres on host) available.

### Option A — Docker Compose (full stack)

From the repository root:

```bash
docker compose up --build
```

| Service | URL / port |
|---------|------------|
| Web | [http://localhost:3000](http://localhost:3000) |
| API | [http://localhost:8000](http://localhost:8000) — OpenAPI at `/docs` |
| Postgres | `localhost:5433` → container `5432` (avoids clashing with a local Postgres on `5432`) |

The API container runs **`alembic upgrade head`**, **`python -m app.scripts.seed`**, then **uvicorn**. Use **Mock sign-in** on `/login` and pick a seeded user.

| Email | Role |
|-------|------|
| `teacher@example.com` | teacher |
| `student@example.com` | student |
| `admin@example.com` | admin |

### Option B — Backend only (SQLite, no Postgres)

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Creates `backend/data/classroom_ops.db`, applies schema via **`create_all`**, and seeds if empty. **Set `DATABASE_URL`** if you want Postgres against a local instance instead.

### Option C — Frontend against a running API

```bash
cd web
npm install
export NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

### Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | Backend | Async SQLAlchemy URL. Defaults to SQLite under `backend/data/` when unset. |
| `CORS_ORIGINS` | Backend | Comma-separated origins; default `http://localhost:3000`. |
| `NEXT_PUBLIC_API_URL` | Web | Base URL for API calls (Compose sets this for the `web` service). |

Optional **`backend/.env`** (gitignored) is loaded by **Pydantic Settings** for local overrides.

### Migrations (PostgreSQL)

When targeting Postgres (local or Docker):

```bash
cd backend
source .venv/bin/activate
export DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5433/classroom_ops
alembic upgrade head
python -m app.scripts.seed
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Adjust host/port/credentials to match your instance.

---

## Testing

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
pytest
```

- **By default**, tests use a **temporary SQLite** file (`conftest.py` sets `DATABASE_URL` unless you override it).
- To mirror **CI**, export Postgres URLs before `pytest`:

```bash
export DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/classroom_ops_test
export TEST_DATABASE_URL="$DATABASE_URL"
pytest -q
```

CI (`.github/workflows/ci.yml`) runs **`pytest -q`** on **push/PR** to `main`/`master` with a **Postgres 16** service container.

---

## API overview

Base URL: same host as Uvicorn (e.g. `http://localhost:8000`). All classroom routes require **`X-User-Id: <uuid>`** except where noted.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | — | Liveness JSON. |
| `GET` | `/users` | **None** (demo) | Lists users for mock login picker. |
| `POST` | `/classrooms` | `X-User-Id` | Create classroom for current user. |
| `GET` | `/classrooms` | `X-User-Id` | Active classrooms **owned** by user. |
| `GET` | `/classrooms/{id}` | `X-User-Id` | Owner-only detail. |
| `PATCH` | `/classrooms/{id}` | `X-User-Id` | Owner-only update; **rejects archived** rows. |
| `POST` | `/classrooms/{id}/archive` | `X-User-Id` | Owner-only soft archive (idempotent if already archived). |

Interactive schema: **`/docs`** (Swagger UI).

---

## Roadmap

Practical next steps that fit the current codebase direction—**no promises on timeline**:

- **Real authentication** (OIDC / school SSO) replacing header-based mock identity; lock down or remove public **`GET /users`** in any shared environment.
- **Authorization beyond ownership**—use `User.role` (or org membership) for admin/co-teacher scenarios instead of owner-only checks.
- **Student-facing flows** and richer domain (rosters, assignments) once the core API stabilizes.
- **Audit log surfacing** in the UI or admin endpoints (today it is write-focused).
- **Background jobs** for bulk imports, email, or long-running reports.
- **Observability**—structured logging, metrics, tracing, and safer deployment defaults.
- **CI expansion**—e.g. `npm run lint` / `npm run build` for the web package, cache tuning, image publish if you move toward deployable artifacts.

---

## Project status

**Actively evolving** personal repository focused on **backend architecture**, **clear API boundaries**, and **repeatable local + CI workflows**. It is suitable as a **portfolio flagship** for how the backend is organized—not as a statement that every surface is production-hardened yet.
