# Invariant and Gate Patterns

Use this reference for architectural invariants, expensive checks, report-only
linters, and build-purity validation.

## Enforce invariants with tests

A script that no required command runs is only documentation. Put durable checks
under `tests/` so `npm run test` enforces them. This repository's import-cycle
coverage lives in `tests/unit/architecture/import-cycles.test.ts` and runs as part
of the Vitest suite.

## Add explicit timeouts for CPU-bound tests

Vitest's default timeout can be too short when a test parses many source files or
performs heavy graph work under parallel load. Use the third argument to `it` for
bounded CPU-heavy tests:

```ts
it('does not contain runtime import cycles', () => {
  // bounded CPU-heavy assertion
}, 60_000);
```

Use Playwright's `test.setTimeout(120_000);` pattern for browser journeys that are
bounded but slow because the game boots and renders scenes.

## Adopt new gates report-only first

When a new linter or formatter reveals a large existing backlog, make it visible
without blocking unrelated work:

```bash
npm run lint
npm run format:check
```

A report-only gate may emit warnings while exiting zero. Do not convert it into a
blocking error gate until the backlog is burned down or the command is scoped to
new violations.

## Verify build purity

Builds should not leave tracked files dirty unless the repository's gate
explicitly accepts and cleans generated churn.

```bash
git status --short
npm run build
git status --short
git diff -- frontend/public/assets
```

If a build changes tracked assets, determine whether a generator used wall-clock
time, nondeterministic ordering, environment-specific paths, or a stale checked-in
artifact. Fix determinism when possible; otherwise make the owning gate discard or
verify the accepted generated output deliberately.
