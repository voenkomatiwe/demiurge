# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

---

## Quick start

```bash
# Clone (or use this template: https://github.com/{{ORG}}/project-template/generate)
git clone <repo-url>
cd <repo-name>

# Initialize a fresh project (one-time, deletes itself after run)
./setup.sh

# Install and run
bun install
bun run dev
```

## Project documentation

All documentation lives in [`docs/`](./docs/). Start with:

- [`docs/vision.md`](./docs/vision.md) — what we're building and why
- [`docs/scope.md`](./docs/scope.md) — in/out of MVP
- [`docs/sources/README.md`](./docs/sources/README.md) — original briefs, specs, wireframes
- [`docs/web/architecture.md`](./docs/web/architecture.md) — web app architecture (if applicable)
- [`docs/contracts/architecture.md`](./docs/contracts/architecture.md) — smart contracts (if applicable)
- [`docs/design/system.md`](./docs/design/system.md) — design system (if applicable)

## Role onboarding

Pick your role and follow its card:

| Role | Onboarding |
|------|------------|
| Frontend developer | [`docs/roles/frontend.md`](./docs/roles/frontend.md) |
| Backend developer | [`docs/roles/backend.md`](./docs/roles/backend.md) |
| Smart contract developer | [`docs/roles/smartcontract.md`](./docs/roles/smartcontract.md) |
| Designer | [`docs/roles/designer.md`](./docs/roles/designer.md) |
| Project manager | [`docs/roles/pm.md`](./docs/roles/pm.md) |
| Reviewer | [`docs/roles/reviewer.md`](./docs/roles/reviewer.md) |

## Working on tasks

All work is tracked in **GitHub Issues** on a **GitHub Project**. The Project's Status field is the single source of truth for lifecycle (`Ready` → `In progress` → `Review` → `Done`, plus `Blocked`). Find your queue:

```bash
# Items for your role, ready to claim
gh project item-list "$PROJECT_NUMBER" --owner "$ORG" --format json \
  | jq '.items[] | select(.status=="Ready" and (.labels|index("role:<your-role>")))'
```

AI agents typically work through the GitHub MCP server (`list_project_items`, `update_issue`, `update_project_item_field`); the command above is the CLI equivalent. See your role card for the full workflow (claim, submit, review).

## AI agents

The [`CLAUDE.md`](./CLAUDE.md) file at repo root is the navigation map for AI agents working via Claude Code. It links to every document and every role card.

## Contributing

- Branch naming: `<role>/<issue-number>-<short-description>` (e.g. `frontend/42-login-form`)
- All PRs must link an issue and touch related docs
- Lint and build must pass locally: `bun run lint && bun run build`
- See [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md) for the full checklist
