# ProcessCanvas

**Русский · [English](#english)**

ProcessCanvas — визуальный конструктор бизнес-процессов для менеджеров и аналитиков. Он помогает без технической подготовки показать порядок работы, ответственных, согласования и ветки решений.

Проект спроектирован и разработан **Комроном Назаровым** как portfolio-продукт с архитектурой реального B2B SaaS.

## Что уже работает

- редактор React Flow с пятью типами блоков, undo/redo, валидацией и Run-симуляцией;
- RU/EN, интро, девятишаговое обучение, Help Center и светлая/тёмная темы;
- гостевой local-first режим и перенос локального процесса в аккаунт;
- регистрация, вход, выход и серверные HttpOnly-сессии;
- «Мои процессы»: создание, открытие и удаление;
- серверный autosave, локальный offline-черновик и повторная отправка;
- контрольные версии и восстановление старого состояния;
- отдельный Go API, PostgreSQL, роли рабочих областей и optimistic concurrency.

## Технологии

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS, React Flow, Zustand.
- Backend: Go 1.24, стандартный `net/http`, `pgx` и `bcrypt`.
- Data: PostgreSQL 17 и raw SQL-миграции, встроенные в Go-бинарник.

TypeScript-бэкенд и Drizzle удалены: Next.js отвечает только за интерфейс и проксирует `/api/*` в Go.

## Полный локальный запуск (Windows PowerShell)

Требуются Node.js, pnpm, Go и Docker Desktop.

```powershell
cd C:\ProcessCanvas
pnpm install
docker compose up -d postgres

$env:DATABASE_URL="postgres://processcanvas:processcanvas@localhost:5433/processcanvas?sslmode=disable"
$env:FRONTEND_URL="http://localhost:3000"
go run ./backend/cmd/server
```

Оставьте API запущенным и во втором PowerShell-окне выполните:

```powershell
cd C:\ProcessCanvas
$env:GO_API_URL="http://localhost:8080"
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000). Миграции применяются автоматически при старте Go API. Проверка API: [http://localhost:8080/health](http://localhost:8080/health).

Гостевой редактор можно открыть только командой `pnpm dev`, но аккаунты и серверное сохранение требуют PostgreSQL и Go API.

## API

- `GET /health`, `GET /ready`;
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`;
- `GET /api/auth/session`;
- `GET|POST /api/processes`;
- `GET|PATCH|DELETE /api/processes/:id`;
- `GET|POST /api/processes/:id/versions`;
- `POST /api/processes/:id/versions/:version/restore`.

Пароли хешируются bcrypt. Случайный токен сессии отправляется в `HttpOnly`, `SameSite=Lax` cookie, а в базе хранится только SHA-256-хеш токена. Доступ к каждому процессу проверяется через членство и роль `owner`, `editor` или `viewer`. Поле `expectedVersion` защищает от незаметной перезаписи параллельных изменений.

## Структура

```text
backend/
├── cmd/server/          # точка входа Go API
├── internal/            # config, database, auth, access, HTTP handlers
└── migrations/          # raw SQL up/down migrations
src/
├── app/                 # Next.js frontend
├── components/account/  # auth, процессы, миграция и версии
├── components/editor/   # редактор и server autosave
├── components/experience/
├── i18n/
├── lib/                 # API client, local persistence и offline draft
├── store/
└── types/
```

Подробности Go-сервиса находятся в [backend/README.md](backend/README.md).

## Проверки

```powershell
pnpm lint
pnpm typecheck
pnpm build
Push-Location backend
go vet ./...
go test ./...
Pop-Location
```

Runtime-проверки включают регистрацию и вход двух пользователей, изоляцию чужих процессов, autosave, конфликт `409`, версии, восстановление, выход, reload и чистую консоль браузера.

## Что остаётся для PC-3

- командные приглашения и UI управления ролями;
- явный интерфейс разрешения конфликтов между вкладками;
- экспорт/импорт, шаблоны и совместная работа в реальном времени;
- email verification, восстановление пароля и production rate limiting;
- AI-помощник, аналитика и production deployment/observability.

## English

ProcessCanvas is a localized visual workflow builder with a Next.js frontend and a standalone Go/PostgreSQL backend. The current version supports guest editing, authentication, personal workspaces, access-controlled processes, server autosave with an offline draft, optimistic concurrency, checkpoints, version restore, validation, simulation, and an interactive tutorial.

Run PostgreSQL and `go run ./backend/cmd/server`, then start the UI with `pnpm dev`. See the PowerShell steps above and [backend/README.md](backend/README.md) for the complete setup.
