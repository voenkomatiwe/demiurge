#!/bin/bash
# extract-instincts.sh — extract behavioral patterns from a finished session
#
# Usage:
#   extract-instincts.sh <role> <task_file> [transcript_path]
#
# Called by session-stop.sh at the end of every agent session. Always exits 0
# so it never blocks Claude Code.
#
# Heuristic patterns (deterministic, zero LLM cost):
#   1. clean-first-pass   — task reached review/approved without any Revision block
#   2. build-lint-clean   — Review section shows Build: PASS and Lint: PASS
#   3. parallel-task-dispatch (PM only) — transcript shows ≥2 Task tool uses in one turn
#   4. security-scan-clean — Review section shows Security scan: PASS / pass
#
# Each hit creates or updates a file in .claude/instincts/<role>/<pattern-id>.yml.
# Confidence grows with observations: conf = min(0.9, 0.2 + 0.1 * observations).
#
# LLM-based extraction (richer patterns) can be enabled later by setting
# DEMIURGE_INSTINCTS_LLM=1; for now the hook only runs heuristics.

set -uo pipefail

ROLE="${1:-}"
TASK_FILE="${2:-}"
TRANSCRIPT_PATH="${3:-}"

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
INSTINCTS_ROOT="$PROJECT_DIR/.claude/instincts"
INSTINCTS_DIR="$INSTINCTS_ROOT/$ROLE"
TRANSCRIPTS_LOG="$INSTINCTS_ROOT/_transcripts.log"

# Hard exits, silent — hook is best-effort.
[ -z "$ROLE" ] && exit 0
[ -z "$TASK_FILE" ] && exit 0
[ ! -f "$TASK_FILE" ] && exit 0

mkdir -p "$INSTINCTS_DIR"
mkdir -p "$INSTINCTS_ROOT"

TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TASK_ID=$(basename "$TASK_FILE" .md)

# --- transcript log (baseline, always runs) ---------------------------------

log_transcript() {
  local outcome
  outcome=$(grep -m1 '^\*\*Status\*\*:' "$TASK_FILE" 2>/dev/null \
    | sed -E 's/^\*\*Status\*\*:[[:space:]]*//' \
    | awk '{print $1}')
  echo "$TS | role=$ROLE | task=$TASK_ID | status=${outcome:-unknown} | transcript=${TRANSCRIPT_PATH:-none}" \
    >> "$TRANSCRIPTS_LOG"
}

# --- instinct merge helper --------------------------------------------------
#
# merge_instinct <pattern_id> <pattern_text> <triggers_csv> <implication>
#
# If the file already exists, increment observations and recompute confidence.
# If it's new, create with observations=1, confidence=0.3.

merge_instinct() {
  local pid="$1"
  local ptext="$2"
  local triggers="$3"
  local impl="$4"
  local file="$INSTINCTS_DIR/$pid.yml"

  if [ -f "$file" ]; then
    local obs
    obs=$(grep -m1 '^observations:' "$file" 2>/dev/null | awk '{print $2}')
    obs=$((${obs:-0} + 1))
    local conf
    conf=$(awk -v o="$obs" 'BEGIN {
      c = 0.2 + 0.1 * o
      if (c > 0.9) c = 0.9
      printf "%.1f", c
    }')
    sed -i.bak -E "s/^observations:.*/observations: $obs/" "$file"
    sed -i.bak -E "s/^confidence:.*/confidence: $conf/" "$file"
    sed -i.bak -E "s/^last_seen:.*/last_seen: $TS/" "$file"
    rm -f "$file.bak"
  else
    # Use a single-quoted heredoc so $-vars inside YAML don't expand.
    {
      echo "pattern: \"$ptext\""
      echo "confidence: 0.3"
      echo "observations: 1"
      echo "first_seen: $TS"
      echo "last_seen: $TS"
      echo "role: $ROLE"
      echo "triggers: [$triggers]"
      echo "implication: \"$impl\""
    } > "$file"
  fi
}

# --- heuristics --------------------------------------------------------------

# 1. Task finished without any revision round.
heuristic_clean_first_pass() {
  local status
  status=$(grep -m1 '^\*\*Status\*\*:' "$TASK_FILE" 2>/dev/null \
    | sed -E 's/^\*\*Status\*\*:[[:space:]]*//' \
    | awk '{print $1}')
  [ "$status" = "review" ] || [ "$status" = "approved" ] || return 0

  if ! grep -q '^## Revision #' "$TASK_FILE" 2>/dev/null; then
    merge_instinct \
      "clean-first-pass" \
      "Tasks assigned to the $ROLE agent reach review or approved without a revision round." \
      "clean-pass,$ROLE" \
      "First-pass review is achievable for $ROLE work. Finish fully and self-check before marking review rather than iterating through the reviewer."
  fi
}

# 2. Build and lint both PASS in the Review section.
heuristic_build_lint_clean() {
  grep -q '^## Review' "$TASK_FILE" 2>/dev/null || return 0
  grep -qE '\*\*Build\*\*:.*PASS' "$TASK_FILE" || return 0
  grep -qE '\*\*Lint\*\*:.*PASS' "$TASK_FILE" || return 0

  merge_instinct \
    "build-lint-clean" \
    "Build and lint both pass on first review for $ROLE tasks." \
    "build-success,lint-clean,$ROLE" \
    "The build and lint pipeline is stable for this work. A green build is the expected baseline — do not mark review until it is green."
}

# 3. PM dispatched ≥2 specialists via Task tool in a single turn.
heuristic_parallel_dispatch() {
  [ "$ROLE" = "pm" ] || return 0
  [ -n "$TRANSCRIPT_PATH" ] || return 0
  [ -f "$TRANSCRIPT_PATH" ] || return 0

  local hits=0
  if command -v jq >/dev/null 2>&1; then
    # Count assistant messages whose content has ≥2 Task tool_use blocks.
    hits=$(jq -c '
      select(.role == "assistant") |
      select(
        ([.content[]? | select(.type == "tool_use" and .name == "Task")] | length) >= 2
      )
    ' "$TRANSCRIPT_PATH" 2>/dev/null | wc -l | tr -d ' ')
  fi
  # jq might return 0 if schema differs; fall back to a rough grep check.
  if [ "${hits:-0}" -eq 0 ]; then
    hits=$(grep -c '"name":"Task"[^}]*"name":"Task"' "$TRANSCRIPT_PATH" 2>/dev/null || echo 0)
  fi

  if [ "${hits:-0}" -gt 0 ]; then
    merge_instinct \
      "parallel-task-dispatch" \
      "PM dispatched multiple specialist subagents via the Task tool in a single assistant turn." \
      "parallel-dispatch,pm,hierarchical" \
      "Parallel dispatch is proven in this project. Default to one-message multi-dispatch when file paths do not overlap; sequential fallback only for real conflicts."
  fi
}

# 4. Security scan passed (Review section).
heuristic_security_scan_clean() {
  grep -q '^## Review' "$TASK_FILE" 2>/dev/null || return 0
  grep -qiE '\*\*Security scan\*\*:.*(PASS|pass)' "$TASK_FILE" || return 0

  merge_instinct \
    "security-scan-clean" \
    "Security scan passes cleanly on first review for $ROLE work." \
    "security-clean,$ROLE" \
    "The $ROLE agent's default patterns pass security-scan. Keep hardcoded-secret hygiene, input validation at boundaries, and no raw HTML on user data — those are working."
}

# --- run --------------------------------------------------------------------

log_transcript
heuristic_clean_first_pass
heuristic_build_lint_clean
heuristic_parallel_dispatch
heuristic_security_scan_clean

exit 0
