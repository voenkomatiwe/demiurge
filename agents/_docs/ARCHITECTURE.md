# Architecture — {{PROJECT_NAME}}

_This file is read by PM and specialist agents. Keep it under ~2000 tokens. Grep-friendly._

## System Components

The project is a **Bun workspaces monorepo** with two workspaces: `frontend/` and `backend/`.

```
┌──────────────┐       HTTP       ┌──────────────┐
│  frontend/   │ ◀──────────────▶ │   backend/   │
│ React + Vite │                  │ Fastify API  │
└──────────────┘                  └──────────────┘
```

### 1. Frontend (`frontend/`)
- **Stack**: {{FRONTEND_STACK}}
- **Directory**: `frontend/src/`
- **Deploy**: [target]

### 2. Backend (`backend/`)
- **Stack**: {{BACKEND_STACK}}
- **Directory**: `backend/src/`
- **Deploy**: [target]

## Frontend Conventions

_If applicable. Only include sections relevant to your stack._

- Component conventions
- Styling approach
- State management
- Linting and formatting

## Backend Conventions

_If applicable._

- Framework patterns
- Input validation
- Error shape
- Logging

## API Contracts

_List key API endpoints and their request/response shapes. Agents read this section when implementing or changing an endpoint._

```typescript
// POST /api/example
interface ExampleRequest {
  // ...
}

interface ExampleResponse {
  // ...
}
```

## Integrations

_External services your system depends on (databases, auth providers, CRMs, payment gateways, etc.)._

- **[Service]** — [purpose, key env vars]
- **[Service]** — ...
