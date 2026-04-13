# Pokemon Web Game — Development Plan

## Project Overview

A browser-based Pokémon-style RPG built with **Phaser 3 + TypeScript + Vite**. The player explores a top-down overworld, captures and trains Pokémon in turn-based battles, interacts with NPCs, and progresses through gym challenges. The entire game runs client-side as a static web app.

---

## Phase 1: Environment & Tooling Setup — ✅ COMPLETE
> See [CHANGELOG.md](CHANGELOG.md) for details. Dev server running, folder structure set up, assets sourced.

---

## Phase 2: Core Scenes Skeleton — ✅ COMPLETE
> See [CHANGELOG.md](CHANGELOG.md) for details. All 12 scenes created with full Boot→Preload→Title→Overworld→Battle flow.

---

## Phase 3: The Data Layer — ✅ COMPLETE
> See [CHANGELOG.md](CHANGELOG.md) for details. ~30 Pokémon, ~50 moves, ~15 items, 7 trainers, type chart, encounter tables, evolution data.

---

## Phase 4: Overworld Systems — ✅ COMPLETE\n> See [CHANGELOG.md](CHANGELOG.md) for details. Grid movement, Player/NPC/Trainer entities, EncounterSystem, InputManager, AnimationHelper, procedural map rendering, NPC spawning with flag-gated dialogue, map transitions via warps, wild encounter triggers in tall grass.

---

## Phase 5: Battle System — ✅ COMPLETE
> See [CHANGELOG.md](CHANGELOG.md) for details. Full turn-based battle with damage formula, type effectiveness, STAB, crits, status effects, EXP/level-up, nature modifiers, catch mechanics, AI controller.

---

## Phase 6: UI & Menus — ✅ COMPLETE
> See [CHANGELOG.md](CHANGELOG.md) for details. All menus (Menu, Party, Summary, Inventory, Battle UI) navigable with keyboard + mouse. Shared theme system. 3-tab Summary with INFO/STATS/MOVES.

---

## Phase 7: Audio — ✅ COMPLETE
> See [CHANGELOG.md](CHANGELOG.md) for details. AudioManager with crossfade, autoplay policy, safe playback. 8 BGM tracks + 16 SFX (synthesized placeholders). BGM wired into Title/Overworld/Battle scenes. SFX wired into menus and battle actions.

---

## Phase 8: Save / Load System — ✅ COMPLETE
> See [CHANGELOG.md](CHANGELOG.md) for details. SaveManager with localStorage, SaveData interface, serialize/deserialize, Continue from title screen.

---

## Phase 9: Game Content — World Building — ✅ COMPLETE
> See [CHANGELOG.md](CHANGELOG.md) for details. 6 maps (Pallet Town, Route 1, Viridian City, Route 2, Viridian Forest, Pewter City), starter selection, flag-gated NPCs, PokéCenter healing, trainer rewards & badges, story flow from Oak’s Lab to Boulder Badge.

---

## Phase 10: Polish & Quality of Life — ✅ COMPLETE
> See [CHANGELOG.md](CHANGELOG.md) for details. Battle intro animations, EXP bar, stripe/circle/fade transitions, evolution animation, configurable text speed, save from menu, continue from save.

---

## Phase 11: Deployment — ✅ COMPLETE
> See [CHANGELOG.md](CHANGELOG.md) for details. Vite base path set to `/Pokemon-Web/`. GitHub Actions workflow auto-deploys on push to main. Manual deploy via `npm run deploy`.

---

## Phase 12: Future Enhancements (Post-MVP)

These are stretch goals to expand the game after the core loop is complete, organized by priority tier.

---

### Tier 1 — High-Impact Content & Features

#### 12.1 — Full Gym Circuit & Elite Four
- Expand from 1 gym to all **8 gym badges** (Brock → Misty → Lt. Surge → Erika → Koga → Sabrina → Blaine → Giovanni).
- Build corresponding towns, routes, and dungeons for each gym (Cerulean City, Vermillion City, Celadon City, Fuchsia City, Saffron City, Cinnabar Island).
- Add **Victory Road** dungeon with high-level trainers and wild encounters.
- Implement **Elite Four + Champion** sequence — 5 consecutive battles without access to PokéCenter, with a Hall of Fame scene on victory.
- Each gym leader uses a themed team with improved AI tactics (e.g., Misty leads with Rain Dance).

#### 12.2 — Complete Pokédex (151)
- Expand from ~30 Pokémon to full **Gen 1 roster (151 species)**.
- Download and integrate all front/back/icon sprites from PokéAPI.
- Add Pokédex scene: viewed/caught tracking, species info display, habitat map, cry playback.
- Add Pokédex rating NPC (Prof. Oak evaluates completion).
- Version-exclusive Pokémon split for potential multiplayer trading incentive.

