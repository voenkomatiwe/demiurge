---
name: decompose
description: Decompose a task into specialist subtasks using the PM agent. Usage /decompose TASK-001
argument-hint: "[TASK-ID, e.g. TASK-001]"
---

# Decompose Task

Decompose the task `docs/tasks/$ARGUMENTS.md` into specialist subtasks.

## Steps

1. Read the task file `docs/tasks/$ARGUMENTS.md`
2. Use the **pm** agent to decompose it into specialist subtasks
3. The PM agent will:
   - Read ARCHITECTURE.md and DECISIONS.md for context
   - Create specialist task files (TASK-XXX-designer.md, TASK-XXX-frontend.md, etc.)
   - Set dependencies between subtasks
   - Embed "Why" context in each subtask
   - Add measurable acceptance criteria with success metrics
   - Update the parent task's "Subtasks" section

## Command

Use the pm agent to decompose `docs/tasks/$ARGUMENTS.md` into specialist task files following the _TEMPLATE-SPEC.md format. Read ARCHITECTURE.md and DECISIONS.md first.
