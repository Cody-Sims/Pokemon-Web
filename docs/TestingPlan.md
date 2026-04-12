# Pokemon Web — Testing Plan

## Goal

Create a comprehensive, **non-AI, low-cost** automated testing system that a coding agent (or any developer) can run to verify the game works end-to-end after making changes. The system should catch regressions in game logic, UI flows, data integrity, and scene transitions — without requiring a human to play through the game manually.

---

## Approaches Considered

### 1. Unit Tests with Vitest (Pure Logic) ✅ SELECTED
- **What:** Test all pure-logic modules (damage formulas, catch rate, EXP calc, type chart, state machine, save/load, inventory management) in isolation using **Vitest**, which shares our Vite config natively.
- **Pros:** Fastest to run, easiest to write, deterministic, great coverage of game math/logic. Zero browser required. Vitest has native TypeScript + path alias support via our existing `vite.config.ts`.
- **Cons:** Can't test rendering, scene transitions, or input handling.
- **Cost:** Free (open-source tooling, runs locally in Node).

### 2. Integration Tests with Mocked Phaser ✅ SELECTED
- **What:** Test managers (GameManager, SaveManager, EventManager) and systems (EncounterSystem, BattleManager) by mocking Phaser's Scene/Game objects. Validate that multi-module interactions work correctly (e.g., "battle starts → damage is dealt → EXP awarded → level up → new move learned").
- **Pros:** Catches bugs at the boundary between modules. Tests real game flows without a browser.
- **Cons:** Requires writing Phaser mocks/stubs. Some effort to maintain.
- **Cost:** Free.

### 3. Headless End-to-End Tests with Playwright ✅ SELECTED (Targeted)
- **What:** Boot the actual game in a headless Chromium browser via Playwright. Use **scripted input sequences** (keypresses, waits) to automate gameplay flows. Take screenshots at checkpoints for visual regression.
- **Pros:** Tests the real game in a real browser. Catches rendering bugs, scene crashes, and input issues.
- **Cons:** Slower, more brittle, harder to debug. Requires Playwright install (~200MB for browsers).
- **Cost:** Free (open-source). Runs in CI.

### 4. Deterministic Replay / Input Recording System ✅ SELECTED
- **What:** Build a lightweight **input recorder** into the game's debug mode. Record player inputs (direction, action, frame) as JSON. Replay them headlessly and assert on game state at specific frames.
- **Pros:** Record once, replay forever. Tests real gameplay paths deterministically. Great for regression testing after refactors.
- **Cons:** Requires seeding `Math.random()` for determinism. Replays break if game timing changes significantly.
- **Cost:** Free (custom code).

### 5. AI Agent Playtesting ❌ REJECTED
- **What:** Use an LLM or RL agent to play the game and report issues.
- **Why rejected:** Too costly (API calls per frame), non-deterministic, complex to build, hard to debug failures.

### 6. Monkey Testing / Fuzz Testing ✅ SELECTED (Lightweight)
- **What:** Inject random inputs into the game at high speed for N frames. If the game crashes or throws an unhandled error, the test fails.
- **Pros:** Excellent at finding edge cases and crashes. Zero manual effort to write test cases.
- **Cons:** Non-deterministic (use seed for reproducibility). Doesn't validate correctness, only stability.
- **Cost:** Free.

---

## Architecture

```
pokemon-web/
├── tests/
│   ├── vitest.config.ts          # Vitest configuration (extends vite.config)
│   ├── setup.ts                  # Global test setup (mock Phaser, seed random)
│   │
│   ├── unit/                     # Layer 1: Unit tests
│   │   ├── damage-calculator.test.ts
│   │   ├── catch-calculator.test.ts
│   │   ├── experience-calculator.test.ts
│   │   ├── type-chart.test.ts
│   │   ├── battle-state-machine.test.ts
│   │   ├── status-effects.test.ts
│   │   ├── ai-controller.test.ts
│   │   ├── math-helpers.test.ts
│   │   └── data-integrity.test.ts
│   │
│   ├── integration/              # Layer 2: Integration tests
│   │   ├── game-manager.test.ts
│   │   ├── save-load.test.ts
│   │   ├── battle-flow.test.ts
│   │   ├── encounter-system.test.ts
│   │   ├── inventory.test.ts
│   │   ├── evolution.test.ts
│   │   └── move-executor.test.ts
│   │
│   ├── e2e/                      # Layer 3: End-to-end (Playwright)
│   │   ├── playwright.config.ts
│   │   ├── boot-to-title.spec.ts
│   │   ├── new-game-flow.spec.ts
│   │   ├── battle-flow.spec.ts
│   │   ├── save-continue.spec.ts
│   │   └── menu-navigation.spec.ts
│   │
│   ├── replay/                   # Layer 4: Replay system tests
│   │   ├── replays/              # Recorded input JSON files
│   │   │   ├── starter-battle.json
│   │   │   └── full-route1.json
│   │   ├── replay-runner.ts      # Headless replay executor
│   │   └── replay.test.ts        # Vitest wrapper for replays
│   │
│   ├── fuzz/                     # Layer 5: Fuzz / monkey testing
│   │   ├── monkey-tester.ts      # Random input generator
│   │   └── fuzz.test.ts
│   │
│   └── mocks/                    # Shared mocks
│       ├── phaser-mock.ts        # Minimal Phaser mock (Scene, Game, etc.)
│       └── local-storage-mock.ts # localStorage mock for Node
```

