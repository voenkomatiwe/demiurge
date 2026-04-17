---
title: Contracts Interfaces (boundary with web)
based-on: []
owns-labels: ["area:contracts", "area:api"]
spawns-issues-on-change:
  - section: "## Public functions"
    labels: ["role:smartcontract", "role:backend", "area:contracts", "area:api", "type:feature"]
  - section: "## Events"
    labels: ["role:smartcontract", "role:backend", "area:contracts", "area:api", "type:feature"]
---

# Contract Interfaces

**Source of truth for the boundary between on-chain contracts and off-chain services (backend, indexers, the frontend).**

Any change here is a breaking change. Treat this file like a public API spec: a PR touching it must be reviewed by both smart contract and backend roles.

## Deployed addresses

| Contract | Network | Address | Deployed block | Verified |
|----------|---------|---------|----------------|----------|
| _(fill)_ | local | — | — | — |
| _(fill)_ | testnet | _(fill)_ | _(fill)_ | _(yes/no)_ |
| _(fill)_ | mainnet | _(fill)_ | _(fill)_ | _(yes/no)_ |

## ABIs

The authoritative ABIs are committed at:

```
contracts/out/**/*.json      # Foundry-style artifact output
```

The machine-readable ABI files are the source of truth. This document describes them in human terms.

## Public functions

<!--
For each public/external function that off-chain code relies on:
- Signature
- Purpose (one sentence)
- Inputs + validation
- Return value
- Reverts under what conditions
- Gas cost (approx)

Group by contract.

Example:

### TokenVault

#### `function deposit(uint256 amount) external returns (uint256 shares)`
Deposits `amount` of underlying token, mints corresponding shares to caller.
- Reverts: `InsufficientAllowance`, `Paused`
- Emits: `Deposited(address user, uint256 amount, uint256 shares)`
- Gas: ~120k
-->

## Events

<!--
Every event that indexers or the backend listens to. Document:
- Signature (indexed params matter — they affect filtering)
- When it's emitted
- What downstream consumers do with it
-->

## Errors

<!--
Custom errors (prefer over require strings). Document each error and when it's thrown.
-->

## Versioning

<!--
If the ABI is versioned (e.g., via per-network deploy), document how clients pick the right ABI for a given chain.
-->
