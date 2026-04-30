# Pokemon Web — Full Codebase Bug Review Plan

> A phased, parallel-deep bug audit. The codebase is sliced into small,
> independently-analyzable **shards**. Each shard is narrow enough that one
> reviewer (human or subagent) can read every line and trace every code path
> in a single pass. Shards within a phase have no dependencies on each other
> and run concurrently. Findings flow into a single aggregated report.
>
> **Goal:** maximize defect density per shard. Quality over coverage breadth.
> A shard that finds zero bugs is suspicious; we re-scope and re-run it.
>
> **Out of scope:** style nits, feature requests, performance micro-opts,
> design questions. Only runtime / logic / correctness / safety defects.

---

## Operating Principles

| Principle | What it means in practice |
|---|---|
| **Narrow + deep** | Each shard ≤ ~600 LOC of source. Reviewer reads the full slice, not a search-spot. |
| **Parallel by default** | Shards within a phase share no files; assign one subagent per shard, run concurrently. |
| **Bug-class-driven** | Each shard ships with a checklist of bug classes to actively hunt for. We don't "look for bugs", we look for *specific* bugs. |
| **Trace, don't skim** | For each entry point in a shard, trace at least one happy-path and one failure-path end-to-end. |
| **Cite line ranges** | Every finding cites `file#Lstart-Lend` and a 1-line repro/reasoning. |
| **Triage at the end** | Severity and disposition are decided in Phase 5, not while hunting. Hunters log everything suspicious. |

---

## Bug Class Catalogue

Every shard checklist is built from this catalogue. Keep this list visible while reviewing.

### A. Common (high prior probability)

1. **Null / undefined deref** — optional chaining missing, default values not set, `Map.get()` results unchecked.
2. **Off-by-one** — `<` vs `<=`, inclusive/exclusive ranges, length-vs-index, tile coordinate math.
3. **Boundary conditions** — empty arrays, single-element arrays, max/min values (HP=0, level=1, level=100, PP=0).
4. **Async / event-order bugs** — missing `await`, fire-and-forget promises, callback-after-shutdown, event re-entrancy.
5. **Reference vs value** — shared object mutation (party member, move, item), missing deep clones, default-param object reuse.
6. **Type coercion / arithmetic** — `==` vs `===`, `NaN` propagation, `Math.floor` on negatives, integer division assumptions, `0 || default` masking valid zeros.
7. **Mutation during iteration** — splicing while looping, `forEach` with async, modifying a `Set/Map` mid-traversal.
8. **State machine illegal transitions** — re-entering a state, skipping states, no terminal-state guard.
9. **Resource leaks** — unbound event listeners, uncleared timers / tweens, retained Phaser objects after scene shutdown, texture cache growth.
10. **Error swallowing** — `try/catch` that logs and continues, rejected promises with no handler, `throw` in async without propagation.

### B. Uncommon (high impact, low frequency)

11. **Singleton state leak** — manager carries state between game sessions / save loads.
12. **Save/load round-trip** — fields silently dropped, version drift, NaN/Infinity serialized, Maps/Sets lost through `JSON.stringify`.
13. **Determinism / seeding** — `Math.random` called outside the seeded RNG, ordering depends on `Object.keys` insertion, replays diverge.
14. **Re-entrancy** — input handler triggers itself, event emitter recursion, scene transition kicked twice.
15. **Race conditions** — two animations finish on the same frame, two scenes both writing to `GameManager`, save while transitioning.
16. **Floating-point drift** — accumulated time, partial-tile movement, screen shake offsets.
17. **Locale / Intl / Number formatting** — `toLocaleString` differences, leading-zero parsing.
18. **DOM / focus / accessibility** — focus trap escapes, `tabindex` on wrong element, screen-reader text out of sync with UI.
19. **localStorage quota / corruption** — write-through with no try/catch, partial writes, schema drift between versions.
20. **Audio context state** — autoplay-blocked context, sounds played during shutdown, volume after mute toggle.

### C. Project-specific (Pokémon mechanics + Phaser)

