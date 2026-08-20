# ProcessCanvas Go API

Standalone Go service for authentication, workspaces, processes and immutable process versions.

## Run

From the repository root in PowerShell:

```powershell
docker compose up -d postgres
$env:DATABASE_URL="postgres://processcanvas:processcanvas@localhost:5433/processcanvas?sslmode=disable"
$env:HTTP_PORT="8080"
$env:FRONTEND_URL="http://localhost:3000"
go run ./backend/cmd/server
```

The service applies embedded raw SQL migrations before accepting traffic. `/health` reports that the HTTP service is alive; `/ready` also verifies PostgreSQL.

## Configuration

| Variable | Required | Default |
| --- | --- | --- |
| `DATABASE_URL` | yes | — |
| `HTTP_PORT` | no | `8080` |
| `FRONTEND_URL` | no | `http://localhost:3000` |
| `APP_ENV` | no | `development` |
| `SESSION_COOKIE_NAME` | no | `processcanvas_session` |
| `SESSION_TTL_HOURS` | no | `336` |

Set `APP_ENV=production` behind HTTPS to enable the cookie `Secure` flag.

## Quality checks

```powershell
go vet ./backend/...
go test ./backend/...
```

The service uses the standard `net/http` router, `pgx` for PostgreSQL, `bcrypt` for passwords, structured `slog` logging, request IDs, CORS, panic recovery, bounded request bodies, server timeouts and graceful shutdown.
