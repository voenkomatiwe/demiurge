---
title: Backend Role
kind: role-card
---

# Backend Role

Your zone: **`backend/`** — the Fastify API.
Off-limits: `frontend/`, `contracts/`, `docs/sources/` (read-only).

## Read before your first task

1. `docs/vision.md`
2. `docs/scope.md`
3. `docs/web/stack.md`
4. `docs/web/architecture.md` (especially **Backend layer**, **Data flow**, **Authentication**)
5. `docs/web/api.md` — you **own** this file
6. `docs/web/data-model.md` — you **own** this file
7. `docs/web/security.md` — required reading, no exceptions
8. **`docs/web/references/backend-code-style.md`** — folder layout, plugin/handler/service patterns, error handling, validation, testing, logging. Authoritative style reference; read before writing code
9. `grep -rli "backend\|api\|data" docs/web/decisions/`

## You own these docs

When these files are edited, you are the person to review the PR — even if you didn't write it:

- `docs/web/api.md`
- `docs/web/data-model.md`
- `docs/web/security.md` (co-owned with reviewers)

## Boundary with other roles

- **Frontend**: the HTTP contract lives in `docs/web/api.md`. When you change it — add, remove, rename, or change a shape — bump the OpenAPI spec in the same PR.
- **Smart contracts**: on-chain interactions go through `docs/contracts/interfaces.md`. Addresses, ABIs, and events live there. Never hardcode addresses.
- **PM**: new capabilities start as issues in `status:needs-design`. Don't implement without one.

## Workflow

```bash
# Find your queue
gh issue list --label "role:backend" --label "status:ready"

# Claim
gh issue edit <n> --add-assignee @me \
  --add-label "status:in-progress" --remove-label "status:ready"

# Work
git checkout -b backend/<issue-n>-<short-slug>
# ... edits in backend/ only ...

# Submit
gh pr create --fill
gh issue edit <n> --add-label "status:review" --remove-label "status:in-progress"
```

## Quality gates before requesting review

- [ ] `bun run lint` passes
- [ ] `bun run build` passes
- [ ] All routes have request + response schemas (validation is not optional)
- [ ] Tests: unit for services, integration for routes
- [ ] No secrets or credentials in logs
- [ ] Migration included if data-model changed (and it's zero-downtime safe)
- [ ] `docs/web/api.md` / `docs/web/data-model.md` updated if contract changed
- [ ] Rate limiting considered for any new public endpoint

## Common tasks

| Task | Labels |
|------|--------|
| New endpoint | `role:backend area:api type:feature` |
| Schema migration | `role:backend area:data-model type:feature` |
| Auth / security | `role:backend area:auth area:security` |
| Performance fix | `role:backend type:refactor` |
| Bug fix | `role:backend type:bug` |
