# ProcessCanvas

**Русский · [English](#english)**

ProcessCanvas — визуальный конструктор бизнес-процессов для менеджеров и аналитиков. Он помогает наглядно описывать согласования, заявки, обработку заказов и другие рабочие процессы без технической подготовки.

Проект спроектирован и разработан **Комроном Назаровым** как portfolio-продукт с архитектурой, близкой к реальному B2B SaaS.

## Возможности PC-2 Foundation

- Интерактивное полотно React Flow: масштабирование, перемещение, MiniMap и связи
- Пять типов блоков: Начало, Задача, Согласование, Условие и Завершение
- Русская и английская локализация с русским языком по умолчанию
- Локализованный демонстрационный процесс согласования закупки
- Авторское интро и краткое знакомство из четырёх шагов
- Раздел «О проекте» с возможностью повторить интро и сбросить локальные данные
- Undo/redo для структуры процесса и сгруппированного редактирования текста
- Автосохранение процесса и настроек в версионированный `localStorage`
- Восстановление рабочей области после перезагрузки
- Светлая и тёмная темы, адаптивная компоновка и reduced-motion режим
- Empty states, подсказки, toast-уведомления и доступные подписи элементов

## Горячие клавиши

| Действие | Windows / Linux | macOS |
| --- | --- | --- |
| Отменить | `Ctrl + Z` | `⌘ + Z` |
| Повторить | `Ctrl + Shift + Z` | `⌘ + Shift + Z` |
| Копировать блок | `Ctrl + D` | `⌘ + D` |
| Удалить выбранное | `Delete` / `Backspace` | `Delete` / `Backspace` |

## Локальный запуск

```bash
pnpm install
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000). Проверки качества:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Структура проекта

```text
src/
├── app/                  # Next.js layout, metadata и design tokens
├── components/
│   ├── editor/           # Canvas, верхняя и боковые панели
│   ├── experience/       # Интро, onboarding и About
│   ├── nodes/            # Custom nodes бизнес-процесса
│   └── ui/               # Modal и toast primitives
├── data/                 # Локализованные defaults и demo workflow
├── i18n/                 # Типизированные словари RU/EN и provider
├── lib/                  # Версионированное local persistence
├── store/                # Zustand editor state, history и preferences
└── types/                # Доменная модель Workflow
```

## Локальное хранение

ProcessCanvas сохраняет название процесса, блоки, связи, язык, тему и состояния интро/onboarding на текущем устройстве. Формат имеет номер версии; повреждённые и устаревшие данные безопасно игнорируются. Сброс доступен через раздел «О проекте».

## Следующая задача PC-2

- Backend API и PostgreSQL
- Аутентификация и пользовательские рабочие области
- Серверное автосохранение и версии процессов
- Базовая валидация и режим запуска/симуляции
- Импорт, экспорт и шаблоны

AI-помощник, совместная работа и расширенная аналитика запланированы для PC-3.

---

## English

ProcessCanvas is a visual business workflow builder for managers and analysts. It makes approvals, requests, order handling, and other operational processes understandable without requiring technical expertise.

Designed and developed by **Komron Nazarov** as a portfolio product with production-oriented B2B SaaS architecture.

### PC-2 Foundation features

- Interactive React Flow canvas with zoom, pan, MiniMap, and connections
- Start, Task, Approval, Condition, and End custom nodes
- Typed Russian and English localization; Russian is the default
- Localized purchase approval example
- Authored intro, four-step onboarding, and About section
- Real undo/redo history and grouped text editing
- Versioned local autosave and recovery after reload
- Light/dark themes, responsive layout, and reduced-motion support
- Empty states, contextual hints, toast feedback, and accessible labels

### Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), or run `pnpm lint`, `pnpm typecheck`, and `pnpm build` for the full verification suite.

The next PC-2 task adds the backend API, PostgreSQL, authentication, server persistence, versioning, validation, and a basic run/simulation mode.
