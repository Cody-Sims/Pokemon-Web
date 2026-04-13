# Pokemon Web Game — Development Plan

## Project Overview

A browser-based Pokémon-style RPG built with **Phaser 3 + TypeScript + Vite**. The player explores a top-down overworld, captures and trains Pokémon in turn-based battles, interacts with NPCs, and progresses through a unique original storyline. The entire game runs client-side as a static web app.

> **Phases 1–11 (MVP) are complete.** See [CHANGELOG.md](CHANGELOG.md) for the full history: environment setup, scene skeleton, data layer (~30 Pokémon, ~50 moves, ~15 items), overworld systems (grid movement, NPCs, encounters, map transitions), battle system (damage formula, type effectiveness, status effects, AI, catch mechanics, EXP/level-up), UI & menus, audio, save/load, world content (6 maps from Pallet Town through Pewter City, starter selection, story flow through Boulder Badge), polish (animations, transitions, evolution), and deployment (GitHub Pages + CI/CD).

---

## Storyline Direction — Original Setting

Rather than recreating the Kanto storyline 1:1, this game tells a **unique story** set in a custom region inspired by — but distinct from — the original games.

### Setting: The Aurum Region
A coastal island chain where ancient ruins dot the landscape and a mysterious energy called **Aether** flows through ley lines beneath the ground. Pokémon in this region have evolved alongside Aether, and some exhibit unique behaviors near ley line convergence points.

### Core Conflict
The player arrives in **Littoral Town** (replacing Pallet Town) as the child of a traveling researcher. Professor Willow (a local Pokémon ecologist) asks you to help document the region's Pokémon. But an organization called **The Synthesis Collective** is siphoning Aether from the ley lines to artificially enhance Pokémon — creating powerful but unstable specimens. Their experiments are disrupting wild Pokémon behavior, causing aggressive encounters and environmental changes across the region.

### Story Beats
1. **Act 1 — Discovery** (current content, re-themed): Choose starter, explore first routes, earn first badge. Encounter strange wild Pokémon behavior. Meet your rival (a Synthesis researcher's child who questions their parent's work).
2. **Act 2 — Investigation**: Uncover Synthesis labs hidden in caves/ruins. Rescue captured Pokémon. Earn badges 2–4 while investigating Collective operations in each town.
3. **Act 3 — Confrontation**: Infiltrate the Collective's headquarters. Battle their enhanced Pokémon (boss fights with boosted stats and unique movesets). Earn badges 5–8 while dismantling their network.
4. **Act 4 — Resolution**: Challenge the Pokémon League. The Champion is secretly the Collective's founder. Final battle uses Aether-boosted Pokémon. Post-game opens legendary quests tied to the ley line guardians.

### Design Principles for Story
- **Every gym has a narrative purpose** — not just obstacle gates, but story-relevant encounters.
- **Rival is sympathetic** — they grow alongside you, sometimes helping, sometimes opposing.
- **Choices matter (lite)** — flag-gated dialogue branches that affect NPC reactions and optional side content availability.
- **The existing 6 maps** (Pallet Town through Pewter City) map to Act 1. New acts require new maps.

---

## Phase 1: UI Overhaul & Foundation — COMPLETE

> **Completed 2026-04-12.** NinePatchPanel procedural panel system, MenuController unified input, DialogueScene with speaker names/SFX/choices, full InventoryScene with 5 categories and USE/TOSS, Battle UI with type indicators/PP coloring/damage popups, PartyScene with context menu/SWITCH/fainted indicators, SettingsScene with text speed/volume/fullscreen. See CHANGELOG.md for details.

---

## Phase 2: Gameplay Depth — Battle System Expansion — COMPLETE

> **Completed 2026-04-12.** AbilityHandler with switch-in/after-damage/end-of-turn/immunity/damage-modifier hooks for 20+ abilities. HeldItemHandler with Leftovers/Life Orb/Focus Sash/Choice items/berries. WeatherManager with Sun/Rain/Sandstorm/Hail (damage modifiers, end-of-turn damage, 5-turn duration, UI indicator). Multi-condition evolution (level/item/trade/friendship/location/move-known) with friendship tracking. Protect/Detect with consecutive-use decay. Two-turn moves (Fly/Dig/Solar Beam/Skull Bash/Sky Attack/Razor Wind) with charge-then-attack flow. Weather-setting moves (Sunny Day/Rain Dance/Sandstorm/Hail). All hooks wired into DamageCalculator, BattleManager, and BattleUIScene. See CHANGELOG.md for details.

