# Pokemon Web — Comprehensive Codebase Inventory

## Research Topics
1. All existing maps
2. All existing NPCs
3. Quest system
4. Scene system
5. UI components
6. Data files
7. Current game flow
8. Map system architecture
9. NPC system
10. Existing storyline/event system

---

## 1. All Existing Maps

**Total: 66 maps** registered in `frontend/src/data/maps/index.ts`

### Cities & Towns (10)

| Map Key | File | Description |
|---------|------|-------------|
| `pallet-town` | `data/maps/cities/pallet-town.ts` | Starting town. 25x30 tiles. Pier, docks, Oak's Lab, houses. NPCs: greeter, lab pointer, quest NPC Pip, fisherman Wade, dock sign. |
| `viridian-city` | `data/maps/cities/viridian-city.ts` | First city with PokéCenter, PokéMart. |
| `pewter-city` | `data/maps/cities/pewter-city.ts` | Rock-type gym city. Museum interior available. |
| `coral-harbor` | `data/maps/cities/coral-harbor.ts` | Coastal city. Water-type gym. |
| `ironvale-city` | `data/maps/cities/ironvale-city.ts` | Industrial city. Steel-type gym. Forge. |
| `verdantia-village` | `data/maps/cities/verdantia-village.ts` | Forest village. Grass-type gym. |
| `voltara-city` | `data/maps/cities/voltara-city.ts` | Tech city. Electric-type gym. |
| `wraithmoor-town` | `data/maps/cities/wraithmoor-town.ts` | Spooky town. Ghost-type gym. |
| `scalecrest-citadel` | `data/maps/cities/scalecrest-citadel.ts` | Mountain fortress. Dragon-type gym. |
| `cinderfall-town` | `data/maps/cities/cinderfall-town.ts` | Volcanic town. Fire-type gym. |

### Routes (8)

| Map Key | File | Description |
|---------|------|-------------|
| `route-1` | `data/maps/routes/route-1.ts` | Pallet → Viridian. Pidgey, Rattata, Pikachu (rare). Lv 2-5. |
| `route-2` | `data/maps/routes/route-2.ts` | Viridian → Crystal Cavern/Pewter. Caterpie, Weedle added. Lv 3-6. |
| `route-3` | `data/maps/routes/route-3.ts` | "Tide Pool Path." Spearow, Ekans, Sandshrew, Mankey, Abra. Lv 10-14. |
| `route-4` | `data/maps/routes/route-4.ts` | "Basalt Ridge." Sandshrew, Geodude, Machop, Growlithe, Ponyta. Lv 15-20. |
| `route-5` | `data/maps/routes/route-5.ts` | "Verdant Path." Oddish, Paras, Bellsprout, Scyther (rare). Lv 22-28. |
| `route-6` | `data/maps/routes/route-6.ts` | Ghostly route. Gastly, Haunter, Drowzee, Kadabra (rare). Lv 28-36. |
| `route-7` | `data/maps/routes/route-7.ts` | Route to Scalecrest. Gastly, Haunter, Koffing, Weezing, Arbok. Lv 32-39. |
| `route-8` | `data/maps/routes/route-8.ts` | "Stormbreak Pass." Pre-Victory Road. Ace trainers. |

### Dungeons (6)

| Map Key | File | Description |
|---------|------|-------------|
| `viridian-forest` | `data/maps/dungeons/viridian-forest.ts` | Bug-type dungeon. Caterpie, Weedle, Pikachu (rare). Lv 3-6. |
| `crystal-cavern` | `data/maps/dungeons/crystal-cavern.ts` | Rock cave. Zubat, Geodude, Clefairy, Onix (rare), Cubone. Lv 8-13. |
| `crystal-cavern-depths` | `data/maps/dungeons/crystal-cavern-depths.ts` | Post-game deeper area. |
| `ember-mines` | `data/maps/dungeons/ember-mines.ts` | Volcanic mine. Zubat, Geodude, Koffing, Magmar (rare). Lv 18-25. |
| `victory-road` | `data/maps/dungeons/victory-road.ts` | Pre-League dungeon. Machop/Machoke, Geodude/Graveler, Rhydon. Lv 40-48. |
| `aether-sanctum` | `data/maps/dungeons/aether-sanctum.ts` | Post-game dungeon. |

