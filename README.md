# ProcessCanvas

**Русский · [English summary](#english-summary)**

ProcessCanvas — визуальный конструктор бизнес-процессов для менеджеров, аналитиков и небольших команд. Он помогает без программирования показать порядок работы, ответственных, согласования и ветки решений, проверить структуру и безопасно пройти процесс в режиме симуляции.

Проект спроектирован и разработан **Комроном Назаровым** как законченный portfolio-продукт с архитектурой B2B SaaS.

## Возможности v1.0

- визуальный редактор React Flow с блоками Start, Task, Approval, Condition и End;
- undo/redo, горячие клавиши, валидация, пошаговая Run-симуляция и девятишаговое обучение;
- русский и английский интерфейс, светлая/тёмная тема, Help Center и адаптивная компоновка;
- гостевой local-first режим, autosave и восстановление после перезагрузки;
- безопасный импорт и экспорт версионированного JSON;
- шаблоны согласования закупки, отпуска и приёма сотрудника;
- регистрация, вход, выход и личная рабочая область;
- создание, открытие, переименование и удаление серверных процессов;
- перенос гостевого процесса в аккаунт без автоматического удаления локальной копии;
- серверный autosave, offline-черновик, автоматический retry и понятное разрешение конфликтов `409`;
- контрольные точки, история версий и восстановление без удаления истории.

## Архитектура

```text
Browser
  └─ Next.js 15 / React 19 / TypeScript
       ├─ React Flow + Zustand
       ├─ localStorage + offline recovery draft
       └─ /api/* reverse proxy
            └─ Go 1.24 / net/http
                 ├─ auth + HttpOnly sessions
                 ├─ workspaces + role checks
                 ├─ processes + optimistic concurrency
                 └─ pgx → PostgreSQL 17
```

Next.js обслуживает интерфейс и проксирует запросы. Бизнес-API полностью находится в отдельном Go-сервисе; старые Next.js API routes и Drizzle отсутствуют. Raw SQL-миграции встроены в Go-бинарник и применяются при старте.

Основные каталоги:

```text
backend/cmd/server/          точка входа Go API
backend/internal/            config, database, auth, HTTP и process service
backend/migrations/          встроенные raw SQL-миграции
src/components/editor/       полотно и autosave
src/components/account/      auth, процессы, конфликты, перенос и версии
src/components/experience/   обучение, импорт/экспорт, шаблоны и симуляция
src/i18n/                    типизированные RU/EN-словари
src/lib/                     persistence, API client, validation и file format
tests/e2e/                   Playwright-сценарии
```

## Локальный запуск в Windows PowerShell

Нужны Node.js 22+, pnpm, Go 1.24+ и Docker Desktop.

Установите frontend-зависимости и поднимите PostgreSQL:

```powershell
cd C:\ProcessCanvas
pnpm install
docker compose up -d postgres
```

Запустите Go API **из папки `backend`**:

```powershell
cd C:\ProcessCanvas\backend

$env:DATABASE_URL="postgres://processcanvas:processcanvas@localhost:5433/processcanvas?sslmode=disable"
$env:FRONTEND_URL="http://localhost:3000"

go run ./cmd/server
```

В другом окне запустите frontend:

```powershell
cd C:\ProcessCanvas
$env:GO_API_URL="http://localhost:8080"
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000). Проверки API: [health](http://localhost:8080/health) и [readiness](http://localhost:8080/ready). Гостевой редактор работает без Go/PostgreSQL, но аккаунты и серверное сохранение требуют оба сервиса.

Полный контейнерный запуск:

```powershell
cd C:\ProcessCanvas
docker compose up --build
```

Для локальной разработки можно продолжать запускать только `postgres` командой `docker compose up -d postgres`.

## Конфигурация

Скопируйте `.env.example` в `.env.local` только при необходимости. `.env.example` содержит безопасные примеры, а не секреты. Для production обязательно замените пароль PostgreSQL, используйте HTTPS URL и `APP_ENV=production`; тогда session cookie получает флаг `Secure`.

Go поддерживает `DATABASE_URL`, `HTTP_PORT`, `FRONTEND_URL`, `APP_ENV`, `SESSION_COOKIE_NAME`, `SESSION_TTL_HOURS` и `AUTH_RATE_LIMIT_PER_MINUTE`. Next.js использует `GO_API_URL`. Compose также читает `POSTGRES_PASSWORD`.

## Сохранение, конфликты и версии

- Гостевой процесс сохраняется в браузере.
- Серверный процесс сохраняется с `expectedVersion`; более новая редакция возвращает `409` и никогда не перезаписывается автоматически.
- При недоступном API создаётся отдельный offline draft. После восстановления сети выполняется retry.
- При конфликте можно открыть серверную версию, сохранить локальные изменения отдельным процессом или оставить их локально.
- Autosave обновляет рабочее состояние. Неизменяемые снимки создаются только контрольной точкой или восстановлением.
- Восстановление создаёт новую текущую версию и сохраняет прежнюю историю.

## Тесты

Frontend unit-тесты покрывают JSON-формат, строгий импорт, шаблоны, графовую валидацию, симуляцию и offline draft:

```powershell
cd C:\ProcessCanvas
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Go unit/HTTP integration-тесты:

```powershell
cd C:\ProcessCanvas\backend
go vet ./...
go test ./...
```

Полный integration-тест создаёт случайную PostgreSQL-схему и удаляет её вместе с данными после завершения:

```powershell
cd C:\ProcessCanvas\backend
$env:TEST_DATABASE_URL="postgres://processcanvas:processcanvas@localhost:5433/processcanvas?sslmode=disable"
go test ./internal/httpapi -run TestProcessAPIIntegration -v -count=1
```

Playwright:

```powershell
cd C:\ProcessCanvas
pnpm exec playwright install chromium
pnpm test:e2e
```

GitHub Actions выполняет lint, typecheck, unit tests, production build, Go formatting/vet/integration tests, Playwright и сборку обоих контейнеров. CI использует отдельный чистый PostgreSQL service container и не требует production-секретов.

## Безопасность и production-основа

- bcrypt для паролей; в PostgreSQL хранится только SHA-256-хеш случайного session token;
- `HttpOnly`, `SameSite=Lax`, а в production также `Secure` cookie;
- проверки ролей `owner`, `editor`, `viewer` для каждого процесса;
- CORS только для настроенного frontend origin;
- лимит размера JSON, строгий decoder, нейтральные API-ошибки и rate limiting регистрации/входа;
- request ID, структурированные логи, recovery, защитные HTTP-заголовки и server timeouts;
- почасовая очистка просроченных сессий, graceful shutdown, отдельные health/readiness;
- multi-stage образы и запуск контейнеров от непривилегированных пользователей.

## Подготовка релиза и деплоя

Перед публичным `v1.0.0` выполните [release checklist](docs/RELEASE_CHECKLIST.md), добавьте настоящие изображения в [docs/screenshots](docs/screenshots/README.md), настройте резервные копии PostgreSQL, HTTPS, мониторинг `/health` и `/ready`, затем проверьте миграции и rollback на production-подобной копии. Тег, GitHub Release и deployment в этом репозитории намеренно не выполняются автоматически.

## Известные ограничения и roadmap после v1.0

- нет приглашений участников и UI управления ролями;
- нет realtime-совместного редактирования и графического diff версий;
- нет подтверждения email и восстановления пароля;
- нет AI-помощника, продуктовой аналитики и production observability;
- offline-режим хранит один recovery draft текущего серверного процесса;
- пользовательский текст блоков не переводится автоматически при смене языка.

После релиза: командные workspace, совместное редактирование, visual diff, email flows, аудит действий, AI-помощник и аналитика процессов.

## English summary

ProcessCanvas is a localized visual workflow builder with a Next.js/TypeScript frontend, standalone Go API and PostgreSQL. It supports guest editing, strict JSON import/export, three localized templates, authentication, access-controlled server workflows, optimistic autosave with offline recovery and conflict resolution, checkpoints, version restore, validation, simulation and guided learning. See the PowerShell commands above, [Go API documentation](backend/README.md), and the [v1 release checklist](docs/RELEASE_CHECKLIST.md).
