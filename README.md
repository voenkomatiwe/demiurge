# demiurge

A multi-agent AI orchestrator for [Claude Code](https://claude.com/claude-code) and [Codex](https://github.com/openai/codex). Five specialist agents (PM, reviewer, designer, frontend, backend), an API-first task system backed by SQLite, and an optional web dashboard for managing everything without a terminal.

**The goal**: you upload project documentation, PM agent analyzes it, builds a plan, creates tasks for specialist agents, and they execute autonomously.

## Install

```bash
bun install -g demiurge
```

## Quick start

```bash
# 1. Initialize a new project (3 questions: name, executor, ui)
mkdir my-project && cd my-project
demiurge init

# 2. Upload project documentation
demiurge intake specs.md wireframes.md notes.txt

# 3. Run PM agent to analyze docs and create tasks
demiurge run pm --task TASK-001

# 4. See what PM created
demiurge task list

# 5. Run specialist agents
demiurge run frontend --task TASK-001-frontend
demiurge run backend --task TASK-001-backend

# 6. (Optional) Open the web dashboard
demiurge ui    # http://localhost:4400
```

## How it works

```
You upload documentation
   │
   ▼
demiurge intake docs/*
   │
   ▼
PM agent analyzes → creates task plan → decomposes into subtasks
   │
   ▼
Specialist agents execute (frontend, backend, designer)
   │
   ▼
Reviewer agent: build + lint + security check
   │
   ▼
PM approves → done
```

Agents communicate through a shared SQLite database. Each agent reads its task, plans its own implementation, updates progress, and sets status to `review` when done. No markdown files to manage — everything goes through `demiurge task` commands.

## Two execution modes

| Mode | How agents run | Task storage | Status |
|------|---------------|--------------|--------|
| **Local** | Claude Code / Codex subprocesses on your machine | SQLite | MVP |
| **GitHub** | GitHub Actions via `repository_dispatch` | GitHub Issues | Future |

Modes are mutually exclusive. Architecture supports both through adapter interfaces (`StorageAdapter`, `Executor`).

## CLI reference

### Project setup

```bash
demiurge init                              # Interactive (3 questions)
demiurge init --yes --executor claude-code # Non-interactive with defaults
demiurge init --executor codex --ui        # Use Codex, enable UI dashboard
```

### Tasks

```bash
demiurge task list                         # All tasks
demiurge task list --status in-progress    # Filter by status
demiurge task list --assigned-to frontend  # Filter by agent
demiurge task get TASK-001                 # Task details (JSON)
demiurge task create --title "Build API" --assigned-to backend
demiurge task update TASK-001 --status review
demiurge task update TASK-001 --progress - <<'EOF'
Step 1 complete. Step 2 in progress.
EOF
demiurge task delete TASK-001
```

### Running agents

```bash
demiurge run pm --task TASK-001            # Run PM on a task
demiurge run frontend --task TASK-001-frontend
demiurge agents sessions                   # List all sessions
demiurge agents sessions --status running  # Active sessions only
demiurge agents stop --session <id>        # Stop an agent
```

### Documents

```bash
demiurge intake file1.md file2.pdf         # Upload intake documents
```

### Memory & decisions

```bash
demiurge memory get                        # Current memory bank
demiurge memory set "Active: TASK-001"     # Update memory
demiurge decision add --title "Use React" --decision "React for UI" --tags frontend,stack
demiurge decision list                     # All decisions
demiurge decision list --tags frontend     # Filter by tag
```

### Web dashboard

```bash
demiurge ui                                # Start on port 4400
demiurge ui --port 3000                    # Custom port
```

Dashboard pages: Dashboard (overview), Tasks (tree + filters), Task Detail (status + run agent), Documents (upload + view), Agent Sessions (logs + stop), Decisions (tag filter).

## What `demiurge init` creates in your project

```
your-project/
├── agents/              # Agent prompts (pm, reviewer, designer, frontend, backend)
│   ├── pm/agent.md
│   ├── reviewer/agent.md
│   ├── designer/agent.md
│   ├── frontend/agent.md
│   └── backend/agent.md
├── .claude/
│   ├── hooks/           # session-start, scope-check, session-stop, protect-files
│   ├── rules/           # security, coding-style, agent-behavior
│   ├── skills/          # orchestrator skills
│   ├── workflows/       # default.yaml pipeline
│   └── settings.json    # Hook registrations
├── .demiurge/
│   └── data.db          # SQLite database (tasks, sessions, decisions, memory)
└── demiurge.config.json # Executor and model configuration
```

The project's tech stack is NOT asked during init — PM agent determines it from your intake documents.

## Configuration

```json
// demiurge.config.json
{
  "executor": "claude-code",
  "model": "opus",
  "agents": {
    "pm": { "model": "opus" },
    "reviewer": { "model": "opus" },
    "designer": { "model": "sonnet" },
    "frontend": { "model": "sonnet" },
    "backend": { "model": "sonnet" }
  }
}
```

## Agents

| Agent | Default model | Role |
|-------|--------------|------|
| **pm** | opus | Analyze docs, decompose tasks, coordinate, approve |
| **reviewer** | opus | Build + lint + security scan + convention check |
| **designer** | sonnet | UI/UX design specs with measurable criteria |
| **frontend** | sonnet | Client-side implementation |
| **backend** | sonnet | API, integrations, server-side logic |

Each agent has: identity, critical rules, workflow, success metrics. Agent prompts live in `agents/` and are customizable.

## Architecture

```
┌─────────────────────────────────────────┐
│  UI Layer (React SPA)                   │  ← optional, `demiurge ui`
├─────────────────────────────────────────┤
│  API Layer (Fastify)                    │  ← REST API
├─────────────────────────────────────────┤
│  Storage Adapter                        │  ← SQLite (MVP) / GitHub Issues (future)
├─────────────────────────────────────────┤
│  Executor Adapter                       │  ← Claude Code / Codex (MVP) / GitHub Actions (future)
└─────────────────────────────────────────┘
```

CLI commands access SQLite directly (no server needed). The UI is a convenience layer.

## Development (contributing to demiurge)

```
demiurge/
├── agents/           # Template agent definitions (source of truth)
├── packages/core/    # Types, DB, adapters, services, executors
├── backend/          # Fastify REST API
├── frontend/         # React SPA (Vite + Tailwind v4)
├── cli/              # CLI commands (commander)
└── package.json      # Bun workspaces root
```

```bash
bun install                    # Install all workspace dependencies
bun test                       # Run all tests
bun run dev:frontend           # Frontend dev server
bun run dev:backend            # Backend dev server
bun run build                  # Build all workspaces
bun run lint                   # Biome check
```

## Requirements

- [Bun](https://bun.sh) >= 1.1
- [Claude Code](https://claude.com/claude-code) or [Codex](https://github.com/openai/codex)

## License

MIT