---

## Layer 1: Unit Tests (Vitest)

### What to test

| Module | Key assertions |
|--------|---------------|
| `DamageCalculator` | Damage is > 0 for attacking moves; 0 for status moves; STAB multiplier applied; type effectiveness correct; critical hit multiplier applied |
| `CatchCalculator` | Full-HP legendary = low catch rate; 1-HP sleep = high catch rate; Master Ball (255 rate) = always caught |
| `ExperienceCalculator` | EXP scales with level; trainer battle gives bonus; level-up triggers correctly; nature multipliers correct |
| `type-chart` | Every type matchup is correct (fire > grass, water > fire, etc.); neutral = 1; immune = 0 |
| `BattleStateMachine` | Valid transitions work; `enter`/`exit` handlers fire; state is updated |
| `StatusEffectHandler` | Burn halves attack; paralysis halves speed; sleep prevents action; poison does damage each turn |
| `AIController` | AI prefers super-effective moves; AI uses healing items when HP is low |
| `math-helpers` | `clamp`, `lerp`, `randomInt`, `weightedRandom` return correct ranges |
| `pokemon-data` | All Pokémon have valid types, base stats > 0, learnsets reference valid moves |
| `move-data` | All moves have valid types, PP > 0, power is null for status moves |
| `item-data` | All items have valid categories and effects |
| `trainer-data` | All trainer parties reference valid Pokémon/moves |
| `encounter-tables` | All encounter entries reference valid Pokémon; weights sum correctly |

### Example test file

```typescript
// tests/unit/damage-calculator.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DamageCalculator } from '../../frontend/src/battle/DamageCalculator';
import { PokemonInstance, MoveData } from '../../frontend/src/data/interfaces';

// Seed Math.random for determinism
beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

describe('DamageCalculator', () => {
  const makeAttacker = (overrides?: Partial<PokemonInstance>): PokemonInstance => ({
    dataId: 4, // Charmander
    level: 10,
    currentHp: 30,
    stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 },
    ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
    evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
    nature: 'hardy',
    moves: [{ moveId: 'ember', currentPp: 25 }],
    status: null,
    exp: 0,
    friendship: 70,
    ...overrides,
  });

  it('should deal > 0 damage for a physical move', () => {
    const result = DamageCalculator.calculate(
      makeAttacker(),
      makeAttacker({ dataId: 1 }), // Bulbasaur (grass, weak to fire)
      { id: 'ember', name: 'Ember', type: 'fire', category: 'special', power: 40, accuracy: 100, pp: 25 },
    );
    expect(result.damage).toBeGreaterThan(0);
    expect(result.effectiveness).toBeGreaterThan(1); // super effective
  });

  it('should return 0 damage for status moves', () => {
    const result = DamageCalculator.calculate(
      makeAttacker(),
      makeAttacker(),
      { id: 'growl', name: 'Growl', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 40 },
    );
    expect(result.damage).toBe(0);
  });
});
```

### Data Integrity Tests

These are critical — they validate that all game data cross-references are valid:

```typescript
// tests/unit/data-integrity.test.ts
import { describe, it, expect } from 'vitest';
import { pokemonData } from '../../frontend/src/data/pokemon-data';
import { moveData } from '../../frontend/src/data/move-data';
import { trainerData } from '../../frontend/src/data/trainer-data';
import { encounterTables } from '../../frontend/src/data/encounter-tables';

describe('Data Integrity', () => {
  it('all Pokemon learnset moves exist in move-data', () => {
    for (const [id, pokemon] of Object.entries(pokemonData)) {
      for (const entry of pokemon.learnset) {
        expect(moveData[entry.moveId], `Pokemon ${pokemon.name} has invalid move ${entry.moveId}`).toBeDefined();
      }
    }
  });

  it('all trainer party Pokemon exist in pokemon-data', () => {
    for (const [id, trainer] of Object.entries(trainerData)) {
      for (const member of trainer.party) {
        expect(pokemonData[member.pokemonId], `Trainer ${trainer.name} has invalid Pokemon ID ${member.pokemonId}`).toBeDefined();
      }
    }
  });

  it('all encounter table Pokemon exist in pokemon-data', () => {
    for (const [route, entries] of Object.entries(encounterTables)) {
      for (const entry of entries) {
        expect(pokemonData[entry.pokemonId], `Route ${route} has invalid Pokemon ID ${entry.pokemonId}`).toBeDefined();
      }
    }
  });

  it('all Pokemon have base stats > 0', () => {
    for (const [id, pokemon] of Object.entries(pokemonData)) {
      for (const [stat, value] of Object.entries(pokemon.baseStats)) {
        expect(value, `${pokemon.name}.baseStats.${stat}`).toBeGreaterThan(0);
      }
    }
  });
});
```

---

## Layer 2: Integration Tests

Integration tests validate multi-module interactions with mocked Phaser objects.

### Phaser Mock Strategy

Most game logic modules (GameManager, BattleManager, SaveManager) have minimal Phaser dependencies. We create a lightweight mock:

```typescript
// tests/mocks/phaser-mock.ts
import { vi } from 'vitest';

export const createMockScene = () => ({
  add: { text: vi.fn(), image: vi.fn(), sprite: vi.fn(), rectangle: vi.fn() },
  cameras: { main: { fadeIn: vi.fn(), fadeOut: vi.fn() } },
  input: { keyboard: { addKeys: vi.fn(), on: vi.fn() } },
  scene: { start: vi.fn(), launch: vi.fn(), stop: vi.fn(), pause: vi.fn(), resume: vi.fn() },
  time: { delayedCall: vi.fn(), addEvent: vi.fn() },
  tweens: { add: vi.fn() },
  sound: { add: vi.fn(), play: vi.fn() },
  load: { image: vi.fn(), spritesheet: vi.fn(), audio: vi.fn(), tilemapTiledJSON: vi.fn() },
  sys: { events: { on: vi.fn(), emit: vi.fn() } },
});

// tests/mocks/local-storage-mock.ts
export const createLocalStorageMock = () => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  };
};
```

### Key Integration Scenarios

| Test | What it validates |
|------|------------------|
| **Battle flow** | Start battle → player attacks → enemy takes damage → enemy faints → EXP awarded → level up detected → new move offered |
| **Save/Load round-trip** | Modify GameManager state → save → clear state → load → verify all fields restored correctly |
| **Inventory management** | Add items → use potion in battle → item consumed → HP restored → verify bag updated |
| **Encounter system** | Walk N steps in grass → encounter triggers → correct level range → valid Pokemon from table |
| **Evolution** | Level up to evolution threshold → evolution triggered → base stats recalculated → correct new Pokemon |
| **Full battle** | Create two parties → run BattleManager through full battle → verify winner/loser, all state changes |

---

## Layer 3: End-to-End Tests (Playwright)

E2E tests boot the actual game in a headless browser and simulate real user interactions.

### Setup

```typescript
// tests/e2e/playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 8080,
    reuseExistingServer: true,
  },
});
```

### Key E2E Scenarios

```typescript
// tests/e2e/boot-to-title.spec.ts
import { test, expect } from '@playwright/test';

test('game boots and reaches title screen', async ({ page }) => {
  await page.goto('/');

  // Wait for canvas to appear (Phaser renders to <canvas>)
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 10_000 });

  // Take a screenshot to verify rendering (visual baseline)
  await page.screenshot({ path: 'tests/e2e/screenshots/title-screen.png' });
});

test('game does not throw console errors on boot', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  await page.waitForTimeout(5_000); // Let game boot fully

  expect(errors).toEqual([]);
});
```

### Input Simulation for Phaser

Since Phaser captures keyboard events on the canvas, we dispatch them directly:

```typescript
// Helper: press a key for N milliseconds (Phaser reads key-down state)
async function pressKey(page: Page, key: string, duration = 200) {
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
  await page.waitForTimeout(50); // brief pause between inputs
}

// Navigate the title menu
test('can start new game from title screen', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3000); // Wait for title

  await pressKey(page, 'Enter'); // Select "New Game"
  await page.waitForTimeout(2000);

  // Verify we left the title screen (take screenshot, check for overworld elements)
  await page.screenshot({ path: 'tests/e2e/screenshots/overworld.png' });
});
```

---

## Layer 4: Deterministic Replay System

The most powerful testing tool — record gameplay once, replay & assert forever.

### Architecture

```
[Game] ←→ [InputManager]
              ↕
        [InputRecorder]
              ↕ writes/reads
        [replay.json]
              ↕
        [ReplayRunner] (headless)
              ↕
        [State Assertions]
```

### Input Recorder (built into game's debug mode)

```typescript
// To be added to frontend/src/systems/InputRecorder.ts
interface InputFrame {
  frame: number;
  keys: string[];      // Keys currently held
  action?: string;     // 'confirm' | 'cancel' | 'menu'
}

interface ReplayData {
  version: number;
  seed: number;           // Math.random seed for determinism
  startState?: string;    // Optional: serialized SaveData to load before replay
  frames: InputFrame[];
  assertions: ReplayAssertion[];
}

interface ReplayAssertion {
  atFrame: number;
  type: 'state-check' | 'scene-active' | 'party-size' | 'pokemon-hp' | 'no-errors';
  expected: any;
}
```

### How it works

1. **Recording mode:** Enable with a debug flag (`?record=true` in URL). `InputRecorder` hooks into `InputManager` and logs every frame's key state to an array. On stop, exports JSON.

2. **Seeded randomness:** On replay, seed `Math.random` with the recorded seed using a simple PRNG (e.g., mulberry32). This makes battles, encounters, and critical hits deterministic.

3. **Replay mode:** `ReplayRunner` boots the game headlessly (in Playwright or jsdom), feeds recorded inputs frame-by-frame, and checks assertions at specified frames.

4. **Assertions:** At specific frames, check things like:
   - "Player is on route-1"
   - "Party has 1 Pokémon"
   - "Battle scene is active"
   - "No console errors"

### Seeded PRNG Implementation

```typescript
// frontend/src/utils/seeded-random.ts
export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Usage: replace Math.random in test/replay mode
let rng = mulberry32(12345);
Math.random = rng; // Only in test mode!
```

---

## Layer 5: Fuzz / Monkey Testing

A lightweight stress test that throws random inputs at the game to find crashes.

### Implementation

```typescript
// tests/fuzz/monkey-tester.ts
import { test, expect } from '@playwright/test';

const KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'z', 'x'];

test('monkey test: 2000 random inputs without crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  await page.waitForTimeout(3000);

  // Press Enter to start a new game
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);

  const rng = mulberry32(42); // Seeded for reproducibility

  for (let i = 0; i < 2000; i++) {
    const key = KEYS[Math.floor(rng() * KEYS.length)];
    const duration = Math.floor(rng() * 300) + 50;

    await page.keyboard.down(key);
    await page.waitForTimeout(duration);
    await page.keyboard.up(key);
    await page.waitForTimeout(20);

    // Every 200 inputs, take a screenshot for debugging
    if (i % 200 === 0) {
      await page.screenshot({ path: `tests/fuzz/screenshots/frame-${i}.png` });
    }
  }

  expect(errors).toEqual([]);
});
```

---

## Configuration

