# Pokemon Web Game — Development Plan

## Project Overview

A browser-based Pokémon-style RPG built with **Phaser 3 + TypeScript + Vite**. The player explores a top-down overworld, captures and trains Pokémon in turn-based battles, interacts with NPCs, and progresses through an original storyline set in the **Aurum Region**. The entire game runs client-side as a static web app.

> Full storyline bible: [docs/storyline.md](storyline.md) | Architecture: [docs/architecture.md](architecture.md) | Testing: [docs/TestingArchitecture.md](TestingArchitecture.md)

---

## Storyline — The Aurum Region

A coastal island chain where ancient ruins dot the landscape and **Aether** flows through underground ley lines. The player arrives in **Littoral Town** and is recruited by Professor Willow to document the region's Pokémon. Meanwhile, **The Synthesis Collective** is siphoning Aether to artificially enhance Pokémon, creating powerful but unstable **Synthetics**. The player's quest to find their missing Pokémon Ranger father intertwines with the region-wide crisis.

**Key Characters:** Kael Ashford (primary rival, 6 encounters), Marina Oleander (secondary rival/researcher), Rook (ex-Collective drifter), Director Aldric Maren (Collective founder, secret Champion), Dr. Vex Corbin (3 boss fights), Zara Lux (potential defector).

**Story Arcs:** Act 1 Awakening (Badges 1–2) → Act 2 Investigation (Badges 3–5) → Act 3 Confrontation (Badges 6–8, Abyssal Spire) → Act 4 Resolution (Elite Four, Champion Aldric) → Post-Game (Shattered Isles, Father's Trail, Legendaries).

---

## Completed Work

### Phase 1: UI Overhaul & Foundation
NinePatchPanel, MenuController, DialogueScene (speaker names, SFX, choices), InventoryScene (5 categories, USE/TOSS), Battle UI (type indicators, PP coloring, damage popups), PartyScene (context menu, SWITCH, fainted indicators), SettingsScene.

### Phase 2: Battle System Expansion
AbilityHandler (20+ abilities), HeldItemHandler (Leftovers/Life Orb/Focus Sash/berries/Choice items), WeatherManager (Sun/Rain/Sandstorm/Hail), multi-condition evolution (level/item/friendship/move-known), Protect/Detect, two-turn moves (Fly/Dig/Solar Beam), weather-setting moves.

### Phase 3: Side Content
Fishing system (3 rod tiers, per-route fishing tables), day/night cycle (GameClock, 4 time periods, camera tint), shiny Pokémon (1/4096 chance, sparkle effect), Pokédex Scene (151-species browser, seen/caught). Crystal Cavern dungeon (20×30, 7-species encounter table, 3 hiker trainers). Rival Kael (6 encounters Lv 5→65) + Marina (2 encounters). Synthesis Collective grunts. QuestManager + 12 quest definitions. Quest NPCs across towns. Story NPCs (Rook, Synthesis sensors).

### Phase 4: Economy & PC Storage
ShopScene (Buy/Sell, per-town inventory, quantity selector), PCScene (12×30 boxes, party↔box transfers), money system, auto-deposit on full party, trainer battle rewards, SaveManager persistence.

### Phase 4.5: Art Assets & Tileset Expansion
42 new tile types (IDs 68–109) across 10 biomes: Coastal, Volcanic, Mine, Industrial, Forest, Electric, Ghost/Ruin, Dragon, Synthesis HQ, League. Battle background system.

### Phase 5: Act 2 Maps & Story
Route 3 (Tide Pool Path), Coral Harbor (Gym 2 Water), Route 4 (Basalt Ridge), Ember Mines (Dr. Vex boss #1), Ironvale City (Gym 3 Steel), Route 5 (Canopy Trail), Verdantia Village (Gym 4 Grass), Voltara City (Gym 5 Electric). 15 interior maps. Encounter tables for all routes. Synthesis grunt encounters, story NPCs.

### Phase 6: Difficulty & Replayability
Classic, Hard, and Nuzlocke modes. Enhanced AIController with STAB/status awareness. Difficulty selection on New Game.

### Phase 7: Mobile & Accessibility
TouchControls (virtual D-pad + A/B), responsive scaling, accessibility settings (text size, colorblind, reduced motion), PWA (manifest.json, service worker, offline support).

### Phase 8: Act 3+ World Expansion
Route 6, Wraithmoor Town (Gym 6 Ghost), Route 7 (Vex boss #2, Rook identity reveal), Scalecrest Citadel (Gym 7 Dragon), Cinderfall Town (Gym 8 Fire), Victory Road (3 Ace Trainers), Pokémon League (Elite Four + Champion). 9 interior maps. Encounter tables for Route 6/7/Victory Road. Route 8 (Stormbreak Pass, 20×30). Aether Sanctum (post-game, 20×25). Crystal Cavern Depths (post-game, 20×30).

### Phase 9: Story & Quest Wiring
Rival encounters placed on correct maps. 12 quests with full step automation. QuestJournalScene (Active/Complete tabs) + QuestTrackerScene HUD overlay. Generic house interiors (8×8 template, 10 per-city). Quest interaction NPCs. Tag-battle system (Ironvale Kael/player vs 2 grunts). Show-Pokémon and wild-encounter interaction types. Berry fixes.

### Phase 10: First Impressions & New Game Experience
IntroScene with Professor Willow presentation, typewriter text, character naming with keyboard input, confirmation slide. Running Shoes from Mom. Gender selection with sprite previews.

### Phase 11: Battle Animation & Visual Effects
MoveAnimationPlayer (6 animation styles, 18 type-based particle palettes, 16 specific move overrides). Screen flash and screen shake effects.

### Phase 12: Overworld Atmosphere & World Feel
WeatherRenderer (6 weather types via particle emitters). NPC Behavior system (stationary, look-around, wander, pace). EmoteBubble system (6 types). LightingSystem (darkness overlay, radial gradient lights). Animated tiles (water shimmer, grass pulse, lava cycling). AmbientSFX system. Terrain footstep SFX.

### Phase 13: Player Movement & Exploration
Bicycle (B key toggle, 3× speed), running encounter modifier (1.5×). OverworldAbilities (Cut, Surf, Strength, Flash, Rock Smash — wired). Surfing state. Ledge system (one-way jumps, parabolic hop). Strength boulder-pushing. Flash integration for dark caves.

### Phase 15: Sound & Music
CryGenerator (151 procedural Web Audio cries). 13 new BGM keys + 14 SFX keys. Context-sensitive music per town. AudioManager enhancements (fanfare, low-HP beep, pause/resume).

### Phase 16: Advanced Battle Features (Partial)
Synthesis Mode (19 eligible Pokémon, +100 BST boosts, UI with SYNTH button and cyan aura). Double Battle Manager (2v2, 4 active slots, spread targeting, tag battle). Move Tutor & TM System (50 TMs, 5 tutors, `canLearnMove()`, Heart Scale).

### Phase 17: Cutscene & Story Presentation
CutsceneEngine (16 action types, data-driven). 18 cutscenes authored (game-intro, rival-kael-lab, ember-mines-discovery, willow-kidnapping, rook-reveal, zara-defection, willow-rescue, champion-reveal, morwen-prophecy, solara-confession, ashborne-warning, aldric-spire-offer, post-champion-victory, fathers-journal-discovery, father-reunion + more). Flashback system (sepia overlay). Map-entry and NPC-triggered cutscene wiring. Smart-skip for already-played cutscenes.

### Phase 18: Pokémon Personality & Bond
Friendship system (battle/walk/heal adjustments, battle effects at ≥220). Nickname system (NicknameScene, Name Rater NPC). Nature flavor texts. Affection dialogue. Heart meter. EXP bonus at high friendship. Crit boost at ≥220.

### Phase 19: World Enrichment & Side Activities
Berry Growing System (BerryGarden, BERRY_SOIL tile). TrainerCardScene. Hidden Items System (16 items, Itemfinder key item). Voltorb Flip mini-game.

### Phase 20: Achievement & Completion Tracking
AchievementManager (50 achievements, 5 categories). AchievementToast. AchievementScene. GameStats (12 tracked). Hall of Fame data structure. Achievement triggers wired.

### Storyline Implementation
- **Pokémon League**: 6 rooms (Lobby, 4 E4 chambers, Champion Chamber). All E4 complete (Nerida, Theron, Lysandra, Ashborne). Champion Aldric. Hall of Fame flag.
- **Abyssal Spire**: 5-floor Collective HQ dungeon. Rook partner (F1), Dr. Vex boss #3 (F2), Zara confrontation (F3), Willow rescue (F4), Aldric escape (F5). 8 new trainers.
- **Shattered Isles**: 3 post-game maps (Shore, Ruins, Temple). Rook postgame battle (Lv 70–74). Father's Trail journal fragments. Solatheon encounter.
- **Verdantia Lab**: 15×18 mini-dungeon. 3 grunt trainers. 3 lore terminals. Encounter table.
- **NPC Population**: All 10 cities populated (Mom healer, Old Man Edgar, Museum Curator, Blacksmith Apprentice, Veteran Knox, etc.).
- **Encounter Tables**: All new areas covered.
- **Flag Chain**: Data-driven `victoryFlag`/`badgeReward` system. 21 trainers with flags. Full main and post-game flag chains verified.
- **Cutscenes wired**: Map-entry and NPC-triggered cutscenes connected. `requireFlag` on warps (Verdantia Lab, Coral Harbor ferry). Father's Trail auto-trigger post-champion.
- **Legendaries**: Solatheon (#152, Psychic/Fairy, BST 650) and Noctharion (#153, Ghost/Dark, BST 650) with proper data and encounters.
- **Moves**: Fairy (6), Dark (+6), Ghost (+6) type moves. Legendary learnsets.

### Code Architecture
Scenes decomposed into subdirectories (boot/, title/, overworld/, battle/, menu/, pokemon/, minigame/). Battle system reorganized (core/, calculation/, effects/, execution/). Systems organized (audio/, engine/, overworld/, rendering/). UI organized (controls/, widgets/). Data split into per-type files (moves/, pokemon/, trainers/, maps/). Tests organized into domain subdirectories.

---

## Remaining Work

### Map Visual Redesigns (from map-improvements audit)

Six cities share a copy-paste template layout and lack biome-specific tiles despite having 115+ tile types available. Routes 6 and 7 are visually barren.

#### Priority 1 — City Uniqueness Redesigns

| City | Current Rating | Issue | Target Biome |
|------|:---:|-------|--------------|
| **Ironvale City** | ⭐ | Template grid, no industrial/forge theming | `METAL_FLOOR`, `PIPE`, `GEAR`, `CONDUIT`, `CLIFF_FACE` |
| **Voltara City** | ⭐ | Template grid, no tech/electric theming | `CONDUIT`, `ELECTRIC_PANEL`, `WIRE_FLOOR`, `METAL_FLOOR` |
| **Wraithmoor Town** | ⭐ | Template grid, no ghost/ruin theming | `CRACKED_FLOOR`, `RUIN_WALL`, `RUIN_PILLAR`, `GRAVE_MARKER`, `MIST` |
| **Scalecrest Citadel** | ⭐ | Template grid, no fortress/dragon theming | `FORTRESS_WALL`, `DRAGON_SCALE_FLOOR`, `DRAGON_STATUE`, `CLIFF_FACE` |
| **Cinderfall Town** | ⭐ | Template grid, no volcanic/fire theming | `ASH_GROUND`, `EMBER_VENT`, `HOT_SPRING`, `LAVA_ROCK`, `MAGMA_CRACK` |
| **Coral Harbor** | ⭐⭐ | Partial coastal tiles, template building arrangement | `DOCK_PLANK`, `WET_SAND`, `TIDE_POOL`, `PALM_TREE`, `CORAL_BLOCK` |

Each city needs: unique building arrangement (no grid pattern), biome-appropriate tile usage, organic path layouts, signature visual features (forge, conduits, graveyard, fortress gate, hot springs, harbor docks).

#### Priority 2 — Route Visual Polish

| Route | Current Rating | Issue | Target Feel |
|-------|:---:|-------|-------------|
| **Route 6** | ⭐ | Generic flat grass | Transition from tech (Voltara) to ruins (Wraithmoor): `CONDUIT` remnants → `DARK_GRASS`, `AUTUMN_TREE` → `CRACKED_FLOOR`, `RUIN_PILLAR`, `MIST` |
| **Route 7** | ⭐ | Generic flat grass | Mountain pass: `CLIFF_FACE`, `ROCK`, `BOULDER`, `CAVE_FLOOR`, `FORTRESS_WALL` remnants |
| Route 4 (Basalt Ridge) | ⭐⭐⭐ | Decent but could use more volcanic tiles | Add `LAVA_ROCK`, `MAGMA_CRACK`, `VOLCANIC_WALL` |
| Route 5 (Canopy Trail) | ⭐⭐⭐⭐ | Good but missing jungle tiles | Add `VINE`, `MOSS_STONE`, `GIANT_ROOT`, `BERRY_TREE` |
| Victory Road | ⭐⭐⭐ | Functional but small (20×25) | Expand to 25×35, add `AETHER_CRYSTAL`, `BOULDER` puzzles, more Ace Trainers |

#### Priority 3 — Dungeon & Interior Polish

- **Ember Mines**: Add `CONTAINMENT_POD`, `TERMINAL`, `AETHER_CONDUIT`, `SYNTHESIS_FLOOR`/`WALL` tiles for the lab section
- **Pokémon League**: Expand from compact 10×10 into proper multi-room layout with unique theming per E4 chamber (already has 6 map files, but visual quality can improve)

### Remaining Feature Work

#### Gameplay — High Priority

| Feature | Description | Status |
|---------|-------------|--------|
| **Fly fast-travel UI** | Map selection scene from visited towns, badge-gated | Not started |
| **Cycling sprite/animation** | Distinct visual for bicycle mode | Not started |
| **Boss trainer Synthesis** | Vex and Aldric use Synthesis Mode in their battles | Not started |
| **Partner AI in doubles** | Smart move selection for NPC allies (Rook, Kael) in tag battles | Not started |
| **Trainer rematches** | All 8 Gym Leaders (Lv 60+), Elite Four (Lv 70+), Kael Champion challenger (Lv 60–65) | Not started |
| **~10 remaining cutscenes** | Full narrative coverage for all story beats | Partial |

#### Gameplay — Medium Priority

| Feature | Description | Status |
|---------|-------------|--------|
| **Overworld visual polish** | Window light shafts in interiors, neon glow in Voltara, Aether crystal pulse animation | Not started |
| **Statistics sub-menu** | Detailed stat viewer scene (GameStats already tracked) | Not started |
| **Hall of Fame on title screen** | View past champion completions from title menu | Not started |
| **Wire remaining achievement triggers** | All gym badges, champion, sweep-trainer, underdog-win, etc. | Partial |
| **Town Map scene** | Show visited cities/routes with current objective marker | Not started |
| **Double battle UI polish** | Partner HP display, partner action indication, clearer messaging | Not started |

#### Content — Post-Game & Side Activities

| Feature | Description | Priority |
|---------|-------------|----------|
| **Battle Frontier / Battle Tower** | Endless streak mode, rental Pokémon, battle points, leaderboard | Medium |
| **Bug-catching contest** | Timed encounter with scoring | Low |
| **Photo Mode** | Pause → free camera → screenshot | Low |
| **Secret base** | Crystal Cavern customizable area | Low |
| **Safari Zone** | Special catch-only zone with different mechanics | Low |
| **Breeding & Egg hatching** | Pokémon nursery system | Low |
| **Follower Pokémon** | Lead Pokémon follows player in overworld | Low |

#### UI & Visual — Phase 14 (Custom Art)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Custom pixel font** | BMFont format, Pokémon-style, replaces Phaser built-in text | Medium |
| **UI sprite sheet** | Nine-patch art, type icons, status icons, gender icons, badge artwork, cursor sprites | Medium |
| **HUD improvements** | Mini-map, party quick-view (6 Pokéballs), clock display, quest tracker polish | Low |

#### Technical — Infrastructure

| Feature | Description | Priority |
|---------|-------------|----------|
| **Performance optimization** | Texture atlases, object pooling | Medium |
| **Enhanced testing** | Visual regression tests, expanded E2E coverage | Medium |
| **Localization (i18n)** | Multi-language support | Low |
| **Mod support** | Custom JSON content loading | Low |
| **Randomizer mode** | Seed-based shuffle of encounters/teams/starters | Low |

#### Multiplayer (Stretch Goals)

| Feature | Description | Priority |
|---------|-------------|----------|
| **WebRTC battles** | Peer-to-peer real-time battles | Low |
| **Trading system** | Pokémon trading between players | Low |
| **Leaderboards** | Online high scores | Low |

---

## Development Principles

- **Data-driven**: Pokémon, moves, items, trainers defined as data objects, not code.
- **Scene isolation**: Scenes communicate via `EventManager` and `GameManager` only.
- **Build small, test often**: Each task has a concrete deliverable.
- **Typed everything**: Interfaces and enums for all game data structures.
- **Test after changes**: `npm run test` for logic, `npm run test:e2e` for UI/scene changes.