### 2.1 — Pokémon Abilities
- Add `abilities: string[]` field to `PokemonData` interface and populate for all ~30 existing species.
- Create `AbilityHandler` class in `frontend/src/battle/` with hooks:
  - `onSwitchIn(pokemon)` — triggered when a Pokémon enters battle (e.g., Intimidate).
  - `onBeforeMove(attacker, defender, move)` — pre-move effects (e.g., Synchronize).
  - `onAfterDamage(attacker, defender, damage, move)` — post-hit effects (e.g., Static, Flame Body).
  - `onEndOfTurn(pokemon)` — passive effects (e.g., Speed Boost).
  - `modifyDamage(attacker, defender, move, damage)` — damage multipliers (e.g., Thick Fat).
  - `checkImmunity(defender, move)` — type immunity overrides (e.g., Levitate).
- Wire hooks into `BattleStateMachine` at appropriate state transitions.
- Display ability name on Summary screen INFO tab.

### 2.2 — Held Items
- Add `heldItem: string | null` field to `PokemonInstance` interface.
- Create `HeldItemHandler` class in `frontend/src/battle/` with hooks matching `AbilityHandler`:
  - `onEndOfTurn` — Leftovers (heal 1/16 HP).
  - `onBeforeMove` — Choice items (lock move, boost stat).
  - `onAfterDamage` — Life Orb (recoil), Focus Sash (survive at 1 HP).
  - `onStatusApplied` — Lum Berry (cure any status), specific berries (cure specific status).
  - `onHPThreshold` — Sitrus Berry (heal 25% HP when below 50%).
- Items consumed after use (berries); permanent items persist.
- Add held item display in Party screen and Summary screen.
- Add GIVE/TAKE item actions in Party context menu.

### 2.3 — Weather System
- Create `WeatherManager` class in `frontend/src/battle/`.
- Four conditions: **Sun, Rain, Sandstorm, Hail** — each with 5-turn default duration.
- Weather effects integrated into `DamageCalculator`:
  - Sun: Fire x1.5, Water x0.5.
  - Rain: Water x1.5, Fire x0.5.
- End-of-turn damage for Sandstorm/Hail (1/16 HP, with immunities).
- Weather-setting moves: Sunny Day, Rain Dance, Sandstorm, Hail.
- Weather-setting abilities on switch-in: Drought, Drizzle, Sand Stream, Snow Warning.
- Visual indicator in battle UI (weather icon + remaining turns).
- Overworld overlay (rain/sand/snow particles) as a stretch goal.

### 2.4 — Multi-Condition Evolution
- Expand `evolution-data.ts` with a discriminated union for evolution conditions:
  - `level` — standard level-up evolution.
  - `item` — use evolution stone from inventory.
  - `trade` — simulated via NPC "Trade Station".
  - `friendship` — evolve at friendship threshold (min 220) + level-up.
  - `time` — combined with friendship for day/night (Eevee to Espeon/Umbreon).
  - `location` — evolve when leveling up in a specific map.
  - `moveKnown` — evolve when a specific move is in the moveset.
- Implement friendship tracking in `PokemonInstance` (start at 70, max 255).
  - Gains: level up (+2 to +5), walking (step counter), vitamins.
  - Losses: fainting (-1), bitter herbs.
- Check conditions in `ExperienceCalculator` (level-up), `InventoryScene` (item use), and overworld (location).

### 2.5 — Expanded Move Effects
- Add missing move effects: stat-changing moves (Swords Dance, Growl), multi-hit moves (Double Slap), recoil moves (Take Down), draining moves (Giga Drain), weather moves.
- Add move priority levels (Quick Attack = +1, Protect = +4, etc.).
- Implement protect/detect mechanics.
- Add flinch mechanic (secondary effect chance).
- Two-turn moves (Fly, Dig, Solar Beam) with invulnerable-turn logic.

### Deliverable
Battles have real strategic depth. Players must consider abilities, items, weather, and move selection. Evolution has multiple paths.

---

## Phase 3: Side Content & World Expansion

**Goal:** Add meaningful side content, optional areas, and expand the world beyond the current 6 maps.

