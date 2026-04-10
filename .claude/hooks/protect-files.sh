#!/bin/bash
# Blocks editing protected files: .env, lock files, git internals
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

PROTECTED_PATTERNS=(
  ".env"
  "package-lock.json"
  "bun.lockb"
  ".git/"
  "node_modules/"
  ".claude/settings"
)

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "Blocked: '$FILE_PATH' is a protected file (matches '$pattern'). Ask the Owner before modifying." >&2
    exit 2
  fi
done

exit 0
