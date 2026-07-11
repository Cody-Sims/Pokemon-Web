---
name: quality-gate
description: Select and run the repository's required build, test, map, browser, bundle, security, documentation, and diff checks. Use before committing or finalizing any implementation.
license: ISC
compatibility: Requires Node.js 22+, npm, and Playwright for browser checks.
---

# Quality Gate

## Determine the change surface

Inspect `git status --short` and `git diff --check`. Classify changed paths before
running checks:

- Documentation-only: review links, paths, dates, and instruction consistency.
- Agent workflow: validate JSON, test hooks with representative stdin payloads, and
  validate every `SKILL.md` frontmatter.
- TypeScript logic or data: focused tests, then `npm run test` and `npm run build`.
- Scene or UI: add focused Playwright coverage.
- Map: validate and preview the affected map, then validate all maps.
- Build or asset pipeline: build and run the bundle-size budget.
- Backend: run backend-specific tests and security checks in addition to frontend
  regression checks.

## Finish

1. Run checks to completion; do not hide failures with filters or altered tests.
2. Restore unrelated generated output.
3. Confirm required changelog, architecture, and `CONTEXT.md` updates.
4. Scan changed files for credentials and review dependency advisories when
   dependencies changed.
5. Review the complete diff and stage only explicit paths.
6. Report every check run and any unresolved pre-existing failure.
