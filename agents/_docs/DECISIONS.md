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

## Demiurge Template Provenance

> This section documents where the demiurge orchestrator template itself comes from.
> Projects installed via `npx demiurge` inherit this record; you can keep it for
> context or remove it if it isn't useful to your team.

```yaml
- id: 0
  date: 2026-04-10
  title: "Adopted demiurge orchestrator template"
  decision: "Installed the demiurge template (five-agent Claude Code orchestrator) as the project's coordination layer."
  reason: "Solves context loss between agents via self-contained task files, binary approval gates, hooks for scope + dependency enforcement, and declarative YAML workflows — without taking on any npm runtime dependency."
  tags: [orchestration, tooling, provenance]
  sources:
    - name: "msitarzewski/agency-agents"
      used_for: "Agent prompt structure (Identity → Rules → Workflow → Metrics → Personality); PM prompt base; reviewer severity markers."
    - name: "affaan-m/everything-claude-code"
      used_for: "Reviewer 5-step methodology; confidence ≥ 80% rule; planner plan-format."
    - name: "ruvnet/ruflo"
      used_for: "Concept only — dependency-blocking workflow engine, declarative YAML pipelines. Reimplemented in bash + YAML; no runtime dependency on ruflo."
  alternatives_considered: ["MetaGPT", "CrewAI", "ruflo as npm dep", "GitHub Agentic Workflows"]
  notes: "Full provenance of specific prompt and script adaptations lives in old-docs/REPOS_ANALYSIS.md at install time. Copy or remove per your project's needs."
```

## How to Add a New Decision

Decisions are now stored in SQLite and managed via CLI:

```bash
demiurge decision add          # add a new decision (interactive)
demiurge decision list         # list all decisions
demiurge decision list --tag frontend  # filter by tag
```

The YAML format above is retained as a reference for the data model. New decisions should be added via the CLI, not by editing this file.

### Fields

- `id` = auto-assigned integer (no gaps).
- `date` = ISO `YYYY-MM-DD`.
- `tags` = lowercase kebab-case, 3–6 tags. Reuse existing tags when possible; add a new tag only when no existing one fits.
- `alternatives_considered` = list what you rejected and implicitly why.
- If the decision reverses an earlier one, add a `supersedes: [id]` field and mark the old entry with `superseded_by: [new_id]`.

## How Agents Query

- **Specialists (frontend/backend/designer)**: `demiurge decision list --tag frontend` — pulls only decisions with a matching tag.
- **PM**: `demiurge decision list` — reads all decisions; cross-references in task context.
- **Reviewer**: queries by tag on demand from a task's review context.

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
