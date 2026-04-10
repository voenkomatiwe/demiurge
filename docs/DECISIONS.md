# Decisions Log

Structured log of architectural and product decisions.
Format: YAML. Agents: search by `tags` and keywords — only PM reads the file whole.

```yaml
# Example entry — replace with your own, or delete this block.
- id: 1
  date: 2026-01-01
  title: "Example: chose X over Y"
  decision: "We use X for [purpose]."
  reason: "Short justification tied to a real constraint (performance, cost, team skill, compliance, etc.)."
  tags: [example, stack]
  alternatives_considered: ["Y", "Z"]
```

## How to Add a New Decision

1. Append a new entry to the YAML block above.
2. `id` = next integer (no gaps).
3. `date` = ISO `YYYY-MM-DD`.
4. `tags` = lowercase kebab-case, 3–6 tags. Reuse existing tags when possible; add a new tag only when no existing one fits.
5. `alternatives_considered` = list what you rejected and implicitly why.
6. If the decision reverses an earlier one, add a `supersedes: [id]` field and mark the old entry with `superseded_by: [new_id]`.

## How Agents Query

- **Specialists (frontend/backend/designer)**: `grep -A6 "tags:.*frontend" docs/DECISIONS.md` — pulls only decisions with a matching tag.
- **PM**: reads the whole file; cross-references decisions in task file "Why" sections.
- **Reviewer**: reads only by tag + only on demand from a task's Review section.

## Tag Taxonomy (starter)

| Tag | Scope |
|-----|-------|
| `frontend` | Client-side code, components, styles |
| `backend` | API server, integrations |
| `design` | UI/UX, design tokens, design-system |
| `stack` | Core framework/library choices |
| `tooling` | Dev experience: lint, format, build |
| `orchestration` | AI agent coordination |
| `infrastructure` | Hosting, deploy, CI/CD |
| `auth` | Authentication, sessions |
| `data` | Database, storage, migrations |
| `mvp` | MVP-scope decisions |

Add or remove tags as your project grows. Keep the list short and focused.