### 3.1 — Fishing System
- 3 rod tiers: Old Rod, Good Rod, Super Rod.
- Interact with water tile (ENTER facing water while rod is key item) triggers fishing sequence.
- Mini-game: timed prompt ("! A bite!"), press ENTER within window to hook, then battle.
- Per-map, per-rod encounter tables in `encounter-tables.ts`.
- Old Rod: available early (NPC gift in town 2).

### 3.2 — Day/Night Cycle (Lite)
- Accelerated clock: 1 real minute = 10 game minutes (full day/night in 2.4 hours real time).
- 4 time periods: Morning (06–12), Day (12–18), Evening (18–21), Night (21–06).
- Overworld tint overlay (Phaser camera pipeline): warm, neutral, orange, blue.
- Encounter table variants by time period.
- Clock displayed in pause menu.
- Save file records game time.
- Time-based evolutions (Eevee to Espeon/Umbreon).

### 3.3 — Shiny Pokémon
- 1/4096 base chance per encounter.
- Alternate sprite set (front/back/icon) — use PokéAPI shiny sprites.
- Sparkle particle effect + SFX on battle intro.
- Shiny star icon on Summary and Party screens.
- `isShiny: boolean` field on `PokemonInstance`.
- Tracked in Pokédex if Pokédex scene is implemented.

### 3.4 — Pokédex Scene
- New `PokedexScene` accessible from pause menu.
- Species list: scrollable, showing seen/caught status per species.
- Detail view: sprite, type, height/weight, short description, habitat.
- Seen count / Caught count displayed at top.
- Auto-register on encounter (seen) and catch (caught).
- Requires `pokedex: { [id: number]: 'seen' | 'caught' }` on `GameManager`.

### 3.5 — Optional Dungeon: Crystal Cavern
- A multi-floor cave accessible from Route 2 (side path, not required for main story).
- Features: dark overlay (reduced visibility), rock-type and ground-type encounters, item pickups on the ground, Strength-boulder puzzle on floor 2.
- Boss encounter at the end: rare Pokémon (predetermined species) at elevated level.
- Rewards: rare TM, unique held item.

### 3.6 — Rival Encounters
- Rival appears at 4 story-gate points with escalating team.
- Rival's team composition adapts based on your starter choice (type advantage).
- Pre-battle dialogue advances the story.
- Rival battles are mandatory (cannot be avoided/fled).
- Post-battle dialogue changes based on whether you won or lost.

### 3.7 — NPC Side Quests (Fetch / Delivery)
- 3–5 simple side quests available across existing and new maps:
  - "Find my lost Pokémon" — locate an NPC's Pokémon in a route, interact with it, return.
  - "Deliver this package" — carry a key item between two NPCs.
  - "Battle challenge" — defeat a specific trainer to earn a reward.
- Quest tracking via `GameManager.flags` (started/completed states).
- Rewards: rare items, move tutors, Pokémon eggs.

### Deliverable
The world feels alive with optional exploration, time-based changes, collectible shinies, a working Pokédex, and side content that rewards curiosity.

---

## Phase 4: PokéMart, Economy & PC Storage — COMPLETE

