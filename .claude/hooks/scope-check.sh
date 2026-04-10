#!/bin/bash
# PostToolUse scope-check hook
# After a specialist Edit/Writes a file, verify it is listed in the active
# task file's "Files to Touch" section. If not, emit a warning (exit 0, non-blocking)
# so the agent sees a scope-creep signal but work is not interrupted.
#
# How it finds the active task:
#  1. Honors env $ACTIVE_TASK if set (e.g. TASK-001-frontend)
#  2. Else picks the most recently modified task file with status `in-progress`
#  3. If none found — exits silently (no active task scope to enforce)

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)

# Nothing to check
[ -z "$FILE_PATH" ] && exit 0

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
TASKS_DIR="$PROJECT_DIR/docs/tasks"
[ -d "$TASKS_DIR" ] || exit 0

# Skip task files themselves and project docs — writing those is always allowed
case "$FILE_PATH" in
  *"docs/tasks/"*|*"docs/MEMORY_BANK.md"*|*"docs/DECISIONS.md"*|*"docs/ARCHITECTURE.md"*|*"docs/WORKFLOW.md"*)
    exit 0
    ;;
esac

# Pick active task
ACTIVE_FILE=""
if [ -n "${ACTIVE_TASK:-}" ] && [ -f "$TASKS_DIR/${ACTIVE_TASK}.md" ]; then
  ACTIVE_FILE="$TASKS_DIR/${ACTIVE_TASK}.md"
else
  # Most recently modified TASK-*-role.md with in-progress status
  ACTIVE_FILE=$(grep -lE '^\*\*Status\*\*:[[:space:]]*in-progress' "$TASKS_DIR"/TASK-*-*.md 2>/dev/null \
    | xargs -I{} ls -t {} 2>/dev/null | head -1 || true)
fi

# No active task → nothing to enforce
[ -z "$ACTIVE_FILE" ] && exit 0
[ -f "$ACTIVE_FILE" ] || exit 0

# Extract lines from "## Files to Touch" until next "## " heading
FILES_LIST=$(awk '
  /^## Files to Touch/ {capture=1; next}
  capture && /^## / {capture=0}
  capture {print}
' "$ACTIVE_FILE")

# No "Files to Touch" section → skip
[ -z "$FILES_LIST" ] && exit 0

# Normalize the edited file to a path relative to project root
REL_PATH="${FILE_PATH#$PROJECT_DIR/}"

# Check if the relative path (or its basename) appears in the allowed list
BASENAME=$(basename "$FILE_PATH")
if echo "$FILES_LIST" | grep -qF "$REL_PATH" || echo "$FILES_LIST" | grep -qF "$BASENAME"; then
  # In scope — silent OK
  exit 0
fi

# Out of scope — warn but do not block
ACTIVE_NAME=$(basename "$ACTIVE_FILE" .md)
echo "⚠ scope-check: '$REL_PATH' is NOT listed in $ACTIVE_NAME → 'Files to Touch'." >&2
echo "   If this edit is legitimate, update the task file's Files to Touch section." >&2
echo "   If this is scope creep, revert and ask the PM to amend the task." >&2
exit 0