### `tests/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@scenes': path.resolve(__dirname, '../frontend/src/scenes'),
      '@entities': path.resolve(__dirname, '../frontend/src/entities'),
      '@data': path.resolve(__dirname, '../frontend/src/data'),
      '@battle': path.resolve(__dirname, '../frontend/src/battle'),
      '@managers': path.resolve(__dirname, '../frontend/src/managers'),
      '@systems': path.resolve(__dirname, '../frontend/src/systems'),
      '@ui': path.resolve(__dirname, '../frontend/src/ui'),
      '@utils': path.resolve(__dirname, '../frontend/src/utils'),
      '@config': path.resolve(__dirname, '../frontend/src/config'),
    },
  },
  test: {
    include: ['unit/**/*.test.ts', 'integration/**/*.test.ts', 'replay/**/*.test.ts'],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['../frontend/src/**/*.ts'],
      exclude: ['../frontend/src/scenes/**', '../frontend/src/main.ts'],
    },
  },
});
```

### `package.json` scripts

```json
{
  "scripts": {
    "test": "vitest run --config tests/vitest.config.ts",
    "test:watch": "vitest --config tests/vitest.config.ts",
    "test:unit": "vitest run --config tests/vitest.config.ts --include 'unit/**'",
    "test:integration": "vitest run --config tests/vitest.config.ts --include 'integration/**'",
    "test:e2e": "npx playwright test --config tests/e2e/playwright.config.ts",
    "test:fuzz": "npx playwright test --config tests/e2e/playwright.config.ts tests/fuzz/",
    "test:coverage": "vitest run --config tests/vitest.config.ts --coverage",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

### Dependencies to add

```bash
npm install -D vitest @vitest/coverage-v8 @playwright/test
npx playwright install chromium
```

---

## Execution Priority

Tests are ordered for the agent workflow: **fast → slow, cheap → expensive**.

| Priority | Layer | Run Time | When to Run |
|----------|-------|----------|-------------|
| 1 | **Unit tests** | < 5s | Every change |
| 2 | **Data integrity** | < 2s | Every data file change |
| 3 | **Integration tests** | < 10s | Every logic change |
| 4 | **E2E smoke tests** | ~30s | Before committing |
| 5 | **Replay tests** | ~60s | Before merging / weekly |
| 6 | **Fuzz tests** | ~120s | Nightly / on demand |

---

## Agent Workflow

When the coding agent makes changes, it should:

1. **Run `npm run test:unit`** — instant feedback on logic correctness.
2. **Run `npm run test:integration`** — verify module boundaries.
3. **Run `npm run test:e2e`** — verify the game boots and basic flows work.
4. **If modifying battle logic:** run relevant replay tests.
5. **If doing a major refactor:** run fuzz tests.

### Test-Driven Fix Cycle

```
Agent makes change
    → Run tests
    → Tests fail?
        → Read error message
        → Fix the issue
        → Re-run tests
    → Tests pass?
        → Commit
```

---

## Implementation Roadmap

### Phase 1 — Foundation (Do First)
- [ ] Set up Vitest config with path aliases
- [ ] Write unit tests for `DamageCalculator`, `CatchCalculator`, `ExperienceCalculator`
- [ ] Write data integrity tests (all cross-references valid)
- [ ] Write `type-chart` exhaustive tests
- [ ] Write `BattleStateMachine` state transition tests
- [ ] Add `npm run test` script to package.json

### Phase 2 — Integration
- [ ] Create Phaser mock utilities
- [ ] Create localStorage mock
- [ ] Write `GameManager` integration tests (party, bag, money, badges)
- [ ] Write `SaveManager` round-trip tests
- [ ] Write battle flow integration test (attack → damage → faint → exp)
- [ ] Write `MoveExecutor` tests with status effects

### Phase 3 — E2E
- [ ] Set up Playwright config with dev server
- [ ] Write boot-to-title smoke test
- [ ] Write console-error-free boot test
- [ ] Write new-game-flow test (title → overworld)
- [ ] Write battle-flow E2E test
- [ ] Set up screenshot comparison baseline

### Phase 4 — Replay System
- [ ] Implement `InputRecorder` in debug mode
- [ ] Implement seeded PRNG (`mulberry32`)
- [ ] Record starter-battle replay
- [ ] Build `ReplayRunner` with Playwright
- [ ] Add frame-level assertions
- [ ] Record full Route 1 walkthrough replay

### Phase 5 — Fuzz Testing
- [ ] Implement seeded monkey tester
- [ ] Configure screenshot capture every N inputs
- [ ] Add global error listener
- [ ] Set up nightly fuzz run (CI or local cron)

---

## Success Criteria

- **Unit test coverage:** ≥80% of `battle/`, `data/`, `utils/`, `managers/` modules
- **Zero-crash guarantee:** Fuzz tests run 2000+ random inputs without unhandled errors
- **Replay stability:** Recorded replays produce identical game state on every run
- **Under 30 seconds:** Unit + integration tests complete in < 30s total
- **Agent-friendly:** All tests runnable via a single `npm run test:all` command with clear pass/fail output
