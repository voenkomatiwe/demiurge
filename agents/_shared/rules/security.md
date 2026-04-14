# Security Rules

Applies to all agents. Non-negotiable baseline. Extend for your project's threat model.

## Secrets

- **Never hardcode** credentials, tokens, API keys, passwords.
- Use environment variables. Validate them at startup, never lazy-load.
- `.env` files are protected — the `protect-files.sh` hook blocks edits.
- If a value looks suspicious (long random string, `sk_`, `pk_live_`, AWS keys, etc.) — STOP and ask the Owner.

## Input Validation

- Validate ALL external input at system boundaries: HTTP handlers, webhooks, form submissions, query parameters, file uploads.
- Use the project's chosen schema validator. Enforce schemas on every route/handler.
- Trust internal types — do not re-validate inside internal modules.

## Injection

- Use parameterized queries. Never string-concatenate user input into SQL, GraphQL, or shell commands.
- No dynamic `eval`, `Function()`, or template-stringed queries on user data.
- For templated rendering, use autoescaping templates.

## XSS

- In frameworks with auto-escaping (React, Vue, Svelte), do NOT use the raw-HTML escape hatch (`dangerouslySetInnerHTML`, `v-html`, `{@html}`) on user content.
- If HTML rendering is required, sanitize with a vetted library (DOMPurify or equivalent).
- CSP headers on production deploys.

## Auth (Better Auth)

- Session tokens → httpOnly + Secure + SameSite=Lax cookies.
- OTP codes: ≥6 digits, ≤5-minute TTL, single-use.
- Rate-limit auth endpoints (login, OTP request, magic link).
- Magic link tokens are single-use and expire in ≤15 minutes.
- Never log full tokens, OTPs, or session IDs.
- Follow the `better-auth-best-practices` skill for server/client setup, adapters, plugins, and hooks.

## Errors

- **Never leak stack traces, DB errors, or internal paths** to HTTP responses.
- Use a structured error shape: `{ error: string, code: string, details?: object }`.
- Log the full error server-side with a request ID; return a correlation ID to the client.

## Dependencies

- No installing packages without explicit approval if not already in the lockfile.
- Check for known CVEs before adding any dep (`npm audit`, `pnpm audit`, `bun audit`, etc.).
- Scrutinize postinstall scripts in any new package — they run arbitrary code.

## File Uploads

- Validate MIME type **server-side** (not just the `accept` attribute).
- Enforce size limits at both the application layer AND the reverse proxy / ingress.
- Never trust user-supplied filenames — generate server-side UUIDs for storage.
- Store uploads outside the webroot when possible.

## PII (Personally Identifiable Information)

- Identify PII in your project: names, emails, phones, government IDs, payment details, location data.
- Encrypt at rest via your database's native mechanisms.
- **Logs must never contain full PII.** Mask (e.g. `+1-XXX-***-1234`, `user@**.com`).
- Respect regional regulations (GDPR, CCPA, etc.) — document requirements via `demiurge decision add --title "..." --decision "..."`.

## Violations

If the reviewer agent finds a `🔴 CRITICAL` security issue → the task goes straight to `revision`, skipping PM approval.
