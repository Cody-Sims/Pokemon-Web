# Codebase Revamp Plan — Pokémon Web

> **Scope:** engineering cleanup, extraction, and architecture revamp of the existing
> codebase. **Not** a feature roadmap — content/feature work lives in
> [`docs/plan.md`](docs/plan.md) and [`docs/IMPROVEMENT_PLAN.md`](docs/IMPROVEMENT_PLAN.md).
>
> **Method:** produced from seven parallel read-only audits (dead code, duplication,
> scenes, battle/systems/managers, data layer, build/test tooling, docs/`.shadow` drift).
> Every claim below is backed by a `file:line` citation or a command that was actually run.

---

## 1. Verified baseline

Measured on this working tree (Node 24.2.0, `main` @ `9eb9713`).

| Metric | Value |
|---|---|
| Production TS | 274 files · 44,848 LOC in `frontend/src/` |
| Layer LOC | scenes 16,016 · data 15,215 · battle 4,067 · systems 3,279 · ui 2,512 · managers 2,135 · utils 793 · entities 443 · config 90 |
| Tests | 61 files · **2,233 passing** in 4.5 s |
| Build | `npm run build` passes, ~4 s, 0 TS errors |
| Bundle | phaser 1,199 kB · index 489 kB · battle 208 kB · maps 169 kB; `dist/` 33 MB (audio-dominated) |
| Assets | 653 files · 19.4 MiB (`audio/bgm` alone 17.8 MiB) |
| Data | 155 Pokémon · 236 moves · 74 items · 50 TMs · 131 trainers · 82 maps · 20 quests · 28 cutscenes · 50 achievements |
| Maps | `npm run map:validate` → 66 checked, 66 pass, **427 warnings** |
| Validators | `npm run agent:validate`, `npm run shadow:validate` pass |

### Baseline defects confirmed by running commands

| # | Defect | Evidence |
|---|---|---|
| B1 | **`tests/setup.ts` never runs.** `tests/vitest.config.ts:17-27` has no `setupFiles`; Vitest reports `setup 0ms`. RNG is therefore unseeded despite `tests/setup.ts:5-8`, producing flaky tests (observed one-off failure at `tests/integration/battle/move-executor-extended.test.ts:209`, passes on rerun). | ran `npm run test` twice |
| B2 | **Coverage reports 0% for everything.** `coverage-final.json` is `{}`. Cause: `root` is `tests/` while `coverage.include` points outside it (`tests/vitest.config.ts:19,25`), and all of `scenes/**` is excluded (`:26`). | ran `npm run test:coverage` |
| B3 | **`npm run test:unit` and `npm run test:integration` are broken.** Vitest 4 rejects `--include`: `CACError: Unknown option --include` (`package.json:15-16`). Both are documented in `AGENTS.md:30-31`. | ran both |
| B4 | **Map toolchain is untracked.** 6 npm scripts target `temp/scripts/map-gen/**` (`package.json:33-38`) but `git ls-files temp` returns **0** — `temp/` is ignored (`.gitignore:38`). A fresh clone cannot run any documented `map:*` command. | ran `git ls-files temp` |
| B5 | **Build mutates tracked source.** `npm run build` rewrites `frontend/public/assets/asset-manifest.json` because `frontend/scripts/generate-atlas.js:177` embeds `new Date().toISOString()`. | hash diff before/after build |
| B6 | **`phaser` is a devDependency** (`package.json:43`) despite being bundled into the shipped app. `tsx` and `gh-pages` are invoked via `npx` (`package.json:34-40`) but undeclared. | read `package.json` |
| B7 | **15 broken data references** across TMs, tutors, item balls, and a warp (see §5). | integrity script run over parsed data |
| B8 | **3 import cycles** in production code (see §4). | dependency-graph script |

---

## 2. Guiding principles

1. **Behaviour-preserving first.** Cleanup and extraction land before any structural rewrite.
2. **Every phase is independently shippable** and ends green on `npm run test` + `npm run build`.
3. **Tests before refactors** for anything touching battle, save, or overworld flow.
4. **One writer per file per phase** — phases are grouped so parallel work never overlaps.
5. **Docs are part of the change.** A phase is not done until its `CONTEXT.md`, `.shadow`
   record, and `docs/CHANGELOG.md` entry land with it.
6. **No new runtime dependencies.** Dev tooling only.

---

## 3. Phase 0 — Stop the bleeding (foundation)

*Everything else depends on trustworthy verification. Do this first, in one PR each.*

### 0.1 Repair the test harness — **highest value / lowest effort**
- Add `setupFiles: ['./setup.ts']` to `tests/vitest.config.ts` so RNG seeding actually applies (fixes B1 and the flaky battle test).
- Fix coverage config (B2): set `coverage.root` to the repo root or move `include` to
  absolute-safe globs; **stop excluding `scenes/**`** — instead report it and set a
  low initial threshold so the number is visible.
