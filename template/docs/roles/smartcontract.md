---
title: Smart Contract Role
kind: role-card
---

# Smart Contract Role

Your zone: the apps listed in "Your workspace" below — each is a smart-contracts-role app.
Off-limits: other roles' apps, `docs/sources/` (read-only), shared `docs/contracts/`
convention files except to *read* them.

## Read before your first task

1. `docs/vision.md`
2. `docs/scope.md`
3. `docs/contracts/stack.md`
4. `docs/apps/<your-app>/architecture.md` — the app you're claiming an issue on
5. `docs/contracts/security.md` — **mandatory**, read every section
6. `docs/apps/<your-app>/interfaces.md` — the boundary you maintain
7. `docs/contracts/audits/` — all past findings (if any)
8. `grep -rli "." docs/contracts/decisions/ | xargs cat` — on-chain is unforgiving, understand past choices before making new ones

## Your workspace

<!-- apps:start -->
_No apps yet._
<!-- apps:end -->

## You own these docs

- `docs/apps/<your-app>/architecture.md`
- `docs/apps/<your-app>/interfaces.md`
- `docs/contracts/security.md`
- `docs/contracts/deployment.md`

## Boundary with other roles

- **Backend**: the ABI and deployed addresses in `docs/apps/<your-app>/interfaces.md` are the only surface area backend consumes. Changes there are breaking — review required from backend before merge.
- **Design / Frontend**: never direct. Everything goes through backend.

## Workflow

Lifecycle lives on the Project board — there are no `status:*` labels. Use MCP tools (`list_project_items`, `update_issue`, `update_project_item_field`) or the CLI equivalents below.

```bash
# 1. Find your queue — items with role:smartcontract AND Project Status = Ready
gh project item-list "$PROJECT_NUMBER" --owner "$ORG" --format json \
  | jq '.items[] | select(.status=="Ready" and (.labels|index("role:smartcontract")))'

# 2. Claim — assign to self, flip Project Status to "In progress"
gh issue edit <n> --add-assignee @me
# set Project Status via MCP update_project_item_field or GraphQL updateProjectV2ItemFieldValue

# 3. Work
git checkout -b contracts/<issue-n>-<short-slug>
# ... edits in contracts/ only ...

# 4. Submit
gh pr create --fill
# set Project Status to "Review"
```

## Quality gates before requesting review

- [ ] `forge build` clean (no warnings)
- [ ] `forge test -vv` green
- [ ] `forge coverage` ≥ 95% (or each gap has a comment explaining why)
- [ ] Invariant tests added for any new state-mutating function
- [ ] `slither .` reports zero high/medium (or each triaged inline)
- [ ] Gas snapshots committed (`forge snapshot`)
- [ ] Storage layout unchanged on upgradeable contracts (`forge inspect ... storage-layout` diff)
- [ ] `docs/apps/<your-app>/interfaces.md` updated if public surface changed
- [ ] Natspec (`@notice`, `@param`, `@return`) on every external function
- [ ] Events emitted for every state change

## Common tasks

| Task | Issue Type | Labels |
|------|-----------|--------|
| New contract or module | `Feature` | `role:smartcontract area:contracts` |
| ABI-breaking change | `Feature` | `role:smartcontract role:backend area:contracts area:api` |
| Security fix | `Bug` | `role:smartcontract area:security` |
| Gas optimization | `Task` | `role:smartcontract area:contracts` |
| Upgrade | `Task` | `role:smartcontract area:contracts area:security` |

## Deploy authority

Testnet deploys run from CI after merge. Mainnet deploys require multisig — see `docs/contracts/deployment.md#mainnet-manual`.
