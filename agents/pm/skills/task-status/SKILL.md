---
name: task-status
description: Show the current status of all tasks. Usage /task-status
---

# Task Status Dashboard

Show the current status of all tasks.

## Steps

1. Run `demiurge task list` to fetch all tasks with their metadata.
2. Extract from each task:
   - Task ID and title
   - Status
   - Assigned to
   - Parent task
   - Dependencies and their statuses
3. Display as a table:

```
| Task | Status | Assigned | Dependencies |
|------|--------|----------|-------------|
| TASK-001 | in-progress | — | — |
| TASK-001-designer | review | designer | none |
| TASK-001-frontend | new | frontend | TASK-001-designer (review) |
```

4. Highlight any blockers:
   - Tasks in `revision` (need rework)
   - Tasks blocked by dependencies not yet `approved`/`done`
   - Tasks in `review` waiting for reviewer/PM

## Output Format
Keep it concise — table + blockers list. No extra commentary.
