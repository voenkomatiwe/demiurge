---
name: security-scan
description: Run a lightweight security audit over code changed in a specialist task — secrets, hardcoded credentials, injection risks, unsafe HTML, missing validation, dependency red flags. Invoke as part of the review pipeline before PM approves a task.
---

# Security Scan

Mechanical + pattern-based security audit. Not a replacement for a full SAST tool (AgentShield, Semgrep) — deliberate smaller scope for the MVP.

## When to Invoke

- By the **reviewer agent** as part of `/review-task`, right after `{{PACKAGE_MANAGER_RUN}} build` and `{{PACKAGE_MANAGER_RUN}} lint`.
- By PM on a task that touches auth, payments, file uploads, or PII.
- On demand before a merge.

## What It Checks

### 1. Hardcoded Secrets (pattern grep)

Patterns to flag:
```
sk_live_[0-9a-zA-Z]{24,}     # Stripe
pk_live_[0-9a-zA-Z]{24,}     # Stripe public (less severe)
AKIA[0-9A-Z]{16}             # AWS access key
AIza[0-9A-Za-z\-_]{35}       # Google API
ghp_[0-9a-zA-Z]{36}          # GitHub token
xox[baprs]-[0-9a-zA-Z-]+     # Slack
-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----
Bearer [A-Za-z0-9._\-]{20,}  # hardcoded auth header
```

Also: literal passwords next to keywords `password:`, `apikey:`, `secret:` in `.ts/.tsx/.js/.jsx/.env.local`.

### 2. Unsafe React Patterns

Grep for:
- `dangerouslySetInnerHTML={{` — flag every occurrence, verify content is sanitized.
- `eval(`, `new Function(` — CRITICAL, blocks approve.
- `document.write(`, `innerHTML =` on user data — HIGH.

### 3. SQL / GraphQL Injection

- String concatenation in query builders: `\`SELECT ... ${...}\``, `\`query { ... ${...} }\``.
- Template-literal queries with user-controlled variables.

### 4. Missing Input Validation

For every new Fastify route handler:
- Does it have a `schema: { body, querystring, params }`? If not → HIGH.
- Does any file-upload endpoint check MIME type server-side? If not → HIGH.

### 5. PII Logging

Grep for:
- `console.log` or `logger.info` with variables named `phone`, `email`, `passport`, `taxId`, `card` → HIGH (log leakage).

### 6. Dependency Red Flags

- Any new dependency in the diff (e.g. `{{PACKAGE_MANAGER}} add` or lock-file changes)? If yes → verify the package is on an allowlist and has no known CVEs.
- Postinstall scripts in new deps → CRITICAL if unknown.

## Steps

1. Identify diff scope:
   ```bash
   git diff --name-only HEAD  # or main..HEAD for a worktree
   ```
2. For each category above, grep the changed files only. No repo-wide scan.
3. For every hit, classify:
   - **CRITICAL** → blocks approval, task goes to `revision`.
   - **HIGH** → must be addressed or explicitly waived by PM.
   - **MEDIUM** → log in review, fix if cheap.
4. Write findings into the task via `demiurge task update <ID> --notes "..."` using this sub-format:

```markdown
### Security scan
**Verdict**: pass | fail
**Findings**:
- [CRITICAL] backend/src/routes/upload.ts:42 — missing MIME type check → exploit: arbitrary file upload
- [HIGH] frontend/src/components/Comment.tsx:18 — dangerouslySetInnerHTML without sanitize
```

## Non-Goals

- Not a full SAST. Missing: taint tracking, CFG analysis, dependency scanning beyond name-match.
- Not a runtime scanner. No fuzzing.
- Not a replacement for security review on auth/payment flows — flag those for human review.

## Escalation

If a CRITICAL finding involves secrets or auth:
1. Set task status to `revision` immediately via `demiurge task update <ID> --status revision`.
2. Notify the Owner via task notes (not just the specialist).
3. If a real secret leaked into git history → rotation required.
