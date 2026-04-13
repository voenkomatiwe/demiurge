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

## Not Doing
_Explicit scope exclusions. PM names at least one thing the specialist should NOT build, even if tempted. This list is as important as Requirements._
- [Something adjacent we chose to defer]
- [A generalisation we're refusing to add]

## Files to Touch
- `frontend/src/components/MyFeature.tsx` (create | modify | delete)
- `backend/src/routes/my-feature.ts` (create | modify)

## Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

## Success Metrics
| Metric | Target | How to Verify |
|--------|--------|---------------|
| Build | 0 errors | `{{PACKAGE_MANAGER_RUN}} build` |
| Lint | 0 violations | `{{PACKAGE_MANAGER_RUN}} lint` |
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

## Session Log
_SessionStop hook appends a timestamp per agent session here. For token/cost accounting use `/cost` in-session or `ccusage` across sessions — neither is written into this file._

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
