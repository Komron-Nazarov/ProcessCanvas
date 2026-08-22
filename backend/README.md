# ProcessCanvas Go API

Standalone Go 1.24 service for authentication, workspaces, role-protected processes and immutable checkpoints. It uses the standard `net/http` router, `pgx`, PostgreSQL and embedded raw SQL migrations.

## Run from Windows PowerShell

Start PostgreSQL from the repository root:

```powershell
cd C:\ProcessCanvas
docker compose up -d postgres
```

Then start the API from this `backend` directory:

```powershell
cd C:\ProcessCanvas\backend
$env:DATABASE_URL="postgres://processcanvas:processcanvas@localhost:5433/processcanvas?sslmode=disable"
$env:FRONTEND_URL="http://localhost:3000"
go run ./cmd/server
```

Migrations run automatically before the server accepts traffic. `GET /health` reports that HTTP is alive; `GET /ready` also pings PostgreSQL.

## Configuration

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | — | PostgreSQL connection URL |
| `HTTP_PORT` | no | `8080` | API listen port |
| `FRONTEND_URL` | no | `http://localhost:3000` | only allowed CORS origin |
| `APP_ENV` | no | `development` | `production` enables Secure cookies |
| `SESSION_COOKIE_NAME` | no | `processcanvas_session` | HttpOnly cookie name |
| `SESSION_TTL_HOURS` | no | `336` | session lifetime, 1–8760 hours |
| `AUTH_RATE_LIMIT_PER_MINUTE` | no | `10` | login/register attempts per client IP |

The API never needs `GO_API_URL`; that variable belongs to Next.js. Do not commit real database credentials.

## Security model

Passwords use bcrypt. A cryptographically random token is sent in an `HttpOnly`, `SameSite=Lax` cookie, while only its SHA-256 hash is stored. Production cookies are `Secure`. Each request resolves workspace membership and checks `owner`, `editor` or `viewer` permissions. Foreign resources return a safe `404`; viewer writes return `403`.

The server also provides bounded request bodies, strict JSON decoding, neutral error responses, request IDs, structured logs, panic recovery, CORS allowlisting, security headers, auth rate limiting, HTTP timeouts, periodic expired-session cleanup and graceful shutdown.

## Tests

Unit tests and compilation checks:

```powershell
cd C:\ProcessCanvas\backend
gofmt -w ./cmd ./internal ./migrations
go vet ./...
go test ./...
```

The HTTP integration suite is opt-in locally and mandatory in CI. It creates a unique PostgreSQL schema, applies migrations there and drops the complete schema afterward; it never truncates or reads existing application tables.

```powershell
cd C:\ProcessCanvas\backend
$env:TEST_DATABASE_URL="postgres://processcanvas:processcanvas@localhost:5433/processcanvas?sslmode=disable"
go test ./internal/httpapi -run TestProcessAPIIntegration -v -count=1
```

It covers health/readiness, registration, duplicate email, valid/invalid login, expiration/logout, personal workspace creation, process CRUD, invalid/oversized input, optimistic conflicts, checkpoints/restore, hidden foreign resources and viewer/editor access.

## Container

`backend/Dockerfile` is a multi-stage build with a minimal Alpine runtime and a non-root user. From the repository root, `docker compose up --build` runs PostgreSQL, API and frontend. For production use a strong PostgreSQL password, HTTPS, `APP_ENV=production`, backups, monitoring and an external secret manager provided by the chosen platform.
