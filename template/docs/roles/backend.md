---
title: Backend Role
kind: role-card
---

# Backend Role

Your zone: the apps listed in "Your workspace" below — each is a backend-role app.
Off-limits: other roles' apps, `docs/sources/` (read-only), shared `docs/web/`
convention files except to *read* them.

## Read before your first task

1. `docs/vision.md`
2. `docs/scope.md`
3. `docs/web/stack.md`
4. `docs/apps/<your-app>/architecture.md` — the app you're claiming an issue on
5. `docs/apps/<your-app>/api.md` — you **own** this file
6. `docs/apps/<your-app>/data-model.md` — you **own** this file
7. `docs/web/security.md` — required reading, no exceptions
8. **`docs/web/references/backend-code-style.md`** — folder layout, plugin/handler/service patterns, error handling, validation, testing, logging. Authoritative style reference; read before writing code
9. `grep -rli "backend\|api\|data" docs/web/decisions/`

## Your workspace

<!-- apps:start -->
_No apps yet._
<!-- apps:end -->

## You own these docs

When these files are edited, you are the person to review the PR — even if you didn't write it:

- `docs/apps/<your-app>/api.md`
- `docs/apps/<your-app>/data-model.md`
- `docs/web/security.md` (co-owned with reviewers)

## Boundary with other roles

- **Frontend**: the HTTP contract lives in `docs/apps/<your-app>/api.md`. When you change it — add, remove, rename, or change a shape — bump the OpenAPI spec in the same PR.
- **Smart contracts**: on-chain interactions go through `docs/apps/<contracts-app>/interfaces.md`. Addresses, ABIs, and events live there. Never hardcode addresses.
- **PM**: new capabilities start as issues in Project Status `Blocked` (grooming). Don't implement without one.

## Workflow

Lifecycle lives on the Project board — there are no `status:*` labels. Use MCP tools (`list_project_items`, `update_issue`, `update_project_item_field`) or the CLI equivalents below.

```bash
# 1. Find your queue — items with role:backend AND Project Status = Ready
gh project item-list "$PROJECT_NUMBER" --owner "$ORG" --format json \
  | jq '.items[] | select(.status=="Ready" and (.labels|index("role:backend")))'

# 2. Claim — assign to self, flip Project Status to "In progress"
gh issue edit <n> --add-assignee @me
# set Project Status via MCP update_project_item_field or GraphQL updateProjectV2ItemFieldValue

# 3. Work
git checkout -b backend/<issue-n>-<short-slug>
# ... edits in backend/ only ...

# 4. Submit
gh pr create --fill
# set Project Status to "Review"
```

## Quality gates before requesting review

- [ ] `bun run lint` passes
- [ ] `bun run build` passes
- [ ] All routes have request + response schemas (validation is not optional)
- [ ] Tests: unit for services, integration for routes
- [ ] No secrets or credentials in logs
- [ ] Migration included if data-model changed (and it's zero-downtime safe)
- [ ] `docs/apps/<your-app>/api.md` / `docs/apps/<your-app>/data-model.md` updated if contract changed
- [ ] Rate limiting considered for any new public endpoint

## Common tasks

| Task | Issue Type | Labels |
|------|-----------|--------|
| New endpoint | `Feature` | `role:backend area:api` |
| Schema migration | `Feature` | `role:backend area:data-model` |
| Auth / security | `Feature` | `role:backend area:auth area:security` |
| Performance fix | `Task` | `role:backend` |
| Bug fix | `Bug` | `role:backend` |
