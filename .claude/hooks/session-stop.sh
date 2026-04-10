#!/bin/bash
# SessionStop hook — record a session summary line into the active task file.
# Non-blocking: always exits 0.
#
# The Claude Code harness passes session metadata via stdin JSON; we only use
# .session_id and .transcript_path if present. Token and cost accounting is
# recorded externally by `ccusage` or `/cost` — here we just drop a timestamp
# in the task's Session Log so the PM can correlate agent sessions to tasks.

set -euo pipefail

INPUT=$(cat 2>/dev/null || true)
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
TASKS_DIR="$PROJECT_DIR/docs/tasks"
[ -d "$TASKS_DIR" ] || exit 0

SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty' 2>/dev/null || true)
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // empty' 2>/dev/null || true)
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Find the most recently modified in-progress task
ACTIVE_FILE=$(grep -lE '^\*\*Status\*\*:[[:space:]]*in-progress' "$TASKS_DIR"/TASK-*-*.md 2>/dev/null \
  | xargs -I{} ls -t {} 2>/dev/null | head -1 || true)
[ -z "$ACTIVE_FILE" ] && exit 0
[ -f "$ACTIVE_FILE" ] || exit 0

# If the file has a "## Session Log" section, append a line; otherwise add one.
if grep -q '^## Session Log' "$ACTIVE_FILE"; then
  # Append just below the heading (simple sed: after the line matching "## Session Log")
  tmp=$(mktemp)
  awk -v ts="$TS" -v sid="$SESSION_ID" '
    {print}
    /^## Session Log/ && !printed {
      print "- " ts " — session " (sid ? sid : "local") " (cost via /cost or ccusage)"
      printed=1
    }
  ' "$ACTIVE_FILE" > "$tmp" && mv "$tmp" "$ACTIVE_FILE"
else
  {
    echo ""
    echo "## Session Log"
    echo "- $TS — session ${SESSION_ID:-local} (cost via /cost or ccusage)"
  } >> "$ACTIVE_FILE"
fi

# --- Instinct extraction ----------------------------------------------------
#
# Detect the agent role from the task filename. Convention:
#   TASK-<id>-<role>.md → role is the trailing segment
#   TASK-<id>.md        → role is "pm" (parent task)
# Unknown filenames are silently skipped so the hook never blocks.

TASK_BASENAME=$(basename "$ACTIVE_FILE" .md)
INSTINCT_ROLE=""
case "$TASK_BASENAME" in
  *-frontend) INSTINCT_ROLE="frontend" ;;
  *-backend)  INSTINCT_ROLE="backend"  ;;
  *-designer) INSTINCT_ROLE="designer" ;;
  *-reviewer) INSTINCT_ROLE="reviewer" ;;
  *-pm)       INSTINCT_ROLE="pm"       ;;
  TASK-*)     INSTINCT_ROLE="pm"       ;; # bare parent task is PM's domain
esac

if [ -n "$INSTINCT_ROLE" ] && [ -x "$PROJECT_DIR/.claude/hooks/extract-instincts.sh" ]; then
  bash "$PROJECT_DIR/.claude/hooks/extract-instincts.sh" \
    "$INSTINCT_ROLE" "$ACTIVE_FILE" "$TRANSCRIPT" >/dev/null 2>&1 || true
fi

exit 0
