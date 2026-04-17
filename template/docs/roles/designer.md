---
title: Designer Role
kind: role-card
---

# Designer Role

Your zone: **`docs/design/`** + Figma files.
Off-limits: implementation code (`frontend/`, `backend/`, `contracts/`), `docs/sources/` (read-only).

## Read before your first task

1. `docs/vision.md`
2. `docs/scope.md`
3. `docs/design/principles.md`
4. `docs/design/system.md` — the **master** for tokens, global rules, anti-patterns
5. `docs/design/pages/` — per-page overrides (only when a page legitimately deviates)
6. **`docs/design/references/designer-code-style.md`** — page spec structure, component spec pattern, handoff checklist. Authoritative style reference; read before writing specs
7. `docs/design/decisions/` — all past ADRs

## You own these docs

- `docs/design/principles.md`
- `docs/design/system.md` (hard cap 500 lines — grow via ADRs, not bloat)
- `docs/design/pages/*`
- Anything under `docs/design/decisions/`

## Boundary with other roles

- **Frontend**: you produce specs and components (in Figma + `docs/design/system.md`). Frontend implements them. If you can't express a state in the design system, expand the system — do not let frontend invent.
- **PM**: you propose patterns; PM decides scope. Don't ship a pattern the roadmap doesn't need yet.

## Workflow

Lifecycle lives on the Project board — there are no `status:*` labels. Use MCP tools (`list_project_items`, `update_issue`, `update_project_item_field`) or the CLI equivalents below.

```bash
# 1. Find your queue — items with role:designer AND Project Status = Ready
gh project item-list "$PROJECT_NUMBER" --owner "$ORG" --format json \
  | jq '.items[] | select(.status=="Ready" and (.labels|index("role:designer")))'

# 2. Claim — assign to self, flip Project Status to "In progress"
gh issue edit <n> --add-assignee @me
# set Project Status via MCP update_project_item_field or GraphQL updateProjectV2ItemFieldValue

# 3. Work in Figma. When shipping a new or changed pattern, update docs/design/system.md in the same PR.

# 4. Submit
gh pr create --fill
# set Project Status to "Review"
```

## Quality gates before requesting review

- [ ] Pattern covers all states (default / hover / focus / active / disabled / loading / error / empty)
- [ ] Contrast ratios meet WCAG (`docs/design/principles.md#accessibility-commitments`)
- [ ] Keyboard interaction specified
- [ ] Reduced-motion behaviour specified if animation is involved
- [ ] Uses existing tokens, or a new token is proposed with rationale
- [ ] Figma file linked from the issue and from `docs/design/system.md`

## Common tasks

| Task | Issue Type | Labels |
|------|-----------|--------|
| New pattern | `Feature` | `role:designer area:design area:ui` |
| Token change | `Task` | `role:designer area:design` |
| Accessibility review | `Task` | `role:designer area:design area:security` |
