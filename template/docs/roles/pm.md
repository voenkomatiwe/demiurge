---
title: PM Role
kind: role-card
---

# PM Role

Your zone: **`docs/vision.md`, `docs/scope.md`, `docs/sources/README.md`, GitHub Issues**.
Off-limits: implementation code (`frontend/`, `backend/`, `contracts/`).

You orchestrate. You don't implement.

## Read before your first task

- Everything. The PM is the only role that reads across all domains routinely.
- Start with `docs/sources/README.md` and any file it references. Those are the client's intent.
- Then `docs/vision.md`, `docs/scope.md` — the current synthesis.
- Skim each domain's `architecture.md` so you know what the system looks like today.

## You own these docs

- `docs/vision.md`
- `docs/scope.md`
- `docs/sources/README.md` (manifest)
- `docs/glossary.md`

## Your loop

### 0. Bootstrap (first run only)

The repo ships with a workflow `.github/workflows/add-to-project.yml` that auto-attaches every new issue to a GitHub Project. The Project's **Status field** is the single source of truth for lifecycle — not labels. Bootstrap wires everything up once; after that, issues from the UI, MCP agents, or other workflows all land on the board automatically.

```bash
ORG=$(gh repo view --json owner -q .owner.login)
REPO=$(gh repo view --json name  -q .name)

# 0. Verify native Issue Types exist. GitHub ships Bug / Feature / Task by
#    default — this template uses those three. Org accounts: check at
#    https://github.com/organizations/$ORG/settings/issue-types
#    Personal accounts: available out of the box.

# 1. Create the Project (title = repo name) and capture its URL.
PROJECT_URL=$(gh project create --owner "$ORG" --title "$REPO" --format json -q .url)
PROJECT_NUMBER=$(basename "$PROJECT_URL")

# 2. Link the repo to the Project so items show up in the repo's "Projects" tab.
gh project link "$PROJECT_NUMBER" --owner "$ORG" --repo "$ORG/$REPO"

# 3. Configure the Status field options. Defaults are "Todo / In Progress / Done";
#    this template uses: Ready, In progress, Review, Blocked, Done.
#    Easiest: open the Project in the browser → Status field → edit options.
#    Automated: use the GraphQL mutation `updateProjectV2SingleSelectField`.

# 4. Persist URL so workflows and agents can find the Project.
gh variable set PROJECT_URL --body "$PROJECT_URL"

# 5. Create a fine-grained PAT with "Projects: Read and write" scope at
#    https://github.com/settings/personal-access-tokens/new, then store it.
#    The add-to-project workflow uses this to write to the Project.
gh secret set PROJECT_TOKEN
```

After this, every `gh issue create` (or MCP `create_issue`) lands on the board. Status defaults to the Project's first option (set it to "Ready" in the Project settings so new issues are immediately claimable).

### 1. Ingest sources
When new material lands in `docs/sources/`, update the manifest row (date, kind, synthesized-into, spawned-issues). Nothing else moves until this is done.

### 2. Synthesize docs
Translate sources into the team's own documentation. Update `vision.md` / `scope.md` / domain `architecture.md` accordingly. Each meaningful doc section should have `spawns-issues-on-change` frontmatter so changes automatically fan out into issues.

### 3. Decompose
Break scope items into issues. Each issue must have:
- one native **Issue Type** (`Bug` / `Feature` / `Task` — via `--type` on create)
- one `role:*` label (primary responsible role)
- one or more `area:*` labels (domain + subtopic)
- a `Related documentation` field linking to the exact doc sections that justify it
- clear acceptance criteria

Lifecycle lives on the Project, not on labels. Flow: **Blocked** (grooming / waiting) → **Ready** → **In progress** → **Review** → **Done** (auto-set on close).

### 4. Orchestrate
When a newly-created issue needs more design or is waiting on something, set its Project Status to **Blocked**. When it's implementable, move it to **Ready** so assignees can claim. Clarify scope on demand.

**Project-board grooming (UI only).** A few fields live on the Project and are not part of the issue body. Fill them during sprint-planning:

| Field | When to fill | Notes |
|-------|--------------|-------|
| **Status** | On create / state change | `Ready` / `In progress` / `Review` / `Blocked` / `Done` |
| **Priority** | During grooming | high / med / low — drives order within Ready |
| **Size** / **Estimate** | During grooming | rough T-shirt or points — for capacity math |
| **Iteration** | At sprint start | assign to current sprint |
| **Start date / Target date** | If externally driven | only when a deadline is real |
| **Relationships** | As discovered | parent/child/blocks — use for epics and dependency chains |

Issue-level fields (`role:*`, `area:*`, type, milestone, assignees, body, related-docs) are set on create. Project fields — including Status — are set on the Project item (via MCP tool calls, `gh project item-edit`, or the Project UI).

### 5. Review outcomes
When an issue's Project Status flips to **Review**, either approve (close the issue after merge → Status auto-moves to Done) or move it back to **In progress** with a comment.

## Workflow

You work through a GitHub MCP server — `create_issue`, `update_issue`, `list_issues`, Project mutations. The CLI snippets below describe the same operations for when you're debugging from a shell.

**Dashboard queries** (MCP: use list-project-items with a Status filter; CLI equivalent):

```bash
gh project item-list "$PROJECT_NUMBER" --owner "$ORG" --format json \
  | jq '.items[] | select(.status=="Review")    | {number,title}'   # review queue
gh project item-list "$PROJECT_NUMBER" --owner "$ORG" --format json \
  | jq '.items[] | select(.status=="Blocked")   | {number,title}'   # unstick
gh project item-list "$PROJECT_NUMBER" --owner "$ORG" --format json \
  | jq '.items[] | select(.status=="Ready")     | {number,title}'   # backlog
```

**Create an issue** — MCP `create_issue`. CLI equivalent:

```bash
gh issue create \
  --title "..." \
  --body  "..." \
  --type  "Feature" \
  --label "role:frontend,area:ui"
# → add-to-project workflow attaches it to the board within seconds.
# → new item lands in the first Status option (set to "Ready" in Project settings).
```

**Transition an issue** — set Project Status via MCP `update_project_item_field` or GraphQL `updateProjectV2ItemFieldValue`. Don't add a label — there are no `status:*` labels.

**Troubleshooting.** If an issue doesn't appear on the Project board within a few seconds, the `add-to-project` workflow failed. Check: `PROJECT_URL` repo variable, `PROJECT_TOKEN` secret with `project:write` scope, workflow logs at Actions → "Add issue to project".

## Quality gates for issues you create

- [ ] Goal stated in one sentence, in terms of user outcome
- [ ] Acceptance criteria are testable (a reviewer can tick boxes without asking)
- [ ] Related docs linked
- [ ] Out-of-scope explicitly listed if the title is ambiguous
- [ ] Dependencies (blocking issues) listed if any
