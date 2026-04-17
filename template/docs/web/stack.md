---
title: Web Stack
based-on: []
owns-labels: ["area:web", "area:stack"]
spawns-issues-on-change: []
---

# Web Stack

Pinned versions and the rationale behind each choice. When you bump a version, update this file and link the PR.

## Frontend

| Layer | Tool | Version | Why |
|-------|------|---------|-----|
| Runtime | Bun | _(fill)_ | Monorepo workspaces, fast install |
| Framework | React | _(fill)_ | — |
| Build tool | Vite | _(fill)_ | — |
| Routing | _(fill)_ | _(fill)_ | — |
| Styling | Tailwind CSS | _(fill)_ | Semantic tokens, no CSS-in-JS runtime |
| UI kit | shadcn/ui | — | Primitives, not a component library |
| State (server) | TanStack Query | _(fill)_ | Cache, retries, optimistic updates |
| State (client) | _(fill)_ | _(fill)_ | — |
| Language | TypeScript | _(fill)_ | Strict mode |
| Lint/format | Biome | _(fill)_ | One tool for both |

## Backend

| Layer | Tool | Version | Why |
|-------|------|---------|-----|
| Runtime | Bun | _(fill)_ | Same runtime as frontend build |
| HTTP framework | Fastify | _(fill)_ | Schema-first, OpenAPI out of the box |
| Auth | _(fill — e.g. Better Auth)_ | _(fill)_ | — |
| ORM / Query builder | _(fill)_ | _(fill)_ | — |
| Database | _(fill — e.g. Postgres)_ | _(fill)_ | — |
| Validation | Fastify schemas | — | Request + response validation for free |
| Logging | _(fill)_ | _(fill)_ | — |
| Testing | _(fill)_ | _(fill)_ | — |

## Versions policy

- Pin exact versions in `package.json` (no `^`, no `~`) for app dependencies.
- Bump quarterly. Security patches immediately.
- Document breaking upgrades as an ADR in `docs/web/decisions/`.
