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
echo "**Stack**: Bun workspaces monorepo — \`frontend/\` (React + Vite + TS + Tailwind v4 + shadcn/ui), \`backend/\` (Fastify + OpenAPI + Better Auth); Biome for lint/format (root \`biome.json\`). See CLAUDE.md for the filled-in project stack."
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

# Instincts — if there's exactly one in-progress task, show its role's
# high-confidence learned patterns (≥ 0.5). Keeps the output short and
# role-relevant; skips silently when no active role is discoverable.
INSTINCTS_ROOT="$PROJECT_DIR/.claude/instincts"
if [ -d "$INSTINCTS_ROOT" ] && [ -d "$TASKS_DIR" ]; then
  active_task=$(grep -lE '^\*\*Status\*\*:[[:space:]]*in-progress' "$TASKS_DIR"/TASK-*.md 2>/dev/null \
    | xargs -I{} ls -t {} 2>/dev/null | head -1 || true)
  if [ -n "$active_task" ] && [ -f "$active_task" ]; then
    active_base=$(basename "$active_task" .md)
    active_role=""
    case "$active_base" in
      *-frontend) active_role="frontend" ;;
      *-backend)  active_role="backend"  ;;
      *-designer) active_role="designer" ;;
      *-reviewer) active_role="reviewer" ;;
      *-pm)       active_role="pm"       ;;
      TASK-*)     active_role="pm"       ;;
    esac
    role_dir="$INSTINCTS_ROOT/$active_role"
    if [ -n "$active_role" ] && [ -d "$role_dir" ]; then
      shopt -s nullglob
      first=1
      for inst_file in "$role_dir"/*.yml; do
        [ -f "$inst_file" ] || continue
        conf=$(grep -m1 '^confidence:' "$inst_file" 2>/dev/null | awk '{print $2}')
        # Skip anything below 0.5 (not yet confident).
        awk -v c="${conf:-0}" 'BEGIN { exit !(c+0 >= 0.5) }' || continue
        if [ "$first" = "1" ]; then
          echo "### Instincts (role: $active_role, confidence ≥ 0.5)"
          first=0
        fi
        ptext=$(grep -m1 '^pattern:' "$inst_file" | sed -E 's/^pattern:[[:space:]]*"?//; s/"?[[:space:]]*$//')
        impl=$(grep -m1 '^implication:' "$inst_file" | sed -E 's/^implication:[[:space:]]*"?//; s/"?[[:space:]]*$//')
        obs=$(grep -m1 '^observations:' "$inst_file" | awk '{print $2}')
        printf -- "- **%s** (conf=%s, obs=%s)\n  %s\n  → %s\n" "$(basename "$inst_file" .yml)" "${conf:-?}" "${obs:-?}" "${ptext:-?}" "${impl:-?}"
      done
      shopt -u nullglob
      [ "$first" = "0" ] && echo ""
    fi
  fi
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
