# ProcessCanvas

ProcessCanvas is a polished visual workflow builder for designing business processes such as purchase approvals, leave requests, order handling, and employee onboarding. This repository contains **PC-1**, the portfolio-ready editor foundation.

## PC-1 features

- Interactive React Flow canvas with pan, zoom, controls, minimap, and dotted background
- Five custom node types: Start, Task, Approval, Condition, and End
- Click and drag-and-drop node creation
- Connections with arrowheads and two labelled Condition branches (Yes / No)
- Live property editing for name, description, owner, and due time
- Node selection, movement, duplication, and deletion; edge selection and deletion
- `Delete` / `Backspace` and `Ctrl` / `Cmd + D` keyboard actions
- Zustand-powered typed editor state and a separate workflow domain model
- Responsive three-panel workspace and light/dark themes
- Included purchase approval demo workflow

## Stack

Next.js (App Router), TypeScript (strict), React, Tailwind CSS, React Flow (`@xyflow/react`), Zustand, Lucide Icons, ESLint, and pnpm.

## Local development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Quality checks:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Project structure

```text
src/
├── app/                 # Next.js layout, page and global styles
├── components/
│   ├── editor/          # Canvas shell, toolbar and side panels
│   └── nodes/           # Five custom workflow node components
├── data/                # Demonstration workflow
├── store/               # Zustand editor state and actions
└── types/               # Typed workflow domain model
```

## Planned features

### PC-2 — Persistence and execution foundation

- Undo/redo history and autosave persistence
- Workflow validation and versioning
- Run mode with step status and lightweight simulation
- Import/export and reusable workflow templates
- Backend API, database persistence, and authentication

### PC-3 — Intelligent collaboration

- AI-assisted process generation and improvement suggestions
- Team workspaces, comments, roles, and review flows
- Execution analytics, bottleneck reporting, and audit history
- Advanced conditions, integrations, and production deployment

## Current scope

PC-1 is intentionally client-side. The Run action, undo/redo, backend persistence, authentication, AI, simulation, import/export, and advanced validation are reserved for later milestones.
