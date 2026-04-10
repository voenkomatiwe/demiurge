# Agent Behavior Rules

Applies to all agents. Governs how agents collaborate inside the orchestrator.

## Scope Discipline

- **Read only what your agent spec says.** PM does not read source; frontend does not read backend; designer does not read code.
- **Edit only files listed in `## Files to Touch`** of your task file. The `scope-check.sh` hook warns on out-of-scope edits.
- If you need to edit a file outside the list → STOP, add it to the task file's Files to Touch, note the reason in `## Progress`.

## Context Discipline

- **Task files are self-contained.** The `## Why` section explains the purpose. Do not hunt for context in other files unless the task file points you there.
- **Do not read the entire `src/` directory.** Read only what's in Files to Touch.
- **DECISIONS.md** — search by keyword (grep for your topic); only PM reads it whole.
- **ARCHITECTURE.md** — read only the section relevant to your role.

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

- Build must pass (`bun run build`) before `review`.
- Lint must pass (`bun run lint` — Biome) before `review`.
- For UI tasks: visually verify via screenshot (designer → Pencil `pencil_get_screenshot`, frontend → Playwright or manual).
- For backend tasks: tests for happy path + main error cases must exist and pass.

## Decisions

- **Agents do not make architectural decisions.** If a decision is needed → stop, flag in `## Progress` as `[NEEDS-DECISION]`, ask PM.
- PM records accepted decisions into `docs/DECISIONS.md` and updates `MEMORY_BANK.md`.

## Tool Usage

- Prefer Read/Write/Edit/Grep/Glob over Bash for file operations.
- Bash is for running build/lint/tests only — not for file I/O.
- Skills (`Skill` tool): invoke when the agent spec says to. Don't improvise with skills not in your list.

## Hooks

- `SessionStart` auto-loads project context — read it.
- `PostToolUse` (scope-check) warns about out-of-scope edits — heed the warning.
- `PostToolUse` (Biome) auto-fixes lint — no action needed.
- `Stop` (SessionStop) appends token usage timestamps — no action needed.

## When Uncertain

- If the task is ambiguous → do NOT guess. Ask PM via a `[NEEDS-CLARIFICATION]` note in `## Progress` and set status back to `new` with a comment.
- If acceptance criteria seem impossible → ask PM. Do not ship something that doesn't meet criteria.
- If a file you need doesn't exist → create it ONLY if it's in Files to Touch with action `(create)`.

## Forbidden

- ❌ Modifying `.env`, lock files, `.git/`, `node_modules/`, `.claude/settings*` (protect-files.sh blocks).
- ❌ Installing new dependencies without explicit task approval.
- ❌ Creating files outside Files to Touch.
- ❌ Reading other specialists' task files (except status, for dependency checking).
- ❌ Skipping tests, build, or lint.
- ❌ Using `--no-verify` or any skip-hook flag.
