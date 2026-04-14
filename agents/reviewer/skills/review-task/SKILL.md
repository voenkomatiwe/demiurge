---
name: review-task
description: Run the full review pipeline on a specialist task (reviewer agent → PM agent). Usage /review-task TASK-001-frontend
argument-hint: "[TASK-ID, e.g. TASK-001-frontend]"
---

# Review Task

Run the full review pipeline on task `$ARGUMENTS`.

## Pipeline

### Step 1: Code Review (Reviewer Agent)
Use the **reviewer** agent to review task `$ARGUMENTS` (fetch via `demiurge task get $ARGUMENTS`):
- Read the task for requirements and acceptance criteria
- Read all files in the task's workspace
- Run `{{PACKAGE_MANAGER_RUN}} build` — check for errors
- Run `{{PACKAGE_MANAGER_RUN}} lint` — check for violations
- **Invoke the `security-scan` skill** — hardcoded secrets, XSS, injection, missing validation, PII logging
- Check accessibility, conventions
- Write findings into the task via `demiurge task update $ARGUMENTS --notes "..."`
- Recommend `approved` or `revision`

If `security-scan` returns a CRITICAL finding → skip Step 2, set status to `revision` immediately via `demiurge task update $ARGUMENTS --status revision`.

### Step 2: Task Review (PM Agent)
Use the **pm** agent to review task `$ARGUMENTS` (fetch via `demiurge task get $ARGUMENTS`):
- Check each acceptance criterion — is it met?
- Check success metrics — do they pass?
- If reviewer recommended `revision` — add specific feedback
- Set final status via `demiurge task update $ARGUMENTS --status approved` or `--status revision`

## Important
- Run Step 1 first, then Step 2
- If reviewer finds CRITICAL issues, do NOT proceed to PM review — go straight to `revision`
- All feedback must be specific: file:line, what's wrong, what to fix