- Replace `--include` with project/`--project` or `--dir` selectors, or split into two
  config files, so `test:unit` / `test:integration` work again (B3).
- Add coverage thresholds at *current measured* levels and ratchet upward.

### 0.2 Relocate the map toolchain out of `temp/` (B4)
- `git mv`-equivalent move of `temp/scripts/map-gen/**` (21 files) → `scripts/map-gen/`.
- Update `package.json:33-38`, `AGENTS.md`, `.github/instructions/map-generation.instructions.md`,
  and the `DEC-0007` anchors.
- Declare `tsx` in `devDependencies`. Keep `temp/` for generated previews only.
- Also affects `.github/skills/tile-sprite-gen/SKILL.md:193`, which references a
  non-existent `temp/scripts/sprites/create_npc_atlases.py`.

### 0.3 Make the build pure (B5)
- Drop the timestamp from `frontend/scripts/generate-atlas.js:177` (or derive it from
  content hash) so `asset-manifest.json` is deterministic.
- Add `git diff --exit-code` after the build in CI to keep it that way.

### 0.4 Introduce lint/format/EditorConfig
- ESLint flat config (`eslint`, `@eslint/js`, `typescript-eslint`, `globals`,
  `eslint-plugin-playwright`), Prettier, `.editorconfig`, `.nvmrc` + `engines`.
- Seed rules that encode this repo's actual conventions: no deep imports past a barrel,
  no raw scene-key string literals (once §6.1 lands), `prefer-const`, `no-floating-promises`.
- Land as **report-only** first (warnings), then flip to errors per directory.

### 0.5 Close CI gaps
Current CI (`.github/workflows/ci.yml`) runs `npm test`, `npm run build`,
`scripts/check-bundle-size.sh`, and three E2E specs. Add:
- `map:validate`, `agent:validate`, `shadow:validate`
- lint + format check, coverage thresholds, `npm audit --audit-level=high`
- build-purity diff check
- Align Node: docs say 22+, CI uses 20, local is 24 — pin one.

### 0.6 Fix the 15 broken data references (B7)
Cheap correctness wins, listed in §5.

**Exit criteria:** coverage numbers are real, all three test scripts run, `map:*` works
from a fresh clone, build leaves the tree clean, CI enforces all of it.

---

## 4. Phase 1 — Deletion and de-duplication (behaviour-preserving)

### 4.1 Delete dead code — ~1,400 LOC removable
17 orphan files are unreachable from `frontend/src/main.ts` / `config/game-config.ts`:

| File | LOC | Disposition |
|---|---:|---|
| `scenes/minigame/VoltorbFlipScene.ts` | 356 | Never registered in `config/game-config.ts:9-35`. **Decide: wire it up or delete.** Quest text references it. |
| `systems/audio/ProceduralAudio.ts` | 330 | Barrel-only export → delete |
| `systems/overworld/BerryGarden.ts` | 169 | Barrel-only export → delete |
| `ui/widgets/TextBox.ts` / `PixelText.ts` / `MenuList.ts` / `HealthBar.ts` / `BattleHUD.ts` | 336 | Legacy widget set superseded by direct helpers. **Do not delete blindly** — §4.3 wants these roles filled; either revive as the canonical widgets or delete and build fresh. |
| `systems/overworld/HiddenItems.ts` | 47 | Barrel-only → delete |
| `entities/WildEncounterZone.ts` | 32 | Unreferenced → delete |
| `managers/DialogueManager.ts` | 30 | App-dead, test-only (`tests/integration/managers/dialogue-manager.test.ts:2`) |
| `utils/seeded-random.ts` | 11 | Test/replay-only — move under `tests/` |
| 5 barrel `index.ts` files | 91 | Unused barrels — see §4.2, they should become *used*, not deleted |

Also:
- **93 unused locals/params/imports** (`tsc --noUnusedLocals --noUnusedParameters`),
  e.g. `battle/core/BattleManager.ts:142` `getEnemyMove`, unused imports at
  `BattleManager.ts:2,8`, `DamageCalculator.ts:1,3`, `DoubleBattleManager.ts:9`,
  unused fields in `InventoryScene.ts:35,45,46`, `PokedexScene.ts:15,24`.
- **70 unused exports** — mostly *de-export*, not delete (they are used inside their own
  file): `data/type-chart.ts:7 typeChart`, `ui/theme.ts:108 TYPE_BADGE_FRAMES`,
  `battle/execution/MoveAnimationPlayer.ts:157 getMoveAnimation`.
  ⚠️ `data/shop-data.ts:2 shopInventories` **is live** via dynamic import at
  `scenes/minigame/ShopScene.ts:51-52` — do not remove.
- Deprecated compat exports: `ui/theme.ts:141,173`, `utils/constants.ts:80`,
  `data/maps/interiors/generic-house.ts:105`.

### 4.2 Fix the import cycles (B8)
| Cycle | Fix |
|---|---|
| `managers/GameManager.ts:9` ↔ `managers/QuestManager.ts:1` | Invert via events; quest automation subscribes rather than imports |
| `battle/core/DoubleBattleManager.ts:10` ↔ `battle/core/PartnerAI.ts:6` | Move `SPREAD_MOVES` / targeting constants to a `battle/format/targeting-data.ts` |
| `managers/AchievementManager.ts:1` ↔ `data/achievement-data.ts:1` | Move `AchievementDef` into `data/` types (also a data-purity fix) |

Add a cycle-detection script to CI so they cannot come back.

### 4.3 Extract shared abstractions
Ranked by call sites eliminated. These are the highest-leverage reuse wins.

| # | New module | Replaces | Scale of duplication |
|---|---|---|---|
| 1 | `scenes/shared/SceneInputRegistry.ts` | ad-hoc keyboard/pointer/scene-event binding with auto-teardown | **122** `input.keyboard.on(...)` registrations repo-wide vs only **22** `.off(...)` in 5 files |
| 2 | `ui/controls/SelectableController.ts` (grow `MenuController`) | hand-rolled cursor/wrap/confirm/cancel | 6 scenes use `MenuController`; **18 scenes hand-roll** (`PCScene.ts:104-116`, `MenuScene.ts:101-114`, `BattleMoveMenu.ts:231-252`, `VoltorbFlipScene.ts:84-89`) |
| 3 | `ui/design-tokens.ts` + `PanelPresets.ts` | scattered colours/strokes/panel styles | **536** numeric hex literals in 49 files, **169** hex strings in 33 files, **111** raw `add.rectangle`, **45** ad-hoc `NinePatchPanel` configs. HP colours redefined 3× (`BattleScene.ts:281-306`, `SummaryScene.ts:251-253`, `HealthBar.ts:19-36`) |
| 4 | `data/selectors.ts` | repeated data lookups + display formatting | **99** `pokemonData[...]` in 32 files, 35 `moveData[...]`, 62 party-access sites, 16 duplicate HP-percent calcs |
| 5 | `ui/widgets/MessageBox.ts` | duplicate typewriter / advance / queue | `DialogueScene.ts:278-385`, `TextBox.ts:34-61`, `BattleMessageHandler.ts:60-80` |
| 6 | `utils/phaser-sequence.ts` | promise-wrapped tweens, `delayedCall` chains | **90** `tweens.add` in 25 files, **83** `delayedCall` in 21, 15 hand-rolled `new Promise` |
| 7 | `utils/grid-math.ts` + `utils/format.ts` | tile↔world math, clamp, capitalise, pad | **186** `TILE_SIZE`/`*16`/`/16` sites in 49 files, 26 manual clamps |
| 8 | `scenes/shared/SceneNavigator.ts` | direct `scene.start/stop/launch/resume` + fade duplication | see §6.1 |

Estimated total: **1,800–3,100 LOC removed** from call sites.

### 4.4 Fix the listener-leak class of bugs
**19 scenes register Phaser listeners with no matching teardown.** This is a real defect
class, not style — the codebase uses `scene.restart()` (`OverworldScene.ts:841`,
`InventoryScene.ts:176`), so handlers can double-register.

Highest risk:
- `OverworldScene.ts:393-404` registers `resume`/`pause`; `shutdown()` (`:1325-1346`) does not remove them, nor call `time.removeAllEvents()` / `tweens.killAll()`. The wild-encounter delayed call at `:846-858` has **no liveness guard** (the trainer path at `:852-855` does).
- `OverworldScene.ts:194-196` installs an achievement-toast callback closing over `this` into the **singleton** `AchievementManager` (`AchievementManager.ts:15,65-66`) and never clears it → destroyed scene retained, toast can render into a dead scene.
- `BattleUIScene.ts:172-173`, `PartyQuickViewScene.ts:104-105`, `MinimapScene.ts:102-106`, `MenuScene.ts:142` — same pattern.
- No-shutdown-at-all: `BattleTowerScene`, `BPShopScene`, `StarterSelectScene`, `VoltorbFlipScene`, `FlyMapScene`, `TrainerCardScene`, `SettingsScene`, `HallOfFameScene`, `AchievementScene`, `QuestJournalScene`, `StatisticsScene`, `NicknameScene`, `MoveTutorScene`, `TitleScene`.

