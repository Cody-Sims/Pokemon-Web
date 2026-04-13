# Pokemon Web Game — Development Plan

## Project Overview

A browser-based Pokémon-style RPG built with **Phaser 3 + TypeScript + Vite**. The player explores a top-down overworld, captures and trains Pokémon in turn-based battles, interacts with NPCs, and progresses through a unique original storyline. The entire game runs client-side as a static web app.

---

## Storyline — The Aurum Region

A coastal island chain where ancient ruins dot the landscape and **Aether** flows through underground ley lines. The player arrives in **Littoral Town** and is recruited by Professor Willow to document the region's Pokémon. Meanwhile, **The Synthesis Collective** is siphoning Aether to artificially enhance Pokémon, creating powerful but unstable specimens.

**Story Beats:**
1. **Act 1 — Discovery** (current content): Starter, first routes, Badge 1, strange wild behavior, meet rival.
2. **Act 2 — Investigation**: Synthesis labs in caves/ruins, Badges 2–4, rescue Pokémon.
3. **Act 3 — Confrontation**: Infiltrate Collective HQ, Badges 5–8, boss fights.
4. **Act 4 — Resolution**: Pokémon League, Champion is Collective founder, post-game legendaries.

---

## Completed Phases

### Phase 1: UI Overhaul & Foundation ✓
> NinePatchPanel, MenuController, DialogueScene (speaker names, SFX, choices), InventoryScene (5 categories, USE/TOSS), Battle UI (type indicators, PP coloring, damage popups), PartyScene (context menu, SWITCH, fainted indicators), SettingsScene.

### Phase 2: Gameplay Depth — Battle System Expansion ✓
> AbilityHandler (20+ abilities), HeldItemHandler (Leftovers/Life Orb/Focus Sash/berries/Choice items), WeatherManager (Sun/Rain/Sandstorm/Hail), multi-condition evolution (level/item/friendship/move-known), Protect/Detect, two-turn moves (Fly/Dig/Solar Beam), weather-setting moves. All wired into DamageCalculator, BattleManager, and BattleUIScene.

### Phase 3.1–3.4: Side Content ✓
> Fishing system (3 rod tiers, per-route fishing tables, water tile interaction), day/night cycle (GameClock with 10× accelerated time, 4 time periods, camera tint), shiny Pokémon (1/4096 chance, sparkle effect, ★ on Summary), Pokédex Scene (151-species browser, seen/caught status, detail panel with sprite/types/stats, POKEDEX in pause menu).

### Phase 4: PokéMart, Economy & PC Storage ✓
> ShopScene (Buy/Sell tabs, per-town inventory, quantity selector), PCScene (12×30 boxes, party↔box transfers, pick/place), money system, auto-deposit on full party, trainer battle rewards, SaveManager persistence.

### Phase 7: Mobile & Accessibility ✓
> TouchControls (virtual D-pad + A/B buttons, auto-detected), responsive scaling (Phaser.Scale.FIT), accessibility settings (text size, colorblind mode, reduced motion), PWA (manifest.json, service worker, offline support).

### Other Completed Work ✓
> Full Gen 1 Pokédex (151 Pokémon), 200+ moves by type, Pokémon catching end-to-end (CatchCalculator, ball throw/shake animation, party/PC deposit), complete data layer restructure (per-type files).

---

## Remaining Phases

### Phase 3.5–3.7: Side Content (Remaining)

**3.5 — Optional Dungeon: Crystal Cavern**
- Multi-floor cave off Route 2, dark overlay, rock/ground encounters.
- Strength-boulder puzzle, boss encounter (rare Pokémon), TM + held item rewards.

**3.6 — Rival Encounters**
- 4 story-gate encounters with escalating team (adapts to starter choice).
- Mandatory battles, pre/post dialogue with win/loss variants.

**3.7 — NPC Side Quests**
- 3–5 fetch/delivery/battle quests tracked via `GameManager.flags`.
- Rewards: rare items, move tutors.

---

### Phase 5: Act 2 Maps & Story Progression

**Goal:** Expand from 6 to ~12 maps, Gyms 2–4.

- **Tide Pool Path** (Route 3): coastal, fishable, Synthesis scouts.
- **Coral Harbor** (Town 3): Gym 2 (Water), PokéMart, fishing NPC.
- **Basalt Ridge** (Route 4): volcanic, fire/rock encounters.
- **Ember Mines** (Dungeon): 2-floor cave, Synthesis lab.
- **Ironvale** (Town 4): Gym 3 (Steel), side quest.
- **Canopy Trail** (Route 5): dense forest, bug/grass encounters.
- **Gym puzzles**: Gym 2 (rising tides), Gym 3 (gear switches), Gym 4 (vine barriers).
- **Story**: Collective encounters per route, Ember Mines reveals Aether extraction, rival tag-battle at Gym 3.

---

### Phase 6: Difficulty Modes & Replayability

**Goal:** Add replay value with difficulty selection at New Game.

- **Classic**: Standard experience.
- **Nuzlocke**: Fainted = released, first encounter per route only, mandatory nicknames, game over on wipe.
- **Hard Mode**: Trainer levels +3–5, gym leaders use held items + smart AI, no items in trainer battles, 0.75× money.
- **Randomizer** (stretch): Seed-based shuffle of encounters/teams/starters.

---

### Phase 8: Act 3+ World Expansion

**Goal:** Complete storyline through Gym 8 and Pokémon League.

- Towns 5–8, Routes 6–10, 2 additional dungeons.
- Gyms 5–8 with story-integrated puzzles.
- Synthesis Collective HQ infiltration (Act 3 climax).
- Victory Road, Elite Four + Champion.
- Post-game: legendary quests, endgame dungeon.

---

## Backlog

### Content
- Breeding & Egg hatching
- Follower Pokémon in overworld
- Safari Zone
- TMs, HMs & overworld move effects (Cut, Surf, Strength, Fly)
- Trainer rematch system
- Achievement tracking

### Multiplayer
- WebRTC peer-to-peer battles
- Trading system
- Leaderboards

### Technical
- Localization (i18n)
- Mod support (custom JSON content)
- Performance optimization (texture atlases, object pooling)
- Enhanced testing (visual regression, expanded E2E)

---

## Development Principles

- **Data-driven**: Pokémon, moves, items, trainers defined as data objects, not code.
- **Scene isolation**: Scenes communicate via `EventManager` and `GameManager` only.
- **Build small, test often**: Each phase has a concrete deliverable.
- **Typed everything**: Interfaces and enums for all game data structures.
