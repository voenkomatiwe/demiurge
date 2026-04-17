---
title: Reviewer Role
kind: role-card
---

# Reviewer Role

Your zone: **pull requests and issues with Project Status `Review`**.
You don't ship code yourself. You decide whether work is done.

## Read before reviewing

- The issue body and its linked docs
- The PR description
- Relevant role card (`docs/roles/<role>.md`) for the role that produced the PR — quality gates live there

## Five-step review methodology

1. **Scope** — does the diff match what the issue asked for? Anything beyond scope is a red flag: ask to split or remove.
2. **Correctness** — does the code do what it claims? Trace one real path end-to-end.
3. **Quality** — naming, duplication, readability. Would a newcomer understand this in six months?
4. **Safety** — security, input validation, error handling, data integrity. Especially for `area:auth`, `area:security`, `area:contracts`.
5. **Docs** — did relevant `.md` files get updated? Did this introduce a new decision that needs an ADR?

## Severity markers for comments

Use these prefixes so authors know what to fix now vs later:

- **🔴 blocker** — must be fixed before merge
- **🟡 suggestion** — worth considering, author can push back
- **💭 nit** — style / preference, author's call

Only leave blockers when you're **≥ 80% confident** the issue is real. When in doubt, ask a question instead.

## Approval criteria

Tick all before approving:

- [ ] Scope matches the linked issue
- [ ] Role's quality gates satisfied (see `docs/roles/<role>.md`)
- [ ] CI green
- [ ] Docs updated if behaviour changed
- [ ] No blocker comments unresolved

## Escalation

- Security concern in `area:contracts` or `area:auth` → request a second reviewer with the matching role
- Architectural decision surfacing without an ADR → ask for one before merge

## Workflow

```bash
# Your queue — items with Project Status = Review
gh project item-list "$PROJECT_NUMBER" --owner "$ORG" --format json \
  | jq '.items[] | select(.status=="Review")'
gh pr list --search "is:open review-requested:@me"

# After review: sending back → set Project Status to "In progress"
#   (via MCP update_project_item_field or GraphQL updateProjectV2ItemFieldValue)
# Or let the merge + close close the issue naturally — Status moves to Done automatically.
```
