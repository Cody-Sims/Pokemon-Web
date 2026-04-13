# Pokemon Web — Testing Architecture

## Overview

The testing system is a **5-layer automated test suite** designed to catch regressions in game logic, data integrity, UI flows, and scene stability — without requiring human playtesting. Tests are ordered by speed and cost: fast unit tests run on every change, while slow E2E/fuzz tests run before commits or nightly.

**Current stats:** 1089 tests across 33 test files, running in ~1 second (unit + integration).

---

## Directory Structure

```
tests/
├── vitest.config.ts              # Vitest configuration (path aliases, includes)
├── setup.ts                      # Global test setup (Math.random seed)
│
├── mocks/                        # Shared mocks
│   ├── phaser-mock.ts            # Minimal Phaser Scene/Game mock for Node
│   └── local-storage-mock.ts     # localStorage mock for Node
│
├── unit/                         # Layer 1: Pure-logic unit tests
│   ├── damage-calculator.test.ts
│   ├── damage-calculator-extended.test.ts
│   ├── catch-calculator.test.ts
│   ├── experience-calculator.test.ts
│   ├── type-chart.test.ts
│   ├── type-chart-exhaustive.test.ts
│   ├── battle-state-machine.test.ts
│   ├── status-effects.test.ts
│   ├── status-effects-extended.test.ts
│   ├── ai-controller.test.ts
│   ├── ai-controller-extended.test.ts
│   ├── math-helpers.test.ts
│   ├── seeded-random.test.ts
│   ├── data-integrity.test.ts
│   ├── data-integrity-extended.test.ts
│   ├── map-data.test.ts
│   ├── audio-keys.test.ts
│   └── constants.test.ts
│
├── integration/                  # Layer 2: Multi-module integration tests
│   ├── game-manager.test.ts
│   ├── save-load.test.ts
│   ├── save-load-extended.test.ts
│   ├── battle-flow.test.ts
│   ├── full-battle-scenarios.test.ts
│   ├── encounter-system.test.ts
│   ├── encounter-extended.test.ts
│   ├── move-executor.test.ts
│   ├── move-executor-extended.test.ts
│   ├── event-manager.test.ts
│   ├── evolution.test.ts
│   ├── evolution-extended.test.ts
│   ├── inventory.test.ts
│   └── dialogue-manager.test.ts
│
├── e2e/                          # Layer 3: Headless browser tests (Playwright)
│   ├── playwright.config.ts
│   ├── boot-to-title.spec.ts
│   ├── new-game-flow.spec.ts
│   └── menu-navigation.spec.ts
│
├── replay/                       # Layer 4: Deterministic replay tests
│   ├── replay-types.ts
│   ├── replay-runner.ts
│   ├── replay.test.ts
│   └── replays/
│       └── starter-battle.json
│
└── fuzz/                         # Layer 5: Monkey / fuzz testing
    └── fuzz.test.ts
```

---

## Layer 1: Unit Tests

**Purpose:** Test every pure-logic module in isolation — battle math, data lookups, utility functions. Zero Phaser dependency.

