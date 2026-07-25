---
name: quality-gate
description: Select and run the repository's required build, test, map, browser, bundle, security, documentation, and diff checks. Use before committing or finalizing any implementation.
license: ISC
compatibility: Requires Node.js 22+, npm, and Playwright for browser checks.
---

# Quality Gate

## Non-negotiables

- Verify commands and paths before citing them; do not assume documented commands
  still work.
- Never make a gate pass by weakening it: do not lower coverage thresholds,
  loosen assertions, mock away the failing behavior, add `.skip`/`.only`, hide
  output with filters, or convert real failures into warnings.
- `npm run lint` is report-only: warnings are expected and exit 0. Fix errors,
  but do not change lint config, `--max-warnings`, or existing warning severity
  just to make the output quieter.
- `npm run test:coverage` reads thresholds from `tests/vitest.config.ts`; raise
  coverage with code/tests instead of lowering thresholds.
- Builds must be deterministic. After build or generator work, check for dirty
  tracked files. New generators must not embed wall-clock timestamps.

## Determine the change surface

Inspect `git status --short` and `git diff --check`. Classify changed paths before
running checks:

- Documentation-only: review links, paths, dates, and instruction consistency.
- Agent workflow: run `npm run agent:validate`, test hooks with representative
  stdin payloads, and run `npm run agent:global:check` when the global toolkit changed.
- Shadow architecture: run `npm run shadow:validate`, then compare affected records
  with their current code, documentation, and test evidence.
- TypeScript logic or data: focused tests, `npm run lint`,
  `npm run format:check`, `npm run test`, and `npm run build`.
- Coverage-sensitive changes: also run `npm run test:coverage`.
- Scene or UI: add focused Playwright coverage.
- Map: validate and preview the affected map with the tracked `scripts/map-gen/`
  toolchain, then validate all maps.
- Build or asset pipeline: run affected generators, `npm run build`, the
  bundle-size budget, and a tracked-file cleanliness check.
- Backend: run backend-specific tests and security checks in addition to frontend
  regression checks.

`npm run test` includes the production import-cycle guard under
`tests/unit/architecture/` and the cross-reference data integrity guard under
`tests/unit/data/data-integrity.test.ts`.

## Finish

1. Run checks to completion; report warnings separately from failures.
2. Restore unrelated generated output and confirm build purity.
3. Confirm required changelog, bug tracker, architecture, and `CONTEXT.md` updates.
4. Scan changed files for credentials and review dependency advisories when
   dependencies changed.
5. Review the complete diff and stage only explicit paths.
6. Report every check run and any unresolved pre-existing failure.
