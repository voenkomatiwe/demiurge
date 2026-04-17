---
title: Web API Contracts
based-on: []
owns-labels: ["area:web", "area:api"]
spawns-issues-on-change:
  - section: "## Endpoints"
    type: Feature
    labels: ["role:backend", "role:frontend", "area:api"]
  - section: "## Error conventions"
    type: Task
    labels: ["role:backend", "role:frontend", "area:api"]
---

# Web API Contracts

**Source of truth for the boundary between frontend and backend.** Backend produces it, frontend consumes it. Either role editing this doc must open a PR that the other role reviews.

## Transport

<!--
JSON over HTTPS. REST or RPC? Versioning strategy (URL-based? header-based? none?).
Content types, compression.
-->

## Authentication

See `docs/web/architecture.md#authentication` for issuance. This section covers how the client proves identity on each request.

- Header / cookie:
- Expiry behaviour:
- Refresh flow:

## Error conventions

<!--
Every error response looks the same. Document the shape once.

Example:
  {
    "error": {
      "code": "VALIDATION_FAILED",
      "message": "Human-readable summary",
      "details": [{ "field": "email", "issue": "must be a valid email" }]
    }
  }

Status codes used: 400 (validation), 401 (unauth), 403 (forbidden), 404 (not found), 409 (conflict), 422 (semantic), 429 (rate limit), 5xx (server).
-->

## Pagination

<!--
Cursor-based or offset-based? Default page size, max page size, response shape (items + nextCursor / items + total + page).
-->

## OpenAPI specification

The authoritative machine-readable contract lives at:

```
backend/openapi.json    (generated from Fastify schemas on build)
```

Frontend types are generated from this file via `bun run codegen:api` (when backend lives in the repo).

## Endpoints

<!--
List endpoints by resource. One sub-heading per resource, table of operations.

Example:

### Users

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | /users | Create user | public |
| GET | /users/me | Get current user | session |

Link to the full spec in backend/openapi.json for request/response shapes — don't duplicate them here.
-->
