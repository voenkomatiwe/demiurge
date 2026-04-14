#!/bin/bash
# SessionStart hook — loads project context summary for the agent
# Outputs: project one-liner, active tasks with status, memory bank, running agents.
# Runs on every session start so agents never lose orientation.
#
# Data source: demiurge CLI (SQLite-backed). Falls back gracefully if the CLI
# is unavailable or the project has not been initialized yet.

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# --- resolve demiurge CLI -----------------------------------------------------
DMG=""
if command -v demiurge >/dev/null 2>&1; then
  DMG="demiurge"
elif [ -f "$PROJECT_DIR/cli/src/index.ts" ] && command -v bun >/dev/null 2>&1; then
  DMG="bun run --bun $PROJECT_DIR/cli/src/index.ts"
fi

# If the DB does not exist, the project is not initialized — skip CLI queries.
DB_EXISTS=0
[ -f "$PROJECT_DIR/.demiurge/data.db" ] && DB_EXISTS=1

dmg() {
  # Wrapper: runs a demiurge CLI command, returns empty string on failure.
  if [ -z "$DMG" ] || [ "$DB_EXISTS" -eq 0 ]; then
    return 0
  fi
  $DMG "$@" 2>/dev/null || true
}

# --- project header -----------------------------------------------------------

PROJECT_NAME=""
if [ -f "$PROJECT_DIR/CLAUDE.md" ]; then
  PROJECT_NAME=$(grep -m1 '^# ' "$PROJECT_DIR/CLAUDE.md" 2>/dev/null | sed -E 's/^# //' | head -c 80)
fi
[ -z "$PROJECT_NAME" ] && PROJECT_NAME=$(basename "$PROJECT_DIR")

echo "## Demiurge — Session Context"
echo ""
echo "**Project**: $PROJECT_NAME"
echo "**Stack**: Bun workspaces monorepo — \`frontend/\` (React + Vite + TS + Tailwind v4 + shadcn/ui), \`backend/\` (Fastify + OpenAPI + Better Auth); Biome for lint/format (root \`biome.json\`). See CLAUDE.md for the filled-in project stack."
echo "**Docs**: CLAUDE.md, docs/ARCHITECTURE.md, docs/BRIEF.md"
echo ""

if [ -z "$DMG" ]; then
  echo "_demiurge CLI not found. Install with \`bun link\` or \`bun install -g demiurge\`._"
  echo ""
  exit 0
fi

if [ "$DB_EXISTS" -eq 0 ]; then
  echo "_Project not initialized. Run \`demiurge init\` to create the database._"
  echo ""
  exit 0
fi

# --- active tasks -------------------------------------------------------------

TASK_LIST=$(dmg task list)
if [ -n "$TASK_LIST" ] && [ "$TASK_LIST" != "No tasks found." ]; then
  echo "### Active tasks"
  # Output is tab-separated: ID  STATUS  ASSIGNED  TITLE
  while IFS=$'\t' read -r tid tstatus tassigned ttitle; do
    [ -z "$tid" ] && continue
    printf -- "- **%s** [%s] → %s — %s\n" "$tid" "$tstatus" "${tassigned:--}" "${ttitle:-$tid}"
  done <<< "$TASK_LIST"
  echo ""
else
  echo "_No tasks yet. Create one via \`demiurge task create --title \"...\"\`._"
  echo ""
fi

# --- blockers (revision or blocked) ------------------------------------------

BLOCKERS_REV=$(dmg task list --status revision)
BLOCKERS_BLK=$(dmg task list --status blocked)
BLOCKERS=""
[ -n "$BLOCKERS_REV" ] && [ "$BLOCKERS_REV" != "No tasks found." ] && BLOCKERS="$BLOCKERS_REV"
if [ -n "$BLOCKERS_BLK" ] && [ "$BLOCKERS_BLK" != "No tasks found." ]; then
  [ -n "$BLOCKERS" ] && BLOCKERS="$BLOCKERS"$'\n'"$BLOCKERS_BLK" || BLOCKERS="$BLOCKERS_BLK"
fi

if [ -n "$BLOCKERS" ]; then
  echo "### ⚠ Blockers"
  while IFS=$'\t' read -r tid tstatus _ _; do
    [ -z "$tid" ] && continue
    echo "- **$tid** → $tstatus"
  done <<< "$BLOCKERS"
  echo ""
fi

# --- running agents -----------------------------------------------------------

RUNNING=$(dmg agents sessions --status running)
if [ -n "$RUNNING" ]; then
  echo "### Running agents"
  while IFS=$'\t' read -r sid sstatus sagent stask; do
    [ -z "$sid" ] && continue
    echo "- **$sagent** on $stask (session $sid)"
  done <<< "$RUNNING"
  echo ""
fi

# --- memory bank snapshot -----------------------------------------------------

MEMORY=$(dmg memory get)
if [ -n "$MEMORY" ] && [ "$MEMORY" != "(empty)" ]; then
  echo "### Memory Bank snapshot"
  # First 30 lines is enough for current state
  echo "$MEMORY" | head -30
  echo ""
fi

# --- instincts (role-specific learned patterns) --------------------------------

INSTINCTS_ROOT="$PROJECT_DIR/.claude/instincts"
if [ -d "$INSTINCTS_ROOT" ]; then
  # Find the active in-progress task to determine the role
  ACTIVE_LINE=$(dmg task list --status in-progress | head -1)
  if [ -n "$ACTIVE_LINE" ] && [ "$ACTIVE_LINE" != "No tasks found." ]; then
    ACTIVE_ASSIGNED=$(echo "$ACTIVE_LINE" | cut -f3)
    active_role="${ACTIVE_ASSIGNED:--}"
    role_dir="$INSTINCTS_ROOT/$active_role"
    if [ "$active_role" != "-" ] && [ -d "$role_dir" ]; then
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

# --- footer -------------------------------------------------------------------

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
