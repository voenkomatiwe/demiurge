# Workflow — AI Agent Orchestration

## Overview

```
Owner drops materials into docs/intake/
    │
    ▼
demiurge intake docs/* → PM generates Brief (docs/BRIEF.md)
    │
    ▼ (Owner approves Brief)
PM creates parent task (demiurge task create)
    │
    ▼
PM decomposes → lightweight subtasks for specialists (Goal + Why + Boundaries)
    │
    ▼ (Owner approves decomposition)
Specialists plan their own implementation
    │
    ▼
Specialists work (in parallel via worktrees if independent)
    │
    ▼
Reviewer agent checks code quality, build, lint, accessibility
    │
    ▼
PM reviews task completion against Goal
    │
    ▼ (Owner approves final result)
Done
```

## Roles

| Role | Who | What they do |
|------|-----|-------------|
| Owner | Human | Provides materials, approves briefs/plans/results |
| PM | AI agent (opus) | Synthesizes briefs, decomposes tasks, coordinates, propagates constraints |
| Reviewer | AI agent (opus) | Code quality gate — build, lint, security, accessibility |
| Designer | AI agent (sonnet) | Plans and creates UI/UX design specs |
| Frontend | AI agent (sonnet) | Plans and implements client-side code |
| Backend | AI agent (sonnet) | Plans and implements API, integrations, server-side logic |

## Step-by-Step Process

### 1. Intake — Provide Raw Materials

Drop files into `docs/intake/`:
- Text notes, product ideas, feature descriptions
- Screenshots, mockups, competitor examples
- Links, references, existing specs

Then run:
```bash
demiurge intake docs/*
```

### 2. PM Generates Brief

```bash
demiurge run pm
```

PM reads everything in `docs/intake/`, synthesizes `docs/BRIEF.md`.

**Approve**: Review the brief. If changes needed — tell the PM.

### 3. PM Creates and Decomposes Task

```bash
demiurge task create --title "Parent task" --status new
```

PM creates a parent task, then decomposes it into specialist subtasks:

```bash
demiurge task create --title "TASK-001-designer" --parent TASK-001 --assigned designer
demiurge task create --title "TASK-001-frontend" --parent TASK-001 --assigned frontend
demiurge task create --title "TASK-001-backend"  --parent TASK-001 --assigned backend
```

Each subtask has only: **Why**, **Goal**, **Not Doing**, **Design Reference**. No implementation details — that's the specialist's job.

**Approve**: Review the tasks via `demiurge task list`. If changes needed — tell the PM.

### 4. Specialists Plan and Work

Each specialist reads their task via `demiurge task get TASK-001-frontend`, plans, then executes:

Sequentially (if there are dependencies):
```bash
demiurge run designer --task TASK-001-designer
# → Reviewer checks → PM approves
demiurge run frontend --task TASK-001-frontend
```

In parallel (if no dependencies):
```bash
# Terminal 1:
demiurge run frontend --task TASK-001-frontend

# Terminal 2:
demiurge run backend --task TASK-001-backend
```

Status updates happen via CLI:
```bash
demiurge task update TASK-001-frontend --status in-progress
```

### 5. Code Review (Reality Check)

After each specialist finishes, the reviewer agent verifies the code:
```bash
demiurge run reviewer --task TASK-001-frontend
```

Reviewer checks: build, lint, security, accessibility, convention adherence.

### 6. PM Review

PM reviews task completion against the Goal:
```bash
demiurge run pm --task TASK-001-frontend
```

Statuses: `approved` → done, `revision` → specialist reworks with specific feedback.

```bash
demiurge task update TASK-001-frontend --status approved
# or
demiurge task update TASK-001-frontend --status revision
```

### 7. Completion

Owner reviews the overall result. If everything is good:
```bash
demiurge task update TASK-001 --status done
```

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

PM or reviewer records revision feedback via the task update:

```bash
demiurge task update TASK-001-frontend --status revision --note "Issue: [description]. Expected fix: [what outcome is needed]"
```

## CLI Quick Reference

| Command | What it does |
|---------|-------------|
| `demiurge intake docs/*` | Process intake materials |
| `demiurge task list` | List all tasks |
| `demiurge task list --status in-progress` | Filter tasks by status |
| `demiurge task get TASK-001` | View a specific task |
| `demiurge task create --title "..."` | Create a new task |
| `demiurge task update TASK-001 --status review` | Update task status |
| `demiurge task delete TASK-001` | Delete a task |
| `demiurge memory get` | Read current project state |
| `demiurge memory set "..."` | Update project state |
| `demiurge decision add` | Record a new decision |
| `demiurge decision list` | List all decisions |
| `demiurge run <agent> --task <id>` | Launch an agent on a task |

## Useful Commands

```bash
# Start Claude Code
claude

# Work in an isolated worktree
claude --worktree feature-name

# Resume a session (memory auto-loaded via demiurge memory get)
claude --resume

# Agents are automatically available from .claude/agents/
```

## Automation (Hooks)

These run automatically — no manual action needed:

| Hook | When | What |
|------|------|------|
| **Session start** | `startup`/`resume` | Loads project summary + active tasks via CLI |
| **Auto-lint** | After Edit/Write on source files | Runs your project's linter (configure in `.claude/settings.json`) |
| **Protected files** | Before Edit/Write | Blocks .env, lock files, node_modules, .claude/settings |
| **Post-compact reminder** | After context compaction | Re-injects project conventions + memory pointer |
| **Notification** | When Claude waits for input | macOS notification |

## Memory Bank

Persistent state that survives compaction. PM maintains it via CLI:

```bash
demiurge memory get          # read current state
demiurge memory set "..."    # update (overwrites, not appends)
```

Contents:
- Active task + current step
- Completed steps checklist
- Key decisions this session (refs to decision IDs)
- Open blockers with one-line reasons

Budget: ≤300 tokens. Rewritten, never accumulated.

On `claude --resume` → SessionStart hook runs `demiurge memory get` automatically.

## Context Layers (how agents save tokens)

```
Layer 0: CLAUDE.md (≤500 tokens)           — all agents, auto-loaded
Layer 1: ARCHITECTURE.md (≤2000 tokens)    — PM, frontend, backend (section-scoped)
Layer 2: demiurge decision list (by tag)   — PM whole, others by keyword
Layer 3: demiurge memory get (≤300 tokens) — after compaction recovery
Layer 4: demiurge task get <id>            — assigned agent, read entirely
Layer 5: frontend/src/ | backend/src/      — specialist decides what to read
```
