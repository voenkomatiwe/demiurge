#!/usr/bin/env bash
#
# build-local.sh — Assemble agents/ → .claude/ for local development.
#
# The source of truth for agent definitions lives in agents/.
# Claude Code reads from .claude/ (flat structure).
# This script syncs the two so you can develop demiurge with live agents.
#
# Usage:
#   bin/build-local.sh              # sync agents/ → .claude/
#   bin/build-local.sh --clean      # remove generated dirs first
#
# Safe to re-run; output is fully regenerated.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
AGENTS_SRC="$PROJECT_DIR/agents"

CLEAN=0
[ "${1:-}" = "--clean" ] && CLEAN=1

# Dirs that build-local generates (cleaned with --clean).
GENERATED_DIRS=("$PROJECT_DIR/.claude/agents" "$PROJECT_DIR/.claude/skills" "$PROJECT_DIR/.claude/hooks" "$PROJECT_DIR/.claude/rules" "$PROJECT_DIR/.claude/workflows" "$PROJECT_DIR/.claude/instincts" "$PROJECT_DIR/docs" "$PROJECT_DIR/design-system")

log() { printf '• %s\n' "$*"; }

if [ ! -d "$AGENTS_SRC" ]; then
  echo "Error: agents/ directory not found at $AGENTS_SRC" >&2
  exit 1
fi

# --- Clean (optional) ---
if [ $CLEAN -eq 1 ]; then
  log "Cleaning generated directories"
  for d in "${GENERATED_DIRS[@]}"; do
    [ -d "$d" ] && rm -rf "$d" && log "  removed: ${d#$PROJECT_DIR/}"
  done
fi

# --- Agent definitions ---
log "Syncing agent definitions"
mkdir -p "$PROJECT_DIR/.claude/agents"
for agent_dir in "$AGENTS_SRC"/*/; do
  name=$(basename "$agent_dir")
  [ "${name:0:1}" = "_" ] && continue
  [ ! -f "$agent_dir/agent.md" ] && continue
  cp "$agent_dir/agent.md" "$PROJECT_DIR/.claude/agents/${name}.md"
  log "  agent: $name"
done

# --- Agent skills ---
log "Syncing skills"
for agent_dir in "$AGENTS_SRC"/*/; do
  name=$(basename "$agent_dir")
  [ "${name:0:1}" = "_" ] && continue
  [ ! -d "$agent_dir/skills" ] && continue
  for skill_dir in "$agent_dir"/skills/*/; do
    [ ! -d "$skill_dir" ] && continue
    skill_name=$(basename "$skill_dir")
    dest="$PROJECT_DIR/.claude/skills/$skill_name"
    mkdir -p "$dest"
    cp -r "$skill_dir"/* "$dest/" 2>/dev/null || true
    log "  skill: $skill_name (from $name)"
  done
done

# --- Shared resources ---
log "Syncing shared resources"
for subdir in rules hooks workflows instincts; do
  src="$AGENTS_SRC/_shared/$subdir"
  [ ! -d "$src" ] && continue
  dest="$PROJECT_DIR/.claude/$subdir"
  mkdir -p "$dest"
  cp -r "$src"/* "$dest/" 2>/dev/null || true
  log "  shared: $subdir"
done

# settings.json
if [ -f "$AGENTS_SRC/_shared/settings.json" ]; then
  cp "$AGENTS_SRC/_shared/settings.json" "$PROJECT_DIR/.claude/settings.json"
  log "  shared: settings.json"
fi

# Ensure hook scripts are executable
if [ -d "$PROJECT_DIR/.claude/hooks" ]; then
  chmod +x "$PROJECT_DIR/.claude/hooks"/*.sh 2>/dev/null || true
  log "  hooks: chmod +x"
fi

# --- Docs ---
log "Syncing docs"
if [ -d "$AGENTS_SRC/_docs" ]; then
  mkdir -p "$PROJECT_DIR/docs"
  cp -r "$AGENTS_SRC/_docs"/* "$PROJECT_DIR/docs/" 2>/dev/null || true
  log "  docs: _docs/ → docs/"
fi

# --- Design system (markdown design tool) ---
if [ -d "$AGENTS_SRC/_design-system" ]; then
  mkdir -p "$PROJECT_DIR/design-system"
  cp -r "$AGENTS_SRC/_design-system"/* "$PROJECT_DIR/design-system/" 2>/dev/null || true
  log "  design-system: _design-system/ → design-system/"
fi

log "Done. .claude/ and docs/ are up to date with agents/."
