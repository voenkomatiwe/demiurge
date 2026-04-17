---
title: Web Security
based-on: []
owns-labels: ["area:web", "area:security"]
spawns-issues-on-change:
  - section: "## Authentication"
    labels: ["role:backend", "area:auth", "area:security", "type:feature"]
  - section: "## Threat model"
    labels: ["role:backend", "area:security", "type:refactor"]
---

# Web Security

Threat model and defences for the web application. Read this **before** touching auth, inputs, or third-party integrations.

## Threat model

<!--
Who might attack, what they'd gain, what's in scope to defend against.
Recommended framework: STRIDE (Spoofing, Tampering, Repudiation, Info disclosure, Denial of service, Elevation of privilege).
For each category, note the mitigations we rely on.
-->

## Authentication

- Auth provider / library:
- Session vs. token:
- Cookie attributes (Secure, HttpOnly, SameSite):
- Password policy / OTP / magic link / OAuth:
- Rate limiting on auth endpoints:

## Authorization

<!--
Who can do what. Role-based, attribute-based, or resource-based?
Where the check happens (middleware, route, service layer).
-->

## Input validation

- Library:
- Where: at the HTTP boundary (Fastify schemas) AND at the service layer (defence in depth).
- Sanitization for HTML / SQL / shell: what we do, what we explicitly don't need.

## Secrets management

- Where secrets live (env vars, vault, secrets manager):
- What never ends up in logs:
- Rotation procedure:

## Transport

- TLS everywhere (no HTTP fallback).
- HSTS header:
- CSP header:
- CORS policy:

## Dependencies

- How we monitor CVEs (Dependabot? Snyk?).
- SLA for patching critical vulnerabilities.

## Audit trail

<!--
Which actions are logged for audit? Where logs live. Retention.
-->

## Incident response

<!--
On breach: who is contacted, what is the first response, how users are notified.
Link to internal runbook if there is one.
-->
