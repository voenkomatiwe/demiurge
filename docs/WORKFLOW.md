# Workflow — AI Agent Orchestration

## Overview

```
Owner creates a task
    │
    ▼
PM decomposes → task files for specialists
    │
    ▼ (Owner approve decomposition)
Specialists work (in parallel via worktrees)
    │
    ▼
Reviewer agent checks code quality, build, lint, accessibility
    │
    ▼
PM reviews task completion against acceptance criteria
    │
    ▼ (Owner approve final result)
Done
```

## Roles

| Role | Who | What they do |
|------|-----|-------------|
| Owner | Human | Creates tasks, approves plans and results |
| PM | AI agent (opus) | Decomposes tasks, coordinates, propagates constraints |
| Reviewer | AI agent (opus) | Code quality gate — build, lint, security, accessibility |
| Designer | AI agent (sonnet) | UI/UX design specs with measurable criteria |
| Frontend | AI agent (sonnet) | Client-side implementation |
| Backend | AI agent (sonnet) | API, integrations, server-side logic |

## Step-by-Step Process

### 1. Create a Task

```bash
cp docs/tasks/_TEMPLATE.md docs/tasks/TASK-XXX.md
```

Fill in: Goal, Background, Requirements, Acceptance Criteria.

### 2. PM Decomposes

```bash
claude
> use the pm agent to decompose docs/tasks/TASK-XXX.md into specialist tasks
```

PM will create:
- `docs/tasks/TASK-XXX-designer.md`
- `docs/tasks/TASK-XXX-frontend.md`
- `docs/tasks/TASK-XXX-backend.md`

**Approve**: Review the task files. If changes needed — tell the PM.

### 3. Specialists Work

Sequentially (if there are dependencies):
```bash
> use the designer agent to work on docs/tasks/TASK-XXX-designer.md
# → Reviewer checks → PM approves
> use the frontend agent to work on docs/tasks/TASK-XXX-frontend.md
```

In parallel (if no dependencies):
```bash
# Terminal 1:
claude
> use the frontend agent to work on docs/tasks/TASK-XXX-frontend.md

# Terminal 2:
claude --worktree backend-work
> use the backend agent to work on docs/tasks/TASK-XXX-backend.md
```

### 4. Code Review (Reality Check)

After each specialist finishes, the reviewer agent verifies the code:
```bash
> use the reviewer agent to review docs/tasks/TASK-XXX-frontend.md
```

Reviewer checks: build, lint, security, accessibility, convention adherence.
Writes findings into the task file under "Review" section.

### 5. PM Review

PM reviews task completion against acceptance criteria:
```bash
> use the pm agent to review docs/tasks/TASK-XXX-frontend.md
```

Statuses: `approved` → done, `revision` → agent reworks with specific feedback.

### 6. Completion

Owner reviews the overall result. If everything is good — task is `done`.

## Task Statuses

```
new         → task created
blocked     → waiting on a dependency not yet done/approved
in-progress → agent is working
review      → agent finished, awaiting reviewer + PM
revision    → result rejected, rework needed (see Revisions section)
approved    → PM accepted; awaiting Owner if top-level
done        → task fully completed
cancelled   → dropped (usually cascaded from a cancelled parent)
```

## Revision Format (when result is rejected)

Reviewer adds to the task file:

```markdown
## Revision #1
**Date**: 2026-04-09
**Reviewer**: Owner | PM
**Issues**:
- [Specific problem 1]
- [Specific problem 2]
**Expected fix**: [What exactly needs to be fixed]
```

## Slash Commands

Custom skills for fast orchestration (type in Claude Code):

| Command | What it does |
|---------|-------------|
| `/decompose TASK-001` | PM decomposes task into specialist subtasks |
| `/review-task TASK-001-frontend` | Full review pipeline: reviewer agent → PM agent |
| `/task-status` | Dashboard: all task statuses, blockers, dependencies |

## Useful Commands

```bash
# Start Claude Code
claude

# Work in an isolated worktree
claude --worktree feature-name

# Resume a session (Memory Bank auto-loaded via SessionStart hook)
claude --resume

# Launch a specialist on a specific task with active-task pinning
scripts/run-agent.sh frontend TASK-001-frontend
scripts/run-agent.sh pm       TASK-001
scripts/run-agent.sh reviewer TASK-001-frontend

# Agents are automatically available from .claude/agents/
```

## Automation (Hooks)

These run automatically — no manual action needed:

| Hook | When | What |
|------|------|------|
| **Session start** | `startup`/`resume` | Loads project summary + active tasks + Memory Bank snapshot |
| **Scope check** | After Edit/Write | Warns if edited file is not in active task's "Files to Touch" |
| **Auto-lint** | After Edit/Write on source files | Runs your project's linter (configure in `.claude/settings.json`) |
| **Protected files** | Before Edit/Write | Blocks .env, lock files, node_modules, .claude/settings |
| **Session stop** | When agent session ends | Appends a timestamp to the active task's "Session Log" section (cost/tokens via `/cost` or `ccusage`) |
| **Post-compact reminder** | After context compaction | Re-injects project conventions + Memory Bank pointer |
| **Notification** | When Claude waits for input | macOS notification |

### Pinning the Active Task (for scope-check)

The `scope-check` hook needs to know which task is active. It picks:
1. `$ACTIVE_TASK` env var if set (export before launching claude)
2. Otherwise the most recently modified task with status `in-progress`

The `scripts/run-agent.sh` wrapper sets this automatically:

```bash
scripts/run-agent.sh frontend TASK-001-frontend
```

## Memory Bank (`docs/MEMORY_BANK.md`)

Persistent state that survives compaction. PM maintains it:
- Active task + current step
- Completed steps checklist
- Key decisions this session (refs to DECISIONS.md)
- Open blockers with one-line reasons

Budget ≤ 300 tokens. Rewritten, never accumulated.

On `claude --resume` → SessionStart hook injects the first 30 lines automatically.

## Context Layers (how agents save tokens)

```
Layer 0: CLAUDE.md (≤500 tokens)           — all agents, auto-loaded
Layer 1: ARCHITECTURE.md (≤2000 tokens)    — PM, frontend, backend (section-scoped)
Layer 2: DECISIONS.md (grep by keyword)    — PM whole, others by keyword
Layer 3: MEMORY_BANK.md (≤300 tokens)      — after compaction recovery
Layer 4: TASK-xxx.md (self-contained)      — assigned agent, read entirely
Layer 5: frontend/src/ | backend/src/ (only "Files to Touch")   — specialist, scope-enforced by hook
```

## First Task (Validation)

```bash
# 1. Task already created
cat docs/tasks/TASK-001.md

# 2. PM decomposes (slash command)
/decompose TASK-001

# 3. Approve decomposition → Designer works
> use the designer agent to work on docs/tasks/TASK-001-designer.md

# 4. Review designer output (slash command)
/review-task TASK-001-designer

# 5. Approve → Frontend works
> use the frontend agent to work on docs/tasks/TASK-001-frontend.md

# 6. Review frontend code (slash command)
/review-task TASK-001-frontend

# 7. Check overall status
/task-status

# 8. Owner approve → Done
```
