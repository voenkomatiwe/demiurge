#!/usr/bin/env bash
#
# Interactive initializer for a project generated from this template.
# Run ONCE, right after cloning. The script deletes itself on success.
#
# What it does:
#   1. Asks for project name, description, GitHub org.
#   2. Asks which domains the project needs (web / contracts / design).
#   3. Replaces {{PLACEHOLDERS}} in all .md and config files.
#   4. Removes unused domain folders and labels.
#   5. Commits the initialization as a single chore commit.
#   6. Deletes itself.

set -euo pipefail

# ---------- helpers ----------

bold()   { printf '\033[1m%s\033[0m\n' "$*"; }
info()   { printf '\033[36m→\033[0m %s\n' "$*"; }
ok()     { printf '\033[32m✓\033[0m %s\n' "$*"; }
err()    { printf '\033[31m✗\033[0m %s\n' "$*" >&2; }
ask()    { local p="$1" var="$2" default="${3:-}"; local input
  if [ -n "$default" ]; then printf '%s [%s]: ' "$p" "$default"
  else printf '%s: ' "$p"
  fi
  IFS= read -r input
  if [ -z "$input" ] && [ -n "$default" ]; then input="$default"; fi
  if [ -z "$input" ]; then err "empty value, aborting"; exit 1; fi
  printf -v "$var" '%s' "$input"
}
yesno()  { local p="$1" default="${2:-y}"; local input prompt
  if [ "$default" = "y" ]; then prompt="[Y/n]"; else prompt="[y/N]"; fi
  printf '%s %s: ' "$p" "$prompt"
  IFS= read -r input
  input="${input:-$default}"
  case "$input" in y|Y|yes|YES) return 0 ;; *) return 1 ;; esac
}

# ---------- pre-flight ----------

if [ ! -f CLAUDE.md ] || [ ! -d docs ]; then
  err "Run this from the repo root of a freshly cloned template."; exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  err "Not a git repo."; exit 1
fi

bold "Project initialization"
echo "This is a one-time setup. Press Ctrl+C to abort."
echo

# ---------- inputs ----------

ask "Project name (short, lowercase-kebab or Title Case)" PROJECT_NAME
ask "One-line description" PROJECT_DESCRIPTION
ask "GitHub organization (used in CODEOWNERS and issue config)" ORG
ask "Repo name (used in issue config)" REPO "$(basename "$(git rev-parse --show-toplevel)")"

echo
bold "Domains"
echo "Pick the domains this project needs. Unused domains will be removed."
USE_WEB=1;       yesno "Include web (frontend + backend)?" y       || USE_WEB=0
USE_CONTRACTS=1; yesno "Include smart contracts?"          n       || USE_CONTRACTS=0
USE_DESIGN=1;    yesno "Include design system?"            y       || USE_DESIGN=0

if [ "$USE_WEB" = 0 ] && [ "$USE_CONTRACTS" = 0 ] && [ "$USE_DESIGN" = 0 ]; then
  err "At least one domain must be selected."; exit 1
fi

echo
bold "Summary"
echo "  Name:        $PROJECT_NAME"
echo "  Description: $PROJECT_DESCRIPTION"
echo "  Org:         $ORG"
echo "  Repo:        $REPO"
echo "  Domains:     $([ $USE_WEB = 1 ] && printf 'web ')$([ $USE_CONTRACTS = 1 ] && printf 'contracts ')$([ $USE_DESIGN = 1 ] && printf 'design')"
echo
yesno "Proceed?" y || { err "Aborted."; exit 1; }

# ---------- placeholder replacement ----------

info "Replacing placeholders..."
# Only touch text files; use find to enumerate.
FILES=$(find . \
  -type d \( -name .git -o -name node_modules \) -prune -o \
  -type f \( -name '*.md' -o -name '*.yml' -o -name '*.yaml' -o -name '*.json' -o -name 'CODEOWNERS' \) -print)

# Portable sed in-place: macOS requires `-i ''`, GNU requires `-i`.
sed_inplace() {
  if sed --version >/dev/null 2>&1; then sed -i "$@"
  else sed -i '' "$@"
  fi
}

# Escape replacement strings for sed.
esc() { printf '%s' "$1" | sed -e 's/[\/&]/\\&/g'; }

PN=$(esc "$PROJECT_NAME")
PD=$(esc "$PROJECT_DESCRIPTION")
OE=$(esc "$ORG")
RE=$(esc "$REPO")

echo "$FILES" | while IFS= read -r f; do
  [ -z "$f" ] && continue
  sed_inplace "s/{{PROJECT_NAME}}/$PN/g; s/{{PROJECT_DESCRIPTION}}/$PD/g; s/{{ORG}}/$OE/g; s/{{REPO}}/$RE/g" "$f"
done
ok "Placeholders replaced."

# ---------- domain pruning ----------

prune_domain() {
  local domain="$1"
  info "Removing docs/$domain/ and $domain-specific entries..."
  rm -rf "docs/$domain"
  rm -f "docs/roles/${domain}.md" 2>/dev/null || true
  # Role pruning: these roles only exist within a domain
  case "$domain" in
    web)
      rm -f docs/roles/frontend.md docs/roles/backend.md
      ;;
    contracts)
      rm -f docs/roles/smartcontract.md
      ;;
    design)
      rm -f docs/roles/designer.md
      ;;
  esac
  # Labels: remove area:<domain> entries from .github/labels.yml.
  if [ -f .github/labels.yml ]; then
    # Remove the block for this single label (name + next two lines).
    python3 - "$domain" <<'PY' > .github/labels.yml.tmp
import re, sys
domain = sys.argv[1]
with open(".github/labels.yml") as f:
    text = f.read()
