#!/bin/bash
# check-deps.sh — validate task dependencies
#
# Usage:
#   check-deps.sh TASK-ID              Check one task; exit 1 if blocked
#   check-deps.sh --block TASK-ID      Check + set status=blocked on failure
#   check-deps.sh --unblock-all        Scan blocked tasks; unblock where deps met
#   check-deps.sh --all                Report dependency status for every task
#   check-deps.sh --help               Show usage
#
# Task-file contract (see docs/tasks/_TEMPLATE-SPEC.md):
#   **Status**: <one of: new blocked in-progress review revision approved done cancelled>
#   **Dependencies**: <comma-separated list of TASK-IDs, or "none">
#
# A dependency is satisfied when its parent task's status is `done` or `approved`.
# Anything else means the dependent task should be `blocked`.
#
# Designed to be called from:
#   - PM agent (before dispatching specialists)
#   - SessionStart hook (auto-unblock pass)
#   - CLI by the Owner

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
TASKS_DIR="$PROJECT_DIR/docs/tasks"
SATISFIED_STATUSES=("done" "approved")

if [ ! -d "$TASKS_DIR" ]; then
  # Graceful exit — docs/tasks/ may not exist yet (no tasks created).
  echo "check-deps: no docs/tasks/ directory — skipping." >&2
  exit 0
fi

# --- helpers -----------------------------------------------------------------

get_status() {
  local task_id="$1"
  local file="$TASKS_DIR/$task_id.md"
  if [ ! -f "$file" ]; then
    echo "missing"
    return
  fi
  local line
  line=$(grep -m1 '^\*\*Status\*\*:' "$file" 2>/dev/null || echo "")
  if [ -z "$line" ]; then
    echo "unknown"
    return
  fi
  # Strip markdown prefix, take the first token (handles "new | blocked | ..." template form).
  echo "$line" | sed -E 's/^\*\*Status\*\*:[[:space:]]*//' | awk '{print $1}'
}

get_dependencies() {
  local task_id="$1"
  local file="$TASKS_DIR/$task_id.md"
  if [ ! -f "$file" ]; then
    return
  fi
  local line
  line=$(grep -m1 '^\*\*Dependencies\*\*:' "$file" 2>/dev/null || echo "")
  # Grab every TASK-xxx identifier on that line.
  echo "$line" | grep -oE 'TASK-[A-Za-z0-9_-]+' || true
}

is_satisfied() {
  local status="$1"
  for s in "${SATISFIED_STATUSES[@]}"; do
    if [ "$status" = "$s" ]; then
      return 0
    fi
  done
  return 1
}

set_status() {
  local task_id="$1"
  local new_status="$2"
  local file="$TASKS_DIR/$task_id.md"
  # Portable sed -i (macOS + Linux) via .bak temp.
  sed -i.bak -E "s/^(\\*\\*Status\\*\\*:).*/\\1 $new_status/" "$file"
  rm -f "$file.bak"
}

# --- core check --------------------------------------------------------------

check_one() {
  local task_id="$1"
  local file="$TASKS_DIR/$task_id.md"
  if [ ! -f "$file" ]; then
    echo "✗ $task_id: task file not found ($file)"
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
    set_status "$task_id" "blocked"
    echo "  → status set to blocked"
  fi
  return 1
}

cmd_unblock_all() {
  local changed=0
  # Enable nullglob behavior via a guarded loop so an empty dir is silent.
  shopt -s nullglob
  for file in "$TASKS_DIR"/TASK-*.md; do
    [ -f "$file" ] || continue
    local task_id
    task_id=$(basename "$file" .md)
    local status
    status=$(get_status "$task_id")
    if [ "$status" != "blocked" ]; then
      continue
    fi
    if check_one "$task_id" >/dev/null 2>&1; then
      set_status "$task_id" "new"
      echo "  unblocked: $task_id"
      changed=$((changed + 1))
    fi
  done
  shopt -u nullglob
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
  shopt -s nullglob
  for file in "$TASKS_DIR"/TASK-*.md; do
    [ -f "$file" ] || continue
    # Skip templates.
    case "$(basename "$file")" in
      _TEMPLATE*) continue ;;
    esac
    local task_id
    task_id=$(basename "$file" .md)
    total=$((total + 1))
    if check_one "$task_id"; then
      ready=$((ready + 1))
    else
      blocked=$((blocked + 1))
    fi
  done
  shopt -u nullglob
  echo ""
  echo "Summary: $total task(s), $ready ready, $blocked blocked"
}

usage() {
  cat <<'EOF'
check-deps.sh — validate task dependencies

Usage:
  check-deps.sh TASK-ID              Check one task; exit 1 if blocked
  check-deps.sh --block TASK-ID      Check + set status=blocked on failure
  check-deps.sh --unblock-all        Scan blocked tasks; unblock where deps met
  check-deps.sh --all                Report dependency status for every task
  check-deps.sh --help               Show this help

A dependency is satisfied when its parent task's status is "done" or "approved".
Anything else (new, in-progress, review, revision, blocked, cancelled) means
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
