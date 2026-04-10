# Memory Bank

Persistent orchestration state. Updated by PM after every status change.
Budget: ≤300 tokens. Read after `/compact` to recover active-task state.

## Current State
**Active task**: _none_
**Current step**: _idle_
**PM last action**: _—_
**Last updated**: _—_

## Completed Steps (current parent task)
- [ ] Q&A with Owner
- [ ] Decompose into specialist subtasks
- [ ] Assign specialists
- [ ] Reviewer pass
- [ ] PM final approve
- [ ] Owner approve

## Key Decisions This Session
_Reference DECISIONS.md entries that matter for the in-flight work_
- None yet

## Files Modified This Session
_Only files touched in-session, cleared on new parent task_
- None yet

## Open Blockers
_Tasks in `blocked` or `revision` with one-line reason_
- None

---

## How PM Updates This File

1. On parent-task decompose → set `Active task`, fill `Completed Steps` skeleton
2. On every status change → tick the matching step, bump `Last updated`
3. On new decision recorded in DECISIONS.md → add one-line reference here
4. On Owner approve → clear `Active task` to `none`, archive nothing (keep decisions)

Rule: this file is append-conservative. Old entries get rewritten, not accumulated.
