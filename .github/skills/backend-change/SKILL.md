---
name: backend-change
description: Assess, design, implement, and validate an explicitly requested server, API, worker, cloud-save, database, or authentication change. Use whenever a request implies backend behavior, even though the repository currently has no backend.
license: ISC
compatibility: The backend runtime must be selected and documented by the task.
---

# Backend change

## Establish scope before coding

1. Confirm the task explicitly requires a backend. The current product is a static
   Vite application with localStorage persistence.
2. Read `AGENTS.md`, `.github/instructions/backend.instructions.md`, and the backend
   proposal in `docs/plan.md`.
3. Define the runtime, hosting platform, data store, trust boundaries, API contract,
   authentication model, availability expectations, and local workflow.
4. Prefer an optional service that does not prevent offline or static gameplay.
5. Do not choose infrastructure, dependencies, or secret names without documenting
   why they are required.

## Implement

- Separate contracts, validation, authorization, business logic, and persistence.
- Treat all client input and stored data as untrusted.
- Keep secrets server-side and grant every service the minimum permissions needed.
- Add bounded payloads, explicit CORS, timeouts, retries only for idempotent
  operations, rate limits, and non-sensitive errors.
- Version data and API contracts and provide migration and rollback behavior.

## Validate

- Test malformed input, unauthorized access, ownership violations, replay/retry,
  storage failures, limits, and browser contract compatibility.
- Run backend checks plus all existing frontend checks.
- Scan dependencies and committed files for vulnerabilities and secrets.
- Update CI, architecture, setup documentation, `AGENTS.md`, `llms.txt`, and the
  changelog.
