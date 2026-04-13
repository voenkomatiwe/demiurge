# Coding Style Rules

Applies to all code-producing agents (frontend, backend). Stack defaults below assume the base template: a **Bun workspaces monorepo** with `frontend/` (React + Vite + TS + Tailwind v4 + shadcn/ui) and `backend/` (Fastify + OpenAPI + Better Auth) as workspaces, a single shared `biome.json` at the repo root, and all build/lint/format commands run from the root through proxy scripts (`bun run build`, `bun run lint`, `bun run format`).

## General

- **Language**: All code and comments in English.
- **Formatter**: Biome (`{{PACKAGE_MANAGER_RUN}} format`). No ESLint, no Prettier, no manual formatting.
- **Linter**: Biome (`{{PACKAGE_MANAGER_RUN}} lint`). Zero violations before marking `review`.
- **Package manager**: `{{PACKAGE_MANAGER}}` (see `CLAUDE.md`). Commands below use this throughout.

## TypeScript

- `"strict": true` — no exceptions.
- **No `any`.** Use `unknown` if the type is genuinely unknown and narrow it.
- Explicit return types on exported functions. Inferred is fine for internal ones.
- `type` for unions/aliases, `interface` for object shapes that may be extended.
- Prefer `const` assertions over enums for simple value sets.

## React (frontend)

- **Components**: PascalCase filename = PascalCase component. One component per file.
- **Hooks**: `use*` prefix. Custom hooks in `frontend/src/hooks/`.
- **Props**: Typed with `interface`, destructured in signature.
- **State**: `useState` for local, external store (Zustand or Redux Toolkit) only when shared across components.
- **Effects**: Minimize. Prefer derived state. Cleanup always if subscribing.
- **Keys**: Stable IDs, never array index for reorderable lists.
- **No inline styles** — Tailwind classes only.

## Tailwind v4

- **Semantic classes only**: `bg-primary`, `text-foreground`, `border-border`.
- **Never** arbitrary values like `bg-[#3b82f6]` or `w-[437px]` in production.
- If a design value doesn't match a token → add the token to `@theme` in your CSS first.
- Breakpoints: mobile-first. `sm:`, `md:`, `lg:` scale UP.

## shadcn/ui

- Install from inside the frontend workspace: `cd frontend && {{PACKAGE_MANAGER_DLX}} shadcn@latest add [component]`.
- Customize by editing the generated file in `frontend/src/components/ui/` directly, not by wrapping.
- Do not duplicate shadcn primitives — use them.

## Fastify (backend)

- **Plugins** for modularity. Group related routes into a plugin.
- **Schemas** on every route: `{ body, params, querystring, response }` — required for OpenAPI generation.
- **OpenAPI docs** via `@fastify/swagger` + `@fastify/swagger-ui` — exposed at `/docs` in non-production environments.
- **Lifecycle hooks** for cross-cutting: auth check, logging, rate limit.
- Async/await, never raw promises.

## Better Auth

- Follow the `better-auth-best-practices` skill.
- Session cookies: httpOnly + Secure + SameSite=Lax.
- OTP: ≥6 digits, ≤5-minute TTL, single-use.
- Rate-limit auth endpoints.

## Imports

- Absolute imports via TS path aliases (`@/components/*`, `@/lib/*`).
- Sort order: external packages → aliased internal → relative. Biome handles this.
- No circular imports.

## Naming

| Kind | Convention | Example |
|------|------------|---------|
| Component | PascalCase | `HeroSection` |
| Function / variable | camelCase | `getUserById` |
| Constant | UPPER_SNAKE | `MAX_UPLOAD_SIZE` |
| Type / interface | PascalCase | `UserDTO` |
| File (component) | PascalCase | `HeroSection.tsx` |
| File (utility) | kebab-case | `format-currency.ts` |
| CSS var / design token | kebab-case | `--color-primary` |

## Comments

- Only where the code can't explain itself. Don't narrate what's obvious.
- JSDoc on exported functions with non-trivial behavior.
- No `TODO` comments without a task reference: `// TODO(TASK-042): retry logic`.

## File Size

- Component files: soft cap 200 lines. If larger → extract sub-components.
- Utility files: soft cap 150 lines. Split by concern.
- Fastify plugin files: soft cap 250 lines. Split by resource.

## Build Hygiene

- `{{PACKAGE_MANAGER_RUN}} build` and `{{PACKAGE_MANAGER_RUN}} lint` must pass before status `review`.
- No `console.log` in committed code — use a structured logger (`pino` on the backend, remove on the frontend).
- No `debugger` statements.
- No dead code. Delete instead of commenting out.
