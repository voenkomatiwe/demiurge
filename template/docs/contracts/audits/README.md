---
title: Contracts Audits Index
kind: index
---

# Audits

Every external audit lands here as a PDF + a markdown summary of findings and their resolution.

## Layout

```
audits/
├── README.md                              ← this index
├── NNNN-<firm>-<date>/
│   ├── report.pdf                         ← original audit document
│   ├── summary.md                         ← our summary + finding tracker
│   └── fixes/                             ← PRs/commits fixing findings (can be links instead of files)
```

## Index

| # | Firm | Date | Scope | Status | Critical | High | Med | Low |
|---|------|------|-------|--------|----------|------|-----|-----|
| — | _(no audits yet)_ | — | — | — | — | — | — | — |

## Finding status convention

- **Fixed** — PR merged, verified by auditor
- **Acknowledged** — intentional design trade-off, no fix planned
- **Mitigated** — addressed through a different mechanism (e.g., operational rather than code)
- **Wontfix** — risk accepted, documented in `docs/contracts/security.md#known-risks-and-mitigations`

## Before requesting an audit

Run through `docs/contracts/security.md#audit-checklist`. Audits are expensive — the team's own review should be exhausted first.
