#!/bin/bash
# check-deps.sh — validate task dependencies via demiurge CLI
#
# Usage:
#   check-deps.sh TASK-ID              Check one task; exit 1 if blocked
#   check-deps.sh --block TASK-ID      Check + set status=blocked on failure
#   check-deps.sh --unblock-all        Scan blocked tasks; unblock where deps met
#   check-deps.sh --all                Report dependency status for every task
#   check-deps.sh --help               Show usage
#
# Data source: demiurge CLI (SQLite-backed). Falls back gracefully if the CLI
# is unavailable or the project has not been initialized yet.
#
# A dependency is satisfied when its status is `done` or `approved`.
# Anything else means the dependent task should be `blocked`.

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
SATISFIED_STATUSES="done approved"

# --- resolve demiurge CLI -----------------------------------------------------
DMG=""
if command -v demiurge >/dev/null 2>&1; then
  DMG="demiurge"
elif [ -f "$PROJECT_DIR/cli/src/index.ts" ] && command -v bun >/dev/null 2>&1; then
  DMG="bun run --bun $PROJECT_DIR/cli/src/index.ts"
fi

if [ -z "$DMG" ]; then
  echo "check-deps: demiurge CLI not found — skipping." >&2
  exit 0
fi

if [ ! -f "$PROJECT_DIR/.demiurge/data.db" ]; then
  echo "check-deps: no .demiurge/data.db — skipping." >&2
  exit 0
fi

dmg() {
  $DMG "$@" 2>/dev/null || true
}

# --- helpers -----------------------------------------------------------------

get_status() {
  local task_id="$1"
  local json
  json=$(dmg task get "$task_id")
  if [ -z "$json" ]; then
    echo "missing"
    return
  fi
  # Extract status from JSON: "status": "in-progress"
  local status
  status=$(echo "$json" | grep '"status"' | head -1 | sed 's/.*"status"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
  echo "${status:-unknown}"
}

get_dependencies() {
  local task_id="$1"
  local json
  json=$(dmg task get "$task_id")
  if [ -z "$json" ]; then
    return
  fi
  # Extract dependencies array from JSON. Format: "dependencies": ["TASK-001", "TASK-002"]
  # or "dependencies": null
  echo "$json" | grep -q '"dependencies".*null' && return
  # Extract TASK-IDs from the dependencies field
  echo "$json" | sed -n '/"dependencies"/,/]/p' | grep -oE 'TASK-[A-Za-z0-9_-]+' || true
}

is_satisfied() {
  local status="$1"
  for s in $SATISFIED_STATUSES; do
    if [ "$status" = "$s" ]; then
      return 0
    fi
  done
  return 1
}

# --- core check --------------------------------------------------------------

check_one() {
  local task_id="$1"
  local task_json
  task_json=$(dmg task get "$task_id")
  if [ -z "$task_json" ]; then
    echo "✗ $task_id: task not found"
    return 2
  fi

  local deps
  deps=$(get_dependencies "$task_id")
  if [ -z "$deps" ]; then
    echo "✓ $task_id: no dependencies"
    return 0
  fi

  local blockers=()
  while IFS= read -r dep; do
    [ -z "$dep" ] && continue
    [ "$dep" = "$task_id" ] && continue
    local dep_status
    dep_status=$(get_status "$dep")
    if ! is_satisfied "$dep_status"; then
      blockers+=("$dep (status: $dep_status)")
    fi
  done <<< "$deps"

  if [ ${#blockers[@]} -eq 0 ]; then
    echo "✓ $task_id: all dependencies satisfied"
    return 0
  fi

  echo "✗ $task_id: blocked by:"
  for b in "${blockers[@]}"; do
    echo "    - $b"
  done
  return 1
}

# --- commands ----------------------------------------------------------------

cmd_check() {
  local task_id="$1"
  if check_one "$task_id"; then
    return 0
  fi
  return 1
}

cmd_block() {
  local task_id="$1"
  if check_one "$task_id"; then
    return 0
  fi
  local current
  current=$(get_status "$task_id")
  if [ "$current" != "blocked" ]; then
    dmg task update "$task_id" --status blocked
    echo "  → status set to blocked"
  fi
  return 1
}

cmd_unblock_all() {
  local changed=0

  # Get all blocked tasks from the CLI
  local blocked_list
  blocked_list=$(dmg task list --status blocked)
  if [ -z "$blocked_list" ] || [ "$blocked_list" = "No tasks found." ]; then
    echo "check-deps: nothing to unblock."
    return
  fi

  while IFS=$'\t' read -r tid _ _ _; do
    [ -z "$tid" ] && continue
    if check_one "$tid" >/dev/null 2>&1; then
      dmg task update "$tid" --status new
      echo "  unblocked: $tid"
      changed=$((changed + 1))
    fi
  done <<< "$blocked_list"

  if [ "$changed" -eq 0 ]; then
    echo "check-deps: nothing to unblock."
  else
    echo "check-deps: unblocked $changed task(s)."
  fi
}

cmd_all() {
  local total=0
  local ready=0
  local blocked=0

  local all_tasks
  all_tasks=$(dmg task list)
  if [ -z "$all_tasks" ] || [ "$all_tasks" = "No tasks found." ]; then
    echo "No tasks found."
    return
  fi

  while IFS=$'\t' read -r tid _ _ _; do
    [ -z "$tid" ] && continue
    total=$((total + 1))
    if check_one "$tid"; then
      ready=$((ready + 1))
    else
      blocked=$((blocked + 1))
    fi
  done <<< "$all_tasks"

  echo ""
  echo "Summary: $total task(s), $ready ready, $blocked blocked"
}

usage() {
  cat <<'EOF'
check-deps.sh — validate task dependencies (demiurge CLI)

Usage:
  check-deps.sh TASK-ID              Check one task; exit 1 if blocked
  check-deps.sh --block TASK-ID      Check + set status=blocked on failure
  check-deps.sh --unblock-all        Scan blocked tasks; unblock where deps met
  check-deps.sh --all                Report dependency status for every task
  check-deps.sh --help               Show this help

A dependency is satisfied when its parent task's status is "done" or "approved".
Anything else (new, in-progress, review, revision, blocked) means
the dependent task is not ready yet.
EOF
}

main() {
  if [ $# -eq 0 ]; then
    usage
    exit 2
  fi

  case "$1" in
    --help|-h)
      usage
      exit 0
      ;;
    --block)
      if [ $# -lt 2 ]; then
        echo "error: --block requires a TASK-ID" >&2
        exit 2
      fi
      cmd_block "$2"
      ;;
    --unblock-all)
      cmd_unblock_all
      ;;
    --all)
      cmd_all
      ;;
    TASK-*)
      cmd_check "$1"
      ;;
    *)
      echo "error: unknown argument '$1'" >&2
      usage
      exit 2
      ;;
  esac
}

main "$@"
