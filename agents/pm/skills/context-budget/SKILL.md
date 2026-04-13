---
name: context-budget
description: Audit context window consumption — check file sizes against token budgets and suggest trimming. Use when the Owner or PM wants to verify that CLAUDE.md, task files, and shared docs fit within their intended budgets, or when a session feels sluggish and context may be bloated.
---

# Context Budget Audit

Verify context consumption stays within the orchestrator's default budgets.

## Token Budgets (defaults)

| File | Budget (tokens) | Rough char count (~4 chars/token) |
|------|----------------|----------------------------------|
| `CLAUDE.md` | ≤ 500 | ≤ 2000 |
| `docs/ARCHITECTURE.md` | ≤ 2000 | ≤ 8000 |
| `docs/MEMORY_BANK.md` | ≤ 300 | ≤ 1200 |
| Any single task file | soft 1500 | ≤ 6000 |

Rules of thumb: 1 token ≈ 4 characters ≈ 0.75 English words.

## Steps

1. For each budgeted file: check its size with `wc -c` and `wc -w`.
2. Estimate tokens: `tokens ≈ chars / 4` (English) or `chars / 3.5` (mixed Cyrillic).
3. Report a table:

```
| File | Chars | Est. Tokens | Budget | Status |
|------|-------|-------------|--------|--------|
| CLAUDE.md | 1400 | ~350 | 500 | ✅ |
| docs/ARCHITECTURE.md | 2550 | ~640 | 2000 | ✅ |
| docs/MEMORY_BANK.md | 1180 | ~295 | 300 | ⚠ near |
```

4. For any file `⚠ near` (>80% of budget) or `❌ over`:
   - Identify bloat: repetitive sections, stale notes, inline examples that could be links.
   - Suggest 2–3 concrete trimming actions (e.g. "move the API contract example to a separate doc and link").
   - Do NOT trim automatically — propose, let Owner decide.

5. Also scan `docs/tasks/TASK-*.md` for outliers:
   - Any task file > 6000 chars → flag, it probably has bloated Review/Revision history.
   - Suggest archiving old Revision blocks into a `.history` file if needed.

## When to Run

- Manually before a big session where you plan lots of parallel agents.
- When `/compact` suggestions show unusually high load.
- After accumulating 5+ revisions on a task.

## Non-Goals

- Not a token counter for the full Claude Code conversation (use `/cost` for that).
- Not an automatic trimmer — it only reports and recommends.
