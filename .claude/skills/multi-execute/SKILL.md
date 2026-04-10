---
name: multi-execute
description: Execute multiple independent specialist tasks in parallel via isolated git worktrees. Use when PM has decomposed a parent task into ≥2 subtasks with no cross-dependencies — avoids serial waiting and lets specialists work simultaneously without file conflicts.
---

# Multi-Execute

Run 2+ independent specialist tasks in parallel. Based on the "many brains, many hands" pattern from the ECC reference.

## When to Use

Only when all of these are true:
1. Two or more tasks are in `new`/`in-progress` and independent (no dependency chain).
2. The tasks touch **disjoint file sets** (`## Files to Touch` do not overlap).
3. No shared state writes (DB migrations, config files, package.json).

If any fails → run sequentially. The rule is **one file, one owner**.

## How It Works

Each parallel specialist runs in a separate git worktree so their file edits don't collide:

```bash
# Main worktree runs frontend
scripts/run-agent.sh frontend TASK-001-frontend

# In a second terminal, isolated worktree for backend
cd $(git worktree add ../worktree-backend -b backend-TASK-001)
ACTIVE_TASK=TASK-001-backend claude "use the backend agent to work on docs/tasks/TASK-001-backend.md"
```

PM merges the worktrees after both pass review.

## Steps (PM executes)

1. **Verify independence**:
   - Cross-check `## Files to Touch` for overlaps. Abort if any file appears in ≥2 tasks.
   - Cross-check `## Dependencies`. All prerequisites must be `done`/`approved`.
2. **Create worktrees**:
   ```bash
   for task in TASK-001-frontend TASK-001-backend; do
     role=$(echo $task | sed 's/.*-//')
     git worktree add "../worktree-$role" -b "$role-TASK-001"
   done
   ```
3. **Launch specialists** (in separate terminals, or background with `&`):
   ```bash
   (cd ../worktree-frontend && ACTIVE_TASK=TASK-001-frontend claude "use the frontend agent …") &
   (cd ../worktree-backend  && ACTIVE_TASK=TASK-001-backend  claude "use the backend agent …") &
   wait
   ```
4. **Review each** with `/review-task TASK-XXX-role`.
5. **Merge worktrees** into main:
   ```bash
   git merge --no-ff frontend-TASK-001
   git merge --no-ff backend-TASK-001
   git worktree remove ../worktree-frontend
   git worktree remove ../worktree-backend
   ```
6. **Resolve conflicts**: if any arise, that means the independence check was wrong. Log a lesson and tighten the next decomposition.

## Non-Goals

- This is not a background job runner. Each specialist still needs a terminal.
- Not for tasks with shared state. If backend writes schema and frontend reads it, run backend first.
- Does not parallelize within a single specialist — that's the specialist's job.

## Failure Modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Merge conflict | Independence check missed a shared file | Resequence, retry sequentially |
| One specialist blocks the other via DB | Shared state not detected | Add to the `one file, one owner` rule and redecompose |
| Reviewer finds one approved, other revision | Normal — keep the approved worktree merged, rework the other |
