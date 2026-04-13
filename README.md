# demiurge

A drop-in multi-agent orchestrator template for [Claude Code](https://claude.com/claude-code). Install once and you get five specialist agents (PM, reviewer, designer, frontend, backend), a structured task-file workflow, context-preserving hooks, a Memory Bank that survives `/compact`, and a set of skills for analysis, security, and parallel execution.

**The goal**: solve the "context loss between agents" problem. An agent joining the project reads one task file and understands exactly what to do and why, without scanning the whole codebase.

## Stack assumptions

The template ships as a **Bun workspaces monorepo** — the agents, rules, and hooks reference this stack by default:

- **Backend**: Fastify + OpenAPI docs (via `@fastify/swagger`)
- **Frontend**: React + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Auth**: Better Auth (Phone OTP + Magic Link)
- **Design**: Pencil, Markdown, or Figma (choose at install)
- **Linting / formatting**: Biome
- **Database**: PostgreSQL (configurable at install)
- **Package manager**: `bun` (workspaces: `frontend/` + `backend/`)

The CLI prompts for each choice. If your project uses a different stack, the installer writes your answers into `CLAUDE.md` and the specialists adapt.

## Install

```bash
# Inside your project directory
npx demiurge
```

The CLI prompts for project name, description, backend, frontend, auth, database, and design tool, then copies the template.

### CLI options

```bash
npx demiurge --yes                        # accept all defaults
npx demiurge --project my-app --design pencil --backend fastify
npx demiurge --dry-run                    # preview without writing
npx demiurge --force                      # overwrite existing files
npx demiurge --help                       # full option list
```

## What gets installed

```
your-project/
├── .claude/
│   ├── agents/              # pm, reviewer, designer, frontend, backend
│   ├── hooks/               # session-start, scope-check, session-stop, protect-files, check-deps
│   ├── rules/               # security, coding-style, agent-behavior
│   ├── skills/              # context-budget, analyze-repo, multi-execute, security-scan, + design skill
│   ├── workflows/           # default.yaml — full-stack pipeline definition
│   ├── instincts/           # continuous learning (populated over time)
│   └── settings.json        # hook registrations
├── agents/
│   ├── backend/references/  # backend style guide (read by backend agent)
│   ├── designer/references/ # designer style guide (read by designer agent)
│   └── frontend/references/ # frontend style guide (read by frontend agent)
├── docs/
│   ├── ARCHITECTURE.md      # skeleton for your architecture
│   ├── DECISIONS.md         # YAML decisions log
│   ├── MEMORY_BANK.md       # persistent state (survives /compact)
│   ├── WORKFLOW.md          # how the orchestrator works
│   ├── intake/              # drop project materials here for PM to process
│   └── tasks/
│       ├── _TEMPLATE.md         # owner task template
│       └── _TEMPLATE-SPEC.md    # specialist task template
├── design-system/           # (only with --design markdown)
│   └── MASTER.md            # design tokens, global rules, anti-patterns
├── frontend/                # workspace stub
├── backend/                 # workspace stub
├── scripts/
│   ├── run-agent.sh         # launch a specialist on a task
│   └── convert.sh           # export agents to .agents/ and .codex/
├── biome.json               # shared Biome config
├── package.json             # Bun workspaces root + proxy scripts
└── CLAUDE.md                # project root context
```

## After install

1. **`bun install`** — wires workspaces, installs root devDeps (Biome).
2. **Review `CLAUDE.md`** — the installer filled in your stack and description. Verify it matches reality.
3. **Drop project materials into `docs/intake/`** — notes, screenshots, links, PDFs. More context = better results.
4. **Generate a brief**:
   ```bash
   claude
   > use the pm agent to read docs/intake/ and generate a brief
   ```
   PM reads everything, asks clarifying questions, then writes `docs/BRIEF.md`.
5. **Review the brief** — read `docs/BRIEF.md`, tell PM to adjust if needed, then approve.
6. **PM creates the first task** — once the brief is approved, PM writes `docs/tasks/TASK-001.md`.
7. **Decompose and ship**:
   ```
   /decompose TASK-001
   ```
   PM breaks TASK-001 into specialist subtasks (frontend, backend, designer, etc.)
8. *(Optional)* Edit `docs/ARCHITECTURE.md` once your stack is settled.

## How the workflow works

```
Owner drops materials into docs/intake/
   │
   ▼
PM generates docs/BRIEF.md
   │
   ▼ (Owner reviews and approves brief)
PM creates TASK-001.md from the approved brief
   │
   ▼
/decompose TASK-001
PM creates specialist task files (TASK-001-frontend.md, etc.)
   │
   ▼ (Owner approves decomposition)
Specialists work (optionally in parallel via worktrees)
   │
   ▼
Reviewer agent: build + lint + security-scan + convention check
   │
   ▼
PM reviews against acceptance criteria
   │
   ▼ (Owner approves final result)
Done
```

## Agents

| Agent | Model | Role |
|-------|-------|------|
| **pm** | opus | Decompose tasks, coordinate specialists, propagate constraints, approve |
| **reviewer** | opus | Quality gate — build, lint, security, accessibility, conventions |
| **designer** | sonnet | UI/UX design specs with measurable criteria |
| **frontend** | sonnet | Client-side implementation |
| **backend** | sonnet | API, integrations, server-side logic |

Each agent has: Identity & Memory, Critical Rules, Workflow, Success Metrics, and Personality.

Based on the prompt structure from [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) and the reviewer methodology from [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code).

## Hooks (installed in `.claude/settings.json`)

| Hook | When | What |
|------|------|------|
| SessionStart | `startup`/`resume` | Loads project summary + active tasks + Memory Bank snapshot |
| Check deps | SessionStart | Auto-unblocks tasks whose dependencies are now satisfied |
| Scope check | After Edit/Write | Warns if edited file is not in active task's "Files to Touch" |
| Protect files | Before Edit/Write | Blocks `.env`, lock files, `.git/`, `.claude/settings*` |
| Session stop | When agent session ends | Appends timestamp to active task's Session Log + extracts instincts |
| Post-compact reminder | After `/compact` | Re-injects conventions + Memory Bank pointer |

## Slash commands

| Command | Purpose |
|---------|---------|
| `/decompose TASK-001` | PM decomposes a task into specialist subtasks |
| `/review-task TASK-001-frontend` | Full review pipeline (reviewer + PM) |
| `/task-status` | Dashboard of all task statuses and blockers |

## Customization

- **Stack**: Edit `CLAUDE.md` → Stack section to reflect your actual tools.
- **Conventions**: Edit `.claude/rules/coding-style.md` to match your project.
- **Agent behavior**: Edit `.claude/agents/*.md` to add or remove Critical Rules.
- **Security checks**: Edit `.claude/rules/security.md` for your compliance and threat model.
- **Task template**: Edit `docs/tasks/_TEMPLATE-SPEC.md` to add fields.
- **Pipeline**: Edit `.claude/workflows/default.yaml` to change stages, add approval gates.

## Multi-runtime export

```bash
scripts/convert.sh
```

Generates `.agents/` (Cursor-compatible plain markdown) and `.codex/` (OpenAI Codex layout) from the agent definitions. Source of truth is always `.claude/agents/`.

## Development (contributing to demiurge)

The source of truth for all agent definitions lives in `agents/`. Claude Code reads from `.claude/` (flat structure). To develop locally:

```bash
bin/build-local.sh          # sync agents/ → .claude/ + docs/ + design-system/
bin/build-local.sh --clean  # remove generated dirs first, then sync
```

### Project structure (source)

```
agents/
├── _docs/           → docs/           (architecture, decisions, tasks, workflow)
├── _scaffold/       → project root    (package.json, biome.json, workspace stubs)
├── _design-system/  → design-system/  (MASTER.md, pages/)
├── _shared/         → .claude/        (hooks, rules, workflows, instincts, settings)
├── pm/              → .claude/agents/pm.md + skills
├── reviewer/        → .claude/agents/reviewer.md + skills
├── designer/        → .claude/agents/designer.md + skills
├── frontend/        → .claude/agents/frontend.md + skills
└── backend/         → .claude/agents/backend.md + skills
```

## Requirements

- Node.js >= 18 (for the installer)
- [Claude Code](https://claude.com/claude-code) installed

## License

MIT