#### 12.3 — PC Storage System (Bill's PC)
- Box-based storage with **12 boxes × 30 slots each** (360 storage capacity).
- Accessible from PokéCenter terminals with a dedicated `PCScene`.
- Drag-and-drop or cursor-based Pokémon movement between boxes and party.
- Box renaming and wallpaper customization.
- Auto-deposit when party is full after a catch.
- Data persisted in `SaveManager` alongside party data.

#### 12.4 — TMs, HMs & Overworld Moves
- **TMs (single-use)** — teach specific moves; found as items, rewards, or purchased.
- **HMs (unlimited-use)** — Cut, Fly, Surf, Strength, Flash.
- Overworld HM effects:
  - **Cut** — remove small trees blocking paths (sprite swap + flag).
  - **Surf** — traverse water tiles; triggers water encounter table.
  - **Strength** — push boulders onto switches or out of the way.
  - **Flash** — illuminate dark caves (reduce visibility overlay radius).
  - **Fly** — fast-travel to previously visited PokéCenters via a map selection screen.
- Move compatibility table per species (checked before teaching).

#### 12.5 — PokéMart & Economy
- Dedicated shop UI with buy/sell tabs, item descriptions, and quantity selector.
- **Mart inventory varies by town** (early towns sell basic items; later towns stock better Poké Balls, TMs, and stat items).
- Sell price = ½ buy price. Key items cannot be sold.
- Trainer battle reward money formula: `base_payout × highest_level`.
- Amulet Coin held item doubles payout.
- Pay Day move adds bonus money per use.

---

### Tier 2 — Gameplay Depth

