---
title: Sources Manifest
kind: manifest
---

# Sources Manifest

Raw input materials provided before and during project work: client briefs, technical specs, wireframes, research, contracts, anything upstream of the team's own writing.

**Rules:**

- **Read-only for developers.** Never edit files in `docs/sources/`. Add new ones; if something needs correction, upload a new version (e.g. `brief-v2.pdf`) and mark the old one as superseded in the table below.
- **Every new upload adds a row here.** Commit the file and the manifest edit together.
- **The synthesized column is what makes changes traceable.** When a source changes, a GitHub Action reads this manifest plus `based-on:` frontmatter in synthesized docs to know which docs may need re-synthesis, and opens an issue for the PM.

## Files

| File | Uploaded | By | Kind | Synthesized into | Spawned issues | Notes |
|------|----------|----|------|------------------|----------------|-------|
| _(empty — add a row per file)_ | | | | | | |

<!--
Example row (delete once real entries exist):

| sources/brief.pdf | 2026-04-17 | @alice | client brief | docs/vision.md, docs/scope.md | #1, #2 | — |
| sources/wireframes/login.png | 2026-04-17 | @bob | wireframe | docs/apps/landing/architecture.md | #4 | — |
-->

## Layout conventions

```
sources/
├── README.md              ← this file
├── brief.pdf              ← top-level documents go flat
├── technical-spec.md
├── wireframes/            ← group by kind when there are several files
│   └── *.png
├── research/
│   └── *.md
└── legal/
    └── *.pdf
```

Prefer descriptive filenames over dates (`auth-flow-spec.md`, not `2026-04-17-spec.md`). Git tracks dates for you.