> **Completed 2026-04-12.** ShopScene with Buy/Sell tabs, per-town inventory (`shop-data.ts`), quantity selector, money validation. PCScene with 12×30 box grid, party↔box transfers, pick/place mechanic, party protection (can't remove last member). GameManager: money system (earn/spend), bag management, 12 PC boxes with auto-deposit when party full. Items have `buyPrice`, sell at 50%. Trainer battles award `rewardMoney`. Money shown on pause menu. SaveManager persists boxes. Overworld NPC interaction types (`shop`, `pc`, `heal`) trigger respective scenes. See CHANGELOG.md for details.

### 4.1 — PokéMart / Shop System
- New `ShopScene` launched from interacting with mart NPCs.
- **Buy tab**: item list with prices, quantity selector (1/5/10/max), purchase confirmation.
- **Sell tab**: shows player inventory, sell price = half buy price, quantity selector.
- Mart inventory defined per town in `item-data.ts` or a new `shop-data.ts`.
- Money display in shop header. Insufficient funds feedback.
- Key items cannot be sold (grayed out).

### 4.2 — Economy & Trainer Rewards
- Set Up Trainer Battles
- Money field in `GameManager` (persisted in save data).
- Trainer battle reward: `base_payout * highest_level` of their team.
- Pickup items from overworld (sparkle sprite on ground, interact to collect).
- Money displayed in pause menu.

### 4.3 — PC Storage System
- New `PCScene` accessed from PokéCenter computer interactions.
- **12 boxes x 30 slots** with box navigation (left/right arrows to switch boxes).
- Move Pokémon: select from box, place in party, or select from party, deposit in box.
- Party must always have at least 1 Pokémon (prevent depositing last member).
- Auto-deposit: when catching with full party, Pokémon goes to first open box slot.
- Box data persisted in `SaveManager` as `boxes: PokemonInstance[][]`.
- Box names editable (default: "Box 1", "Box 2", etc.).

### Deliverable
Full resource loop: earn money, buy items, use items, store Pokémon. PC storage prevents the party-full dead end.

---

## Phase 5: Act 2 Maps & Story Progression

**Goal:** Expand the world from 6 maps to ~12 maps, covering the second story act.

### 5.1 — New Maps
- **Tide Pool Path** (Route 3) — coastal route with water-edge encounters, fishable tiles, Synthesis Collective scouts as trainers.
- **Coral Harbor** (Town 3) — port town with Gym 2 (Water-themed), PokéMart, PokéCenter, fishing NPC.
- **Basalt Ridge** (Route 4) — volcanic path with fire/rock encounters, cave entrance.
- **Ember Mines** (Dungeon) — 2-floor cave with dark overlay, fire-type encounters, Synthesis lab on floor 2.
- **Ironvale** (Town 4) — mining town with Gym 3 (Steel-themed), NPC side quest, PC access.
- **Canopy Trail** (Route 5) — dense forest route with bug/grass encounters, branching paths.

### 5.2 — Gym Leaders 2–4
- **Gym 2 (Coral Harbor)**: Water specialist. Puzzle: navigate rising tide platforms. Leader uses Rain Dance strategy.
- **Gym 3 (Ironvale)**: Steel specialist. Puzzle: rotate gear switches to open doors. Leader uses Sandstorm + sturdy defense.
- **Gym 4 (reached via Route 5)**: Grass/Poison specialist. Puzzle: cut through vine barriers (after obtaining Cut HM). Leader uses status-inflicting moves.

### 5.3 — Story Integration
- Synthesis Collective encounters in each new route (trainer battles + dialogue).
- Ember Mines dungeon reveals Collective is extracting Aether from underground.
- Rival appears before Gym 3 — helps you in a tag-battle (2v2 against Collective grunts) or challenges you (based on story flags).
- Key item obtained: **Aether Lens** — reveals hidden paths/items in dungeons.

### Deliverable
The game has ~12 explorable maps, 4 gyms, and a story that hooks the player past the initial hour of gameplay.

---

## Phase 6: Difficulty Modes & Replayability

**Goal:** Add replay value through multiple difficulty modes.

### 6.1 — Difficulty Selection
- Selectable at New Game: **Classic**, **Nuzlocke**, **Hard Mode**.
- Stored in `SaveData.difficulty`.

### 6.2 — Nuzlocke Mode
- Fainted Pokémon are **permanently released** (removed from party/PC).
- Only the **first encounter per route** is catchable (subsequent encounters cannot throw Poké Balls).
- Nickname prompt is mandatory after every catch.
- Game Over screen if all Pokémon faint (save deleted or archived).
- Visual indicator in UI: skull icon on fainted Pokémon before release.

### 6.3 — Hard Mode
- Trainer and gym leader Pokémon are **3–5 levels higher**.
- Gym leaders use held items and better AI (switch on bad matchups).
- **No items usable in battle** (Bag option disabled during trainer battles).
- Reduced money from trainers (x0.75 multiplier).
- Wild Pokémon have randomized IV spreads (no forced-good IVs).

### 6.4 — Randomizer (Stretch Goal)
- On new game, seed-based shuffle of: wild encounter tables, trainer teams, starter options.
- Seed is shareable (display on pause menu) for race/challenge parity.
- Does not randomize items or story progression.

### Deliverable
Players have a reason to replay. Nuzlocke and Hard Mode create meaningfully different experiences from the same content.

---

## Phase 7: Mobile & Accessibility

**Goal:** Make the game playable on mobile and accessible to more players.

### 7.1 — Touch Controls
- Virtual D-pad (bottom-left) + A/B buttons (bottom-right) as Phaser GameObjects.
- Auto-detect touch capability (`navigator.maxTouchPoints`).
- Touch-to-move: tap a walkable tile, pathfind and walk there.
- Touch-friendly menu targets (minimum 44x44 px).
- D-pad hidden when a menu is active (A/B buttons remain for confirm/cancel).

### 7.2 — Responsive Scaling
- Configure Phaser Scale Manager: `mode: Phaser.Scale.FIT`, `autoCenter: Phaser.Scale.CENTER_BOTH`.
- Test at common resolutions: 360x640 (phone), 768x1024 (tablet), 1920x1080 (desktop).
- UI elements anchor to viewport edges (not fixed pixel positions).

### 7.3 — Accessibility Features
- **Remappable controls**: Settings menu allows rebinding all keys.
- **Text scaling**: Small/Medium/Large font size option.
- **Colorblind mode**: Alternate type-color palettes (protanopia, deuteranopia).
- **Reduced motion**: Disable screen shake, flash effects, rapid animations.

### 7.4 — PWA Support
- `manifest.json` with app icons, theme color, `display: standalone`.
- Service worker (Workbox) pre-caches game assets.
- Works offline after first load.
- "Add to Home Screen" on mobile browsers.

### Deliverable
The game is playable on phones and tablets, accessible to players with visual or motor needs, and installable as a PWA.

---

## Phase 8: Continued World Expansion (Act 3+)

**Goal:** Complete the main storyline through gym 8 and the Pokémon League.

> Detailed sub-phases to be planned after Phase 5 is complete, informed by playtesting and feedback. General scope:

- Maps for towns 5–8, routes 6–10, 2 additional dungeons.
- Gyms 5–8 with unique puzzles and story integration.
- Synthesis Collective headquarters infiltration (Act 3 climax).
- Victory Road dungeon.
- Pokémon League: Elite Four (4 consecutive battles) + Champion.
- Hall of Fame scene.
- Post-game content: legendary quests, Cerulean Cave equivalent.

---

## Backlog — Future Considerations

These items are tracked but not yet scheduled into phases:

### Content
- Full 151 Pokédex (expand from ~30 to 151 species)
- Breeding & Egg hatching system
- Follower Pokémon in overworld
- Safari Zone special mechanics
- Pokémon Amie / affection system
- TMs, HMs & overworld move effects (Cut, Surf, Strength, Flash, Fly)
- More trainer variety and rematch system
- Achievement / milestone tracking

### Multiplayer
- WebRTC peer-to-peer battles
- Trading system with trade evolutions
- Leaderboards (speed-run, Pokédex completion, battle rating)

### Technical
- Localization (i18n) — multi-language support
- Mod support — load custom content from JSON
- Performance optimization (texture atlases, object pooling, lazy scene loading)
- Enhanced automated testing (visual regression, expanded E2E coverage)
- Analytics (opt-in, privacy-first)

---

## Estimated Scope

| Phase | Description | Relative Effort |
|-------|-------------|----------------|
| 1 | UI Overhaul & Foundation | Large |
| 2 | Gameplay Depth — Battle Expansion | Large |
| 3 | Side Content & World Expansion | Medium |
| 4 | PokéMart, Economy & PC Storage | Medium |
| 5 | Act 2 Maps & Story (Gyms 2-4) | Large |
| 6 | Difficulty Modes & Replayability | Small |
| 7 | Mobile & Accessibility | Medium |
| 8 | Act 3+ Maps & Story (Gyms 5-8, League) | Large |
| Backlog | Future Considerations | Ongoing |

---

## Development Principles

### Modular & Data-Driven
Every Pokémon, move, item, and trainer is defined as data, not code. Adding new content means adding objects to arrays, not writing new classes.

### Scene Isolation
Scenes communicate only through `EventManager` and `GameManager`. No scene directly references another scene's internals.

### Build Small, Test Often
Each phase has a concrete deliverable. Test that deliverable manually before moving on.

### Copilot-Friendly Code
- **Descriptive function and variable names** — Copilot fills in logic better when names are clear.
- **Rich comments before complex functions** — describe intent, inputs, outputs, and edge cases.
- **Small, focused files** — one class or system per file.
- **Typed everything** — interfaces and enums give Copilot the context to generate correct code.

### Version Control
- Commit at the end of each sub-phase.
- Use feature branches for large systems.
- Write brief commit messages describing what works now.
