---
title: Backend Code Style
kind: agent-reference
audience: [role:backend]
---

# Backend Code Style

Reference for the backend agent. Patterns and conventions for Fastify + TypeScript + OpenAPI + Better Auth.

---

## Folder Structure

```
src/
├── plugins/           # Fastify plugins (auth, cors, swagger, rate-limit)
├── routes/            # Route modules grouped by resource
│   └── {resource}/
│       ├── index.ts       # Route registration (plugin export)
│       ├── handlers.ts    # Request handlers
│       ├── schemas.ts     # JSON Schema definitions (request + response)
│       └── service.ts     # Business logic (no Fastify dependency)
├── middleware/         # Lifecycle hooks (auth check, logging, error handler)
├── lib/               # Shared utilities (date formatting, slug generation)
├── db/                # Database client, migrations, seed
│   ├── client.ts      # Connection + singleton
│   ├── migrations/    # Ordered migration files
│   └── seed.ts        # Development seed data
├── types/             # Shared TypeScript types and interfaces
├── config/            # Environment validation + app config
│   └── env.ts         # Zod schema for process.env, validated at startup
└── server.ts          # App entry point — registers plugins, routes, starts listener
```

For a small API (< 5 routes), flat `routes/` without resource subfolders is fine.

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Route plugin files | kebab-case | `user-routes.ts` |
| Service files | kebab-case | `user-service.ts` |
| Schema files | kebab-case | `user-schemas.ts` |
| Functions | camelCase | `getUserById` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_LOGIN_ATTEMPTS` |
| Types / interfaces | PascalCase | `UserDTO`, `CreateUserBody` |
| Environment vars | SCREAMING_SNAKE_CASE | `DATABASE_URL` |
| Route prefixes | kebab-case plural | `/api/v1/user-profiles` |

---

## Plugin Pattern

Every route group is a Fastify plugin:

```typescript
import type { FastifyPluginAsync } from "fastify";
import { getUserHandler, createUserHandler } from "./handlers";
import { getUserSchema, createUserSchema } from "./schemas";

const userRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/:id", { schema: getUserSchema }, getUserHandler);
  fastify.post("/", { schema: createUserSchema }, createUserHandler);
};

export default userRoutes;
```

**Rules:**
- One plugin per resource (users, orders, products)
- Register plugins with a prefix: `fastify.register(userRoutes, { prefix: "/api/v1/users" })`
- Plugins encapsulate their own decorators and hooks — no leaking into parent scope
- Cross-cutting concerns (auth, rate-limit) go in `plugins/` and register at the app level

---

## Route Schema Pattern

Every route MUST have a full schema — no exceptions. This drives OpenAPI generation.

```typescript
export const createUserSchema = {
  tags: ["users"],
  summary: "Create a new user",
  body: {
    type: "object" as const,
    required: ["email", "name"],
    properties: {
      email: { type: "string", format: "email" },
      name: { type: "string", minLength: 1, maxLength: 100 },
    },
    additionalProperties: false,
  },
  response: {
    201: {
      type: "object" as const,
      properties: {
        id: { type: "string", format: "uuid" },
        email: { type: "string" },
        name: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
      },
    },
    409: {
      type: "object" as const,
      properties: {
        error: { type: "string" },
        code: { type: "string" },
      },
    },
  },
};
```

**Rules:**
- `body`, `params`, `querystring`, `response` — define all that apply
- `additionalProperties: false` on request bodies — reject unknown fields
- `tags` and `summary` on every schema for readable OpenAPI docs
- Response schemas for success AND main error cases (400, 401, 404, 409)

---

## Handler Pattern

Handlers are thin — validate input (via schema), call service, return response:

```typescript
import type { FastifyRequest, FastifyReply } from "fastify";
import { createUser } from "./service";

export async function createUserHandler(
  request: FastifyRequest<{ Body: CreateUserBody }>,
  reply: FastifyReply,
): Promise<void> {
  const user = await createUser(request.body);
  reply.status(201).send(user);
}
```

**Rules:**
- Handlers do NOT contain business logic — delegate to service layer
- Handlers do NOT catch errors — let the global error handler deal with them
- Type request generics: `FastifyRequest<{ Body: T; Params: T; Querystring: T }>`
- Always set explicit status codes: `reply.status(201).send()`

---

## Service Layer Pattern

Business logic lives in service files — no Fastify dependency:

```typescript
import { db } from "@/db/client";
import { AppError } from "@/lib/errors";

export async function createUser(data: CreateUserBody): Promise<UserDTO> {
  const existing = await db.user.findByEmail(data.email);
  if (existing) {
    throw new AppError("User already exists", "USER_EXISTS", 409);
  }

  const user = await db.user.create(data);
  return toUserDTO(user);
}
```

**Rules:**
- Services are pure async functions — no request/reply objects
- Services throw typed errors (`AppError`) — the error handler maps them to HTTP responses
- Services own all database access for their resource
- Services return DTOs, not raw database rows

---

## Error Handling

Structured error class + global error handler. Never leak internals.

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}
```

Global error handler:

```typescript
// src/middleware/error-handler.ts
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "@/lib/errors";

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      error: error.message,
      code: error.code,
      details: error.details,
    });
    return;
  }

  if (error.validation) {
    reply.status(400).send({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: error.validation,
    });
    return;
  }

  request.log.error({ err: error }, "Unhandled error");
  reply.status(500).send({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}
```

