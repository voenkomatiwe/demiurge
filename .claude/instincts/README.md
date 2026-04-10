# Instincts

Project-scoped learned patterns. Continuous-learning layer from PLAN.md.

## How it Works (planned)

1. **Observation** — A `Stop` hook analyzes the just-finished session.
2. **Instinct** — A pattern is saved with a confidence score (0.3–0.9) in this directory.
3. **Evolution** — A slash command (`/evolve`) merges 3+ related instincts into a durable skill.
4. **Project-scoped** — These files live in the repo, so they do not pollute other projects.

## Current Status

**Empty.** Instinct extraction is deferred to Phase 1 of PLAN.md "Следующие шаги" (Automation / CEO agent phase).

For MVP: the existing hooks (session-start, scope-check, session-stop) provide the plumbing; the actual pattern-extraction logic is not yet wired up.

## File Format (when populated)

```markdown
---
name: <short name>
confidence: 0.65
observed_count: 4
first_seen: 2026-04-10
last_seen: 2026-04-14
---

# Instinct: <name>

**Pattern**: <what recurs>
**Context**: <when it applies — agent role, task type>
**Action**: <what the agent should do>
**Evidence**: <task IDs where observed>
```
