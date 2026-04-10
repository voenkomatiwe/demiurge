---
name: analyze-repo
description: Scan the repo to surface structure, key files, and existing decisions before decomposing a task. Use before PM decomposition so constraint discovery and existing-code reuse are grounded in reality, not assumptions.
---

# Analyze Repo

Produce a compact map of the repo relevant to the current task. The PM uses this before decomposition so specialist task files can reference real files and existing conventions.

## Output Format

Return (≤ 40 lines total):

```
### Structure
- src/<top-level dirs with 1-line purpose>
- design/<.pen files>
- docs/<relevant docs>

### Key existing files relevant to task
- src/components/ui/*         — shadcn primitives in use
- src/App.tsx                 — current entrypoint
- src/main.tsx                — Vite mount
- src/api/*                   — Fastify routes

### Existing conventions observed
- Tailwind v4 with semantic tokens (bg-primary, bg-background)
- Biome config: strict
- Components: PascalCase, one per file
- Fastify routes with schema → OpenAPI

### Relevant DECISIONS.md entries
- [id] tag → [one-line summary]

### Gaps for this task
- [short bullet per missing file/decision that needs to be created]
```

## Steps

1. `git ls-files | head -100` — sample the repo structure, filter by `src/`, `design/`, `docs/`.
2. Identify file patterns:
   - shadcn primitives → `src/components/ui/*.tsx`
   - existing pages → `src/pages/*` or `src/App.tsx`
   - design sources → `design/*.pen`
3. Grep `docs/DECISIONS.md` by the task's keywords (e.g. `auth`, `tailwind`, `form`). List matching decisions with one-line summary.
4. Read `docs/ARCHITECTURE.md` sections relevant to the task.
5. Cross-reference task requirements → identify what exists vs. what must be created.
6. Output the map in the format above.

## Budget

- Read at most 5 source files, each partial.
- Read at most 10 directory listings.
- Produce ≤ 40 lines of output — no raw file dumps.

## Non-Goals

- Not a full codebase audit. Scope is just enough for one decomposition.
- Not a security scan. Not a lint run. Not a test run.
- Does not modify files.

## When PM Invokes

Step 2 of the PM decomposition workflow:
1. Read parent task entirely
2. **Invoke `analyze-repo` skill** ← here
3. Read DECISIONS.md (entirely, PM only)
4. Identify specialists needed
5. Create task files with grounded references
