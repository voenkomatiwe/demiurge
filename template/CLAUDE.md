# {{PROJECT_NAME}} — Agent Guide

{{PROJECT_DESCRIPTION}}

Read `docs/vision.md` for the full product context.

---

## Navigation

Don't read the whole docs tree. Use this table — pick one row, read one file, go.

| I need to... | Read this |
|--------------|-----------|
| Understand the product and goals | `docs/vision.md` |
| See what's in / out of MVP | `docs/scope.md` |
| See the original client brief or spec | `docs/sources/README.md` (manifest), then the file it points to |
| Understand system architecture (web) | `docs/web/architecture.md` |
| Understand on-chain architecture | `docs/contracts/architecture.md` |
| Look up the tech stack + versions | `docs/<domain>/stack.md` |
| Find an API contract | `docs/web/api.md` |
| Find a contract interface or event | `docs/contracts/interfaces.md` |
| Understand the data model | `docs/web/data-model.md` |
| Find an architectural decision | `grep -rli "<keyword>" docs/*/decisions/` |
| Find the design system (tokens, global rules) | `docs/design/system.md` |
| Find a page-specific design override | `docs/design/pages/<route>.md` |
| Frontend code-style reference (patterns, naming, testing) | `docs/web/references/frontend-code-style.md` |
| Backend code-style reference (plugins, handlers, services) | `docs/web/references/backend-code-style.md` |
| Designer code-style reference (spec structure, handoff) | `docs/design/references/designer-code-style.md` |
| Learn the project glossary | `docs/glossary.md` |
| Onboard to a role | `docs/roles/<role>.md` |
| Find my tasks | Project board, filter: `role:<role>` AND Status = Ready |
| Find all tasks on a topic | `gh issue list --label "area:<topic>" --state all` |
| See what's in review | Project board, filter: Status = Review |
| See what's blocked | Project board, filter: Status = Blocked |
| Look at past session context | `.claude/memory.md` |

---

## Workflow in one screen

Lifecycle lives on the **GitHub Project Status field**, not on labels. Preferred path: MCP tools (`list_project_items`, `update_issue`, `update_project_item_field`). CLI fallbacks shown below.

```bash
# 1. Pick a task — role:<role> AND Project Status = Ready
gh project item-list "$PROJECT_NUMBER" --owner "$ORG" --format json \
  | jq '.items[] | select(.status=="Ready" and (.labels|index("role:<role>")))'

# 2. Claim — assign to self, flip Project Status to "In progress"
gh issue edit <n> --add-assignee @me
# → MCP update_project_item_field to set Status = "In progress"

# 3. Read the referenced docs (every issue must link docs under "Related documentation")
#    Read only the linked docs, not the whole tree.

# 4. Work. Touch code only in your role's workspace (see your role card).

# 5. Submit
gh pr create --fill
# → MCP update_project_item_field to set Status = "Review"
```

---

## Project conventions

- **Package manager**: bun (`bun install`, `bun run <script>`)
- **Lint / format**: Biome (`bun run lint` to check, `bun run format` to apply)
- **TypeScript**: strict mode everywhere
- **Code & comments**: English only
- **Commits**: conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`)
- **PRs**: must reference an issue with `Closes #<n>`
- **Docs changes**: edit the `.md` file in its proper domain; never duplicate content between files

---

## Rules for AI agents

1. **Before your first tool call on a task**: read `docs/roles/<your-role>.md`. It tells you which files are your workspace and which are off-limits.
2. **Never edit `docs/sources/`** — those are read-only input materials.
3. **Record decisions** as ADRs in `docs/<domain>/decisions/NNNN-<slug>.md`. Include frontmatter (`id`, `status`, `date`, `tags`, `related-issues`).
4. **When you modify a synthesized doc**, check its frontmatter for `spawns-issues-on-change` — a GitHub Action will pick up the diff and create follow-up issues if the listed sections changed.
5. **Stay in scope**: your issue has labels like `role:<x>` and `area:<y>`. Don't expand beyond the files those labels imply without opening a new issue.
6. **When blocked**, set the Project Status to `Blocked` and comment on the issue with what's needed.
