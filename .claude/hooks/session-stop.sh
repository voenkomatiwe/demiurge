#!/bin/bash
# SessionStop hook — record a session summary line into the active task file.
# Non-blocking: always exits 0.
#
# The Claude Code harness passes session metadata via stdin JSON; we only use
# .session_id and .transcript_path if present. Token usage itself is recorded
# externally by `ccusage` or `/cost` — here we just drop a timestamp so the PM
# can correlate agent sessions to tasks later.

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

# If the file has a "## Token Usage" section, append a line; otherwise add one.
if grep -q '^## Token Usage' "$ACTIVE_FILE"; then
  # Append just below the heading (simple sed: after the line matching "## Token Usage")
  tmp=$(mktemp)
  awk -v ts="$TS" -v sid="$SESSION_ID" '
    {print}
    /^## Token Usage/ && !printed {
      print "- " ts " — session " (sid ? sid : "local") " (cost via /cost or ccusage)"
      printed=1
    }
  ' "$ACTIVE_FILE" > "$tmp" && mv "$tmp" "$ACTIVE_FILE"
else
  {
    echo ""
    echo "## Token Usage"
    echo "- $TS — session ${SESSION_ID:-local} (cost via /cost or ccusage)"
  } >> "$ACTIVE_FILE"
fi

exit 0
