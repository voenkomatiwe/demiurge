> **Note:** This template is for reference only. Tasks are now stored in SQLite and managed via `demiurge task` commands. See `demiurge task create --help`.

# TASK-XXX-[role]: [Subtask Title]

**Status**: new | blocked | in-progress | review | revision | approved | done | cancelled
**Assigned to**: [designer | frontend | backend]
**Parent**: TASK-XXX ([parent task title])
**Dependencies**: [TASK-XXX-role (status) | none]
**Created**: YYYY-MM-DDTHH:MM:SSZ
**Started**: _not started_
**Completed**: _not completed_

## Why

[PM writes 1-3 sentences: product context + why this task exists. The specialist reads this to understand the bigger picture.]

## Goal

[PM writes 1-3 sentences: what the end result should be. Outcome-focused, not implementation-focused. No file paths, no code examples, no exact libraries.]

## Not Doing

[PM lists explicit scope exclusions — what NOT to build, even if tempting. This is as important as the Goal.]

- [Something adjacent we chose to defer]

## Design Reference

[Links to design specs if applicable. Empty for backend-only tasks.]

---

_Everything below this line is the specialist's responsibility._

## Plan

_Specialist creates their implementation plan here after reading the task. Break down into concrete steps, decide file paths, choose approach._

## Progress

_Specialist updates this as work progresses._

## Review

_Reviewer agent findings will appear here._

## Revisions

_PM/reviewer feedback will appear here._

## Session Log

_SessionStop hook appends timestamps here._

---

## Status Semantics

| Status | Meaning |
|--------|---------|
| `new` | Created, not yet started |
| `blocked` | Waiting on a dependency |
| `in-progress` | Agent actively working |
| `review` | Agent finished, awaiting reviewer + PM |
| `revision` | Rejected, rework needed (see Revisions) |
| `approved` | PM accepted |
| `done` | Fully completed |
| `cancelled` | Dropped |
