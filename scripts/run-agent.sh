#!/bin/bash
# run-agent.sh — convenience wrapper around `claude` that pins a task as ACTIVE
# so the scope-check hook can enforce Files-to-Touch discipline.
#
# Usage:
#   scripts/run-agent.sh <role> <task-id>
#   scripts/run-agent.sh frontend TASK-001-frontend
#   scripts/run-agent.sh pm       TASK-001
#
# What it does:
#   1. Verifies the task file exists
#   2. Exports ACTIVE_TASK=<task-id> so hooks know which task is in play
#   3. Launches `claude` with a canned prompt asking the specified agent to work on the task
#   4. Prints a cost reminder on exit (use `/cost` in-session or `ccusage` after)

set -euo pipefail

if [ $# -lt 2 ]; then
  cat <<USAGE >&2
Usage: $0 <role> <task-id>

Examples:
  $0 pm       TASK-001
  $0 designer TASK-001-designer
  $0 frontend TASK-001-frontend
  $0 backend  TASK-001-backend
  $0 reviewer TASK-001-frontend
USAGE
  exit 2
fi

ROLE="$1"
TASK_ID="$2"

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TASK_FILE="$PROJECT_DIR/docs/tasks/${TASK_ID}.md"

if [ ! -f "$TASK_FILE" ]; then
  echo "Error: task file not found: $TASK_FILE" >&2
  exit 1
fi

case "$ROLE" in
  pm|designer|frontend|backend|reviewer) ;;
  *)
    echo "Error: unknown role '$ROLE'. Valid: pm, designer, frontend, backend, reviewer" >&2
    exit 2
    ;;
esac

export ACTIVE_TASK="$TASK_ID"

echo "→ Active task: $TASK_ID"
echo "→ Agent:       $ROLE"
echo "→ Task file:   docs/tasks/${TASK_ID}.md"
echo ""
echo "Launching claude. Use '/cost' in-session to see token usage."
echo ""

cd "$PROJECT_DIR"
claude "use the $ROLE agent to work on docs/tasks/${TASK_ID}.md"

echo ""
echo "Session ended."
echo "  • Run '/cost' inside claude for this session's cost, or"
echo "  • Run 'ccusage' outside for cumulative project usage."