21. **Battle FSM** — illegal transition, double-execute turn, switch during forced-move, faint vs run-out-of-PP order.
22. **Damage formula** — STAB on non-attacker types, multi-hit weather/ability stacking, crit ignoring stages selectively, type immunity → 1 dmg, recoil on miss.
23. **Status interactions** — sleep counter never decrements, freeze + fire move thaw missing, badly-poisoned counter persists across switch incorrectly, status applied to fainted target.
24. **Speed / priority ties** — speed tie RNG not seeded, priority bracket comparison, Quick Claw / Stall ordering.
25. **Stat stages** — clamp at ±6, reset on switch / faint, accuracy/evasion ignored by certain moves.
26. **PP** — Pressure double-deduct, multi-turn double-deduct, charge-turn bookkeeping, PP > max via PP Up.
27. **Catch / faint / EXP** — EXP awarded to fainted Pokémon, EXP-share split off-by-one, catch on 0 HP, catch during charge turn.
28. **Move targeting** — single vs all-adjacent vs all, double-battle redirection (Lightning Rod, Storm Drain), self-target damage.
29. **Inventory** — count overflow, negative count via `-=`, key-item duplication, TM consumption on cancel.
30. **Map / movement** — walking onto blocking tile via tween cancel, warp loop (entering A warps to B which warps back), grid-snap drift after rapid input, NPC overlapping player at spawn.
31. **NPC behavior** — trainer LoS through transparent tiles / grass / objects, NPC pathfinding into walls, trainer step-walk through other NPCs.
32. **Encounter system** — encounter triggered after warp (cross-map), encounter while cycling (intended?), repel countdown wrong, surfing encounters on land tile.
33. **Save manager** — autosave during battle, save during transition, save lock not released on error, slot overwrite without confirm.
34. **Phaser scene lifecycle** — `create()` runs before previous `shutdown()`, listener registered on `scene.events` not removed, `this.time.addEvent` not destroyed, tween chain after destroy.
35. **Phaser textures** — atlas frame name typo silently renders question-mark frame, sprite created before preload finishes, reused texture keys across scenes.
36. **Camera / viewport** — bounds wrong on map < viewport, follow target null after switch, zoom + pixel-art aliasing.
37. **Dialogue** — page advance during text-reveal skips text, A held from previous menu auto-advances, dialogue reentry after cutscene cancel.
38. **Cutscenes** — input not blocked, save not blocked, Pokémon party mutated mid-cutscene with no rollback on cancel.
39. **Quests / flags** — flag set twice, flag check order wrong, achievement granted retroactively without progress.
40. **Audio** — BGM duplicated on scene re-entry, SFX overlap with no cap, mute persisted across reload but slider not.

---

## Phase 0 — Bootstrap & Methodology Lock

**Owner:** orchestrator. **Parallelizable:** no. **Output:** seeded review workspace.

1. Create `.copilot-tracking/reviews/bug-review-{{YYYY-MM-DD}}/` with subfolders: `shards/`, `findings/`, `aggregate/`.
2. Snapshot current `git rev-parse HEAD` into `aggregate/baseline.txt` so all findings reference the same tree.
3. Generate the shard manifest (`aggregate/manifest.md`) — copy the shard tables from Phases 1–4 below and assign owners.
4. Confirm tools available: `npm run build`, `npm run test`, `grep`, `tsc --noEmit`.
5. Run `npm run build && npm run test` once — capture baseline pass/fail. Any pre-existing failures are noted so they aren't re-attributed to the audit.

**Exit:** manifest exists, baseline recorded, no shard started yet.

---

## Phase 1 — Battle Subsystem (highest defect density)

> The battle code has the deepest logic and the most past-finding density (see [docs/bugs.md](docs/bugs.md)).
> All shards in this phase are parallelizable.