| Module Under Test | Test Files | What's Verified |
|---|---|---|
| `DamageCalculator` | `damage-calculator.test.ts`, `-extended.test.ts` | Base damage formula, STAB, type effectiveness, crits, random factor, stat stages, burn halving physical attack, physical vs special routing |
| `CatchCalculator` | `catch-calculator.test.ts` | Catch rate scaling, status bonuses (sleep=2×, burn=1.5×), HP scaling, ball multiplier, shake mechanics, edge cases (invalid data, 0 multiplier) |
| `ExperienceCalculator` | `experience-calculator.test.ts` | EXP formula, trainer bonus, level-up triggers, multi-level ups, new move detection, stat recalculation, nature modifiers (all 25 natures) |
| `BattleStateMachine` | `battle-state-machine.test.ts` | State transitions, enter/exit/update handlers, handler invocation order, unregistered state safety |
| `StatusEffectHandler` | `status-effects.test.ts`, `-extended.test.ts` | Burn (½ attack, 1/16 end-of-turn), paralysis (¼ speed, 25% skip), sleep (turn counting), freeze (20% thaw, fire thaw), poison (1/8), bad-poison (escalating), confusion (self-hit, wear off), flinch, leech seed (drain + heal, grass immunity), trapping (4-5 turns, 1/8 dmg), stat stage multipliers (-6 to +6), stat change effects, drain/recoil/heal/self-destruct, move effect chance, type immunities, single-status rule, cleanup |
| `AIController` | `ai-controller.test.ts`, `-extended.test.ts` | Wild random selection, trainer super-effective preference, power×effectiveness scoring, 0-PP avoidance, fallback to tackle, single move & unknown opponent |
| `type-chart` | `type-chart.test.ts`, `-exhaustive.test.ts` | All 48 super-effective matchups, all 8 immunities, 324 (18×18) matchup validity, combined dual-type effectiveness (4×, 0.25×, 0×), normal-type has no SE |
| `math-helpers` | `math-helpers.test.ts` | `clamp`, `lerp`, `randomInt`, `randomFloat`, `weightedRandom` — edge cases, boundary conditions, distribution |
| `seeded-random` | `seeded-random.test.ts` | Determinism, different seeds, [0,1) range, distribution quality (10-bucket chi-square), edge seeds (0, negative, MAX_SAFE_INTEGER) |
| `data-integrity` | `data-integrity.test.ts`, `-extended.test.ts` | All pokemon have valid types, stats > 0, learnset references valid moves, learnsets sorted/deduplicated, catch rate > 0, evolution targets exist, sprite keys present, starter balance. All moves have valid types/categories/accuracy/PP, status moves null power, effect field validation (flinch chance, recoil amount, drain target, status values, priority). All items have valid categories/effects, pokeballs have multipliers, Super Potion > Potion. All trainers reference valid pokemon/moves, have dialogue, gym leader scaling. All encounter tables reference valid pokemon, valid level ranges, positive weights. Evolution chains acyclic, no self-evolution, all sources/targets exist. |
| `map-data` | `map-data.test.ts` | Tile constants unique, all tiles have colors, SOLID_TILES correctness (trees/water/walls solid; paths/doors/grass not) |
| `audio-keys` | `audio-keys.test.ts` | BGM/SFX keys non-empty, unique, expected tracks exist, MAP_BGM maps to valid BGM keys |
| `constants` | `constants.test.ts` | All game constants valid ranges (TILE_SIZE > 0, CRIT_CHANCE ∈ (0,1), MAX_PARTY_SIZE = 6, etc.) |

---

## Layer 2: Integration Tests

**Purpose:** Test multi-module interactions with mocked Phaser. Verify that modules compose correctly for real game flows.

| Test File | What's Verified |
|---|---|
| `game-manager.test.ts` | Singleton pattern, party add/set/max-6 cap, bag CRUD with stacking, money earn/spend/insufficient, badges dedup, flags, trainer defeat tracking, pokedex seen/caught, position/map, full serialize→deserialize round-trip |
| `save-load.test.ts`, `-extended.test.ts` | Save creates localStorage entry, load returns valid SaveData, corrupted data returns null, version/timestamp present, full round-trip (save→clear→load→restore with party, bag, pokedex, trainers, flags), pokemon field preservation (nickname, status, EVs, friendship), multi-item bag, 6-pokemon party, multiple save/load cycles |
| `battle-flow.test.ts`, `full-battle-scenarios.test.ts` | BattleManager init, selectMove turn execution, damage dealing, VICTORY/DEFEAT transitions, flee mechanics (wild yes, trainer no), pokemon switching (valid, fainted, out-of-range), EXP award chain, end-of-turn burn damage, multi-turn battle to victory, multi-pokemon party battles, trainer multi-enemy parties, speed-based turn order, priority move override, paralysis speed reduction in battle, status accumulation over turns |
| `move-executor.test.ts`, `-extended.test.ts` | All standard moves execute, PP deduction, miss handling, status moves no damage, OHKO (miss or KO), fixed damage (Sonic Boom=20, Dragon Rage=40), level damage (Seismic Toss, Night Shade), Super Fang (halve HP), multi-hit (2-5 or fixed 2), self-destruct, drain healing, recoil damage, fire thawing, Haze execution, Growl stat lowering, Absorb drain, Take Down recoil, HP clamping. **Every move in moveData** tested for crash-free execution. |
| `encounter-system.test.ts`, `-extended.test.ts` | Encounter triggering, non-zone returns null, encounter rate gating, valid pokemon from table, level range enforcement, repel step counting, createWildPokemon for **every registered species** (stats, IVs, EVs, moves, HP), level scaling, weighted distribution over 1000 samples |
| `event-manager.test.ts` | Singleton, on/emit/off, multiple listeners, clear specific/all, no-throw on unregistered emit |
| `evolution.test.ts`, `-extended.test.ts` | Evolution threshold detection, all 3 starter chains, stat improvement after evolution, item-based evolution (Pikachu→Thunder Stone), **every level-based evolution** tested for trigger, evolved form has higher base stat total, nature effects on all 25 natures, EXP formula edge cases (level 1, level 100, 0 EXP, massive EXP) |
| `inventory.test.ts` | Potion healing + HP cap, pokeball catch rates (1×, 1.5×, 2×), medicine status curing, item purchase flow |
| `dialogue-manager.test.ts` | Singleton, set/get/clear queue, array copy safety, empty/single/many lines |