**Rules:**
- All errors to clients use shape: `{ error: string, code: string, details?: object }`
- Never expose stack traces, DB errors, or internal file paths in responses
- Log the full error server-side with request ID for correlation
- Use `AppError` for all expected business errors — with semantic `code` strings

---

## Validation

Validate at system boundaries. Trust internally.

```typescript
// src/config/env.ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  AUTH_SECRET: z.string().min(32),
});

export const env = envSchema.parse(process.env);
```

**Rules:**
- Environment variables validated once at startup via Zod — fail fast if missing
- HTTP input validated by Fastify JSON Schema (automatic from route schemas)
- Internal function calls trust TypeScript types — no re-validation
- File uploads: validate MIME type server-side, enforce size limits, generate server-side filenames (UUID)

---

## Auth Patterns (Better Auth)

Follow the `better-auth-best-practices` skill for setup. Key patterns:

```typescript
// Protected route via preHandler hook
fastify.addHook("preHandler", async (request, reply) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    reply.status(401).send({ error: "Unauthorized", code: "UNAUTHORIZED" });
    return;
  }
  request.session = session;
});
```

**Rules:**
- Session cookies: httpOnly + Secure + SameSite=Lax
- OTP codes: ≥6 digits, ≤5-minute TTL, single-use
- Magic link tokens: single-use, ≤15-minute expiry
- Rate-limit auth endpoints (login, OTP request, magic link)
- Never log full tokens, OTPs, or session IDs
- Auth middleware as Fastify preHandler hook — not inline in handlers

---

## Database Patterns

```typescript
// src/db/client.ts — singleton connection
import { env } from "@/config/env";

// Initialize your DB client here (Drizzle, Prisma, Kysely, etc.)
// Export a single instance — never create connections per-request
```

**Rules:**
- Single database client instance — exported from `db/client.ts`
- Migrations are ordered files in `db/migrations/` — never modify existing migrations, always create new ones
- Transactions for multi-step writes: wrap in a single transaction, rollback on any failure
- Queries live in service files, not in handlers or route plugins
- Use parameterized queries always — never string-concatenate user input into SQL
- Seed data in `db/seed.ts` — for development only, never runs in production

---

## Testing

Tools: Vitest + Supertest (or `fastify.inject()`).

**What to test:**
- Service layer — unit tests for business logic, mocked DB
- Route handlers — integration tests via `fastify.inject()`, real schema validation
- Auth flows — protected routes return 401 without session, 200 with session
- Error cases — invalid input returns 400, missing resource returns 404, conflict returns 409

**What NOT to test:**
- Fastify internals (plugin registration, hook ordering)
- JSON Schema validation logic — Fastify handles this
- Third-party library behavior

Route integration test pattern:

```typescript
import { build } from "@/test/app";

describe("POST /api/v1/users", () => {
  test("creates a user and returns 201", async () => {
    const app = await build();

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/users",
      payload: { email: "test@example.com", name: "Test User" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      email: "test@example.com",
      name: "Test User",
    });
  });

  test("returns 409 when email already exists", async () => {
    const app = await build();
    await app.inject({
      method: "POST",
      url: "/api/v1/users",
      payload: { email: "test@example.com", name: "First" },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/users",
      payload: { email: "test@example.com", name: "Duplicate" },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: "USER_EXISTS" });
  });
});
```

Service unit test pattern:

```typescript
import { createUser } from "./service";
import { db } from "@/db/client";

vi.mock("@/db/client");

test("throws USER_EXISTS when email is taken", async () => {
  vi.mocked(db.user.findByEmail).mockResolvedValue({ id: "1", email: "a@b.com" });

  await expect(createUser({ email: "a@b.com", name: "X" }))
    .rejects.toThrow("User already exists");
});
```

**File structure:**
- Tests colocated with source: `user-service.ts` → `user-service.test.ts`
- Shared test utilities in `src/test/` (app builder, factories, fixtures)
- Test database setup/teardown in `src/test/setup.ts`

---

## Logging

Use `pino` (built into Fastify) for structured JSON logging.

**Rules:**
- Never use `console.log` — use `request.log` inside handlers, `fastify.log` outside
- Log levels: `error` for failures, `warn` for recoverable issues, `info` for request lifecycle, `debug` for development only
- Include request ID in all log entries (Fastify does this automatically)
- PII masking — never log full email, phone, government ID, payment details:

```typescript
request.log.info({
  userId: user.id,
  email: maskEmail(user.email), // "t***@example.com"
  action: "login_success",
});
```

- Redact sensitive headers in Fastify logger config:

```typescript
const app = Fastify({
  logger: {
    redact: ["req.headers.authorization", "req.headers.cookie"],
  },
});
```

---

## What NOT to Do

- No `console.log` — use pino / `request.log`
- No `any` — use `unknown` + type narrowing
- No raw SQL string concatenation — parameterized queries only
- No business logic in handlers — delegate to service layer
- No routes without schemas — every route needs `{ schema }` for OpenAPI
- No hardcoded secrets — `process.env` with Zod validation at startup
- No raw error messages to clients — always `{ error, code, details? }`
- No untyped `catch(e)` — narrow the error type or use `AppError`
- No `setTimeout` / `setInterval` for scheduling — use a proper job queue
- No modifying existing migration files — always create new ones
