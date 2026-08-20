# ProcessCanvas

**Русский · [English](#english)**

ProcessCanvas — визуальный конструктор бизнес-процессов для менеджеров и аналитиков. Он помогает без технической подготовки показать, кто и в каком порядке выполняет работу, где требуется согласование и как процесс меняется при ответах «Да» или «Нет».

Проект спроектирован и разработан **Комроном Назаровым** как portfolio-продукт с архитектурой, близкой к реальному B2B SaaS.

## Возможности текущей версии

- интерактивное полотно React Flow и пять типов бизнес-блоков;
- типизированная локализация RU/EN, русский по умолчанию;
- отдельное девятишаговое учебное полотно, которое не изменяет настоящий процесс;
- сохранение прогресса обучения, пропуск и неограниченный повтор через «Помощь»;
- Help Center: создание схем, типы блоков, связи, ветвление и горячие клавиши;
- undo/redo, версионированный `localStorage` v3 и безопасная миграция v2;
- структурная валидация с подсветкой проблемных блоков;
- пошаговая Run-симуляция с выбором веток и историей пути;
- светлая/тёмная тема, reduced motion и адаптивная трёхпанельная компоновка;
- backend foundation: PostgreSQL, Drizzle ORM, cookie-сессии, API процессов, рабочие области и версии.

## Быстрый локальный запуск редактора

```bash
pnpm install
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Запуск PostgreSQL и API

1. Скопируйте `.env.example` в `.env.local`.
2. Замените `SESSION_SECRET` на случайную строку длиной не менее 32 символов.
3. Запустите базу и примените миграции:

```bash
docker compose up -d postgres
pnpm db:migrate
pnpm dev
```

Первая SQL-миграция уже находится в `drizzle/`. Для изменения схемы используйте:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

Никакие облачные или платные сервисы для локальной разработки не нужны.

## Схема данных

| Сущность | Назначение |
| --- | --- |
| `User` | аккаунт и безопасный хеш пароля |
| `Workspace` | личная или командная рабочая область |
| `WorkspaceMember` | роль `owner`, `editor` или `viewer` |
| `Process` | название, узлы, связи и текущая версия |
| `ProcessVersion` | неизменяемый снимок конкретной версии |

Все запросы процессов проверяют активную серверную сессию и членство пользователя в рабочей области. Изменение ID в URL не даёт доступа к чужому процессу. Обновление принимает `expectedVersion` и возвращает конфликт `409`, если процесс уже изменён в другой сессии.

## API foundation

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`;
- `GET /api/auth/session`;
- `GET|POST /api/processes`;
- `GET|PATCH|DELETE /api/processes/:id`;
- `GET /api/processes/:id/versions`;
- `POST /api/processes/:id/versions/:version/restore`.

Тела запросов валидируются Zod. Пароли хешируются bcrypt, а серверная сессия хранится в подписанной `HttpOnly`, `SameSite=Lax` cookie.

## Архитектура

```text
src/
├── app/api/             # auth, processes и version REST endpoints
├── components/
│   ├── editor/          # полотно и панели
│   ├── experience/      # интро, обучение, Help и симуляция
│   ├── nodes/           # React Flow custom nodes
│   └── ui/              # modal/toast primitives
├── i18n/                # типизированные RU/EN словари
├── lib/                 # tutorial engine, validation и local persistence
├── server/              # auth, access control, DB и Zod schemas
├── store/               # Zustand editor/history/tutorial state
└── types/               # доменная модель workflow
```

## Проверки качества

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Проверены RU/EN, восстановление учебного шага после reload, безопасный выход из обучения, Help Center, валидная и невалидная Run-сессии, светлая/тёмная основа, размеры 1366×768 и 850×700 и чистая консоль браузера.

## Известные ограничения

- UI регистрации, список серверных процессов и серверный autosave ещё не подключены к редактору; текущий интерфейс продолжает безопасно работать как гостевой/local-first режим.
- API, схема базы, миграции, авторизация, версии и access control готовы как backend foundation, но для их runtime-проверки нужен запущенный PostgreSQL.
- Полная история undo/redo не сохраняется между перезагрузками, сам процесс сохраняется.
- Пользовательский текст не переводится автоматически.
- Симуляция визуальная и не выполняет внешние бизнес-операции.

## Roadmap PC-3

- интерфейс аккаунта и список рабочих процессов;
- подключение server autosave, offline draft retry и перенос локальной схемы в аккаунт;
- интерфейс истории версий и восстановления;
- шаблоны, импорт/экспорт и совместная работа;
- AI-помощник и аналитика прохождения процессов.

---

## English

ProcessCanvas is a visual workflow builder for managers and analysts. The current version includes a localized React Flow editor, an isolated nine-step interactive tutorial, a replayable Help Center, workflow validation, and a safe step-by-step simulation.

The backend foundation provides PostgreSQL, Drizzle migrations, signed HttpOnly sessions, workspaces, access-controlled process APIs, optimistic concurrency, and immutable versions. Run the editor with `pnpm dev`, or follow the PostgreSQL steps above to develop against the API.

The account UI and server autosave integration remain the next PC-3 increment; the existing editor continues to work as a complete guest/local-first experience.