# Remove the named block: lines starting with `- name: "area:<domain>"` and the following 1-2 lines
# until the next `- name:` or EOF or blank section boundary.
pattern = re.compile(
    rf'^- name: "area:{re.escape(domain)}"[\s\S]*?(?=^- name:|\Z)',
    flags=re.MULTILINE,
)
text = pattern.sub('', text)
# Collapse multiple blank lines.
text = re.sub(r'\n{3,}', '\n\n', text)
print(text, end='')
PY
    mv .github/labels.yml.tmp .github/labels.yml
  fi
}

[ "$USE_WEB"       = 0 ] && prune_domain web
[ "$USE_CONTRACTS" = 0 ] && prune_domain contracts
[ "$USE_DESIGN"    = 0 ] && prune_domain design

# CODEOWNERS: comment out lines for missing domains.
if [ -f CODEOWNERS ]; then
  comment_codeowners() {
    local domain="$1"
    sed_inplace "/^docs\/$domain\//s|^|# removed by setup.sh: |" CODEOWNERS
  }
  [ "$USE_WEB"       = 0 ] && comment_codeowners web
  [ "$USE_CONTRACTS" = 0 ] && comment_codeowners contracts
  [ "$USE_DESIGN"    = 0 ] && comment_codeowners design
fi

ok "Domains pruned."

# ---------- optional: LICENSE ----------
if [ ! -f LICENSE ]; then
  if yesno "Add an MIT LICENSE?" y; then
    YEAR=$(date +%Y)
    cat > LICENSE <<EOF
MIT License

Copyright (c) $YEAR $ORG

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
    ok "LICENSE created."
  fi
fi

# ---------- self-delete + commit ----------

info "Removing setup.sh..."
rm -f setup.sh

info "Verifying no template placeholders left..."
# Match only {{UPPERCASE_WORDS}} — GitHub Actions ${{ github.x }} uses lowercase,
# so this pattern won't flag them.
REMAINING=$(grep -rlE '\{\{[A-Z_]+\}\}' \
  --include='*.md' --include='*.yml' --include='*.yaml' --include='*.json' --include='CODEOWNERS' \
  . 2>/dev/null | grep -v '^\./\.git/' || true)
if [ -n "$REMAINING" ]; then
  err "Some placeholders remain:"
  echo "$REMAINING"
  echo "Inspect the files above and edit manually."
  echo "Commit skipped. Run: git add -A && git commit -m 'chore: initialize project from template'"
  exit 1
fi

info "Committing initialization..."
git add -A
git commit -m "chore: initialize project from template

- Project: $PROJECT_NAME
- Domains: $([ $USE_WEB = 1 ] && printf 'web ')$([ $USE_CONTRACTS = 1 ] && printf 'contracts ')$([ $USE_DESIGN = 1 ] && printf 'design')
" >/dev/null

# ---------- first PM issue ----------
#
# Plan Phase 4.3: after setup, create the entry-point PM issue.
# We can only do this if a GitHub remote is already wired and `gh` is authenticated.
# Otherwise we leave a printable instruction at the end.

FIRST_ISSUE_BODY=$(cat <<'BODY'
## Goal

Bootstrap the project documentation so every role has enough context to start work.

## Steps

1. Collect initial source materials (brief, spec, wireframes, research) into `docs/sources/`.
2. Add a row to `docs/sources/README.md` for each file.
3. Synthesize:
   - `docs/vision.md` — problem, users, success criteria
   - `docs/scope.md` — in / out of MVP
   - `docs/<domain>/architecture.md` — fill out the sections relevant to the sources
4. Link sources in each synthesized doc via `based-on:` frontmatter.
5. Open follow-up issues per domain for the first implementation tasks.

## Acceptance criteria

- [ ] `docs/sources/README.md` lists every uploaded source
- [ ] `docs/vision.md` and `docs/scope.md` filled, not templated
- [ ] At least one `docs/<domain>/architecture.md` section fleshed out with `based-on:` referencing real sources
- [ ] First implementation issues opened with `role:*` / `area:*` / `status:ready` labels

## Related documentation

- `docs/sources/README.md`
- `docs/vision.md`
- `docs/scope.md`

---
_Auto-created by setup.sh — this is the entry point for all work on the project._
BODY
)

FIRST_ISSUE_CREATED=0
if command -v gh >/dev/null 2>&1 \
   && git remote get-url origin >/dev/null 2>&1 \
   && gh auth status >/dev/null 2>&1; then
  info "Creating entry-point PM issue..."
  if gh issue create \
       --title "[PM] Synthesize initial project documentation" \
       --label "role:pm" \
       --label "type:docs" \
       --label "status:ready" \
       --body "$FIRST_ISSUE_BODY" >/dev/null 2>&1; then
    ok "Entry-point issue created."
    FIRST_ISSUE_CREATED=1
  else
    err "gh issue create failed (labels may not exist yet — run the sync-labels workflow first, then open the issue manually)."
  fi
fi

echo
ok "Done."
echo
bold "Next steps"
echo "  1. Push to your new repo: git push -u origin main"
echo "  2. Run the sync-labels workflow once (or push .github/labels.yml) to apply labels"
echo "  3. Upload initial sources to docs/sources/ and update docs/sources/README.md"
if [ "$FIRST_ISSUE_CREATED" = 0 ]; then
  echo "  4. Open the entry-point PM issue:"
  echo "       gh issue create --title '[PM] Synthesize initial project documentation' \\"
  echo "         --label 'role:pm' --label 'type:docs' --label 'status:ready'"
fi
echo
echo "Start onboarding via README.md → docs/roles/<your-role>.md"