| Shard ID | Scope | Bug classes to hunt | Specific traps to check |
|---|---|---|---|
| **B-1** Damage formula | [frontend/src/battle/calculation/DamageCalculator.ts](frontend/src/battle/calculation/DamageCalculator.ts) | A1, A6, C22, C25 | STAB on dual-type, immunity → 0 not 1, crit + stages, weather modifier path on every code path, Foul Play stages, fixed-damage moves bypass formula, random factor seeded |
| **B-2** EXP & catch & faint | [frontend/src/battle/calculation/ExperienceCalculator.ts](frontend/src/battle/calculation/ExperienceCalculator.ts), [CatchCalculator.ts](frontend/src/battle/calculation/CatchCalculator.ts) | A2, A3, C27 | EXP split rounding, level-100 cap, EXP-share off-by-one, catch on 0 HP, status bonus stacking, ball multipliers, catch during semi-invulnerable turn |
| **B-3** Move executor — pre-hit | [frontend/src/battle/execution/MoveExecutor.ts](frontend/src/battle/execution/MoveExecutor.ts) (lines 1–~250) | A4, A8, C21, C26 | PP deduct path (charge, multi-turn, struggle, called-by-Metronome), accuracy check, OHKO move guard, protect/detect, sleep/freeze/paralysis pre-checks |
| **B-4** Move executor — post-hit | MoveExecutor.ts (lines ~250–end) | C22, C23, C28 | Multi-hit weather/ability path, secondary effects on immune/0-dmg, drain on 0-dmg, recoil on miss, crash damage, contact-triggered abilities, life-orb after substitute |
| **B-5** Status & weather effects | [frontend/src/battle/effects/](frontend/src/battle/effects) — every file | C23 | Sleep counter decrement once per turn, badly-poisoned counter reset on switch, freeze thaw probability + fire-move thaw, weather turn count, terrain stacking, status applied to substitute |
| **B-6** Abilities & held items | [frontend/src/battle/effects/](frontend/src/battle/effects) (ability + item handlers) | A1, C22, C28 | Ability triggers fire on switch-in once, ability suppress vs item suppress, choice-item lock survives faint correctly, berry consumed twice, air balloon popped on immune hit |
| **B-7** AI controller | [frontend/src/battle/core/AIController.ts](frontend/src/battle/core/AIController.ts) (and any decision tree files) | A1, A8 | Empty move set, all moves immune, switching logic when all party fainted, scoring with NaN, double-battle ally targeting |
| **B-8** Battle FSM | [frontend/src/battle/core/BattleStateMachine.ts](frontend/src/battle/core/BattleStateMachine.ts) + DoubleBattle | A4, A8, C21 | Re-enter PLAYER_TURN after run failure, faint mid-execute when both faint same hit, switch + forced-move (Outrage), turn skipped after pivot move, end-of-turn order |
| **B-9** Battle scene glue | [frontend/src/scenes/battle/](frontend/src/scenes/battle) (UI scene, action menu, turn runner, catch handler) | A4, A9, C34 | Listener cleanup on scene shutdown, double-input on rapid A spam, BAG → throw timing vs intro tween, faint animation completion before next turn, pause-menu during animation |

**Subagent prompt template (one per shard):**

> Read every line of the files listed for shard `<ID>`. For each function, write a 1-line summary of intent, then walk through inputs that trigger each bug class in the checklist. Log any suspected defect to `findings/<ID>.md` using:
> ```
> ### <short title>
> - **File:** path#Lstart-Lend
> - **Class:** <bug class id>
> - **Repro / reasoning:** 1–3 lines.
> - **Confidence:** high | medium | low
> ```
> Do not propose fixes. Do not assess severity. Log everything suspicious; we triage later.

---

## Phase 2 — Overworld, Entities, Systems

| Shard ID | Scope | Bug classes |
|---|---|---|
| **O-1** OverworldScene main | [frontend/src/scenes/overworld/OverworldScene.ts](frontend/src/scenes/overworld/OverworldScene.ts) | A4, A9, C30, C32, C34 |
| **O-2** Overworld helpers | other files in [frontend/src/scenes/overworld/](frontend/src/scenes/overworld) | A4, C32, C37 |
| **O-3** Grid movement | [frontend/src/systems/overworld/](frontend/src/systems/overworld) movement files | A2, A6, A16, C30 |
| **O-4** NPC behavior + encounters | NPCBehavior, encounter system files | C31, C32 |
| **O-5** Field abilities (cut, surf, fish) | field-ability files | A4, C30, C32 |
| **O-6** Entities | [frontend/src/entities/](frontend/src/entities) — Player, NPC, Trainer, InteractableObject | A1, A4, C30, C31 |
| **O-7** Map parser & tiles | [frontend/src/data/maps/map-parser.ts](frontend/src/data/maps/map-parser.ts), tiles.ts, map-interfaces.ts | A1, A2, A3 |
| **O-8** Cutscene engine | [frontend/src/systems/engine/CutsceneEngine.ts](frontend/src/systems/engine/CutsceneEngine.ts) | A4, C38 |
| **O-9** Rendering systems | [frontend/src/systems/rendering/](frontend/src/systems/rendering) — weather, lighting, animations | A9, C34, C36 |

Same subagent prompt as Phase 1.

---

## Phase 3 — Managers, Persistence, UI, Audio

| Shard ID | Scope | Bug classes |
|---|---|---|
| **M-1** GameManager | [frontend/src/managers/GameManager.ts](frontend/src/managers/GameManager.ts) | A5, A11, C33 |
| **M-2** SaveManager | [frontend/src/managers/SaveManager.ts](frontend/src/managers/SaveManager.ts) | B12, B19, C33 |
| **M-3** PartyManager + PlayerStateManager | [frontend/src/managers/PartyManager.ts](frontend/src/managers/PartyManager.ts), [PlayerStateManager.ts](frontend/src/managers/PlayerStateManager.ts) | A3, A5, B11 |
| **M-4** EventManager + DialogueManager | [frontend/src/managers/EventManager.ts](frontend/src/managers/EventManager.ts), [DialogueManager.ts](frontend/src/managers/DialogueManager.ts) | A4, A9, A14, C37 |
| **M-5** TransitionManager | [frontend/src/managers/TransitionManager.ts](frontend/src/managers/TransitionManager.ts) | A4, A9, C34 |
| **M-6** Quest / Achievement / Stats / Progress | [QuestManager.ts](frontend/src/managers/QuestManager.ts), [AchievementManager.ts](frontend/src/managers/AchievementManager.ts), [StatsManager.ts](frontend/src/managers/StatsManager.ts), [ProgressManager.ts](frontend/src/managers/ProgressManager.ts) | A5, B11, C39 |
| **M-7** AudioManager + audio system | [frontend/src/managers/AudioManager.ts](frontend/src/managers/AudioManager.ts), [frontend/src/systems/audio/](frontend/src/systems/audio) | B20, C40 |
| **U-1** Menu scenes | [frontend/src/scenes/menu/](frontend/src/scenes/menu) | A1, A4, C29, C37 |
| **U-2** Inventory specifically | [InventoryScene.ts](frontend/src/scenes/menu/InventoryScene.ts) | C29 |
| **U-3** UI widgets | [frontend/src/ui/widgets/](frontend/src/ui/widgets) | A1, A9, B18 |
| **U-4** UI controls (touch, joystick, menu controller) | [frontend/src/ui/controls/](frontend/src/ui/controls) | A4, A14, B18 |
| **U-5** Title / boot / preload | [frontend/src/scenes/title/](frontend/src/scenes/title), [scenes/boot/](frontend/src/scenes/boot) | A4, C34, C35 |
| **U-6** Pokémon scenes (starter, nickname, PC, move tutor) | [frontend/src/scenes/pokemon/](frontend/src/scenes/pokemon) | A1, A3, C29 |
| **U-7** Minigames | [frontend/src/scenes/minigame/](frontend/src/scenes/minigame) | A2, A6 |

---

## Phase 4 — Cross-Cutting Sweeps

These shards walk the **whole tree** but each one looks for **a single class of bug**. Each is a focused grep + read pass; together they catch defects no single-file shard would notice. All parallelizable.

| Shard ID | Single hunt | Method |
|---|---|---|
| **X-1** `Math.random` outside seeded RNG | Determinism / replay drift (B13) | grep `Math\.random` repo-wide; confirm each call routes through the seeded RNG used in tests. |
| **X-2** Unbound listeners | Resource leaks (A9) | grep `\.on\(` and `EventManager\.on`; confirm matching `off` / `once` / scene-shutdown cleanup. |
| **X-3** Tween / timer cleanup | Resource leaks (A9, C34) | grep `this\.tweens`, `this\.time\.add`, `setTimeout`, `setInterval`; confirm destruction on scene shutdown. |
| **X-4** Missing `await` | Async order (A4) | grep `async ` then visit each caller; flag fire-and-forget. |
| **X-5** `==` and `!=` usage | Coercion (A6) | grep `[^=!]==[^=]` and `!=[^=]`; flag any non-`===`. |
| **X-6** `parseInt` without radix / `Number()` on user input | Coercion (A6) | grep `parseInt`, `parseFloat`. |
| **X-7** Default-param object literals | Reference reuse (A5) | grep `=\s*\{\s*\}` and `=\s*\[\s*\]` in function signatures. |
| **X-8** `JSON.parse` without try/catch | Save corruption (B12, B19) | grep `JSON\.parse`. |
| **X-9** `localStorage` writes without try/catch | Quota / corruption (B19) | grep `localStorage\.setItem`. |
| **X-10** Singleton mutable state | Cross-session leak (B11) | inspect each manager for top-level `let`/array/map; confirm reset paths. |
| **X-11** Event re-entrancy | A14 | grep `emit\(` calls inside `on(` handlers; flag synchronous emit chains. |
| **X-12** Floating-point comparisons | B16 | grep `===\s*\d+\.` and float `<`/`>` thresholds. |
| **X-13** Texture / atlas frame typos | C35 | enumerate every `setTexture`, `play(`, `'frame_'` literal; cross-check against `frontend/public/assets/` atlases. |
| **X-14** Save schema drift | B12 | diff `SaveData` interface vs every `SaveManager` read path; flag any field read but not written or vice versa. |
| **X-15** Type assertions / `as any` / `!` non-null | A1 | grep `as any`, `!\.`, `as unknown`. |
| **X-16** `for ... in` on arrays | Iteration order (A7) | grep `for\s*\(.*\sin\s`. |
| **X-17** Mutating shared data objects | Reference vs value (A5) | grep `pokemonData\[`, `moveData\[`, `itemData\[` write sites. |
| **X-18** Index 0 / falsy guards | A6 | grep `if\s*\(!.*\)` near numeric fields (HP, level, count). |
| **X-19** Map / Set serialization | B12 | grep `new Map`, `new Set`; confirm save/load path handles them. |
| **X-20** Phaser scene `scene.start` vs `scene.launch` | C34 | enumerate every transition; confirm parent scene is correctly stopped/paused. |

Each X-shard fits in one focused pass and produces one findings file.

---

## Phase 5 — Game-Mechanic Edge-Case Matrix

Pure black-box reasoning. For each row, write a short trace describing the expected vs current behavior. No file restriction — follow the call chain wherever it leads. Parallelizable per row.

