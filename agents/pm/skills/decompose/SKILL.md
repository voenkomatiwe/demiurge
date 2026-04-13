---
name: decompose
description: Decompose a task into lightweight specialist subtasks using the PM agent. Usage /decompose TASK-001
argument-hint: "[TASK-ID, e.g. TASK-001]"
---

# Decompose Task

Decompose the task `docs/tasks/$ARGUMENTS.md` into lightweight specialist subtasks.

## Steps

1. Read the task file `docs/tasks/$ARGUMENTS.md`
2. Use the **pm** agent to decompose it into specialist subtasks
3. The PM agent will:
   - Read ARCHITECTURE.md and DECISIONS.md for context
   - Create lightweight specialist task files (TASK-XXX-designer.md, TASK-XXX-frontend.md, etc.)
   - Each task has ONLY: Why, Goal, Not Doing, Design Reference, Dependencies
   - NO implementation details — specialists plan their own work
   - Set dependencies between subtasks
   - Update the parent task's "Subtasks" section

## Command

Use the pm agent to decompose `docs/tasks/$ARGUMENTS.md` into lightweight specialist task files following the _TEMPLATE-SPEC.md format. Each task should have only Goal, Why, Not Doing, and Design Reference — no file paths, no code examples, no implementation details. Specialists will plan their own implementation.
