---
title: Contracts Security
based-on: []
owns-labels: ["area:contracts", "area:security"]
spawns-issues-on-change:
  - section: "## Audit checklist"
    labels: ["role:smartcontract", "area:contracts", "area:security", "type:docs"]
  - section: "## Known risks"
    labels: ["role:smartcontract", "area:contracts", "area:security", "type:docs"]
---

# Smart Contracts Security

Threat model, audit posture, and operational safeguards for on-chain code. **Read this before touching any contract.**

## Threat model

<!--
Who are the attackers and what do they want? Typical classes:
- External users exploiting logic flaws (reentrancy, arithmetic, access bypass)
- MEV searchers (sandwich, front-run, liquidation races)
- Malicious admin (protect against even with multisig)
- Compromised oracle / external dependency
- Cross-chain bridge failure (if applicable)

For each, document the mitigation we rely on.
-->

## Security properties (invariants)

<!--
Statements that must ALWAYS hold, no matter the execution path. These are what fuzzing and invariant tests prove.

Example:
- Total supply equals sum of balances.
- No user can withdraw more than they deposited plus their accrued yield.
- Admin cannot modify user balances directly.

Each invariant should have a corresponding test in the repo.
-->

## Audit checklist

Before requesting a formal audit, the team verifies:

- [ ] All `public` / `external` functions have explicit access control or a documented reason to be permissionless
- [ ] All ERC20 `transfer`/`transferFrom` use `SafeERC20` (handles non-standard tokens)
- [ ] Reentrancy guard on every state-mutating external function that makes external calls
- [ ] Use `_nonReentrant` / Checks-Effects-Interactions pattern consistently
- [ ] Arithmetic uses Solidity 0.8+ built-in overflow checks, or `unchecked` blocks are justified in comments
- [ ] No use of `tx.origin` for authorization
- [ ] No `delegatecall` to arbitrary addresses
- [ ] No timestamp / blockhash used as a source of randomness
- [ ] Upgradeable contracts have storage gaps and no constructor (use `initialize`)
- [ ] Initializer is protected (`initializer` modifier, only callable once)
- [ ] Events emitted for every state change that indexers need
- [ ] Tests pass with `forge coverage` ≥ 95% (or documented exceptions)
- [ ] Slither has zero high/medium findings (or each is triaged with a `// slither-disable-next-line` comment explaining why)
- [ ] Gas snapshots committed and unchanged unexpectedly

## Known risks and mitigations

<!--
Risks we've accepted or mitigated. For each:
- Risk description
- Likelihood / impact
- Mitigation
- Residual risk (accepted? tracked issue?)
-->

## Audits

Past audits are in `docs/contracts/audits/`. See `docs/contracts/audits/README.md` for the index.

## Incident response

- Pausability: _(which contracts, who can pause, who can unpause)_
- Emergency contact:
- Post-mortem policy:
