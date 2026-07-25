# Red-Green Proof Reference

Use this reference whenever a test is added, strengthened, or suspected of being
vacuous.

## Focus the target

Run the smallest command that exercises the test:

```bash
npm run test -- tests/unit/example.test.ts -t "behavior name"
```

Replace the example path and test name with the real file and case. Keep the full
`npm run test` for the final gate.

## Prove it fails for the right reason

1. Make the smallest temporary production mutation that should violate the new
   assertion.
2. Run the focused command and confirm it fails on the intended assertion.
3. Restore the production behavior before continuing. In an isolated worktree,
   restore only the deliberate mutation path, not unrelated user work.
4. Run the focused command again and confirm it passes.
5. Record the proof in the final report, for example: "Temporarily removed the
   stat-stage reset; the Haze test failed on the reset assertion; restored it and
   the test passed."

Do not commit the temporary mutation. If the test stays green while the behavior
is broken, the test is not proving the behavior and must be rewritten.

## Avoid green lies

- Do not re-implement the formula, state machine, parser, or selector from the
  production module inside the test.
- Do not assert only metadata such as a move name, event name, hit flag, or return
  type when the behavior is a state change.
- Do not satisfy a failing test by broadening mocks until the assertion no longer
  observes production behavior.
- Prefer fixed fixtures with known outcomes, boundary examples, property-level
  invariants, and calls into the real module under test.

## Treat failures as findings

When a strengthened assertion reveals a real bug, fix the production bug or report
it as blocked. Do not rename keys, skip cases, loosen expectations, or move the
assertion into a mock simply to make the command green.
