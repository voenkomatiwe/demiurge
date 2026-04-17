---
title: Web Architecture
based-on: []
owns-labels: ["area:web", "area:architecture"]
spawns-issues-on-change:
  - section: "## Authentication"
    type: Feature
    labels: ["role:backend", "area:auth", "area:web"]
  - section: "## Data flow"
    type: Feature
    labels: ["role:backend", "role:frontend", "area:api", "area:web"]
  - section: "## External integrations"
    type: Feature
    labels: ["role:backend", "area:web"]
---

# Web Architecture

The full picture of the web application: both frontend and backend, their contract, and how data moves.

Read this **once** end-to-end on your first task. After that, jump to the section your issue touches.

## System overview

<!--
A short paragraph + one ASCII (or mermaid) diagram.
Keep the diagram readable in GitHub's markdown renderer.
-->

```
[ Browser ]  ── HTTPS ──▶  [ Frontend (static) ]
                              │
                              │  JSON (REST)
                              ▼
                         [ Backend API ]
                              │
                              ├─▶ [ Database ]
                              └─▶ [ External services ]
```

## Frontend layer

<!--
What the frontend owns. Frameworks, state management, routing, build tooling.
What it does NOT own: business logic beyond presentation, persistence, auth issuance.
-->

## Backend layer

<!--
What the backend owns. HTTP framework, validation, business logic, persistence, auth issuance.
What it does NOT own: rendering, client-side state.
-->

## Data flow

<!--
Walk through 1-3 representative flows end-to-end. E.g.:
1. User logs in — frontend → POST /auth/login → backend validates → sets session cookie → returns user
2. User creates resource — frontend → POST /resource → backend validates + persists → returns resource
Use sequence diagrams if helpful.
-->

## Authentication

<!--
Who issues tokens? Where are they stored? How are they validated?
Cookie settings (SameSite, Secure, HttpOnly). Session vs. JWT decision.
Link to docs/web/security.md for threat model.
-->

## External integrations

<!--
Third-party services this app depends on: payments, email, analytics, object storage.
For each: purpose, library/SDK, where credentials live, fallback behaviour if it's down.
-->

## Deployment topology

<!--
Where the frontend is hosted (CDN? same origin as API?), where the backend runs (single process, container, serverless), how database is reached, networking boundaries.
Link to docs/web/deployment.md for the full deploy process.
-->
