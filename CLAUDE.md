# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

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

- `src/` — source code
- `design/` — Pencil design files
- `docs/` — architecture, decisions, tasks
- `.claude/agents/` — AI orchestrator agents (pm, reviewer, designer, frontend, backend)

## For Agents

- Read ONLY your task file from `docs/tasks/`. Do not scan the entire `src/`.
- The "why" context is embedded in the "Why" section of your task file.
- Project decisions: `docs/DECISIONS.md` (search by tag, do not read entirely).
- Architecture: `docs/ARCHITECTURE.md`.
- After completing work: update your task file status to `review`.
