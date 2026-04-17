---
title: Frontend Role
kind: role-card
---

# Frontend Role

Your zone: **`frontend/`** — the React SPA.
Off-limits: `backend/`, `contracts/`, `docs/sources/` (read-only).

## Read before your first task

1. `docs/vision.md` — what we're building
2. `docs/scope.md` — what's in MVP
3. `docs/web/stack.md` — your stack
4. `docs/web/architecture.md` (especially **Frontend layer** and **Data flow**)
5. `docs/web/api.md` — the contract you consume
6. `docs/design/system.md` — tokens and components
7. **`docs/web/references/frontend-code-style.md`** — folder layout, component/page patterns, error handling, state management, testing. Authoritative style reference; read before writing code
8. `grep -rli "frontend\|ui" docs/web/decisions/ docs/design/decisions/`

## Boundary with other roles

- **Backend**: everything you send or receive from the server is specified in `docs/web/api.md`. If you need a field that isn't there, open a backend issue — do not add it client-side.
- **Designer**: visual decisions come from `docs/design/`. If a pattern isn't there, ask — don't invent.
- **Smart contracts**: you never call contracts directly from the browser in this project. The backend wraps on-chain reads/writes.

## Workflow

```bash
# Find your queue
gh issue list --label "role:frontend" --label "status:ready"

# Claim
gh issue edit <n> --add-assignee @me \
  --add-label "status:in-progress" --remove-label "status:ready"

# Work
git checkout -b frontend/<issue-n>-<short-slug>
# ... edits in frontend/ only ...

# Submit
gh pr create --fill
gh issue edit <n> --add-label "status:review" --remove-label "status:in-progress"
```

## Quality gates before requesting review

- [ ] `bun run lint` passes
- [ ] `bun run build` passes
- [ ] Tests updated (unit for logic, e2e for user flows touched)
- [ ] No new `any` types
- [ ] Design tokens used (no hex / no magic spacing values)
- [ ] Accessibility: keyboard path works, focus visible, labels on interactive elements
- [ ] No new entries to `docs/web/api.md` (that's the backend's job)

## Common tasks

| Task | Labels |
|------|--------|
| New screen | `role:frontend area:ui type:feature` |
| Wiring a new API endpoint | `role:frontend area:api type:feature` |
| UI refactor | `role:frontend area:ui type:refactor` |
| Visual bug | `role:frontend area:ui type:bug` |
