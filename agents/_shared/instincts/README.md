# Instincts

Project-scoped, continuously-learned patterns. The demiurge orchestrator writes here at the end of every agent session (via `SessionStop → extract-instincts.sh`) and reads here at the start of every session (via `SessionStart → session-start.sh`).

**Scope**: committed to the repo, scoped to this project only. Deliberately not shared across projects — patterns that work for one codebase don't transfer reliably.

## Directory layout

```
.claude/instincts/
├── README.md            ← this file
├── _transcripts.log     ← one line per finished session (audit trail, no instinct content)
├── pm/                  ← PM-specific instincts
│   ├── clean-first-pass.yml
│   └── parallel-task-dispatch.yml
├── frontend/
├── backend/
├── designer/
└── reviewer/
```

One YAML file per unique pattern per role. Filename = stable pattern ID, contents = confidence-weighted observation record.

## File format

```yaml
pattern: "Tasks assigned to the frontend agent reach review or approved without a revision round."
confidence: 0.6
observations: 4
first_seen: 2026-04-10T12:00:00Z
last_seen: 2026-04-12T16:30:00Z
role: frontend
triggers: [clean-pass, frontend]
implication: "First-pass review is achievable for frontend work. Finish fully and self-check before marking review rather than iterating through the reviewer."
```

### Fields

- **pattern** — one-sentence description of what was observed
- **confidence** — `0.2 + 0.1 × observations`, capped at `0.9`
- **observations** — number of sessions where this pattern was detected
- **first_seen** / **last_seen** — ISO 8601 UTC timestamps
- **role** — which agent role this instinct belongs to (`pm`, `frontend`, `backend`, `designer`, `reviewer`)
- **triggers** — tag list used for future clustering / semantic grouping
- **implication** — actionable guidance the agent can use

## How extraction works (current: heuristic)

`.claude/hooks/extract-instincts.sh` runs at `SessionStop`. It inspects the just-finished task file and the session transcript for deterministic patterns. No LLM cost, no network calls.

### Heuristics built-in

| Pattern ID | What triggers it | Applies to |
|---|---|---|
| `clean-first-pass` | Task ended in `review` or `approved` with **zero** `## Revision #` blocks | any role |
| `build-lint-clean` | Review section shows `**Build**: PASS` and `**Lint**: PASS` | any role |
| `parallel-task-dispatch` | Transcript has ≥ 2 `Task` tool uses in a single assistant turn | PM only |
| `security-scan-clean` | Review section shows `**Security scan**: PASS` | any role |

When a pattern is detected:
- New file: `observations = 1`, `confidence = 0.3`
- Existing file: `observations += 1`, `confidence` recomputed

All heuristics are additive — one session can trigger multiple, each independently.

## How reading works

`.claude/hooks/session-start.sh` detects the currently-active task (via `demiurge task list --status in-progress`), derives its role, and prints every instinct for that role with `confidence ≥ 0.5`. Low-confidence instincts are hidden to avoid noise.

**Threshold**: `confidence ≥ 0.5` means `observations ≥ 3`. A pattern needs at least three independent hits before it influences agent behavior.

**Scope**: only the active role's instincts are printed. PM sees PM instincts; frontend sees frontend instincts. Agents can still manually read the whole directory if they want a broader picture, but by default SessionStart keeps it focused.

## Transcripts log

`_transcripts.log` is an append-only index:

```
2026-04-10T12:00:00Z | role=frontend | task=TASK-001-frontend | status=approved | transcript=/path/to/transcript.jsonl
```

It's the baseline dataset for **future** LLM-based extraction. When heuristics aren't enough, a later job can replay these transcripts and mine richer patterns (e.g., "this project prefers co-located actions in stores" or "backend routes always live under `backend/src/routes/<resource>/`"). Until that pipeline exists, the log just grows.

## Enabling LLM extraction (future)

The current script is heuristic-only. A future iteration will add LLM-based extraction behind an environment flag:

```bash
# ~/.zshrc or project-local .env
DEMIURGE_INSTINCTS_LLM=1
```

When set, `extract-instincts.sh` will also call `claude -p` on the transcript to pull 1–3 higher-signal patterns per session. Not enabled by default because it costs API dollars on every session stop.

## Curation rules

- **Never edit instinct files by hand.** They're auto-generated. If a pattern is wrong, delete the file; it'll regenerate from observations.
- **Deletion is fine.** Removing an instinct resets it. The next session that matches the pattern will recreate it at confidence 0.3.
- **`/evolve` slash command (planned)** will cluster 3+ related instincts into a durable skill. Not implemented yet; waiting for enough real data (PLAN.md estimated 2–3 weeks of continuous use).
- **Export/import** between projects is **deliberately not supported.** Patterns that emerge in one codebase often don't hold in another.
