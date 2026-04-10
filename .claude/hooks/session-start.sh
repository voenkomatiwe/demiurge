#!/bin/bash
# SessionStart hook — loads project context summary for the agent
# Outputs: project one-liner, active tasks with status, hot blockers
# Runs on every session start so agents never lose orientation.

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
TASKS_DIR="$PROJECT_DIR/docs/tasks"

# Read project name from the first heading of CLAUDE.md (fallback to dir name)
PROJECT_NAME=""
if [ -f "$PROJECT_DIR/CLAUDE.md" ]; then
  PROJECT_NAME=$(grep -m1 '^# ' "$PROJECT_DIR/CLAUDE.md" 2>/dev/null | sed -E 's/^# //' | head -c 80)
fi
[ -z "$PROJECT_NAME" ] && PROJECT_NAME=$(basename "$PROJECT_DIR")

echo "## Claude Orchestrator — Session Context"
echo ""
echo "**Project**: $PROJECT_NAME"
echo "**Stack**: Fastify + OpenAPI (backend); React + Vite + TS + Tailwind v4 + shadcn/ui (frontend); Better Auth; Pencil for design; Biome for lint/format. See CLAUDE.md for current project stack."
echo "**Docs**: CLAUDE.md, docs/ARCHITECTURE.md, docs/DECISIONS.md, docs/WORKFLOW.md, docs/MEMORY_BANK.md"
echo ""

if [ -d "$TASKS_DIR" ]; then
  echo "### Active tasks"
  shopt -s nullglob
  found_any=0
  for f in "$TASKS_DIR"/TASK-*.md; do
    [ -f "$f" ] || continue
    name=$(basename "$f" .md)
    # Skip templates (shouldn't match TASK-* anyway)
    [[ "$name" == _* ]] && continue
    # Read status from the file (looks for "**Status**:" line)
    status=$(grep -m1 -E '^\*\*Status\*\*:' "$f" 2>/dev/null | sed -E 's/^\*\*Status\*\*:[[:space:]]*//; s/\|.*//; s/[[:space:]]*$//' || echo "?")
    assigned=$(grep -m1 -E '^\*\*Assigned to\*\*:' "$f" 2>/dev/null | sed -E 's/^\*\*Assigned to\*\*:[[:space:]]*//' || echo "-")
    title=$(head -1 "$f" | sed -E 's/^# //')
    printf -- "- **%s** [%s] → %s — %s\n" "$name" "${status:-?}" "${assigned:--}" "${title:-$name}"
    found_any=1
  done
  if [ "$found_any" = "0" ]; then
    echo "_No tasks yet. Create one via \`cp docs/tasks/_TEMPLATE.md docs/tasks/TASK-XXX.md\`._"
  fi
  echo ""
fi

# Hot blockers: anything in `revision` or `blocked`
if [ -d "$TASKS_DIR" ]; then
  blockers=$(grep -lE '^\*\*Status\*\*:[[:space:]]*(revision|blocked)' "$TASKS_DIR"/TASK-*.md 2>/dev/null || true)
  if [ -n "$blockers" ]; then
    echo "### ⚠ Blockers"
    while IFS= read -r bf; do
      bname=$(basename "$bf" .md)
      bstatus=$(grep -m1 -E '^\*\*Status\*\*:' "$bf" | sed -E 's/^\*\*Status\*\*:[[:space:]]*//; s/\|.*//; s/[[:space:]]*$//')
      echo "- **$bname** → $bstatus"
    done <<< "$blockers"
    echo ""
  fi
fi

# Memory Bank (compaction recovery)
if [ -f "$PROJECT_DIR/docs/MEMORY_BANK.md" ]; then
  echo "### Memory Bank snapshot"
  # First 30 lines is enough for current state
  head -30 "$PROJECT_DIR/docs/MEMORY_BANK.md"
  echo ""
fi

echo "### Agents available"
echo "- **pm** (opus) — decompose, coordinate, review against criteria"
echo "- **reviewer** (opus) — code quality gate: build, lint, security, a11y"
echo "- **designer** (sonnet) — Pencil designs, UI specs"
echo "- **frontend** (sonnet) — React + TS + Tailwind v4 + shadcn/ui"
echo "- **backend** (sonnet) — Fastify API with OpenAPI + Better Auth"
echo ""
echo "### Slash commands"
echo "- \`/decompose TASK-XXX\` — PM decomposes into specialist tasks"
echo "- \`/review-task TASK-XXX-role\` — full review pipeline"
echo "- \`/task-status\` — dashboard with all task statuses"

exit 0
