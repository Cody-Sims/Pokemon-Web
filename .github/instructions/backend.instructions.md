---
description: Guardrails for introducing or changing an explicitly approved backend
applyTo: 'backend/**,workers/**'
---

# Backend instructions

## Current state

Pokémon Web has no backend. It is deployed as a static GitHub Pages application and
stores saves in browser localStorage. Files under `backend/` or `workers/` represent
an explicit architecture change and require the task to define the runtime,
deployment target, persistence model, and client integration.

## Design guardrails

- Keep the static game playable when an optional remote service is unavailable.
- Define request and response contracts independently from transport handlers.
- Validate all untrusted input at the boundary and return stable, non-sensitive
  errors.
- Keep secrets in deployment configuration; never expose service credentials in
  Vite variables, browser bundles, fixtures, logs, or committed files.
- Require authentication and authorization before reading or writing player data.
- Use least-privilege storage access, bounded request sizes, rate limits, timeouts,
  and explicit CORS origins.
- Make writes idempotent where retries are possible and version persisted schemas.
- Isolate backend dependencies and commands from the frontend build unless a shared
  contract package is deliberately introduced.

## Required documentation and validation

- Document the chosen runtime, local setup, environment variable names, deployment,
  data lifecycle, and rollback path.
- Add unit tests for validation and authorization, integration tests for storage and
  error paths, and contract tests for frontend integration.
- Add backend checks to CI without weakening existing frontend gates.
- Update `AGENTS.md`, `llms.txt`, `docs/architecture.md`, and the changelog when a
  backend is actually introduced.