#### 12.6 — Pokémon Abilities
- Each species has **1–2 possible abilities** (one standard, one hidden).
- Abilities activate automatically in battle via hooks in `BattleStateMachine`:
  - On-switch-in (e.g., Intimidate lowers foe's Attack).
  - On-damage-taken (e.g., Static may paralyze attacker on contact).
  - Passive modifiers (e.g., Levitate grants Ground immunity).
  - Weather-related (e.g., Swift Swim doubles Speed in rain).
- Ability displayed on Summary screen and in Pokédex.
- Data stored in `pokemon-data.ts` as `abilities: string[]` per species.

#### 12.7 — Held Items
- Pokémon can hold **one item** in a dedicated slot.
- Items trigger effects via hooks in battle:
  - **Berries** — auto-consume when HP drops below threshold (Oran Berry heals 10 HP), when statused (Cheri Berry cures paralysis), etc.
  - **Power items** — Leftovers (heal 1/16 HP per turn), Choice Band (+50% Attack, locked into one move), Life Orb (+30% damage, 10% recoil).
  - **Evolution items** — hold + level up or hold + trade triggers evolution (Metal Coat → Steelix).
- Items can be given/taken in Party screen, during battle (Thief move steals item), or from Bag.

#### 12.8 — Weather System
- Four weather conditions: **Sun, Rain, Sandstorm, Hail**.
- Set by moves (Sunny Day, Rain Dance, Sandstorm, Hail) or abilities (Drought, Drizzle, Sand Stream, Snow Warning).
- Battle effects:
  - Sun: Fire +50%, Water −50%, Solar Beam instant, Moonlight heals ⅔.
  - Rain: Water +50%, Fire −50%, Thunder never misses, Solar Beam halved.
  - Sandstorm: Rock/Ground/Steel immune; others lose 1/16 HP/turn; Rock SpDef +50%.
  - Hail: Ice immune; others lose 1/16 HP/turn; Blizzard never misses.
- Overworld visual overlay (rain particles, dimmed sun tint, sand particles, snowflakes) using Phaser particle emitter.
- Weather lasts 5 turns or until replaced.

#### 12.9 — Day/Night Cycle
- Real-time or accelerated clock (1 real minute = 1 game hour, configurable).
- **4 time periods**: Morning (06–12), Day (12–18), Evening (18–21), Night (21–06).
- Overworld tint overlay shifts color temperature per period (warm morning, neutral day, orange evening, blue night).
- Encounter tables vary by time (Hoothoot at night, Pidgey during day).
- Certain NPCs and events only available at specific times.
- Certain evolutions require time-of-day (Eevee → Espeon during day, Umbreon at night).
- Clock displayed in menu; save file records in-game time.

#### 12.10 — Multi-Condition Evolution
- Expand evolution system beyond level-up:
  - **Item evolution** — use stone from bag (e.g., Fire Stone → Flareon).
  - **Trade evolution** — simulated via NPC trade station (Machoke → Machamp).
  - **Friendship evolution** — track friendship value; evolve at threshold + level-up.
  - **Time-of-day evolution** — combined with friendship (Eevee → Espeon/Umbreon).
  - **Location evolution** — evolve when leveling up in specific area (Magneton → Magnezone at Power Plant).
  - **Move-known evolution** — evolve when a specific move is in moveset (Tangela with Ancient Power → Tangrowth).
- Evolution data stored in `evolution-data.ts` with a discriminated union type for conditions.

#### 12.11 — Fishing System
- **3 rod tiers**: Old Rod (Magikarp only), Good Rod (common water types), Super Rod (rare water types).
- Interact with water tile while holding rod → fishing mini-game (timed button press for hook).
- Separate encounter tables per rod tier and per map.
- Rods obtained from specific NPCs (fishing brothers in Vermillion, Fuchsia, Route 12).

#### 12.12 — Safari Zone
- Special area with unique rules: no battling, only throwing Safari Balls and bait/rocks.
- **500-step limit** tracked per visit.
- Rare Pokémon available only here (Chansey, Kangaskhan, Tauros, Scyther, Pinsir).
- Bait lowers catch rate but makes Pokémon stay longer; Rock raises catch rate but Pokémon may flee.
- Dedicated `SafariZoneScene` or mode flag in `BattleScene`.

---

### Tier 3 — Side Content & Polish

#### 12.13 — Breeding & Eggs
- **Day Care** NPC accepts two compatible Pokémon.
- Egg generation based on egg group compatibility; species follows the mother.
- Eggs hatch after a step counter (stored in save data), with a hatch animation.
- Offspring inherits moves from parents (egg moves).
- IV inheritance from parents (random 3 of 12 stats inherited).
- Destiny Knot held item passes 5 IVs; Everstone passes nature.

#### 12.14 — Side Quests & Optional Content
- **Caves & Dungeons**: Mt. Moon, Rock Tunnel, Seafoam Islands, Victory Road — multi-floor with wild encounters, items, and puzzles (Strength boulders, Flash darkness).
- **Legendary encounters**: scripted one-time battles with special intro (Zapdos at Power Plant, Articuno in Seafoam, Moltres at Victory Road, Mewtwo in Cerulean Cave post-game).
- **Rival encounters**: recurring rival battles at key story points (6–8 battles throughout the game).
- **SS Anne**: multi-room ship dungeon, accessible with a ticket, Cut HM obtained here.
- **Game Corner** (Celadon City): coin-based mini-games, exchange coins for rare Pokémon/TMs.
- **Ghost Tower** (Lavender Town): Silph Scope required to identify Ghost-type Pokémon; Marowak ghost boss.

#### 12.15 — Follower Pokémon
- First party member walks behind the player in the overworld.
- Uses a deduplicated sprite system (one spritesheet per species).
- Follower reacts when interacted with (text varies by friendship, HP, status).
- Toggleable in settings.
- Pathfinding follows player's movement history (queue of last N tiles).

#### 12.16 — Pokémon Amie / Affection
- Mini-interaction screen: pet, feed, play with your Pokémon.
- Raises affection stat (separate from friendship).
- High affection grants battle bonuses: bonus EXP, crit rate boost, chance to survive lethal hits ("held on so you wouldn't be sad"), chance to shake off status.
- Affection decays slowly over time if not maintained.

#### 12.17 — Shiny Pokémon
- **1/4096 chance** on every wild encounter and egg hatch.
- Shiny uses alternate palette sprite (front/back/icon variants).
- Sparkle animation + SFX on encounter.
- Shiny star icon on Summary and Party screens.
- Tracked in Pokédex (separate shiny seen/caught counters).
- Shiny Charm item (post-Pokédex completion) increases odds to 3/4096.

#### 12.18 — Achievement System
- Track milestones: first catch, first evolution, first badge, Pokédex completion tiers, battle streaks, shiny encounters.
- Achievement toast notification overlay.
- Achievement gallery accessible from menu.
- Rewards: cosmetic titles, rare items, unlockable player sprite variants.

#### 12.19 — Difficulty Modes
- **Classic** — standard experience, matching Gen 1 difficulty.
- **Nuzlocke** — enforced rules: fainted Pokémon are released, only first encounter per route catchable, nicknames mandatory.
- **Hard Mode** — gym leaders use held items, better AI, higher levels, no items in battle.
- **Randomizer** — shuffle wild encounters, trainer teams, and starter options on new game (seeded RNG for shareable seeds).
- Mode selected at new game; saved in `SaveData`.

---

### Tier 4 — Multiplayer & Social

#### 12.20 — Peer-to-Peer Battles
- **WebRTC** data channels for low-latency direct connections.
- Lobby system: generate a room code, share with a friend, connect.
- Battle sync protocol: each client sends chosen action per turn; both simulate independently with verification.
- Flat level option (all Pokémon scaled to 50 or 100) for competitive fairness.
- Anti-cheat: hash party data at battle start, verify on disconnect.
- Spectator mode: third-party can watch live battles via read-only stream.

#### 12.21 — Trading System
- Peer-to-peer trade via same WebRTC connection layer.
- Trade UI: both players see each other's offered Pokémon with summary details.
- Confirm/cancel flow with both parties agreeing.
- Trade evolutions trigger after trade completes (Haunter → Gengar).
- GTS-lite (Global Trade Station): post a Pokémon + desired species; server matches asynchronously.
  - Requires a lightweight backend (serverless function + database) or a shared Firebase Realtime Database.

#### 12.22 — Leaderboards & Social
- **Speed-run leaderboard** — time from New Game to Champion, submitted on Hall of Fame.
- **Pokédex completion leaderboard** — most species caught.
- **Battle rating** — ELO-based rating from online battles.
- Backend: serverless API (Cloudflare Workers / Vercel Edge Functions) + KV store or lightweight DB.
- Optionally integrate with GitHub OAuth for identity.
- Share battle replays via encoded URLs.

---

### Tier 5 — Technical Enhancements

#### 12.23 — Mobile & Touch Controls
- Virtual D-pad overlay (bottom-left) + A/B buttons (bottom-right) rendered as Phaser UI elements.
- Touch-to-move: tap a tile and the player pathfinds to it.
- Responsive canvas scaling for portrait and landscape orientations.
- Touch-friendly menu targets (minimum 44×44 px tap areas).
- Detect `navigator.maxTouchPoints` to auto-enable.

#### 12.24 — PWA & Offline Support
- `manifest.json` with app name, icons, theme color, `display: standalone`.
- Service worker (Workbox) pre-caches all assets on install.
- Offline fallback: the game runs entirely from cache after first load.
- Update notification banner when a new version is available.
- "Add to Home Screen" prompt on mobile.

#### 12.25 — Localization (i18n)
- All player-visible strings extracted to JSON locale files (`en.json`, `es.json`, `ja.json`, etc.).
- `LocalizationManager` singleton loads the active locale and exposes `t('key')` helper.
- Language selector on Title screen; stored in save data and localStorage.
- Right-to-left (RTL) text support for Arabic/Hebrew if needed.
- Locale-aware number and date formatting.

#### 12.26 — Mod Support & Custom Content
- Load custom Pokémon, moves, maps, and encounter tables from external **JSON files** or a `mods/` directory.
- Mod manifest format: declares mod name, version, and overrides.
- Data-merging layer: mods extend or replace entries in the base data arrays.
- Custom map support: load Tiled JSON from user-provided URL or file input.
- Mod manager UI to enable/disable/reorder mods.
- Sandboxed: mods cannot execute arbitrary code, only supply data.

#### 12.27 — Performance Optimization
- **Texture atlas packing** — combine small sprites into atlases to reduce draw calls.
- **Object pooling** — reuse particle, projectile, and UI element instances instead of creating/destroying.
- **Lazy scene loading** — only initialize scenes when first needed; dispose after leaving.
- **Asset streaming** — load map/encounter data for the next route during transitions.
- **WebGL shader effects** — custom shaders for weather, transitions, and battle effects (faster than sprite-based).
- **Profiling dashboard** — dev-only overlay showing FPS, draw calls, memory, and scene load times.

#### 12.28 — Automated Testing & CI
- **Unit tests** (Vitest) — damage calculator, type chart, catch calculator, EXP calculator, status effects, data integrity.
- **Integration tests** — battle flow, save/load round-trip, encounter system, evolution triggers, inventory management.
- **E2E tests** (Playwright) — boot to title, menu navigation, new game flow, full battle sequence.
- **Fuzz testing** — randomized inputs to battle system to find edge cases.
- **Replay testing** — record and replay deterministic battle sequences for regression detection.
- **Visual regression** — screenshot comparison for UI scenes.
- **CI pipeline** (GitHub Actions): lint → type-check → unit tests → integration tests → build → deploy preview.
- **Coverage thresholds** — enforce minimum coverage for critical systems (battle, save, data).

#### 12.29 — Accessibility
- **Screen reader support** — ARIA labels on canvas overlay for key game state (current scene, dialogue text, battle options).
- **Colorblind modes** — alternate type-color palettes (protanopia, deuteranopia, tritanopia).
- **Remappable controls** — allow rebinding of all keys via Settings menu.
- **Text scaling** — adjustable font size for dialogue and menus.
- **Reduced motion** — option to disable screen shake, flash effects, and rapid animations.
- **High contrast mode** — thicker outlines and increased contrast for UI elements.

#### 12.30 — Analytics & Telemetry (Opt-In)
- Privacy-first, opt-in analytics with a clear consent prompt.
- Track anonymized gameplay metrics: average playtime, gym completion rates, most-used Pokémon, common drop-off points.
- Use a lightweight analytics library (Plausible, Umami, or custom events to a serverless endpoint).
- Data informs content balancing (if Brock is too hard, adjust levels; if a route is skipped, improve rewards).
- No PII collected; all data is aggregate.

---

## Development Principles

### Modular & Data-Driven
Every Pokémon, move, item, and trainer is defined as data, not code. Adding new content means adding objects to arrays, not writing new classes.

### Scene Isolation
Scenes communicate only through `EventManager` and `GameManager`. No scene directly references another scene's internals.

### Build Small, Test Often
Each phase has a concrete deliverable. Test that deliverable manually before moving on. Don't build Phase 5 (battles) before Phase 4 (overworld) is solid.

### Copilot-Friendly Code
- **Descriptive function and variable names** — Copilot fills in logic better when names are clear.
- **Rich comments before complex functions** — describe intent, inputs, outputs, and edge cases.
- **Small, focused files** — one class or system per file. Copilot struggles with 500+ line files.
- **Typed everything** — interfaces and enums give Copilot the context to generate correct code.

### Version Control
- Commit at the end of each sub-phase.
- Use feature branches for large systems (e.g., `feature/battle-system`).
- Write brief commit messages describing what works now.

---

## Estimated Scope per Phase

| Phase | Description | Relative Effort |
|-------|-------------|----------------|
| 1 | Environment Setup | Small |
| 2 | Scene Skeleton | Small |
| 3 | Data Layer | Medium |
| 4 | Overworld Systems | Large |
| 5 | Battle System | Large |
| 6 | UI & Menus | Medium |
| 7 | Audio | Small |
| 8 | Save / Load | Small |
| 9 | World Content | Large |
| 10 | Polish | Medium |
| 11 | Deployment | Small |
| 12.1–12.5 | Tier 1 — High-Impact Content | Large |
| 12.6–12.12 | Tier 2 — Gameplay Depth | Large |
| 12.13–12.19 | Tier 3 — Side Content & Polish | Medium |
| 12.20–12.22 | Tier 4 — Multiplayer & Social | Large |
| 12.23–12.30 | Tier 5 — Technical Enhancements | Ongoing |

---

## Quick-Start Checklist

- [x] Clone Phaser Vite TS template & verify dev server runs
- [x] Set up folder structure per architecture.md
- [x] Create all Scene stub classes (Boot → Preload → Title → Overworld → Battle)
- [x] Define TypeScript interfaces for PokemonData, MoveData, ItemData
- [x] Populate data for 3 starters + 10 route Pokémon + 20 moves
- [ ] Build first Tiled map (Pallet Town) with collision layers
- [x] Implement grid-based player movement with tween
- [ ] Implement NPC dialogue system
- [ ] Implement map transitions (warps)
- [ ] Implement wild encounter trigger in tall grass
- [x] Build the battle state machine (INTRO → turns → VICTORY/DEFEAT)
- [x] Implement damage formula with type effectiveness
- [x] Implement Poké Ball catching mechanic
- [x] Implement EXP gain and level-up
- [x] Build pause menu with party/bag/save options
- [x] Implement save/load to localStorage
- [x] Build Pokemon Summary screen (INFO / STATS / MOVES tabs)
- [x] Implement nature stat modifiers (+10%/-10%)
- [x] Add shared UI theme system (colors, fonts, spacing)
- [x] Download and integrate PokéAPI sprites (front/back/icon)
- [x] Add player walk-cycle spritesheet and animations
- [x] Load and display actual Pokemon sprites in battles and summary
- [ ] Add background music and sound effects
- [ ] Build maps for Route 1, Viridian City, Viridian Forest, Pewter City
- [ ] Implement first gym battle (Brock)
- [ ] Polish animations and transitions
- [ ] Deploy to GitHub Pages
