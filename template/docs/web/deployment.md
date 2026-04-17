---
title: Web Deployment
based-on: []
owns-labels: ["area:web", "area:deployment"]
spawns-issues-on-change: []
---

# Web Deployment

How the web app ships from PR merge to production.

## Environments

| Environment | Purpose | URL | Branch / trigger |
|-------------|---------|-----|------------------|
| Development | Local | http://localhost:_(port)_ | — |
| Preview | Per-PR ephemeral | _(fill)_ | PR opened |
| Staging | Pre-prod integration | _(fill)_ | merge to `main` |
| Production | Live users | _(fill)_ | tag `v*` (or manual promote) |

## Build

```bash
bun install --frozen-lockfile
bun run build         # builds frontend + backend
bun run test          # runs tests
bun run lint          # Biome check
```

## Deploy pipeline

<!--
Walk through the deploy from merge to running. Include:
1. CI trigger
2. Build + test
3. Artifact (container image, static bundle, function zip)
4. Registry / storage
5. Rollout (blue-green, canary, rolling)
6. Smoke tests / health checks
7. Rollback strategy
-->

## Infrastructure

- Frontend host:
- Backend host:
- Database host:
- CDN:
- DNS:
- TLS certs:
- Monitoring:
- Logs:

## Secrets

- Where runtime secrets live:
- How they're injected:
- Who has access:

## Scaling

- Horizontal scale triggers:
- Vertical limits:
- Database connection pooling:

## Backups

- Database backup schedule and retention:
- Restore procedure (and when it was last tested):
