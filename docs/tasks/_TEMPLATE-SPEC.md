# TASK-XXX-[role]: [Subtask Title]

**Status**: new | blocked | in-progress | review | revision | approved | done | cancelled
**Assigned to**: [designer | frontend | backend | marketing]
**Parent**: TASK-XXX ([parent task title])
**Dependencies**: [TASK-XXX-role (status: done/in-progress) | none]
**Created**: YYYY-MM-DDTHH:MM:SSZ
**Started**: _not started_
**Completed**: _not completed_

## Why (embedded context)
[One-line summary of the product/project — PM copies this from CLAUDE.md on first use.]
This task is needed because [why — PM embeds context from parent task].
Related decisions: [reference to DECISIONS.md#anchor if applicable].

## Requirements
- [Specific deliverable 1]
- [Specific deliverable 2]

## Files to Touch
- `path/to/file.tsx` (create | modify | delete)
- `path/to/another.ts` (create | modify)

## Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

## Success Metrics
| Metric | Target | How to Verify |
|--------|--------|---------------|
| Build | 0 errors | `bun run build` |
| Lint | 0 violations | `bun run lint` |
| [Domain-specific metric] | [number] | [command or check] |

## Design Reference
_Link to design specs or Pencil file if applicable_

## Constraints
_Known limitations from other specialists that affect this task_

## Progress
_Agent creates checklist here as work progresses_

## Review
_Reviewer agent findings will appear here_

## Revisions
_PM/reviewer feedback will appear here. Format:_

```markdown
## Revision #1
**Date**: YYYY-MM-DD
**Reviewer**: Owner | PM | reviewer
**Issues**:
- [Specific unmet criterion]
**Expected fix**: [Exact change needed]
```

## Token Usage
_SessionStop hook appends timestamps here; final cost via `/cost` or `ccusage`_

---

## Status Semantics

| Status | Meaning |
|--------|---------|
| `new` | Created, not yet started |
| `blocked` | Waiting on a dependency not yet `done`/`approved` |
| `in-progress` | Agent actively working |
| `review` | Agent finished, awaiting reviewer + PM |
| `revision` | Rejected by reviewer/PM, rework needed (see Revisions section) |
| `approved` | PM accepted; waiting for Owner's final sign-off if top-level |
| `done` | Fully completed |
| `cancelled` | Dropped (usually cascaded from a cancelled parent) |