### Interiors (32)

**Per-city interiors** (each city gets PokéCenter + PokéMart + Gym):
- Pallet Town: `pallet-player-house`, `pallet-rival-house`, `pallet-oak-lab`
- Viridian City: `viridian-pokecenter`, `viridian-pokemart`
- Pewter City: `pewter-pokecenter`, `pewter-pokemart`, `pewter-gym`, `pewter-museum`
- Coral Harbor: `coral-pokecenter`, `coral-pokemart`, `coral-gym`
- Ironvale City: `ironvale-pokecenter`, `ironvale-pokemart`, `ironvale-gym`
- Verdantia Village: `verdantia-pokecenter`, `verdantia-pokemart`, `verdantia-gym`
- Voltara City: `voltara-pokecenter`, `voltara-pokemart`, `voltara-gym`
- Wraithmoor Town: `wraithmoor-pokecenter`, `wraithmoor-pokemart`, `wraithmoor-gym`
- Scalecrest Citadel: `scalecrest-pokecenter`, `scalecrest-pokemart`, `scalecrest-gym`
- Cinderfall Town: `cinderfall-pokecenter`, `cinderfall-pokemart`, `cinderfall-gym`
- Special: `pokemon-league`

**Generic houses (10):** One per city/town (`pallet-town-house-1` through `cinderfall-town-house-1`)

---

## 2. All Existing NPCs

### Named Trainers (defined in `frontend/src/data/trainer-data.ts` — 1172 lines)

**Rival — Kael Ashford (6 encounters):**
- `rival-1` through `rival-6` — Lv 5 to Lv 65. Starter Charmander line → full team at post-game.

**Secondary Rival — Marina Oleander (2 battle encounters):**
- `marina-1` (Route 2, Lv 10-12), `marina-4` (Post-game Crystal Cavern, Lv 55-58)

**Synthesis Collective Grunts:**
- `synthesis-grunt-1` through `synthesis-grunt-6` — Various routes/dungeons. Poison types.
- `stern-grunt-1`, `stern-grunt-2`, `stern-grunt-3` — Quest grunts for Captain Stern's Engine quest.

**Admin — Dr. Vex Corbin:**
- `admin-vex-1` (Ember Mines, Lv 22-24), `admin-vex-2` (Route 7, Lv 36-38)

**Gym Leaders (8):**
| ID | Name | Type | Location | Ace Level |
|----|------|------|----------|-----------|
| `gym-brock` | Brock | Rock | Pewter Gym | Lv 14 (Onix) |
| `gym-coral` | Coral | Water | Coral Gym | Lv 21 (Starmie) |
| `gym-ferris` | Ferris | Steel | Ironvale Gym | Lv 27 (Onix) |
| `gym-ivy` | Ivy | Grass | Verdantia Gym | Lv 31 (Venusaur) |
| `gym-blitz` | Blitz | Electric | Voltara Gym | Lv 35 (Electabuzz) |
| `gym-morwen` | Morwen | Ghost | Wraithmoor Gym | Lv 40 (Gengar) |
| `gym-drake` | Drake | Dragon | Scalecrest Gym | Lv 45 (Dragonite) |
| `gym-solara` | Solara | Fire | Cinderfall Gym | Lv 48 (Charizard) |

**Elite Four:**
- `elite-nerida` — Ice/Water, Lv 50-52

**Champion:**
- `champion-aldric` — Aldric Maren, mixed team, Lv 52-55 (ace: Mewtwo Lv 55)

**Route/Dungeon Trainers (~45+):**
- Bug Catchers: `bug-catcher-1` through `bug-catcher-5`
- Youngsters: `youngster-1` through `youngster-6`
- Lasses: `lass-1` through `lass-5`
- Hikers: `hiker-1` through `hiker-6`
- Swimmers: `swimmer-1` through `swimmer-3`
- Campers: `camper-1` through `camper-4`
- Fisherman: `fisherman-1`
- Sailor: `sailor-1`
- Psychic: `psychic-1`
- Ace Trainers: `ace-trainer-1` through `ace-trainer-5`
- Black Belt: `blackbelt-1`
- Workers: `worker-1`
- Engineers: `engineer-1`, `engineer-2`
- Beauty: `beauty-1`
- Picnicker: `picnicker-1`

### Map-embedded NPCs (defined inline in each map's `.ts` file)

Each map file defines `npcs[]` with non-trainer NPCs. Pallet Town example includes:
- `pallet-npc-1`: Male greeter ("Welcome to Pallet Town!")
- `pallet-npc-2`: Female NPC pointing to Oak's Lab
- `pallet-sign-lab`: Sign NPC ("OAK POKÉMON RESEARCH LAB")
- `pallet-pip`: Delivery Girl Pip (quest NPC, sets `quest_lostDelivery_started`)
- `pallet-wade`: Fisherman Wade (gives Old Rod, sets `received_old_rod`)
- `pallet-dock-sign`: Dock sign

NPCs have: `id`, `tileX`, `tileY`, `textureKey`, `facing`, `dialogue[]`, optional `behavior` (NPCBehaviorConfig), optional `setsFlag`, optional `flagDialogue[]` (conditional dialogue based on game flags).

### NPC Sprite Assets (39 unique sprite atlases loaded in PreloadScene)

`npc-mom`, `npc-nurse`, `npc-female-1` through `npc-female-9`, `npc-male-1` through `npc-male-6`, `npc-oldman`, `npc-hiker`, `npc-professor`, `npc-scientist`, `npc-swimmer`, `npc-sailor`, `npc-bug-catcher`, `npc-ace-trainer`, `npc-ace-trainer-f`, `npc-grunt`, `npc-marina`, `npc-psychic`, `npc-gym-brock`, `npc-gym-blitz`, `npc-gym-ferris`, `npc-admin-vex`, `npc-oak`, `npc-lass`, `npc-vex`, `npc-blitz`, `rival`, `generic-trainer`

---

## 3. Quest System

### Quest Data (`frontend/src/data/quest-data.ts`)
**12 quests defined:**

| Quest ID | Name | Location | Steps | Rewards |
|----------|------|----------|-------|---------|
| `lost-delivery` | The Lost Delivery | Pallet → Viridian → Pewter | 3 | Rare Candy, 5 Super Potions, ₽1000 |
| `collectors-challenge` | The Collector's Challenge | Viridian City | 4 | Leftovers, ₽2000 |
| `lost-pokemon` | The Lost Pokémon | Viridian Forest | 2 | ₽500 |
| `mine-clearance` | Mine Clearance | Ember Mines | 4 | Fire Stone, ₽1500 |
| `berry-farming` | Berry Farming | Routes 1-2 + Forest | 4 | 5 Sitrus, 3 Lum Berries, ₽800 |
| `stern-engine` | Captain Stern's Engine | Route 3 / Coral Harbor | 4 | Mystic Water, ₽1200 |
| `chef-special` | The Chef's Special | Coral Harbor | 6 | 2 Rare Candies, ₽600 |
| `power-restore` | Power Restoration | Voltara City | 4 | Thunder Stone, ₽2000 |
| `restless-spirit` | The Restless Spirit | Wraithmoor Town | 4 | Spell Tag, ₽1500 |
| `dragon-lament` | The Dragon's Lament | Scalecrest area | 3 | Dragon Scale, ₽2500 |
| `volcanic-survey` | Volcanic Survey | Cinderfall area | 6 | Fire Stone, Charcoal, ₽1800 |
| `father-trail` | The Father's Trail | Region-wide | 6 | Master Ball |

### Quest Manager (`frontend/src/managers/QuestManager.ts`)
- Singleton with `startQuest()`, `completeStep()`, `completeQuest()`, `getQuestStatus()`, `getActiveQuests()`, `getCompletedQuests()`
- `initAutomation()` — auto-advances quest steps when flags/events trigger
- All state is derived from `GameManager.flags` — no separate persistence
- Steps can auto-complete via `triggerFlag` (when game flag set) or `triggerEvent` (when EventManager event emitted, e.g., `map-entered:viridian-forest` or `trainer-defeated:stern-grunt-1`)

### Quest UI
- `QuestJournalScene` — Full-screen journal with Active/Complete tabs, quest list on left, detail on right, step checklist with checkmarks
- `QuestTrackerScene` — Lightweight HUD overlay in top-right corner, shows current active quest step, auto-updates on flag changes

