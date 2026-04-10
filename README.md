# create-claude-orchestrator

A drop-in multi-agent orchestrator template for [Claude Code](https://claude.com/claude-code). Install once and you get five specialist agents (PM, reviewer, designer, frontend, backend), a structured task-file workflow, context-preserving hooks, a Memory Bank that survives `/compact`, and a set of skills for analysis, security, and parallel execution.

**The goal**: solve the "context loss between agents" problem. An agent joining the project reads one task file and understands exactly what to do and why, without scanning the whole codebase.

## Stack assumptions

The template ships opinionated around this stack — the agents, rules, and hooks reference it by default:

- **Backend**: Fastify + OpenAPI docs (via `@fastify/swagger`)
- **Frontend**: React + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Auth**: Better Auth (Phone OTP + Magic Link)
- **Design**: Pencil (`.pen` files)
- **Linting / formatting**: Biome
- **Database**: pick your own (Postgres, SQLite, etc.)
- **Package manager**: `bun` by default — swap for npm / pnpm / yarn by editing CLAUDE.md

If your project uses a different stack, edit `CLAUDE.md` after install and the specialists will adapt.

## Install

```bash
# Inside your project directory
npx create-claude-orchestrator
```

The CLI will prompt for project name + description, then copy the template files into your current directory.

### Non-interactive

```bash
npx create-claude-orchestrator --yes --project my-app --description "My thing"
```

### Overwrite existing files

```bash
npx create-claude-orchestrator --force
```

### Preview without writing

```bash
npx create-claude-orchestrator --dry-run
```

## What gets installed

```
your-project/
├── .claude/
│   ├── agents/              # pm, reviewer, designer, frontend, backend
│   ├── hooks/               # session-start, scope-check, session-stop, protect-files
│   ├── rules/               # security, coding-style, agent-behavior
│   ├── skills/              # context-budget, analyze-repo, multi-execute, security-scan
│   ├── instincts/           # stub for continuous learning
│   └── settings.json        # hook registrations
├── docs/
│   ├── ARCHITECTURE.md      # skeleton
│   ├── DECISIONS.md         # YAML decisions log
│   ├── MEMORY_BANK.md       # persistent state
│   ├── WORKFLOW.md          # how the orchestrator works
│   └── tasks/
│       ├── _TEMPLATE.md         # owner task template
│       └── _TEMPLATE-SPEC.md    # specialist task template
├── scripts/
│   ├── run-agent.sh         # launch a specialist on a task
│   └── convert.sh           # export agents to .agents/ and .codex/
└── CLAUDE.md                # project root context
```

## After install

1. **Edit CLAUDE.md** — add your stack, conventions, and structure. Keep it under ~500 tokens.
2. **Edit docs/ARCHITECTURE.md** — describe your system components and conventions.
3. **Create your first task**:
   ```bash
   cp docs/tasks/_TEMPLATE.md docs/tasks/TASK-001.md
   ```
   Fill in Goal, Background, Requirements, Acceptance Criteria.
4. **Run Claude**:
   ```bash
   claude
   > use the pm agent to analyze docs/tasks/TASK-001.md, ask clarifying questions, then decompose
   ```

## How the workflow works

```
Owner creates TASK-001.md
   │
   ▼
PM decomposes → specialist task files (TASK-001-frontend.md, etc.)
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

Each agent has: Identity & Memory → Critical Rules → Workflow → Success Metrics → Personality.

Based on the prompt structure from [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) and the reviewer methodology from [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code).

## Hooks (installed in `.claude/settings.json`)

| Hook | When | What |
|------|------|------|
| SessionStart | `startup`/`resume` | Loads project summary + active tasks + Memory Bank snapshot |
| Scope check | After Edit/Write | Warns if edited file is not in active task's "Files to Touch" |
| Protect files | Before Edit/Write | Blocks `.env`, lock files, `.git/`, `.claude/settings*` |
| Session stop | When agent session ends | Appends timestamp to active task's Token Usage section |
| Post-compact reminder | After `/compact` | Re-injects conventions + Memory Bank pointer |

## Slash commands

| Command | Purpose |
|---------|---------|
| `/decompose TASK-001` | PM decomposes a task into specialist subtasks |
| `/review-task TASK-001-frontend` | Full review pipeline (reviewer + PM) |
| `/task-status` | Dashboard of all task statuses and blockers |

## Customization

- **Stack**: Edit `CLAUDE.md` → Stack to reflect your actual tools. All agents read this first.
- **Conventions**: Edit `.claude/rules/coding-style.md` to match your project.
- **Agent behavior**: Edit `.claude/agents/*.md` to add or remove Critical Rules.
- **Security checks**: Edit `.claude/rules/security.md` for your compliance and threat model.
- **Task template**: Edit `docs/tasks/_TEMPLATE-SPEC.md` to add fields.

If your stack differs significantly from the defaults (e.g. Python backend instead of Fastify, Vue instead of React), ask the PM agent to re-adapt the specialist prompts on your first task.

## Multi-runtime export

```bash
scripts/convert.sh
```

Generates `.agents/` (Cursor-compatible plain markdown) and `.codex/` (OpenAI Codex layout) from `.claude/agents/`. Source of truth is always `.claude/agents/`.

## Requirements

- Node.js ≥ 18 (for the installer)
- [Claude Code](https://claude.com/claude-code) installed

## License

MIT
