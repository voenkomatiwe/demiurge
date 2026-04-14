# Memory Bank

Memory bank is stored in SQLite and managed via CLI:

- `demiurge memory get` — read current state
- `demiurge memory set "content"` — update (overwrites, not appends)

Budget: ≤300 tokens. Rewrite, never accumulate.

PM updates memory when:
- New task becomes active
- Agent status changes
- New decision recorded
- Task enters blocked or revision
- Owner approves top-level task
