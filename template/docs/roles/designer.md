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

```bash
# Find your queue
gh issue list --label "role:designer" --label "status:ready"

# Claim
gh issue edit <n> --add-assignee @me \
  --add-label "status:in-progress" --remove-label "status:ready"

# Work in Figma. When shipping a new or changed pattern, update docs/design/system.md in the same PR.

# Submit
gh pr create --fill
gh issue edit <n> --add-label "status:review" --remove-label "status:in-progress"
```

## Quality gates before requesting review

- [ ] Pattern covers all states (default / hover / focus / active / disabled / loading / error / empty)
- [ ] Contrast ratios meet WCAG (`docs/design/principles.md#accessibility-commitments`)
- [ ] Keyboard interaction specified
- [ ] Reduced-motion behaviour specified if animation is involved
- [ ] Uses existing tokens, or a new token is proposed with rationale
- [ ] Figma file linked from the issue and from `docs/design/system.md`

## Common tasks

| Task | Labels |
|------|--------|
| New pattern | `role:designer area:design area:ui type:feature` |
| Token change | `role:designer area:design type:refactor` |
| Accessibility review | `role:designer area:design area:security type:docs` |
