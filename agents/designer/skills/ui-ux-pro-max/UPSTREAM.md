# Upstream tracking

- **Repo**: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- **Vendored from commit**: `b7e3af8` (full: `b7e3af80f6e331f6fb456667b82b12cade7c9d35`)
- **Vendored on**: 2026-04-11
- **License**: MIT (see LICENSE)
- **Vendored size**: ~668KB (SKILL.md + scripts/ + data/)

## What this skill actually is

**This is not a pure-markdown knowledge-base skill.** It is a Python CLI tool wrapped in a skill interface:

- `SKILL.md` — prose instructions that tell Claude to shell out to the Python script
- `scripts/search.py` — primary entrypoint; invoked as `python3 .claude/skills/ui-ux-pro-max/scripts/search.py <query> [flags]`
- `scripts/core.py`, `scripts/design_system.py` — internal helpers used by `search.py`
- `data/*.csv` — searchable corpus (styles, colors, typography, ui-reasoning, ux-guidelines, products, landing, charts, icons, web-interface) + `data/stacks/*.csv` for 13 frameworks

**Runtime requirement**: Python 3 must be available on the machine running the designer agent. On macOS `python3` ships with the system or via `brew install python3`. Verified present at vendoring time (`python3 --version` → `3.14.3`).

**Integration pattern**: designer invokes `python3 .claude/skills/ui-ux-pro-max/scripts/search.py <query> --design-system --persist -p "<project>"` to generate or update a design system. With `--persist`, the tool writes to `design-system/MASTER.md` and `design-system/pages/*.md` relative to the current working directory — which is why this project adopts `design-system/` as its design folder convention (zero-friction with the tool's default).

## Update procedure

1. `git clone --depth=1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill /tmp/uuxpm`
2. `diff -r /tmp/uuxpm/.claude/skills/ui-ux-pro-max .claude/skills/ui-ux-pro-max` — ignore `UPSTREAM.md` (our file, not in upstream)
3. Review each change. Copy the updated `SKILL.md`, `scripts/`, `data/` as needed.
4. Update the commit SHA and date at the top of this file.
5. Commit with message `chore: sync ui-ux-pro-max skill to <short-sha>`.
6. `rm -rf /tmp/uuxpm`.

## Modification policy

Do NOT edit vendored files in place (`SKILL.md`, `scripts/*.py`, `data/*.csv`). Project-specific overrides, if ever needed, live in `OVERRIDES.md` alongside this file and are applied by the designer agent *after* the vendored `SKILL.md`. As of 2026-04-11, no `OVERRIDES.md` exists — the skill is used unchanged.
