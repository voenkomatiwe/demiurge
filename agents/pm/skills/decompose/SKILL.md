---
name: decompose
description: Decompose a task into lightweight specialist subtasks using the PM agent. Usage /decompose TASK-001
argument-hint: "[TASK-ID, e.g. TASK-001]"
---

# Decompose Task

Decompose the task `$ARGUMENTS` into lightweight specialist subtasks.

## Steps

1. Fetch the task: `demiurge task get $ARGUMENTS`
2. Use the **pm** agent to decompose it into specialist subtasks
3. The PM agent will:
   - Read ARCHITECTURE.md and query decisions via `demiurge decision list --tags <relevant-tag>` for context
   - Create specialist subtasks via `demiurge task create --title "..." --assigned-to <role> --parent $ARGUMENTS --workspace <dir>`
   - Each subtask has ONLY: Why, Goal, Not Doing, Design Reference, Dependencies
   - NO implementation details — specialists plan their own work
   - Set dependencies between subtasks

## Command

Use the pm agent to decompose `$ARGUMENTS` (fetched via `demiurge task get $ARGUMENTS`) into lightweight specialist subtasks. Create each subtask with `demiurge task create --title "..." --assigned-to <role> --parent $ARGUMENTS --workspace <dir>`. Each task should have only Goal, Why, Not Doing, and Design Reference — no file paths, no code examples, no implementation details. Specialists will plan their own implementation.
