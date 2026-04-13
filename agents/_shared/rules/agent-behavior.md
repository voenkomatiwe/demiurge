# Agent Behavior Rules

Applies to all agents. Governs how agents collaborate inside the orchestrator.

## Scope Discipline

- **PM does not read source code.** Frontend does not read backend. Designer does not read code.
- **Specialists decide their own file scope.** You plan your implementation under `## Plan` in the task file — including which files to create, modify, or read.
- **Stay in your workspace.** Frontend works in `frontend/src/`, backend in `backend/src/`, designer in `design/` or `design-system/`.

## Context Discipline

- **Task files are lightweight.** PM gives you Why, Goal, and Not Doing. You plan the rest.
- **Do not read the entire `frontend/` or `backend/` tree.** Read what you need for your plan.
- **DECISIONS.md** — search by keyword (grep for your topic); only PM reads it whole.
- **ARCHITECTURE.md** — read only the section relevant to your role.

## Planning Discipline

- **Write your plan first.** Before coding, write `## Plan` in the task file — concrete steps with checkboxes.
- **You own the HOW.** File paths, component structure, library choices (within the stack), implementation approach — all yours.
- **PM owns the WHAT and WHY.** If the Goal is unclear, ask PM via `[NEEDS-CLARIFICATION]`.

## Status Discipline

- Update task status at every transition: `new` → `in-progress` → `review`.
- Do not mark `approved` — only PM or Owner can do that.
- Do not mark `done` — that is Owner's decision.
- On start: set `in-progress`, fill `Started: <ISO timestamp>`.
- On finish: set `review`, fill `Completed: <ISO timestamp>`, fill `Progress` checklist.

## Revision Discipline

- When receiving a `revision` → read the Revision block, fix ONLY what's listed.
- Do not refactor, do not "improve" unrelated code. Scope = the revision comments.
- After fixing → re-run build/lint, set back to `review`.

## Communication Discipline

- **One file, one owner.** Two agents never edit the same file simultaneously. If PM assigns overlap, they must be sequenced.
- **Constraint propagation goes through PM.** If your work reveals a constraint affecting another specialist, add a note in `## Progress` tagged `[BLOCKS-OTHERS]` and stop — PM will propagate.
- **No direct specialist-to-specialist comms.** Everything flows through task files and PM.

## Quality Gates

- Build must pass (`{{PACKAGE_MANAGER_RUN}} build`) before `review`.
- Lint must pass (`{{PACKAGE_MANAGER_RUN}} lint` — Biome) before `review`.
- For UI tasks: visually verify via screenshot (designer → Pencil `pencil_get_screenshot`, frontend → Playwright or manual).
- For backend tasks: tests for happy path + main error cases must exist and pass.

## Decisions

- **Agents do not make architectural decisions.** If a decision is needed → stop, flag in `## Progress` as `[NEEDS-DECISION]`, ask PM.
- PM records accepted decisions into `docs/DECISIONS.md` and updates `MEMORY_BANK.md`.
- **Implementation decisions are yours.** File structure, component names, library choices (within the stack) — decide and document in `## Plan`.

## Tool Usage

- Prefer Read/Write/Edit/Grep/Glob over Bash for file operations.
- Bash is for running build/lint/tests only — not for file I/O.
- Skills (`Skill` tool): invoke when the agent spec says to. Don't improvise with skills not in your list.

## Hooks

- `SessionStart` auto-loads project context — read it.
- `PostToolUse` (Biome) auto-fixes lint — no action needed.
- `Stop` (SessionStop) appends a session-log timestamp to the active task — no action needed.

## When Uncertain

- If the task Goal is ambiguous → do NOT guess. Ask PM via a `[NEEDS-CLARIFICATION]` note in `## Progress` and set status back to `new`.
- If the Goal seems impossible → ask PM. Do not ship something that doesn't meet the Goal.

## Forbidden

- Modifying `.env`, lock files, `.git/`, `node_modules/`, `.claude/settings*` (protect-files.sh blocks).
- Installing new dependencies without noting it in `## Plan` first.
- Reading other specialists' task files (except status, for dependency checking).
- Skipping tests, build, or lint.
- Using `--no-verify` or any skip-hook flag.
