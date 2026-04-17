---
title: Web Data Model
based-on: []
owns-labels: ["area:web", "area:data-model"]
spawns-issues-on-change:
  - section: "## Entities"
    type: Feature
    labels: ["role:backend", "area:data-model", "area:web"]
  - section: "## Migrations"
    type: Task
    labels: ["role:backend", "area:data-model", "area:web"]
---

# Web Data Model

Persistent entities, their relationships, and how we evolve the schema. This is the backend's source of truth; frontend sees it only through `api.md` (in this app's docs folder).

## Database

- Engine: _(fill — e.g. Postgres 16)_
- Hosting: _(fill)_
- ORM / query builder: _(fill)_
- Migrations tool: _(fill)_

## Entities

<!--
One sub-heading per entity. For each:
- Purpose (one sentence)
- Fields table: name | type | nullable | default | notes
- Indexes
- Relationships to other entities
- Lifecycle rules (when created, when deleted, soft-delete?)

Keep this document in sync with actual migrations. If the schema diverges from this doc, the doc is wrong — fix it.
-->

### _(entity)_

## Relationships diagram

<!--
ASCII or mermaid ER-diagram, high level.
-->

## Migrations

<!--
Conventions: migration filename format, up/down strategy, backfill approach for non-nullable additions, zero-downtime rules.
-->

## PII and retention

<!--
Which entities contain personal data? How long is it retained? Deletion triggers (user deletion, retention expiry).
Link to docs/web/security.md for encryption and access control.
-->
