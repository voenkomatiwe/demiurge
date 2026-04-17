# {{NAME}}

- **Role**: {{ROLE}}
- **Related docs**: [`../../docs/apps/{{NAME}}/`](../../docs/apps/{{NAME}}/)
- **Cross-app conventions**: [`../../docs/{{DOMAIN}}/`](../../docs/{{DOMAIN}}/)

## Getting started

Pick a toolchain that fits this app. See `../../docs/{{DOMAIN}}/stack.md` for
project-wide framework and library guidance.

Bootstrap steps are yours — demiurge currently creates only this folder and
the per-app docs. Subtemplates (nextjs-app / fastify-api / grammy-bot /
foundry-contracts) are a planned addition; until then you scaffold the app
internals yourself (`bun create next-app .`, `forge init .`, etc.).

## Structure (suggested)

- `src/` — code
- `tests/` — tests
- `README.md` — this file; keep links current as the app evolves