---

## Layer 3: End-to-End Tests (Playwright)

**Purpose:** Boot the real game in a headless browser, verify rendering and input handling work without crashes.

| Test | What's Verified |
|---|---|
| `boot-to-title.spec.ts` | Canvas renders, no console errors on boot, canvas has valid dimensions |
| `new-game-flow.spec.ts` | Title → New Game transition works without crash |
| `menu-navigation.spec.ts` | Menu opens/closes without crash |

---

## Layer 4: Deterministic Replay System

**Purpose:** Record player inputs as JSON, replay under seeded PRNG for exact reproducibility.

| Component | Purpose |
|---|---|
| `seeded-random.ts` | Mulberry32 PRNG for deterministic `Math.random` replacement |
| `replay-types.ts` | TypeScript interfaces for replay format (frames, assertions) |
| `replay-runner.ts` | Playwright-based headless replay executor |
| `replay.test.ts` | Vitest tests verifying PRNG determinism |
| `replays/*.json` | Recorded input sequences with frame-level assertions |

---

## Layer 5: Fuzz / Monkey Testing

**Purpose:** Throw random inputs to find crashes and unhandled errors.

| Test | What's Verified |
|---|---|
| `fuzz.test.ts` | 2000 seeded random keypresses (arrows, Enter, Escape, z, x) — game must not throw unhandled errors. Screenshots captured every 500 inputs for debugging. |

---

## Running Tests

| Command | What Runs | Expected Time |
|---|---|---|
| `npm run test` | Unit + integration tests (Vitest) | < 2s |
| `npm run test:unit` | Unit tests only | < 1s |
| `npm run test:integration` | Integration tests only | < 1s |
| `npm run test:watch` | Watch mode — re-runs on file change | Continuous |
| `npm run test:coverage` | Unit + integration with V8 coverage report | < 5s |
| `npm run test:e2e` | Playwright E2E tests (needs dev server) | ~30s |
| `npm run test:fuzz` | Fuzz/monkey testing (Playwright) | ~120s |
| `npm run test:all` | Vitest + Playwright combined | ~30s |

---

## Test Writing Conventions

### File Naming
- Unit tests: `tests/unit/<module-name>.test.ts` (optionally `<module-name>-extended.test.ts` for deep coverage)
- Integration tests: `tests/integration/<feature-name>.test.ts`
- E2E tests: `tests/e2e/<flow-name>.spec.ts`

### Common Test Helpers
All test files can use a standard `makePokemon()` factory:
```typescript
const makePokemon = (overrides?: Partial<PokemonInstance>): PokemonInstance => ({
  dataId: 4, level: 10, currentHp: 30,
  stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 },
  ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy', moves: [{ moveId: 'ember', currentPp: 25 }],
  status: null, exp: 0, friendship: 70, ...overrides,
});
```

### Determinism
Seed `Math.random` in `beforeEach` for reproducible tests:
```typescript
beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(0.5); });
```

### Singleton Reset
Reset singleton managers before each test:
```typescript
beforeEach(() => {
  // @ts-expect-error private access for test reset
  GameManager.instance = undefined;
});
```

---

## Agent Workflow

When making changes, follow this order:

1. **`npm run test`** — Fast feedback on logic correctness (< 2s)
2. **`npm run test:e2e`** — Verify the game boots and basic flows work (~30s)
3. **If modifying battle logic:** check the `-extended` test files for coverage
4. **If modifying data files:** data integrity tests will catch cross-reference errors
5. **If doing a major refactor:** run `npm run test:fuzz`

### Adding Tests for New Features

1. Create a test file in `tests/unit/` or `tests/integration/`
2. Import the module under test with path aliases (resolved by `vitest.config.ts`)
3. Mock `Math.random` for determinism
4. Test edge cases: invalid input, boundary values, error paths
5. For data-driven tests, use `it.each()` for exhaustive coverage
6. Run `npm run test` to verify

---

## Coverage Goals

| Area | Target | Current Status |
|---|---|---|
| `battle/` modules | ≥90% | ✅ All 8 modules tested extensively |
| `data/` integrity | 100% cross-refs | ✅ All pokemon/move/item/trainer/encounter/evolution validated |
| `managers/` | ≥85% | ✅ GameManager, SaveManager, EventManager, DialogueManager tested |
| `systems/` | ≥80% | ✅ EncounterSystem tested (GridMovement/InputManager require Phaser) |
| `utils/` | 100% | ✅ All 5 utility modules tested |
| `type-chart` | 100% (324 matchups) | ✅ Exhaustive validation |
| `constants/` | 100% | ✅ All constants validated |
| Zero-crash guarantee | 2000+ random inputs | ✅ Fuzz test configured |
