---
title: Contracts Architecture
based-on: []
owns-labels: ["area:contracts", "area:architecture"]
spawns-issues-on-change:
  - section: "## Contracts"
    type: Feature
    labels: ["role:smartcontract", "area:contracts"]
  - section: "## Upgrade strategy"
    type: Task
    labels: ["role:smartcontract", "area:contracts", "area:security"]
  - section: "## Access control"
    type: Feature
    labels: ["role:smartcontract", "area:contracts", "area:security"]
---

# Smart Contracts Architecture

The on-chain layer: what contracts exist, how they relate, who can change what.

## System overview

<!--
One paragraph + high-level diagram of contract relationships.
Example:
  [Users] → [Entry/Router] → [Core logic] → [Storage]
                            ↘ [Access control]
-->

## Networks

| Network | Purpose | Chain ID | RPC | Explorer |
|---------|---------|----------|-----|----------|
| Local | Dev | 31337 | http://localhost:8545 | — |
| Testnet | Integration | _(fill)_ | _(fill)_ | _(fill)_ |
| Mainnet | Production | _(fill)_ | _(fill)_ | _(fill)_ |

## Contracts

<!--
One sub-heading per contract. For each:
- Purpose (one sentence)
- Key state variables
- Public functions (link to interfaces.md for full signatures)
- Events emitted
- Dependencies (imports, inherited contracts)
- Upgradeable? (see upgrade strategy below)
-->

### _(ContractName)_

## Access control

<!--
Who can call what. Ownable? AccessControl roles? Multisig?
Document every privileged function and the role that gates it.
-->

## Upgrade strategy

<!--
Immutable? Transparent proxy? UUPS? Beacon? Diamond?
If upgradeable:
- Which contracts are upgradeable and which are not
- Who holds upgrade authority
- Timelock duration
- Storage layout protection (no reordering of variables!)
-->

## External integrations

<!--
Other protocols this depends on: oracles (Chainlink?), tokens (ERC20/721/1155 addresses), DEXs, bridges.
For each: purpose, address (per network), trust assumptions.
-->

## Boundary with web

The web backend talks to contracts via the ABIs in `docs/contracts/interfaces.md`. **That file is the source of truth** — any ABI or event signature change there is a breaking change to the web.

## Gas and economics

<!--
Gas budgets per user action, how we minimize them, any fee-sharing model.
Link to the economic/tokenomic spec if there is one.
-->
