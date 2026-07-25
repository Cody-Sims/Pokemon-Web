---
name: verification-discipline
description: "Strengthens tests and validation so green results are meaningful by proving tests fail, avoiding copied production logic, preserving failing assertions, adding timeouts for CPU-bound checks, adopting report-only gates, and checking build purity. Use when writing or reviewing tests, adding invariants, debugging suspicious green tests, or hardening CI; do not use for routine final gate selection alone."
license: MIT
metadata:
  version: "1.0.0"
  author: "Cody-Sims"
  tier: "core"
---

# Verification Discipline

Make validation credible: a green test must be able to catch the bug it claims to
cover, and a failing test is a finding rather than a nuisance.

## Start

1. Read `AGENTS.md` and `.github/instructions/testing.instructions.md` before
   editing tests.
2. Identify the behavior, invariant, or build property that must be protected.
3. Run the narrow existing test or command first to understand the baseline.
4. Load [references/red-green-proof.md](references/red-green-proof.md) when adding
   or strengthening a test.
5. Load [references/invariant-and-gate-patterns.md](references/invariant-and-gate-patterns.md)
   when turning scripts into CI-enforced checks, adding timeouts, adopting
   report-only gates, or checking build purity.

## Rules

- Prove the test can fail: temporarily break the production behavior, confirm the
  focused test goes red, restore the behavior, and report the proof.
- Never weaken or mock away an assertion to make the suite green. A failing test
  is evidence to investigate.
- Do not copy the production implementation into the test. Assert externally
  visible behavior, fixed examples, independent fixtures, or invariants.
- Strengthen weak assertions before trusting them. Checking only that an action
  hit, returned a name, or avoided a throw often misses the actual behavior.
- Put durable invariants in tests that run under `npm run test`, not in scripts
  that no gate invokes.
- Give CPU-bound tests explicit timeouts so parallel load does not create
  spurious failures.
- Treat build dirtiness as a defect or an explicit gate decision: run `git status
  --short` after build commands and inspect generated tracked output.

## Finish

Run the focused proof, then the relevant full gate from `quality-gate`. Report the
red-green proof, any assertion that exposed a production bug, any timeout or
report-only gate added, and whether the build left the worktree clean.