`SceneInputRegistry` (§4.3 #1) makes the fix mechanical. Add a regression test asserting
listener counts return to baseline after `shutdown()`.

### 4.5 Repo hygiene
- Untrack 2 ignored files committed by accident:
  `.copilot-tracking/research/subagents/2026-04-16/{codebase,storyline}-inventory.md`.
- Retire or relocate `extract_sprites.py` — hardcodes `/tmp/frlg_overworld_npcs.png:16`
  and an absolute `/Users/cody/...` output path (`:17`).
- Move `phaser` → `dependencies`; declare `tsx`, `gh-pages` (B6).
- Delete stale tileset backups (`tileset-2.png`, `tileset-backup.png`,
  `tileset-pre-{core-fix,expand,fix}.png`, ~76 KiB), superseded NPC atlases
  (`sign-post.*`, `item-ball.*`), and unreferenced source sheets
  (`npcs/Males/Males.png`, `Females/Females.png`, `player/RPG_assets.png`).
  Keep `CREDITS.txt` (licensing).
- Two exact-duplicate binaries: `npcs/Males/npc-male-2.png` == `trainers/generic-trainer.png`;
  `npcs/Males/npc-male-1.png` == `player/player-walk.png`.
- **Audio is 17.8 MiB of the 19.4 MiB asset budget** and is *not* deferred by the
  generator (`generate-atlas.js:157-166`) while Pokémon sprites *are* (`:60-75`).
  Convert BGM to compressed formats and/or defer it — biggest single load-time win.

---

## 5. Phase 2 — Data layer

### 5.1 Fix broken references (do in Phase 0)
| Broken ref | Location |
|---|---|
| TM moves missing: `calm-mind`, `facade`, `return`, `attract` | `tm-data.ts:29,32,34,51` |
| Tutor moves missing: `giga-impact`, `blast-burn`, `hydro-cannon`, `frenzy-plant` | `tm-data.ts:125-128` |
| Item-ball rewards missing: `scope-lens`, `net-ball`, `stardust`, `hard-stone` | `maps/cities/scalecrest-citadel.ts:58`, `maps/dungeons/viridian-forest.ts:164`, `maps/routes/route-3.ts:205,216` |
| Tutor ID `tutor-voltara` absent from `moveTutorData` | `maps/cities/voltara-city.ts:118` |
| Warp targets spawn `from-house-1`, but `pallet-town.ts:212` defines `from-player-house` (2 exit tiles) | `maps/interiors/generic-house.ts:111` |
| Shop keys not registered maps: `verdantia`, `wraithmoor`, `cinderfall`, `dragonspine` | `shop-data.ts:44,61,69,78` |

**Promote the audit script into `tests/unit/data/data-integrity.test.ts`** so these can
never regress. This is the single most valuable new test in the repo.

### 5.2 Restore data purity
`DEC-0006` says data is declarative and side-effect free. Violations:
- `data/trainers/rival.ts:2` imports `GameManager`; `:11-23` builds parties from runtime
  flags; `:243` exports a **`Proxy`**. → move starter-dependent party resolution into a
  `systems/` service; keep data static.
- Data importing runtime modules: `achievement-data.ts:1` (← `@managers/AchievementManager`),
  `cutscene-data.ts:1` (← `@systems/engine/CutsceneEngine`), `maps/map-interfaces.ts:2`
  (← `@systems/overworld/NPCBehavior`). → move the *types* into `data/`.
- Logic in data: `type-chart.ts:29-41`, `tm-data.ts:223-238 canLearnMove`,
  `battle-tower-data.ts:264-268`, `maps/interiors/generic-house.ts:51-106` factories.
- Scene-embedded data that belongs in `data/`: `TownMapScene.ts:15-148` `REGION_NODES`/
  `REGION_EDGES` (also duplicated by `FlyMapScene`), `IntroScene.ts:34-66` slides.

### 5.3 Split `interfaces.ts` and introduce typed IDs
`data/interfaces.ts` (131 LOC, 9 interfaces) mixes species data, runtime state, and the
save schema. Split:
`PokemonData`→`data/pokemon/types.ts`, `MoveData`→`data/moves/types.ts`,
`ItemData`→`data/items/types.ts`, `TrainerData`→`data/trainers/types.ts`,
`EncounterEntry`→`data/encounters/types.ts`,
`PokemonInstance`/`MoveInstance`→`models/pokemon-instance.ts`,
`SaveData`→`managers/save-types.ts`. `DoubleBattleResult` (`:127-131`) has **no usages** — delete.

Then attack the untyped-string problem: **49 string-typed ID fields** spanning
**309 flags, 236 move IDs, 124 item/TM IDs, 131 trainer IDs, 82 map keys, 50 achievement
IDs, 28 cutscene IDs**. Strategy: `as const` registries + `keyof typeof` unions
(`MoveId`, `ItemId`, `TrainerId`, `MapKey`, `CutsceneId`), branded types for `FlagName`.
Start with `MapKey` and `MoveId` — highest breakage-per-typo.

Good news: `data/**` already has **0 `any`, 0 non-null assertions, 3 casts**. The gap is
nominal typing, not looseness.

### 5.4 Map system
- Registry is hand-maintained: `maps/index.ts:12-94` imports all 82 maps explicitly, and
  the whole registry is eagerly pulled into the entry chunk. Generate the manifest, then
  lazy-load by region.
- `map-parser.ts:128-134` silently defaults unknown grid chars to grass with a warning —
  make it fail in validation (not at runtime).
- Fold `map:validate` into CI once §0.2 lands; then burn down the 427 warnings
  (344 border, 20 exploration, 21 npcs, 18 objects, 14 connectivity, 8 trainers,
  2 warps — `pokemon-league` warp tiles sit on solid tiles).

---

## 6. Phase 3 — Scenes layer (16k LOC)

### 6.1 Typed scene keys + a router — *prerequisite for everything else here*
Current state: **~190** `this.scene.*` calls inside `scenes/**` (24 `get`, 47 `stop`,
25 `launch`, 15 `start`, 15 `wake`, 14 `sleep`, 14 `resume`, 10 `pause`, 10 `isActive`),
**77** with literal scene keys, **227** hardcoded scene-key string mentions overall.
Hotspots: `MenuScene` 44, `OverworldScene` 37, `TitleScene` 11, `InventoryScene` 11.

`.github/instructions/scenes.instructions.md:24-31` forbids both direct scene references
and direct `scene.start()` for gameplay transitions — the code violates this at
`TitleScene.ts:206`, `IntroScene.ts:625`, `BattleUIScene.ts:767`, `TownMapScene.ts:643-650`,
`FlyMapScene.ts:168-174`, `MenuScene.ts:349-355`, `BattleScene.ts:147`.

Add `scenes/scene-keys.ts` (`SceneKey` const object + type), `scenes/scene-data.ts`
(`SceneDataMap` typing every scene's `init` payload — currently `Record<string, unknown>`
at `BattleScene.ts:96-99` and `IntroScene.ts:76-83`), and `scenes/SceneRouter.ts` wrapping
lifecycle calls and routing gameplay transitions through `TransitionManager`.
Convert `MenuScene`, `TitleScene`, `InventoryScene` first. **Zero behaviour change.**

### 6.2 Tighten the event bus
`EventManager.ts:10` declares `EventName = keyof EventMap | (string & {})`, which defeats
the typing. Only 5 events are typed (`:1-7`). Consequences already visible:
- `berry-harvested` is **emitted with no listener** (`OverworldInteraction.ts:497`).
- `party-changed` is **listened for with no emitter** (`PartyQuickViewScene.ts:100`).
- `onTagged`/`clearByTag` exist but have **0 usages** — adopt them for scene listeners.

Fix: `EventName = keyof EventMap`, add the missing contracts, emit `party-changed` from
`GameManager` mutations, and replace the `events.once('shutdown', …)`-as-callback idiom
(`MenuScene.ts:228-290`, `OverworldInteraction.ts:155-192`, `InventoryScene.ts:435-449`)
which conflates normal close, forced stop, restart, and parent teardown.

### 6.3 Decompose the god objects
Ordered least→most risky. Each target scene becomes a **<250 LOC lifecycle shell**.

**`TownMapScene.ts` (691) — lowest risk, do first as the pattern-setter**
→ `data/region-map.ts` (nodes/edges, shared with `FlyMapScene`) +
`systems/overworld/RegionMapService.ts` (node resolution, visited/flyable, nearest-node) +
`ui/widgets/RegionMapView.ts`. Newly unit-testable with zero Phaser.

**`InventoryScene.ts` (696)** — currently mutates `PokemonInstance` directly
(`:561-632`: `target.currentHp`, `target.status`, `target.level`) and the tests
*re-implement* that logic instead of calling it (`tests/integration/systems/inventory.test.ts:27-49`).
→ `systems/inventory/{InventoryModel,ItemUseService,InventoryBattleBridge}.ts` + panel widgets.

**`IntroScene.ts` (647)** → `data/intro-slides.ts` + `IntroFlowController.ts` (pure phase
reducer) + `ui/widgets/{ProfessorIntroView,NameEntryPanel,AppearancePicker}.ts` +
`ui/dom/DomTextInputAdapter.ts` (shared with `NicknameScene`, which duplicates the hidden-input pattern).

**`BattleScene.ts` (880) + `BattleUIScene.ts` (777)** — see §7.

**`OverworldScene.ts` (1,348) — last, highest risk.** It currently owns map init, progress
writes, HUD overlays, achievement wiring, tilemap/weather/lighting/audio setup, NPC and
object spawning, follower rendering, per-step gameplay, transitions, field abilities,
per-frame update, and prompt rendering (`:120-1346`).
→ `overworld/controllers/{OverworldMapController, OverworldEntityController,
OverworldStepController, OverworldTransitionController, OverworldHudController,
OverworldEnvironmentController}.ts` + `systems/overworld/InteractionResolver.ts` that
returns **commands** (`Talk`, `OpenShop`, `StartBattle`, `SetFlag`) instead of launching
scenes — which also fixes the 591-LOC `OverworldInteraction.ts` callback-context smell.

### 6.4 Resolve unreachable scenes
`VoltorbFlipScene` (not registered), `TrainerCardScene` and `AchievementScene`
(registered but never launched) — wire up or delete. Decide explicitly.

---

## 7. Phase 4 — Battle, managers, systems

### 7.1 The FSM does not actually control the battle
`BattleStateMachine.ts:1` declares 12 states but has **no transition table** — any
registered state can jump to any other (`:24-38`). `BattleManager.ts:47-100` registers
only 7 and never registers `ENEMY_TURN`, `EXECUTE_TURN`, `EXECUTE_MOVES`, `REPLACE`,
`EXP_GAIN`. The real turn flow lives in the **UI scene** (`BattleUIScene.ts:354`,
`:433-508`, `:624-767`), and `DoubleBattleManager.ts:157-162` leaves `CHECK_FAINT`/
`REPLACE` as stubs. This directly contradicts `DEC-0005`.

→ Introduce `battle/engine/BattleEngine.ts` + a real statechart with an explicit
transition table + `BattleTurnOrchestrator` / `BattleOutcomeController`.
`BattleEngine.submitAction()` returns `BattleEvent[]` (`move-used`, `damage-dealt`,
`status-applied`, `pokemon-fainted`, `battle-ended`); the scene *renders events*.

### 7.2 Unify single and double battles
`DoubleBattleManager` is 567 LOC vs `BattleManager`'s 146, duplicating FSM/weather/status
construction (`BattleManager.ts:34-44` ≈ `DoubleBattleManager.ts:88-98`), active-Pokémon
setup, switch-in abilities (`:70-75` ≈ `:497-509`), and cleanup (`:139-142` ≈ `:538-541`).
Genuine divergence is targeting/spread/priority (`DoubleBattleManager.ts:193-343`).
→ one engine + `BattleFormatStrategy` (`single`/`double`/`tag`) + `TargetingPolicy`.

### 7.3 Make battle deterministic
RNG is a module-global seeded from `Date.now()` (`utils/math-helpers.ts:12-24`), consumed
from ~20 sites (`DamageCalculator.ts:84,125,169`, `CatchCalculator.ts:47`,
`BattleManager.ts:118`, `AIController.ts:18,40,74`, `StatusEffectHandler.ts:175,186,201,289,308,341,476,494`,
`AbilityHandler.ts:109,118,127`, `MoveExecutor.ts:452`). Raw `Math.random()` also survives
in `PlayerStateManager.ts:86` and presentation code.
→ inject a `BattleRng` into the engine, calculators, AI, and effects. Enables true replay
tests and removes the flake class from B1.

Also: the calculators are **not pure** — `DamageCalculator.ts:36-41` can mutate HP via
`AbilityHandler.checkImmunity()` (`AbilityHandler.ts:254-267`), and `ExperienceCalculator`
mutates Pokémon. And `AIController.ts:7,19-23` imports `GameManager` for difficulty,
making battle rules depend on a global.

### 7.4 Replace effect switch-blocks with a registry
Branch counts: `StatusEffectHandler` 62 `if` / 22 `case`; `AbilityHandler` 28 `if` /
28 `case`; `HeldItemHandler` 29 `if` / 24 `case` (switches at
`StatusEffectHandler.ts:302-502`, `AbilityHandler.ts:42,107,156,197,226,248`,
`HeldItemHandler.ts:68,111,149,169,234,332`).
→ `battle/effects/registry/{abilities,held-items,move-effects,status-effects}.ts` with
hook-based defs (`onSwitchIn`, `onAfterDamage`, `onEndTurn`, `modifyDamage`,
`checkImmunity`) returning effect events. Each ability becomes independently testable, and
adding one stops meaning "edit six switch statements". Migrate abilities → items → moves.

### 7.5 Managers
- **No `managers/index.ts` barrel exists**, yet `.github/instructions/managers.instructions.md:31`
  mandates `import { GameManager } from '@managers'`, and there are **108** `@managers/<file>`
  deep imports. Either add the barrel or amend the rule — the current state is
  unenforceable. (Same for `@battle/<subdir>`: 22 violations.)
- Reset discipline is inconsistent: only `StatsManager` and `QuestManager` expose
  `resetInstance()`. Tests reach into private fields (`tests/integration/managers/save-load.test.ts:25-30`).
  → uniform `resetInstance()` + a shared test fixture.
- `AudioManager` (482 LOC) stores a `Phaser.Scene` (`:8,46`) and can retain a destroyed one.
- `TransitionManager` couples directly to Phaser cameras and `SaveManager` (`:1,29`).
- `PlayerStateManager` touches `localStorage` in its constructor (`:66-74`) and uses raw
  `Math.random()` for trainer ID (`:86`).

### 7.6 Harden `SaveManager`
Has a version constant and a v1→v2 migration (`:5,59-69`), catches write failures
(`:42-48`), and rejects newer versions **on import only** (`:140-142`). Gaps:
- `load()` does **not** reject future versions and casts after a minimal object check (`:55-71`).
- `loadAndApply()` has **no try/catch** around deserialization (`:79-89`).
- Import validates only 4 fields (`:135-139`) while deserializers assume much more —
  malformed saves throw in `PartyManager.ts:103` and `ProgressManager.ts:126`.
→ `SaveCodec` with `validateSaveData(raw): Result<SaveData, errors>`, migrate-then-validate,
corrupt-save backup, and typed load errors surfaced to the UI.

### 7.7 Systems and entities
- Over-coupled: `CutsceneEngine.ts:1-8,132-139` imports managers and launches scenes by
  string; `InputManager.ts:3` imports UI touch controls; `BerryGarden.ts:24,163` writes
  state through static `GameManager` calls.
- `EncounterSystem` accepts an injectable `rng` for trigger checks (`:13-21`) but still
  uses globals for table selection/IVs/shiny (`:43-48,60-74,108`) — half-deterministic.
- `Trainer.ts:9-14` embeds map collision and line-of-sight; move to an overworld system.

---

## 8. Phase 5 — Tests

- **Promote the data-integrity script to a test** (§5.1) — highest value.
- **Delete tests that re-implement production logic instead of importing it**:
  `tests/unit/systems/grid-movement.test.ts:17-43`,
  `tests/unit/scenes/scene-lifecycle.test.ts:23-38`,
  `tests/unit/battle/battle-ui-state-machine.test.ts:1-80` (a test-only duplicate of a
  state machine that should exist in production), `tests/integration/systems/inventory.test.ts:27-49`.
  These pass while the real code regresses.
- **Share fixtures**: `makePokemon` is redefined in **18 test files**.
- **Fix weak assertions**: `move-executor-extended.test.ts:188-198` (title says "reset",
  asserts only hit/name), `:219-222` (conditional assertion that can assert nothing).
- **Add the missing safety nets**: scene-shutdown listener-count regression tests,
  save round-trip + corrupt-save tests, battle replay determinism tests once `BattleRng` exists.
- **E2E**: CI runs smoke/visual/perf only; `mobile-ui`, `ui-regression`, `boot-to-title`,
  `menu-navigation`, `new-game-flow`, and the 2,000-input fuzz suite never run. Add at
  least the fuzz suite on a schedule.
- Tighten `tsconfig`: enable `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` (currently only
  `strict` + `skipLibCheck: true`).

---

## 9. Phase 6 — Documentation and `.shadow`

Documentation is treated as a deliverable of every phase, not a follow-up.

### 9.1 Drift to correct now
- **Counts are wrong everywhere.** `AGENTS.md:3`, `llms.txt:7`, `data/CONTEXT.md:30-32`
  say 153 Pokémon / 66 maps / 16 move types; reality is **155 / 82 / 18** (`fairy.ts`,
  `steel.ts` exist). `docs/TestingArchitecture.md:7` says 1,172 tests; reality is 2,233.
  `docs/plan.md:16-20` and `docs/IMPROVEMENT_PLAN.md:15-26` are similarly stale.
- **Wrong locations**: `AGENTS.md:139-149` places `MapDefinition`/`ObjectSpawn` in
  `data/interfaces.ts`; they live in `data/maps/map-interfaces.ts:56,94`.
  `PokemonType` is documented as an enum; it is a union (`utils/type-helpers.ts:2,71`).
- **`docs/architecture.md` is materially wrong**: it describes Tiled JSON maps
  (`:10,39-41,342-344,508-519`) — the project uses TS character grids + `TilemapBuilder`.
  Rewrite.
- **Broken commands documented as working**: `AGENTS.md:30-31` (B3).
- **Rules the code cannot satisfy**: the `@managers` barrel does not exist
  (`.github/instructions/managers.instructions.md:31`).
- **Stale counts in instructions**: `scenes.instructions.md:17-18` says battle has 2
  scenes/7 helpers and menu has 13 scenes; actual is 4 and 16.
- **`CONTEXT.md` gaps**: no context for `config/`, battle subdirs, map child dirs, or
  `ui/{controls,widgets}`. At least **13 existing files are missing** from their nearest
  context — e.g. `managers/CONTEXT.md:8-15` omits all four submanagers;
  `scenes/menu/CONTEXT.md` omits `MinimapScene`/`TownMapScene`;
  `battle/CONTEXT.md:13-18` lists a nonexistent `END_OF_TURN` state;
  `utils/CONTEXT.md` omits `nickname-validation.ts`.
- `docs/bugs.md:21-30,32-43` lists entries marked "Fixed" under `## Open`.
- `.github/skills/tile-sprite-gen/SKILL.md:193` references a nonexistent script.

### 9.2 New `.shadow` decisions this revamp must record
`.shadow/index.json` schema v1; each `DEC-NNNN.md` needs frontmatter
(`id`, `kind: decision`, `title`, `status`, `date`, non-empty `anchors`, non-empty
`evidence`, optional `relations`) and sections `## Context`, `## Decision`, `## Rationale`,
`## Consequences`, `## Unknowns`; all paths must resolve; every decision must be mapped to
a feature in `features.json` (`scripts/validate-shadow-architecture.mjs:37-165`).

| ID | Title | Relation | Lands with |
|---|---|---|---|
| DEC-0009 | Scene decomposition boundary — scenes are lifecycle/presentation coordinators | amends DEC-0002 | Phase 3 |
| DEC-0010 | Shared UI/menu abstraction is mandatory for new menus | maps F08 | Phase 1 |
| DEC-0011 | Typed scene keys, typed init payloads, closed event contracts | supersedes DEC-0004 | Phase 3.1 |
| DEC-0012 | Typed data IDs + enforced data purity + integrity tests | supersedes DEC-0006 | Phase 2 |
| DEC-0013 | Battle rules/presentation separation; engine emits events | supersedes DEC-0005 | Phase 4 |
| DEC-0014 | `GameManager` is a facade; durable state lives in focused stores | amends DEC-0003 | Phase 4.5 |
| DEC-0015 | Map toolchain is tracked under `scripts/`; `temp/` is scratch only | supersedes DEC-0007 | Phase 0.2 |
| DEC-0016 | Canonical quality gates (lint, format, coverage thresholds, validators in CI) | amends DEC-0008 | Phase 0 |
| DEC-0017 | Documentation ownership policy — one source per information type | supports all | Phase 0 |

**DEC-0017 ownership map:** `AGENTS.md` = agent quick-reference architecture ·
`CONTEXT.md` = directory inventory · `.shadow/` = decisions and rationale ·
`docs/architecture.md` = human narrative · `docs/plan.md` = feature roadmap ·
`plan.md` (this file) = engineering revamp · `docs/CHANGELOG.md` = history.
Anything duplicated across two of these gets deleted from the non-owner.

Also add feature-graph coverage for **F07 (systems/entities)** and **F08 (UI)**, which
currently have no decisions mapped to them.

---

## 10. Sequencing and parallelism

```
Phase 0  (foundation, mostly independent — high parallelism)
  0.1 test harness ─┐
  0.2 map toolchain ├─ all independent, land in any order
  0.3 build purity  │
  0.4 lint/format   │
  0.6 data fixes   ─┘
        └─> 0.5 CI gates (needs 0.1–0.4 to exist)

Phase 1  (cleanup — needs 0.1 for a trustworthy safety net)
  4.1 deletions ──┐
  4.2 cycles      ├─ independent files, parallel-safe
  4.5 hygiene     │
  4.3 extraction ─┘ (serialize #1 SceneInputRegistry before 4.4)
        └─> 4.4 listener-leak fixes

Phase 2  (data) ──── parallel with Phase 3.1
Phase 3  (scenes)
  6.1 scene keys/router ─> 6.2 event contracts ─> 6.3 decompositions
                                                    TownMap → Inventory → Intro → Battle → Overworld
Phase 4  (battle/managers) — 7.3 RNG and 7.6 SaveManager can start immediately;
                             7.1/7.2 must follow 6.3's battle scene split
Phase 5  (tests)  — continuous, one slice per phase
Phase 6  (docs)   — continuous, one slice per phase; §9.1 drift fixes can land now
```

**Parallel-safe work streams (no overlapping files):**
`{0.1, 0.3, 0.4}` · `{0.2, 0.6}` · `{4.1, 4.2, 4.5}` · `{§5 data, §6.1 scenes}` ·
`{7.3 RNG, 7.6 SaveManager}` · `{§9.1 docs drift}`.

**Must be serialized:** 4.3#1 → 4.4 · 6.1 → 6.2 → 6.3 · 6.3(battle) → 7.1 → 7.2.

---

## 11. Definition of done (every PR)

1. `npm run test` green · `npm run build` green and **leaves the tree clean**
2. `npm run map:validate` (map changes) · `npm run agent:validate` + `npm run shadow:validate` (agent/architecture changes)
3. Coverage did not regress below the threshold
4. Owning `CONTEXT.md` updated · `.shadow` decision added/amended if a boundary moved
5. `docs/CHANGELOG.md` entry
6. `git diff` reviewed; **only intended paths staged** (never `git add .` / `-A`)

---

## 12. Highest-value work, if only five things get done

1. **Fix the test harness** (§0.1) — unseeded RNG and 0% coverage mean the safety net for every other item is fiction.
2. **Track the map toolchain** (§0.2) — 6 documented commands are unrunnable from a clean clone.
3. **Data-integrity test** (§5.1) — 15 real broken references exist today with nothing guarding them.
4. **`SceneInputRegistry` + listener teardown** (§4.3#1, §4.4) — 122 registrations vs 22 removals across 19 restart-capable scenes is an active bug class.
5. **Typed scene keys + router** (§6.1) — 227 hardcoded scene-key strings block every subsequent scene refactor.
