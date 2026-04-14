#!/bin/bash
# SessionStop hook — simplified for CLI-based workflow.
# Non-blocking: always exits 0.
#
# Session logging is now handled by the executor (it writes to the
# agent_sessions table automatically). This hook only runs instinct
# extraction if there is an active in-progress task with a known role.

set -euo pipefail

INPUT=$(cat 2>/dev/null || true)
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

SESSION_ID=$(echo "$INPUT" | grep -o '"session_id":"[^"]*"' 2>/dev/null | head -1 | sed 's/"session_id":"//;s/"//' || true)
TRANSCRIPT=$(echo "$INPUT" | grep -o '"transcript_path":"[^"]*"' 2>/dev/null | head -1 | sed 's/"transcript_path":"//;s/"//' || true)

# --- resolve demiurge CLI -----------------------------------------------------
DMG=""
if command -v demiurge >/dev/null 2>&1; then
  DMG="demiurge"
elif [ -f "$PROJECT_DIR/cli/src/index.ts" ] && command -v bun >/dev/null 2>&1; then
  DMG="bun run --bun $PROJECT_DIR/cli/src/index.ts"
fi

# If CLI or DB is not available, skip to instinct extraction fallback.
DB_EXISTS=0
[ -f "$PROJECT_DIR/.demiurge/data.db" ] && DB_EXISTS=1

if [ -z "$DMG" ] || [ "$DB_EXISTS" -eq 0 ]; then
  exit 0
fi

# --- find the active in-progress task and its role ----------------------------

ACTIVE_LINE=$($DMG task list --status in-progress 2>/dev/null | head -1 || true)
if [ -z "$ACTIVE_LINE" ] || [ "$ACTIVE_LINE" = "No tasks found." ]; then
  exit 0
fi

# Tab-separated: ID  STATUS  ASSIGNED  TITLE
ACTIVE_TASK_ID=$(echo "$ACTIVE_LINE" | cut -f1)
INSTINCT_ROLE=$(echo "$ACTIVE_LINE" | cut -f3)

# Normalize: if assigned_to is "-" or empty, try to infer from task ID suffix
if [ -z "$INSTINCT_ROLE" ] || [ "$INSTINCT_ROLE" = "-" ]; then
  case "$ACTIVE_TASK_ID" in
    *-frontend) INSTINCT_ROLE="frontend" ;;
    *-backend)  INSTINCT_ROLE="backend"  ;;
    *-designer) INSTINCT_ROLE="designer" ;;
    *-reviewer) INSTINCT_ROLE="reviewer" ;;
    *-pm)       INSTINCT_ROLE="pm"       ;;
    TASK-*)     INSTINCT_ROLE="pm"       ;;
  esac
fi

# --- instinct extraction ------------------------------------------------------
#
# The extract-instincts.sh script currently reads heuristics from markdown task
# files. It will need its own migration eventually, but for now we call it if
# it exists. It reads the task file which no longer exists in the new workflow,
# so we skip it if there's no matching file. The instinct system is best-effort.

EXTRACT_SCRIPT="$PROJECT_DIR/.claude/hooks/extract-instincts.sh"
if [ -n "$INSTINCT_ROLE" ] && [ -x "$EXTRACT_SCRIPT" ]; then
  # The extract script expects: <role> <task_file> [transcript_path]
  # In the new workflow, there is no task markdown file. Pass a placeholder
  # so the script's transcript-based heuristics (parallel-task-dispatch) can
  # still fire. File-based heuristics will safely no-op on missing files.
  PLACEHOLDER_FILE="/dev/null"
  bash "$EXTRACT_SCRIPT" "$INSTINCT_ROLE" "$PLACEHOLDER_FILE" "$TRANSCRIPT" >/dev/null 2>&1 || true
fi

exit 0