---

## 4. Scene System

**20 scenes** in `frontend/src/scenes/`:

| Scene | File | Purpose |
|-------|------|---------|
| `BootScene` | `BootScene.ts` | Minimal bootstrap, immediately starts PreloadScene |
| `PreloadScene` | `PreloadScene.ts` | Loads all assets (Pokémon icons, tilesets, player atlas, NPC sprites, audio). Shows progress bar. |
| `TitleScene` | `TitleScene.ts` | Title screen with Continue/New Game/Delete Save/Options menu |
| `IntroScene` | `IntroScene.ts` | Professor Willow intro sequence, player naming, gender selection, difficulty mode. 7 slides. |
| `StarterSelectScene` | `StarterSelectScene.ts` | Overlay for choosing Bulbasaur/Charmander/Squirtle (Lv 5) |
| `OverworldScene` | `OverworldScene.ts` | **Main gameplay scene.** Tile map rendering, player movement, NPC/trainer spawning, warp handling, encounter checks, quest tracking. |
| `DialogueScene` | `DialogueScene.ts` | Overlay for text dialogue. Typewriter effect, speed settings, choice support, speaker name panel. |
| `BattleScene` | `BattleScene.ts` | Battle arena. Sprites, HP bars, experience bars. Launches BattleUIScene. |
| `BattleUIScene` | `BattleUIScene.ts` | Battle UI overlay: action menu (Fight/Bag/Pokémon/Run), move selection, message display, weather indicator. |
| `MenuScene` | `MenuScene.ts` | Pause menu overlay: Pokédex, Pokémon, Bag, Quests, Save, Options, Quit, Exit |
| `InventoryScene` | `InventoryScene.ts` | Bag screen with category tabs (Medicine, Poké Balls, Battle, Key Items, TMs). Use/toss/quantity selection. |
| `PartyScene` | `PartyScene.ts` | Party management: view 6 Pokémon, swap order, context menu |
| `SummaryScene` | `SummaryScene.ts` | Individual Pokémon detail: Info/Stats/Moves tabs, nature, held item |
| `PokedexScene` | `PokedexScene.ts` | 151-species Pokédex with seen/caught counts, list + detail view |
| `PCScene` | `PCScene.ts` | PC box system: 12 boxes × 30 slots, deposit/withdraw/move between boxes and party |
| `ShopScene` | `ShopScene.ts` | Buy/Sell interface for PokéMarts. Dynamic inventory per town. |
| `QuestJournalScene` | `QuestJournalScene.ts` | Full quest journal with Active/Complete tabs |
| `QuestTrackerScene` | `QuestTrackerScene.ts` | HUD overlay showing current quest step |
| `SettingsScene` | `SettingsScene.ts` | Options: text speed, music/SFX volume, battle animations, text size, colorblind mode, reduced motion |
| `TransitionScene` | `TransitionScene.ts` | Screen transitions: fade, stripes, circles animations |

---

## 5. UI Components

**10 files** in `frontend/src/ui/`:

| File | Purpose |
|------|---------|
| `theme.ts` | Centralized theming: `COLORS`, `FONTS`, `SPACING`, `TYPE_COLORS`, `STATUS_COLORS`, `CATEGORY_COLORS`. Helpers: `drawPanel()`, `drawTypeBadge()`, `drawHpBar()`, `drawButton()`, `hpColor()`. Mobile scaling: `MOBILE_SCALE`, `mobileFontSize()`, `isMobile()`, `MIN_TOUCH_TARGET`. |
| `NinePatchPanel.ts` | Reusable rounded-corner panel with fill, border, shadow options |
| `TextBox.ts` | Text display box component |
| `HealthBar.ts` | HP bar rendering component |
| `BattleHUD.ts` | Battle heads-up display elements |
| `MenuController.ts` | Generic keyboard/touch menu navigation controller |
| `MenuList.ts` | Scrollable menu list component |
| `ConfirmBox.ts` | Yes/No confirmation dialog |
| `TouchControls.ts` | Mobile touch D-pad and action buttons, device detection |
| `VirtualJoystick.ts` | Virtual analog joystick for mobile |

---

## 6. Data Files

**All files in `frontend/src/data/`:**

