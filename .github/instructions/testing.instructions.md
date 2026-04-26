---
description: Rules for writing and editing tests (unit, integration, E2E, fuzz)
applyTo: 'tests/**'
---

# Testing Instructions

## Test Suite Structure

| Directory | Runner | Purpose | Naming |
|---|---|---|---|
| `tests/unit/` | Vitest | Isolated module tests | `<module>.test.ts` |
| `tests/integration/` | Vitest | Cross-module interaction tests | `<feature>.test.ts` |
| `tests/e2e/` | Playwright | Browser-based end-to-end flows | `<flow>.spec.ts` |
| `tests/fuzz/` | Playwright | Monkey/fuzz testing | `<target>.spec.ts` |
| `tests/mocks/` | — | Shared mock implementations | `<module>-mock.ts` |

## Test Subdirectories

Unit and integration tests mirror the `frontend/src/` structure:

| Test Dir | Covers |
|---|---|
| `tests/unit/battle/` | `frontend/src/battle/` (damage, EXP, catch, FSM, AI) |
| `tests/unit/data/` | `frontend/src/data/` (data integrity, interface conformance) |
| `tests/unit/managers/` | `frontend/src/managers/` (GameManager, SaveManager, etc.) |
| `tests/unit/scenes/` | `frontend/src/scenes/` (scene lifecycle, event handling) |
| `tests/unit/systems/` | `frontend/src/systems/` (grid movement, encounters, weather) |
| `tests/unit/utils/` | `frontend/src/utils/` (math helpers, constants) |
| `tests/integration/battle/` | Battle subsystem integration |
| `tests/integration/managers/` | Manager interaction tests |
| `tests/integration/systems/` | System integration tests |

## Available Mocks

| Mock | Purpose |
|---|---|
| `mocks/phaser-mock.ts` | Stubs for Phaser.Scene, Phaser.GameObjects, etc. |
| `mocks/local-storage-mock.ts` | In-memory localStorage for SaveManager tests |

## Rules

1. **Determinism**: Seed `Math.random` in `beforeEach` using the seeded-random utility.
2. **Singleton reset**: Reset `GameManager`, `SaveManager`, `EventManager`, etc. in `beforeEach`.
3. **Data-driven**: Use `it.each()` for exhaustive coverage of type matchups, move effects, etc.
4. **No real DOM**: Unit tests use mocked Phaser objects, not a real canvas.
5. **Fast**: Unit + integration suite must run in < 2s. Keep tests small and focused.
6. **Coverage**: Run `npm run test:coverage` to check V8 coverage before major PRs.

## Commands

```bash
npm run test              # All unit + integration (< 2s)
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:watch        # Watch mode for development
npm run test:coverage     # With V8 coverage report
npm run test:e2e          # Playwright E2E (needs dev server)
npm run test:fuzz         # Fuzz/monkey testing
npm run test:all          # All Vitest + Playwright
```

## Config

- Vitest config: `tests/vitest.config.ts`
- Test setup: `tests/setup.ts`
- E2E config: `tests/e2e/playwright.config.ts`
