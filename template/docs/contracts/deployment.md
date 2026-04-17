---
title: Contracts Deployment
based-on: []
owns-labels: ["area:contracts", "area:deployment"]
spawns-issues-on-change: []
---

# Smart Contracts Deployment

How contracts move from PR to verified on-chain code.

## Environments

| Environment | Network | Purpose | Who can deploy |
|-------------|---------|---------|----------------|
| Local | anvil / hardhat | Unit & integration tests | anyone |
| Testnet | _(fill)_ | Integration, external audits | CI on `main` |
| Mainnet | _(fill)_ | Production | multisig (manual) |

## Deployment procedure

### Testnet (automated)

```bash
forge script script/Deploy.s.sol \
  --rpc-url $TESTNET_RPC \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

Triggered by CI after:
- [ ] Tests pass
- [ ] Coverage ≥ 95%
- [ ] Slither clean
- [ ] Gas snapshots match

### Mainnet (manual)

1. Freeze a commit on `main` matching an audit report.
2. Dry-run against a forked-mainnet RPC.
3. Multisig members co-sign the deploy transaction via _(fill — e.g. Safe UI)_.
4. After deploy:
   - [ ] Verify source on Etherscan
   - [ ] Update `docs/apps/<your-app>/interfaces.md` with deployed addresses
   - [ ] Tag the commit `contracts-v<major>.<minor>.<patch>`
   - [ ] Announce in `#deployments` channel

## Verification

Every deploy must result in verified source on the chain's explorer. Unverified = unshipped.

## Upgrades

If contracts are upgradeable (see `docs/apps/<your-app>/architecture.md#upgrade-strategy`):

1. Write upgrade script + storage-layout diff (`forge inspect ... storage-layout`)
2. Run upgrade sim on forked network, assert invariants still hold
3. Execute upgrade via multisig with timelock
4. Update ADR in `docs/contracts/decisions/` referencing the upgrade

## Rollback

Contracts are immutable. Rollback = deploy new contracts + migrate state. Document the migration plan as part of the incident response.

## Post-deploy checklist

- [ ] Addresses added to `docs/apps/<your-app>/interfaces.md`
- [ ] ABI files committed to repo
- [ ] Backend configuration updated with new addresses
- [ ] Frontend chain config updated
- [ ] Monitoring / alerts configured for new contract events
