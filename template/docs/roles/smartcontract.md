---
title: Smart Contract Role
kind: role-card
---

# Smart Contract Role

Your zone: **`contracts/`** — Solidity source, tests, deploy scripts.
Off-limits: `frontend/`, `backend/`, `docs/sources/` (read-only).

## Read before your first task

1. `docs/vision.md`
2. `docs/scope.md`
3. `docs/contracts/stack.md`
4. `docs/contracts/architecture.md` — the whole file
5. `docs/contracts/security.md` — **mandatory**, read every section
6. `docs/contracts/interfaces.md` — the boundary you maintain
7. `docs/contracts/audits/` — all past findings (if any)
8. `grep -rli "." docs/contracts/decisions/ | xargs cat` — on-chain is unforgiving, understand past choices before making new ones

## You own these docs

- `docs/contracts/architecture.md`
- `docs/contracts/interfaces.md`
- `docs/contracts/security.md`
- `docs/contracts/deployment.md`

## Boundary with other roles

- **Backend**: the ABI and deployed addresses in `docs/contracts/interfaces.md` are the only surface area backend consumes. Changes there are breaking — review required from backend before merge.
- **Design / Frontend**: never direct. Everything goes through backend.

## Workflow

```bash
# Find your queue
gh issue list --label "role:smartcontract" --label "status:ready"

# Claim
gh issue edit <n> --add-assignee @me \
  --add-label "status:in-progress" --remove-label "status:ready"

# Work
git checkout -b contracts/<issue-n>-<short-slug>
# ... edits in contracts/ only ...

# Submit
gh pr create --fill
gh issue edit <n> --add-label "status:review" --remove-label "status:in-progress"
```

## Quality gates before requesting review

- [ ] `forge build` clean (no warnings)
- [ ] `forge test -vv` green
- [ ] `forge coverage` ≥ 95% (or each gap has a comment explaining why)
- [ ] Invariant tests added for any new state-mutating function
- [ ] `slither .` reports zero high/medium (or each triaged inline)
- [ ] Gas snapshots committed (`forge snapshot`)
- [ ] Storage layout unchanged on upgradeable contracts (`forge inspect ... storage-layout` diff)
- [ ] `docs/contracts/interfaces.md` updated if public surface changed
- [ ] Natspec (`@notice`, `@param`, `@return`) on every external function
- [ ] Events emitted for every state change

## Common tasks

| Task | Labels |
|------|--------|
| New contract or module | `role:smartcontract area:contracts type:feature` |
| ABI-breaking change | `role:smartcontract role:backend area:contracts area:api` |
| Security fix | `role:smartcontract area:security type:bug` |
| Gas optimization | `role:smartcontract area:contracts type:refactor` |
| Upgrade | `role:smartcontract area:contracts area:security type:refactor` |

## Deploy authority

Testnet deploys run from CI after merge. Mainnet deploys require multisig — see `docs/contracts/deployment.md#mainnet-manual`.
