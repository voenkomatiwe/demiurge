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

Lifecycle lives on the Project board — there are no `status:*` labels. Use MCP tools (`list_project_items`, `update_issue`, `update_project_item_field`) or the CLI equivalents below.

```bash
# 1. Find your queue — items with role:frontend AND Project Status = Ready
gh project item-list "$PROJECT_NUMBER" --owner "$ORG" --format json \
  | jq '.items[] | select(.status=="Ready" and (.labels|index("role:frontend")))'

# 2. Claim — assign to self, flip Project Status to "In progress"
gh issue edit <n> --add-assignee @me
# set Project Status via MCP update_project_item_field or GraphQL updateProjectV2ItemFieldValue

# 3. Work
git checkout -b frontend/<issue-n>-<short-slug>
# ... edits in frontend/ only ...

# 4. Submit
gh pr create --fill
# set Project Status to "Review"
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

| Task | Issue Type | Labels |
|------|-----------|--------|
| New screen | `Feature` | `role:frontend area:ui` |
| Wiring a new API endpoint | `Feature` | `role:frontend area:api` |
| UI refactor | `Task` | `role:frontend area:ui` |
| Visual bug | `Bug` | `role:frontend area:ui` |
