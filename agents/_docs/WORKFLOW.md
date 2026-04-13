# Workflow — AI Agent Orchestration

## Overview

```
Owner drops materials into docs/intake/
    │
    ▼
PM reads intake → generates Brief (docs/BRIEF.md)
    │
    ▼ (Owner approves Brief)
PM creates parent task (TASK-XXX.md)
    │
    ▼
PM decomposes → lightweight task files for specialists (Goal + Why + Boundaries)
    │
    ▼ (Owner approves decomposition)
Specialists plan their own implementation (## Plan in task file)
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

### 2. PM Generates Brief

```bash
claude
> use the pm agent to read docs/intake/ and generate a brief
```

PM reads everything in `docs/intake/`, synthesizes `docs/BRIEF.md`.

**Approve**: Review the brief. If changes needed — tell the PM.

### 3. PM Creates and Decomposes Task

```bash
> use the pm agent to create a task from the approved brief
```

or

```bash
/decompose TASK-001
```

PM creates lightweight specialist tasks:
- `docs/tasks/TASK-XXX-designer.md`
- `docs/tasks/TASK-XXX-frontend.md`
- `docs/tasks/TASK-XXX-backend.md`

Each task has only: **Why**, **Goal**, **Not Doing**, **Design Reference**. No implementation details — that's the specialist's job.

**Approve**: Review the task files. If changes needed — tell the PM.

### 4. Specialists Plan and Work

Each specialist reads their task, writes their own `## Plan`, then executes:

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

### 5. Code Review (Reality Check)

After each specialist finishes, the reviewer agent verifies the code:
```bash
> use the reviewer agent to review docs/tasks/TASK-XXX-frontend.md
```

Reviewer checks: build, lint, security, accessibility, convention adherence.
Writes findings into the task file under "Review" section.

### 6. PM Review

PM reviews task completion against the Goal:
```bash
> use the pm agent to review docs/tasks/TASK-XXX-frontend.md
```

Statuses: `approved` → done, `revision` → specialist reworks with specific feedback.

### 7. Completion

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
**Expected fix**: [What outcome is needed]
```

## Slash Commands

Custom skills for fast orchestration (type in Claude Code):

| Command | What it does |
|---------|-------------|
| `/decompose TASK-001` | PM decomposes task into lightweight specialist subtasks |
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
| **Auto-lint** | After Edit/Write on source files | Runs your project's linter (configure in `.claude/settings.json`) |
| **Protected files** | Before Edit/Write | Blocks .env, lock files, node_modules, .claude/settings |
| **Session stop** | When agent session ends | Appends a timestamp to the active task's "Session Log" section |
| **Post-compact reminder** | After context compaction | Re-injects project conventions + Memory Bank pointer |
| **Notification** | When Claude waits for input | macOS notification |

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
Layer 4: TASK-xxx.md (lightweight)         — assigned agent, read entirely
Layer 5: frontend/src/ | backend/src/      — specialist decides what to read
```
