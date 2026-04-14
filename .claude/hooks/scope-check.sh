#!/bin/bash
# PostToolUse scope-check hook
# After a specialist Edit/Writes a file, verify it falls within the active
# task's workspace directories. If not, emit a warning (exit 0, non-blocking)
# so the agent sees a scope-creep signal but work is not interrupted.
#
# Data source: demiurge CLI (workspace field from SQLite).
# Falls back gracefully if CLI or DB is unavailable.

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path":"[^"]*"' 2>/dev/null | head -1 | sed 's/"file_path":"//;s/"//' || true)

# Nothing to check
[ -z "$FILE_PATH" ] && exit 0

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Whitelist: project docs that agents are still allowed to write directly
case "$FILE_PATH" in
  *"docs/ARCHITECTURE.md"*|*"docs/BRIEF.md"*)
    exit 0
    ;;
esac

# --- resolve demiurge CLI -----------------------------------------------------
DMG=""
if command -v demiurge >/dev/null 2>&1; then
  DMG="demiurge"
elif [ -f "$PROJECT_DIR/cli/src/index.ts" ] && command -v bun >/dev/null 2>&1; then
  DMG="bun run --bun $PROJECT_DIR/cli/src/index.ts"
fi

# If CLI or DB is not available, skip scope checking entirely.
[ -z "$DMG" ] && exit 0
[ ! -f "$PROJECT_DIR/.demiurge/data.db" ] && exit 0

# --- find the active in-progress task ----------------------------------------

ACTIVE_LINE=""
if [ -n "${ACTIVE_TASK:-}" ]; then
  # Env override: check if this specific task exists and is in-progress
  ACTIVE_LINE=$($DMG task list --status in-progress 2>/dev/null | grep "^${ACTIVE_TASK}" | head -1 || true)
fi

if [ -z "$ACTIVE_LINE" ]; then
  # Pick the first in-progress task
  ACTIVE_LINE=$($DMG task list --status in-progress 2>/dev/null | head -1 || true)
fi

# No active task — nothing to enforce
[ -z "$ACTIVE_LINE" ] && exit 0
[ "$ACTIVE_LINE" = "No tasks found." ] && exit 0

ACTIVE_TASK_ID=$(echo "$ACTIVE_LINE" | cut -f1)

# --- get workspace from task JSON ---------------------------------------------

TASK_JSON=$($DMG task get "$ACTIVE_TASK_ID" 2>/dev/null || true)
[ -z "$TASK_JSON" ] && exit 0

# Extract the workspace array from JSON. The workspace field is a JSON array of
# directory strings like ["frontend/src", "backend/src"]. We parse it with sed/grep.
# Example JSON: "workspace": ["frontend/src", "backend/src/routes"]
WORKSPACE_RAW=$(echo "$TASK_JSON" | grep '"workspace"' || true)

# No workspace field or null — skip scope checking (no constraint defined)
[ -z "$WORKSPACE_RAW" ] && exit 0
echo "$WORKSPACE_RAW" | grep -q 'null' && exit 0

# Extract directory entries from the JSON array
# Handles: "workspace": ["frontend/src", "backend/src"]
WORKSPACE_DIRS=$(echo "$TASK_JSON" | sed -n '/"workspace"/,/]/p' | grep '"' | sed 's/.*"\([^"]*\)".*/\1/' | grep -v '^workspace$' || true)

# No workspace dirs extracted — skip
[ -z "$WORKSPACE_DIRS" ] && exit 0

# Normalize the edited file to a path relative to project root
REL_PATH="${FILE_PATH#$PROJECT_DIR/}"

# Check if the relative path starts with any of the workspace directories
while IFS= read -r ws_dir; do
  [ -z "$ws_dir" ] && continue
  # Strip trailing slash for consistent prefix matching
  ws_dir="${ws_dir%/}"
  case "$REL_PATH" in
    "$ws_dir"/*|"$ws_dir")
      # In scope — silent OK
      exit 0
      ;;
  esac
done <<< "$WORKSPACE_DIRS"

# Out of scope — warn but do not block
echo "⚠ scope-check: '$REL_PATH' is outside the workspace for $ACTIVE_TASK_ID." >&2
echo "   Allowed workspace directories:" >&2
while IFS= read -r ws_dir; do
  [ -z "$ws_dir" ] && continue
  echo "     - $ws_dir" >&2
done <<< "$WORKSPACE_DIRS"
echo "   If this edit is legitimate, update the task's workspace field." >&2
echo "   If this is scope creep, revert and ask the PM to amend the task." >&2
exit 0