| File | Contents |
|------|----------|
| `interfaces.ts` | Core TypeScript interfaces: `PokemonData`, `MoveData`, `ItemData`, `TrainerData`, `EncounterEntry`, `PokemonInstance`, `MoveInstance`, `SaveData`, `DoubleBattleResult` |
| `difficulty.ts` | Difficulty system: 3 modes (Classic, Hard, Nuzlocke) with config for level boost, money multiplier, item restrictions, smart AI, permadeath |
| `encounter-tables.ts` | Per-route wild encounter tables with Pokémon ID, level range, weight. Covers all 8 routes + 4 dungeons. |
| `evolution-data.ts` | Evolution chains for all 151 Gen 1 Pokémon. Level-up, item, trade conditions. |
| `item-data.ts` | Full item catalog: medicines (Potion, Super Potion, status heals, Revive), Poké Balls, berries, held items, key items, evolution stones |
| `quest-data.ts` | 12 quest definitions with steps, flags, rewards |
| `shop-data.ts` | Per-town mart inventories (currently defined for viridian-city, pewter-city) |
| `synthesis-data.ts` | Synthesis Mode system: `SYNTHESIS_ELIGIBLE` map of ~30 Pokémon that can Synthesis transform. +100 BST boosts, type/ability overrides. Key item: `synthesis-bracelet`. |
| `tm-data.ts` | ~40 TMs: 8 gym reward TMs, ~18 route/dungeon pickups, ~14 shop TMs |
| `trainer-data.ts` | 60+ trainer definitions (1172 lines). Rivals, gym leaders, Elite Four, Champion, grunts, route trainers. |
| `type-chart.ts` | Pokémon type effectiveness chart |
| `pokemon/` | 16 files by type (normal.ts, fire.ts, water.ts, etc.) + `index.ts`. Contains all 151 Gen 1 Pokémon base data. |
| `moves/` | 17 files by type + `index.ts`. All move definitions. |
| `maps/` | `shared.ts` (tile defs, ~115 tile types, overlay/foreground/ledge/color mappings), `index.ts` (registry), 56 map definition files in subdirs |

---

## 7. Current Game Flow

### Boot → Title → Gameplay sequence:
1. **BootScene** → immediately transitions to PreloadScene
2. **PreloadScene** → loads all assets (Pokémon icons, tilesets, player atlas, 39 NPC sprites, audio BGM/SFX). Progress bar displayed.
3. **TitleScene** → Menu: Continue (if save exists), New Game, Delete Save, Options. Plays title BGM.
4. **New Game path:**
   - **IntroScene** → Professor Willow intro (7 slides), player naming, boy/girl appearance selection, difficulty mode (Classic/Hard/Nuzlocke)
   - → **OverworldScene** (pallet-town) with flag `receivedStarter` not yet set
   - Player walks to Oak's Lab → **StarterSelectScene** overlay → choose Bulbasaur/Charmander/Squirtle
   - Sets `receivedStarter` flag → first rival battle (`rival-1`)
5. **Continue path:**
   - Loads SaveData from localStorage → **OverworldScene** at saved position

### Core Gameplay Loop:
- **OverworldScene**: Grid-based movement, NPC interaction → DialogueScene overlay, warp detection → map transitions, tall grass → wild encounters → TransitionScene → BattleScene
- **Pause Menu** (ESC/Start): MenuScene overlay → Pokédex, Party, Bag, Quests, Save, Options
- **Trainer battles**: Trainer LoS detection → walk toward → dialogue → TransitionScene → BattleScene (isTrainerBattle)
- **Map transitions**: Warp tiles detected on step → TransitionScene (fade/stripes/circles) → OverworldScene.init with new mapKey + spawnId

### Story Progression by Act:
- **Act 1**: Pallet Town → Route 1 → Viridian City → Route 2 → Viridian Forest → Pewter City (Gym 1: Brock)
- **Act 2**: Route 3 → Coral Harbor (Gym 2: Coral) → Route 4 → Ember Mines → Ironvale City (Gym 3: Ferris) → Route 5 → Verdantia Village (Gym 4: Ivy) → Voltara City (Gym 5: Blitz)
- **Act 3**: Route 6 → Wraithmoor Town (Gym 6: Morwen) → Route 7 → Scalecrest Citadel (Gym 7: Drake) → Cinderfall Town (Gym 8: Solara) → Route 8 (Stormbreak Pass)
- **Act 4**: Victory Road → Pokémon League (Elite Four + Champion Aldric)
- **Post-game**: Aether Sanctum, Crystal Cavern Depths, rival rematch

