# Classroom Ops Platform

Production-inspired monorepo for managing classroom workspaces with a teacher-focused dashboard, audited mutations, and containerized local development.

## Stack

- **Backend:** FastAPI, PostgreSQL (Compose / CI) or **SQLite file** for local dev, SQLAlchemy 2.x (async), Alembic, Pydantic v2, pytest.
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod.
- **Infra:** Docker Compose (`api`, `web`, `postgres`), GitHub Actions CI for backend tests.

## Quick start (Docker Compose)

From the repository root:

```bash
docker compose up --build
```

- Web: `http://localhost:3000`
- API: `http://localhost:8000` (OpenAPI docs at `/docs`)
- Postgres: host port **`5433`** → container `5432` (avoids conflict if you already run PostgreSQL on `5432`). Inside Compose, the API still uses `postgres:5432`.

On first API start, Alembic runs migrations and the seed script inserts demo users:

| Email               | Role    | Notes              |
|---------------------|---------|--------------------|
| teacher@example.com | teacher | Primary demo login |
| student@example.com | student |                    |
| admin@example.com   | admin   |                    |

Use **Mock sign-in** on `/login` to pick a user. The UI stores the selection in `localStorage` and sends it on every API call as the `X-User-Id` header (mock authentication).

## Local development (without Docker for Node/Python)

### Backend (Python **3.12+**)

By default the API uses **SQLite** at `backend/data/classroom_ops.db` (directory and DB are created on first startup). Demo users are seeded automatically. No Postgres or `alembic` step is required for this path.

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**PostgreSQL** (matches Docker / production): set `DATABASE_URL` and run migrations + seed, for example:

```bash
export DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/classroom_ops
alembic upgrade head
python -m app.scripts.seed
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd web
npm install
export NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

## Architecture

### Backend layout

- `app/api` — FastAPI routers and HTTP-facing dependencies (`X-User-Id` → current user).
- `app/services` — Business rules (ownership, archive rules, audit orchestration).
- `app/repositories` — SQLAlchemy data access helpers.
- `app/models` — ORM entities (`User`, `Classroom`, `AuditLog`).
- `app/schemas` — Pydantic request/response models.
- `alembic` — Database migrations.

### Frontend layout

- `app/` — Routes (`/login`, `/dashboard`, `/classrooms`, nested CRUD routes).
- `components/` — Shared UI (navigation, empty/loading/error states).
- `lib/api` — Fetch helper that injects `X-User-Id`.
- `lib/schemas` — Zod schemas shared by forms.

### API surface (initial)

| Method | Path                         | Notes                                      |
|--------|------------------------------|--------------------------------------------|
| GET    | `/users`                     | Public list for mock login (local/demo).   |
| POST   | `/classrooms`                | Creates classroom for `X-User-Id` user.    |
| GET    | `/classrooms`                | Active classrooms owned by current user. |
| GET    | `/classrooms/{id}`           | Owner-only.                                |
| PATCH  | `/classrooms/{id}`           | Owner-only; rejects archived rows.         |
| POST   | `/classrooms/{id}/archive`   | Owner-only; soft archive (sets status + `archived_at`). |

Every **create**, **update**, and **archive** writes an `AuditLog` row (`entity_type`, `entity_id`, `action`, JSON `metadata`).

## Testing

By default, `pytest` uses a **temporary SQLite** database (no Postgres needed on your machine).

```bash
cd backend
source .venv/bin/activate
pytest
```

To run tests against **PostgreSQL** (same as CI), set `DATABASE_URL` (and optionally `TEST_DATABASE_URL`) to a Postgres URL before invoking `pytest`.

CI runs the suite against a GitHub Actions Postgres service (see `.github/workflows/ci.yml`).

## Roadmap

- Real authentication (OIDC or school SSO) replacing `X-User-Id`.
- Role-based authorization beyond ownership (co-teachers, school admins).
- Student-facing views, assignments, and roster import.
- Background jobs for bulk operations and notifications.
- Observability: structured logging, metrics, and tracing.

## License

MIT (adjust as needed for your organization).