| Row | Scenario | Expected behavior |
|---|---|---|
| **E-1** | Both Pokémon faint on the same hit (recoil KO) | Attacker faints last; correct switch order |
| **E-2** | Last Pokémon uses self-KO move (Explosion / Self-Destruct) | Player loses after faint resolution |
| **E-3** | Catch attempt on 0-HP / fainted target | Rejected with "It would be a waste" |
| **E-4** | Use Revive on non-fainted Pokémon | Rejected, item not consumed |
| **E-5** | Use Full Restore on fainted | Rejected (per [docs/bugs.md](docs/bugs.md) entry — verify still open) |
| **E-6** | All player moves at 0 PP, select FIGHT | Auto-uses Struggle |
| **E-7** | Multi-turn move (Outrage) interrupted by faint | Confusion not applied to fainted user |
| **E-8** | Pivot move (U-Turn) when no party member alive | Resolves as KO without switch |
| **E-9** | Speed tie | RNG-coin flip, seeded |
| **E-10** | Quick Claw + priority move | Priority bracket beats Quick Claw |
| **E-11** | Status applied to substitute | Original Pokémon unaffected |
| **E-12** | Save during battle | Blocked or restores cleanly |
| **E-13** | Save during cutscene | Blocked |
| **E-14** | Save during scene transition | Blocked or queued |
| **E-15** | Reload from save mid-fishing-cast | No phantom dialogue chain |
| **E-16** | Two warps that point at each other | Player doesn't loop infinitely |
| **E-17** | Warp into a tile occupied by an NPC | Player ends up on a valid tile |
| **E-18** | Encounter step on a warp tile | Battle suppressed until after warp settles |
| **E-19** | Cycle on a tile that disallows cycling | Auto-dismounts cleanly |
| **E-20** | Surf onto land tile | Auto-dismounts |
| **E-21** | Fish on land tile | Rejected |
| **E-22** | TM teach to Pokémon at full move list, cancel at confirm | TM not consumed |
| **E-23** | Move Tutor / nickname enter empty string | Defaults preserved |
| **E-24** | Inventory full on item-ball pickup | Item returned to ball / queued |
| **E-25** | Achievement that depends on a stat that's incremented twice (e.g., paths) | Granted exactly once |
| **E-26** | localStorage quota exceeded on save | User-visible error, no corruption |
| **E-27** | Mute toggle persisted, BGM resumes muted | Both volume slider and audible state agree |
| **E-28** | Tab away during battle then return | Battle resumes without dropped frames advancing FSM |
| **E-29** | Mobile touch + keyboard simultaneously | No double-input |
| **E-30** | Hard reload during autosave write | Save not partially written |

---

## Phase 6 — Aggregate, Triage, Report

**Owner:** orchestrator. **Parallelizable:** no.

1. Collect every `findings/<shard>.md` into `aggregate/all-findings.md`.
2. De-duplicate (multiple shards may flag the same root cause).
3. Cross-link each finding to the bug-class catalogue and to existing entries in [docs/bugs.md](docs/bugs.md) (some "new" findings may be re-discoveries).
4. Apply severity rubric:

   | Severity | Definition |
   |---|---|
   | **Critical** | Save corruption, game-blocking softlock, party loss, irrecoverable state. |
   | **High** | Battle outcome wrong (wrong winner, wrong damage by ≥ 25%), reachable crash, exploit (item dup, infinite money). |
   | **Medium** | Wrong UX behavior the player notices, cosmetic-but-confusing, minor rule drift. |
   | **Low** | Cosmetic-only, edge case requiring rare timing, documented behavior. |

5. For each Critical / High, write a 1-paragraph repro so the fix-PR has the test seed.
6. Append a new dated audit-cycle section to [docs/bugs.md](docs/bugs.md) for every confirmed open bug (Status: Open) and a `### Fixed` entry pre-draft for findings that already match an in-flight fix.
7. Update [docs/CHANGELOG.md](docs/CHANGELOG.md) with a single line under "Changed": "Completed full-codebase bug review cycle ({{count}} findings, {{critical}} critical, {{high}} high)."

**Exit:** all findings are either filed in `docs/bugs.md` (open) or scheduled in a fix backlog issue.

---

## Phase 7 — Fix Wave Planning (optional, follow-up)

Not part of the audit itself, but the audit's deliverable is shaped to feed it directly:

- Group findings by file → one fix-PR per file when possible (minimizes review surface).
- Order by severity, then by shared-test-fixture (battle calculator fixes ship together).
- Each Critical / High finding gets a regression test added under [tests/unit/](tests/unit) or [tests/integration/](tests/integration) **before** the fix lands.

---

## Shard Sizing Reference

If a shard exceeds these limits during Phase 0, split it.

| Limit | Target |
|---|---|
| Max LOC per shard | ~600 source lines (excluding tests + comments) |
| Max files per shard | 6 (or one logical module) |
| Max bug classes per shard checklist | 6 (focus over breadth) |
| Min suspected findings to consider shard "complete" | 0, but an empty file warrants a re-scope review by the orchestrator |

---

## Tracking

- Shard status: `aggregate/manifest.md` (one row per shard, columns: ID, owner, status, finding count).
- Per-shard findings: `findings/<shard-id>.md`.
- Aggregated report: `aggregate/all-findings.md`.
- Final disposition: appended to [docs/bugs.md](docs/bugs.md) under a new dated audit-cycle heading.