---

## 8. Map System Architecture

### Map Format
Maps are defined as TypeScript objects conforming to `MapDefinition` interface:
- `key`: unique string identifier
- `width`, `height`: tile dimensions
- `ground`: 2D number array (parsed from ASCII art via `parseMap()`)
- `encounterTableKey`: reference to encounter-tables.ts
- `npcs[]`: inline NPC spawn definitions
- `trainers[]`: inline trainer spawn definitions
- `warps[]`: warp tile definitions (`tileX`, `tileY`, `targetMap`, `targetSpawnId`)
- `spawnPoints`: named spawn locations (`default`, `from-route-1`, etc.)
- `isInterior`: boolean for camera behavior
- Optional: `bgm`, `weather`, `lighting`

### Tile System
- ~115 tile types defined in `Tile` const object in `data/maps/shared.ts`
- `SOLID_TILES`: set of impassable tiles
- `OVERLAY_BASE`: tiles that need a base tile drawn underneath
- `FOREGROUND_TILES`: tiles rendered above the player (tall grass, trees, vines)
- `LEDGE_TILES`: one-way movement tiles (down, left, right)
- `TILE_COLORS`: rendering colors per tile type (procedural rendering, not tileset-based)
- ASCII art shorthand parsed by `parseMap()` function

### Map Rendering
- `OverworldScene.drawMap()` renders tiles procedurally using colored rectangles from `TILE_COLORS`
- Multi-layer: ground layer (depth 0), player (depth 1), foreground overlays (depth 2)
- Camera follows player on overworld maps; fixed centered for small interiors

### Map Transitions
- Warps defined per-map with `tileX`, `tileY`, `targetMap`, `targetSpawnId`
- `onPlayerStep()` checks warp tiles after each grid step
- TransitionScene plays animation (fade/stripes/circles) → restarts OverworldScene with new mapKey
- `MapPreloader` system preloads Pokémon sprites for adjacent maps

### Map Assets
- Tilesets: `frontend/public/assets/tilesets/overworld.png`, `tileset.png`, `tileset-2.png`
- No Tiled JSON files found — maps are defined purely in TypeScript
- BGM per map via `MAP_BGM` mapping in audio-keys.ts

---

## 9. NPC System

### Entity Classes
- **`NPC`** (`entities/NPC.ts`): Base class extending Phaser.GameObjects.Sprite. Has `npcId`, `dialogue[]`, `facing` direction. Methods: `faceDirection()`, static `getOpposite()`.
- **`Trainer`** (`entities/Trainer.ts`): Extends NPC. Adds `trainerId`, `lineOfSight` (default 4 tiles), `defeated` flag, `mapGround` reference for LoS blocking. Methods: `isInLineOfSight()` (respects solid tiles), `walkToward()` (tween-based approach).

### NPC Spawning (in OverworldScene)
- `spawnNPCs()`: iterates `mapDef.npcs[]`, creates NPC instances, handles flag-based conditional dialogue (`setsFlag`, `flagDialogue`), optional `behavior` config
- `spawnTrainers()`: iterates `mapDef.trainers[]`, creates Trainer instances, links to `trainerData` for party/dialogue

### NPC Behavior System (`systems/NPCBehavior.ts`)
- `NPCBehaviorController` class with 4 behavior types:
  - `stationary`: no movement
  - `look-around`: randomly faces different directions
  - `wander`: moves within a radius from origin
  - `pace`: follows a set route of directions
- Configurable interval (min/max ms between actions)
- Collision-aware wandering

### Dialogue & Interaction
- Player confirms on adjacent NPC → NPC faces player → `DialogueScene` launched with NPC dialogue
- **Flag-based dialogue**: NPCs can have `setsFlag` (sets a GameManager flag on first interaction) and `flagDialogue[]` (array of `{flag, dialogue}` pairs — first matching flag replaces default dialogue)
- **DialogueManager** (`managers/DialogueManager.ts`): Simple singleton queue. `setDialogue()`, `getQueue()`, `clear()`
- **DialogueScene**: Typewriter text effect with configurable speed, speaker name panel, choice support with callbacks

