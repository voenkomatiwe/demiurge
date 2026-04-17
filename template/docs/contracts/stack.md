---
title: Contracts Stack
based-on: []
owns-labels: ["area:contracts", "area:stack"]
spawns-issues-on-change: []
---

# Smart Contracts Stack

| Layer | Tool | Version | Why |
|-------|------|---------|-----|
| Language | Solidity | _(fill — e.g. 0.8.24)_ | Pinned exact, no floating |
| EVM target | _(fill — e.g. cancun)_ | — | — |
| Dev framework | _(fill — Foundry / Hardhat)_ | _(fill)_ | — |
| Libraries | OpenZeppelin Contracts | _(fill)_ | Audited primitives |
| Testing | _(fill — forge-std)_ | _(fill)_ | — |
| Fuzzing / invariants | _(fill — Echidna / Medusa / forge)_ | _(fill)_ | — |
| Static analysis | Slither | _(fill)_ | Runs in CI |
| Formatter | _(fill — forge fmt / prettier-solidity)_ | _(fill)_ | — |
| Deployment | _(fill — forge script / hardhat-deploy)_ | — | — |
| Verification | Etherscan | — | Source code verified on every deploy |

## Compiler settings

```
optimizer: enabled
runs: _(fill — 200 is typical; adjust per size/gas tradeoff)_
via_ir: _(true/false)_
evm_version: _(fill)_
```

## Versions policy

- Pin Solidity to exact version (no `^`).
- Update policy: quarterly, or immediately for security-relevant compiler fixes.
- Document breaking upgrades as an ADR in `docs/contracts/decisions/`.

## Local development

```bash
# _(fill commands specific to your framework)_
# Example for Foundry:
forge install
forge build
forge test -vvv
forge coverage
slither .
```
