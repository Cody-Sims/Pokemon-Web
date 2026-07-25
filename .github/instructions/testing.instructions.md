---
description: Rules for writing and editing tests (unit, integration, E2E, fuzz)
applyTo: 'tests/**'
---

# Testing Instructions

## Test Suite Structure

| Directory            | Runner     | Purpose                        | Naming              |
| -------------------- | ---------- | ------------------------------ | ------------------- |
| `tests/unit/`        | Vitest     | Isolated module tests          | `<module>.test.ts`  |
| `tests/integration/` | Vitest     | Cross-module interaction tests | `<feature>.test.ts` |
| `tests/e2e/`         | Playwright | Browser-based end-to-end flows | `<flow>.spec.ts`    |
| `tests/fuzz/`        | Playwright | Monkey/fuzz testing            | `<target>.spec.ts`  |
| `tests/mocks/`       | —          | Shared mock implementations    | `<module>-mock.ts`  |

## Test Subdirectories

Unit and integration tests mirror the `frontend/src/` structure:

| Test Dir                      | Covers                                                       |
| ----------------------------- | ------------------------------------------------------------ |
| `tests/unit/battle/`          | `frontend/src/battle/` (damage, EXP, catch, FSM, AI)         |
| `tests/unit/data/`            | `frontend/src/data/` (data integrity, interface conformance) |
| `tests/unit/managers/`        | `frontend/src/managers/` (GameManager, SaveManager, etc.)    |
| `tests/unit/scenes/`          | `frontend/src/scenes/` (scene lifecycle, event handling)     |
| `tests/unit/systems/`         | `frontend/src/systems/` (grid movement, encounters, weather) |
| `tests/unit/utils/`           | `frontend/src/utils/` (math helpers, constants)              |
| `tests/integration/battle/`   | Battle subsystem integration                                 |
| `tests/integration/managers/` | Manager interaction tests                                    |
| `tests/integration/systems/`  | System integration tests                                     |

## Available Mocks

| Mock                          | Purpose                                          |
| ----------------------------- | ------------------------------------------------ |
| `mocks/phaser-mock.ts`        | Stubs for Phaser.Scene, Phaser.GameObjects, etc. |
| `mocks/local-storage-mock.ts` | In-memory localStorage for SaveManager tests     |

## Rules

1. **Determinism**: `tests/setup.ts` seeds `Math.random`; use explicit seeded RNGs
   when call order matters.
2. **Singleton reset**: Import `resetManagerSingletons()` from `@managers` in
   suites that touch managers and call it in `beforeEach`.
3. **Prove the test can fail**: New regression tests must fail against the broken
   behavior. Do not copy or reimplement the production algorithm as the expected
   value.
4. **Fix causes, not tests**: Do not weaken assertions, mocks, coverage
   thresholds, or add skips to make a failing gate pass.
5. **Data-driven**: Use `it.each()` for exhaustive coverage of type matchups, move
   effects, registry entries, and data cross-references.
6. **No real DOM**: Unit tests use mocked Phaser objects, not a real canvas.
7. **Fast with explicit timeouts**: Keep tests small. If a CPU-bound regression
   test is intentionally expensive, raise only that test's timeout.
8. **Coverage**: `npm run test:coverage` enforces thresholds from
   `tests/vitest.config.ts`; do not lower them to pass.

## Commands

```bash
npm run test              # All unit + integration (< 2s)
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:watch        # Watch mode for development
npm run test:coverage     # With V8 coverage report
npm run test:e2e          # Playwright E2E (starts Vite automatically)
npm run test:fuzz         # Fuzz/monkey testing
npm run test:all          # All Vitest + Playwright
```

## Config

- Vitest config: `tests/vitest.config.ts`
- Test setup: `tests/setup.ts`
- E2E config: `tests/e2e/playwright.config.ts`
