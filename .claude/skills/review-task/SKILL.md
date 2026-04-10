---
name: review-task
description: Run the full review pipeline on a specialist task (reviewer agent → PM agent). Usage /review-task TASK-001-frontend
argument-hint: "[TASK-ID, e.g. TASK-001-frontend]"
---

# Review Task

Run the full review pipeline on `docs/tasks/$ARGUMENTS.md`.

## Pipeline

### Step 1: Code Review (Reviewer Agent)
Use the **reviewer** agent to review `docs/tasks/$ARGUMENTS.md`:
- Read the task file for requirements and acceptance criteria
- Read all files listed in "Files to Touch"
- Run `{{PACKAGE_MANAGER_RUN}} build` — check for errors
- Run `{{PACKAGE_MANAGER_RUN}} lint` — check for violations
- **Invoke the `security-scan` skill** — hardcoded secrets, XSS, injection, missing validation, PII logging
- Check accessibility, conventions
- Write findings into the task file under "Review" section
- Recommend `approved` or `revision`

If `security-scan` returns a CRITICAL finding → skip Step 2, set status to `revision` immediately.

### Step 2: Task Review (PM Agent)
Use the **pm** agent to review `docs/tasks/$ARGUMENTS.md`:
- Check each acceptance criterion — is it met?
- Check success metrics — do they pass?
- If reviewer recommended `revision` — add specific feedback
- Set final status: `approved` or `revision`

## Important
- Run Step 1 first, then Step 2
- If reviewer finds CRITICAL issues, do NOT proceed to PM review — go straight to `revision`
- All feedback must be specific: file:line, what's wrong, what to fix
