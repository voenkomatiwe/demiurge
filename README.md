# create-demiurge

Scaffold a docs-first, GitHub-native project — with roles, labels, ADRs, bidirectional source → docs tracing, and Claude-Code-friendly navigation.

## Use it

```bash
bun create demiurge my-project
npm create demiurge@latest my-project
pnpm create demiurge my-project
```

Or via `npx`:

```bash
npx create-demiurge my-project
```

The CLI:

1. Copies the template into `my-project/`
2. Runs `git init`
3. Runs the interactive `setup.sh` (asks for project name, description, which domains you need — prunes unused ones, replaces placeholders, creates the initial commit)

Push to a new repo and you're done:

```bash
cd my-project
git remote add origin git@github.com:<you>/<repo>.git
git push -u origin main
```

## Options

| Flag         | Effect                                            |
|--------------|---------------------------------------------------|
| `--force`    | Overwrite non-empty target directory              |
| `--no-setup` | Skip running `setup.sh` after scaffolding         |
| `--no-git`   | Skip `git init`                                   |
| `--help`     | Show help                                         |

## What you get

See [`template/README.md`](template/README.md) and [`template/CLAUDE.md`](template/CLAUDE.md) for the human- and agent-facing entry points of the scaffolded project.

In short:

- `docs/sources/` — read-only raw input materials from stakeholders
- `docs/<domain>/` — synthesized architecture, stack, API, decisions (per domain: `web/`, `contracts/`, `design/`)
- `docs/roles/<role>.md` — thin role cards pointing each contributor to their zone
- `.github/ISSUE_TEMPLATE/` — Feature / Bug / Docs-sync forms with required fields
- `.github/labels.yml` — `area:* role:* type:* status:*` label scheme
- `.github/workflows/` — three GitHub Actions:
  - `sync-labels` — apply `labels.yml` to the repo
  - `docs-sync-on-sources-change` — warn on PRs that touch `docs/sources/`, open a re-sync issue on main
  - `spawn-issues-on-doc-change` — read `spawns-issues-on-change` frontmatter and open follow-up issues
- `CODEOWNERS` — path → team ownership
- `CLAUDE.md` — navigation table for AI agents working with Claude Code

## Add apps incrementally

After scaffolding, add apps one at a time:

```bash
cd my-project
bun x demiurge add app landing --role=frontend
bun x demiurge add app api --role=backend
bun x demiurge add app vault --role=smartcontract
```

Each `add app` creates:

- `apps/<name>/` — your code lives here; pick any toolchain.
- `docs/apps/<name>/` — per-app architecture + role-specific docs (api, data-model, interfaces).
- Registry entry in `.demiurge/apps.yml` (source of truth).
- `apps/README.md` regenerated with a table of all apps.
- `area:apps/<name>` label in `.github/labels.yml`.
- Placeholder CODEOWNERS entries (will be wired to real teams once subsystem 2 adds `team.yml`).
- The "Your workspace" section of `docs/roles/<role>.md` regenerated.

Roles that own code: `frontend`, `backend`, `smartcontract`. Other roles don't own apps.

## Develop

```bash
# Install deps
bun install

# Try the CLI locally
bun run bin/create-demiurge.js /tmp/test-demiurge --no-setup

# Or link globally
bun link
create-demiurge /tmp/test-demiurge
```

## Publish

```bash
bun pm version patch    # or minor / major
bun publish --access public
```

Files shipped: `bin/`, `src/`, `template/` (see `files` in `package.json`).

## Layout

```
create-demiurge/
├── bin/create-demiurge.js   ← entry point
├── src/index.js             ← bootstrap logic (prompts, copy, git init, run setup.sh)
├── template/                ← payload copied into every new project
│   ├── docs/
│   ├── .claude/
│   ├── .github/
│   ├── CLAUDE.md
│   ├── README.md            ← README shipped to the new project
│   ├── CODEOWNERS
│   ├── setup.sh
│   └── _gitignore           ← renamed to .gitignore during scaffold
└── package.json
```

## License

MIT
