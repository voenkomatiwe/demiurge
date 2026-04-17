---
title: Web Decisions Index
kind: index
---

# Web Architectural Decisions

One file per decision. Filename format: `NNNN-<kebab-slug>.md` (zero-padded, sequential).

## Why ADRs?

- Each decision has a stable URL that can be linked from issues, PRs, and other docs.
- Git history tracks the decision's evolution (proposed → accepted → deprecated).
- New team members can read the history to understand _why_ the code looks the way it does.

## Lifecycle

```
proposed  →  accepted  →  deprecated
                       →  superseded-by: NNNN-...
```

Never edit the core of an accepted ADR. If the decision changes, write a **new** ADR that supersedes the old one, and set the old one's `status:` to `superseded` with a `superseded-by:` pointer.

## Index

| # | Title | Status | Date | Tags |
|---|-------|--------|------|------|
| 0001 | [Example decision](./0001-example.md) | proposed | 2026-01-01 | example |

<!--
Keep this table up to date. A tiny GitHub Action can regenerate it from frontmatter,
but for small projects a manual update on ADR addition is fine.
-->

## Writing a new ADR

1. Copy `0001-example.md` to `NNNN-<slug>.md` (next sequential number).
2. Fill in frontmatter and sections. Keep it short — aim for under 200 words of prose.
3. Open a PR with label `type:docs` and get one approval.
4. On merge, add a row to the index table above.
