# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

> **Vision & scope:** see [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md).

## Stack

- **Backend:** {{BACKEND_STACK}}
- **Frontend:** {{FRONTEND_STACK}}
- **Auth:** {{AUTH_STACK}}
- **Design:** {{DESIGN_TOOL}}
- **Linting:** Biome
- **Database:** {{DATABASE}}
- **Package manager:** {{PACKAGE_MANAGER}}

## Conventions

- Tailwind: semantic classes (`bg-primary`, not `bg-[#hex]`)
- Components: shadcn/ui as base
- Formatting: Biome (`{{PACKAGE_MANAGER_RUN}} lint`, `{{PACKAGE_MANAGER_RUN}} format`)
- Backend routes: Fastify schemas + OpenAPI on every endpoint
- Code and comments: English

## Structure

This project is a **Bun workspaces monorepo**. All build, lint, and format commands are run from the repository root.

- `frontend/` — React + Vite workspace (source in `frontend/src/`)
- `backend/` — Fastify workspace (source in `backend/src/`)
- `biome.json` — linter/formatter config (root, shared between workspaces)
- `package.json` — root workspace declaration + proxy scripts (`dev`, `dev:frontend`, `dev:backend`, `build`, `lint`, `format`)
- `design-system/` — Markdown design artifacts (`MASTER.md` + `pages/*.md`)
- `design/` — Pencil design files
- `docs/` — architecture, decisions, tasks
- `.claude/agents/` — AI orchestrator agents (pm, reviewer, designer, frontend, backend)

## For Agents

- Read ONLY your task file from `docs/tasks/`. Do not scan the entire `frontend/` or `backend/` tree.
- The "why" context is embedded in the "Why" section of your task file.
- Project decisions: `docs/DECISIONS.md` (search by tag, do not read entirely).
- Architecture: `docs/ARCHITECTURE.md`.
- After completing work: update your task file status to `review`.