### Trainer Battle Flow
- `onPlayerStep()` checks all trainers' `isInLineOfSight()`
- Trainer walks toward player (tween animation)
- Dialogue shown, then TransitionScene → BattleScene (isTrainerBattle=true)
- After defeat: `GameManager.defeatTrainer(trainerId)`, trainer marked `defeated`

---

## 10. Existing Storyline/Event System

### Event System
- **EventManager** (`managers/EventManager.ts`): Simple typed event bus. `on()`, `off()`, `emit()`, `clear()`. Events are strings, args are `unknown[]`.
- Key events emitted:
  - `map-entered` — when entering a new map (used by quest auto-completion)
  - `trainer-defeated:${id}` — when defeating a trainer (used by quest triggers)
  - `flag-set` — when a game flag changes (updates quest tracker HUD)
  - `quest-completed` — when a quest is fully completed

### Flag System
- **GameManager.flags**: `Record<string, boolean>` — central boolean flag dictionary
- `getFlag(flag)`, `setFlag(flag, value)`, persisted via SaveManager
- Flags drive: quest progress, NPC dialogue changes, story progression
- Known flag patterns:
  - `receivedStarter` — player has chosen starter
  - `quest_*_started`, `quest_*_complete`, `quest_*_step` — quest tracking
  - `received_old_rod` — item received flags
  - `delivery-viridian`, `delivery-pewter` — delivery quest steps

### Story Elements
- **Storyline Bible** exists in `docs/storyline.md` — detailed narrative for The Aurum Region
- **Main antagonist**: Synthesis Collective (white-teal lab coats, double-helix insignia)
- **Director**: Champion Aldric Maren — the Champion IS the villain (revealed Act 3)
- **Admin**: Dr. Vex Corbin — 3 encounters coded (2 battle encounters implemented in trainer-data)
- **Admin**: Zara Lux — described in storyline doc but NOT found in trainer-data.ts (not yet implemented)
- **Legendary**: Solatheon — described in storyline but no data implementation found
- **Player's father**: Missing Ranger subplot driving personal motivation — quest `father-trail` defined
- **Synthesis Mode**: Mega-evolution equivalent using Aether. `synthesis-data.ts` defines eligible Pokémon and stat boosts. `SynthesisHandler` in battle system.

### Save System
- **SaveManager** (`managers/SaveManager.ts`): Serializes GameManager state to localStorage
- **SaveData interface**: version, timestamp, difficulty, player (name, position, party, bag, money, badges, pokedex, playtime), flags, trainersDefeated, boxes

### What's NOT Implemented (based on storyline doc vs. code):
- Admin Zara Lux (no trainer data entry)
- Full Elite Four (only Nerida defined, 3 more E4 members missing)
- Legendary Pokémon encounters (Solatheon, etc.)
- Synthesis Collective HQ raid sequence
- Cutscenes/scripted events beyond NPC dialogue
- NPC movement during story events (e.g., rival appearing, walking)
- Marina encounters 2 & 3 (no battle, co-op — not in trainer data)

---

## Key Discoveries Summary

1. **Massive scope already built**: 66 maps, 60+ trainers, 12 quests, 151 Pokémon, 20 scenes, full battle system with abilities/weather/held items/synthesis mode.
2. **Maps are procedural**: No Tiled JSON — maps are ASCII art parsed to tile arrays, rendered as colored rectangles.
3. **Flag-driven story**: Quests and NPC dialogue advance through `GameManager.flags` checked at runtime.
4. **Quest automation**: Steps can auto-complete on map entry events or trainer defeat events.
5. **Shop inventories sparse**: Only viridian-city and pewter-city have shop data defined; other cities likely need entries.
6. **Elite Four incomplete**: Only 1 of 4 E4 members has trainer data.
7. **Story villain admin Zara Lux**: Fully described in storyline bible but no code implementation.
8. **Difficulty modes functional**: Classic, Hard, Nuzlocke with distinct configs affecting AI, levels, permadeath.

---

## Clarifying Questions
None — all 10 research topics answered through code inspection.
