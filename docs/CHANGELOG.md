# Changelog

All notable changes to the Pokemon Web project.

---

## [2026-04-12]
### Added
- **25 new NPC trainers** across all routes and gyms, with story-fitting dialogue:
  - **Route 1**: Added Lass Janice and Youngster Ben (previously defined but unspawned)
  - **Route 2**: Added Youngster Tim, Lass Mira, and Camper Ethan — hint at Crystal Cavern and Synthesis activity
  - **Viridian Forest**: Added Bug Catcher Leo (references Synthesis sensor device) and Lass Violet
  - **Crystal Cavern**: Added Hiker Garrett (warns about ley line disturbance) and Camper Felix
  - **Pewter Gym**: Added Camper Liam as junior gym trainer
  - **Route 3**: Added Swimmer Lydia (notices reef changes), Fisherman Barney, and Sailor Craig (reports mystery boats)
  - **Coral Gym**: Added Swimmer Nami as second gym trainer
  - **Route 4**: Added Hiker Mason, Youngster Drake, and Synthesis Grunt (guards ridge with story dialogue)
  - **Ember Mines**: Added additional Synthesis Grunt before Dr. Vex
  - **Route 5**: Added Camper Rosa, Youngster Miles, and Synthesis Grunt (collecting Aether from old-growth forest)
  
### Changed
- **Ironvale Gym**: Replaced reused Hiker with unique Black Belt Koji and Foundry Worker Gil (steel/forge themed)
- **Verdantia Gym**: Replaced reused Lass with unique Beauty Lily and Picnicker Daisy (nature themed)
- **Voltara Gym**: Replaced reused Youngster with unique Engineers Watts and Tesla (electric/tech themed)
- Total trainer spawns increased from 25 to 48 across the game

### Fixed
- **Player hidden under tall grass**: Player was at depth 0 (same as ground), so foreground overlays like tall grass (depth 2) completely covered them. Set player depth to 1 — body visible with grass overlaying feet, matching classic Pokémon.

### Added
- **Quit to title**: New "QUIT" option in the pause menu with a Yes/No confirmation dialog. Stops the overworld and returns to the title screen.
- **Delete save data**: New "Delete Save" option on the title screen (only shown when a save exists). Uses a Yes/No confirmation, then removes the save from localStorage and refreshes the title screen.
- **Trainer sprites in battle**: During trainer battles, the enemy trainer sprite appears behind their Pokémon (upper-right, semi-transparent) and the player character appears behind theirs (lower-left). Both slide in during the intro animation. Uses the trainer's `spriteKey` from trainer data.

### Changed
- **Trainer LoS battle trigger**: Trainers now walk toward the player (step-by-step tween) after the `!` exclamation mark, stopping 1 tile away before initiating dialogue — matching classic Pokémon behavior.
- **Wall-blocked line of sight**: Trainer `isInLineOfSight()` now checks for solid tiles between the trainer and player. A wall, tree, or boulder blocks vision so trainers can't see through obstacles.

### Fixed
- **Oak's Lab exit blocked**: Moved lab machines from center (tile 6,10) to sides (tiles 3,10 and 9,10) so the player can walk straight down to the exit mat.
- **Oak's Lab exit warp width**: Widened exit warp from 1 tile to 3 tiles (positions 5–7 on row 11) for easier navigation.

### Added
- **Phase 5 — Route 4 (Basalt Ridge)**: 20×30 volcanic route with cliffs, cave floor, Rook story NPC, Synthesis grunt encounter. Encounter table (Sandshrew, Geodude, Machop, Growlithe, Ponyta, Onix).
- **Phase 5 — Ember Mines**: 20×25 dungeon with mine tracks, boulders. 2 Synthesis grunts + Dr. Vex boss battle #1. Story NPCs: data terminal, caged Pokémon. Encounter table (Zubat, Geodude, Graveler, Koffing, Grimer, Magmar).
- **Phase 5 — Ironvale City**: 25×30 industrial town with PokéCenter, PokéMart, Gym 3 (Steel — Ferris). NPCs: Miner Gil (Mine Clearance quest), Aldric hologram (story), Professor Willow kidnapping event.
- **Phase 5 — Gym Leader Ferris**: Magneton/Magneton/Onix Lv 24–27, awards Anvil Badge.
- **Phase 5 — Route 5 (Canopy Trail)**: 22×30 dense forest with dark grass. Marina co-op event, Synthesis traps. Encounter table (Oddish, Paras, Venonat, Bellsprout, Exeggcute, Tangela, Scyther).
- **Phase 5 — Verdantia Village**: 25×25 herbalist village with PokéCenter, PokéMart, Gym 4 (Grass — Ivy). NPCs: Elder Moss (Solatheon legend + Amulet Coin), Berry Farmer Hana (Berry quest).
- **Phase 5 — Gym Leader Ivy**: Weepinbell/Parasect/Venusaur Lv 28–31, awards Canopy Badge.
- **Phase 5 — Voltara City**: 25×30 tech city with PokéCenter, PokéMart, Gym 5 (Electric — Blitz). NPCs: Engineer Sparks (Power Restore quest), Move Tutor Bolt, Blitz HQ discovery event, Willow kidnapping event.
- **Phase 5 — Gym Leader Blitz**: Voltorb/Raichu/Electrode/Electabuzz Lv 32–35, awards Circuit Badge.
- **Phase 5 — Dr. Vex Corbin (Admin)**: Boss encounter #1 in Ember Mines with Koffing/Muk/Weezing Lv 22–24.
- **15 new interior maps**: PokéCenters, PokéMarts, and Gyms for Ironvale, Verdantia, and Voltara.
- **Map connections**: Coral Harbor ↔ Route 4 ↔ Ironvale, Ironvale ↔ Route 5 ↔ Verdantia ↔ Voltara. All warps and spawn points wired.

## [2026-04-12]
### Added
- **Phase 4.5 — 42 new tile types** (IDs 68–109): Coastal, Volcanic, Mine, Industrial, Forest, Electric, Ghost/Ruin, Dragon, Fire, Synthesis HQ, Post-game, League. All with colors, solid flags, overlays, foreground tiles, char mappings.
- **Battle background system**: `MapDefinition.battleBg` + `BattleScene` image-based bg with procedural fallback. Passed through wild + trainer encounters.
- **Phase 5 — Route 3 (Tide Pool Path)**: 20×40 coastal route, 3 trainers, encounter + fishing tables (Spearow, Ekans, Sandshrew, Mankey, Staryu, Horsea, Lapras).
- **Phase 5 — Coral Harbor**: 25×30 port town with PokéCenter, PokéMart, Gym 2 (Water — Coral), docks. NPCs: Captain Stern, Diver Lena, Chef Marco, disguised Zara Lux.
- **Phase 5 — Coral Harbor interiors**: PokéCenter, PokéMart, Water Gym with Leader Coral (Staryu/Shellder/Starmie Lv 18–21, Tide Badge).
- **Pewter City east exit** to Route 3 with warps and spawn point.

### Fixed
- **Mobile D-pad buttons not working**: Rewrote TouchControls to use native DOM touchstart/mousedown events with manual hit-testing instead of Phaser's per-object interactive handlers inside containers. Phaser's hit-testing fails on interactive objects nested inside `setScrollFactor(0)` containers — the native approach bypasses this entirely and works reliably on all touch devices.
- **Settings scene unusable on mobile**: Added tappable ◀/▶ arrow buttons for each setting row, invisible hit areas for row selection, and a visible [ Back ] button. Settings hint text now shows touch-friendly instructions on mobile devices.
- **Keyboard-only hint texts**: Updated hint text across all scenes to detect touch devices and show appropriate instructions (e.g., "Tap to select" instead of "Press Enter to select", "A = Talk | B = Menu" instead of "ENTER = Talk | ESC = Menu").

### Added
- **MenuController.bindInteractive()**: New method to wire pointer events on game objects for hover/click support, making menus touch-friendly without manual per-item handlers.
- **Mobile/Touch Controls architecture section**: Added documentation to `docs/architecture.md` explaining how TouchControls, InputManager, and MenuController collaborate for mobile input.

## [2026-04-12]
### Fixed
- **Can't enter Oak's Lab**: Lab door 'E' in Pallet Town was at col 12 but warp expected col 11. Fixed lab door row to place E at col 11. Also fixed row 3 (walls+windows) which was 27 chars instead of 25 due to window char insertion error.
- **Player renders above tall grass**: Added `FOREGROUND_TILES` set for tiles that should render ABOVE the player (depth 2). Tall grass, trees, dense trees, and biome tree variants now draw in front of the player sprite, creating the classic Pokemon "walking through grass" visual.
- **Chair not blocking movement**: Added CHAIR and PLANT to SOLID_TILES so they properly block player movement.
- **Overlay depth system**: Ground overlays (doors, flowers, signs, mats, rugs, furniture) render at depth 0.5 (below player at depth 1). Foreground overlays (tall grass, trees) render at depth 2 (above player).

### Added
- **Comprehensive storyline bible** (`docs/storyline.md`): Full narrative document with 4-act structure, detailed character profiles (Kael, Marina, Rook, Aldric, Dr. Vex, Zara Lux), 8 Gym Leaders, Elite Four, 12 side quests with rewards, NPC interaction tables for every town, post-game content (Shattered Isles, legendaries, Father's Trail quest), and dialogue tone guide.
- **Phase 4.5 asset plan** in `docs/plan.md`: 42 new tile types (IDs 68–109) across 10 biome sets (Coastal, Volcanic, Mine, Industrial, Forest, Electric, Ghost/Ruin, Dragon, Collective HQ, League); 24 battle backgrounds; 19 NPC sprites; 20 music tracks — all mapped to specific phases and locations.

### Changed
- **Updated development plan** (`docs/plan.md`): Added new Phase 4.5 (Art Assets & Tileset Expansion) with complete tile, background, sprite, and music inventories; expanded storyline summary with character list and side quest references; updated Phase 3.6 (6 Kael encounters + 4 Marina encounters), Phase 3.7 (12 side quests); expanded Phase 5 with per-map tile and asset requirements; rewrote Phase 8 with full Act 3/4/post-game breakdown and asset lists.

## [2026-04-12]
### Fixed
- **House windows displaying as water**: Uppercase 'W' in Pallet Town house walls mapped to WATER tile. Added HOUSE_WINDOW (60), LAB_WINDOW (61), CENTER_WINDOW (62) exterior window tiles. Fixed Pallet Town, Viridian City, Pewter City maps.
- **Doors, trees, flowers with opaque backgrounds**: Made tree, flower, and all 5 door tiles (house/lab/center/mart/gym) use transparent backgrounds. Added doors to OVERLAY_BASE so their wall type renders underneath. Trees show grass through trunk gaps, flowers sit on grass, doors show wall texture behind them.
- Move category indicators (P/S/St) and type color dots no longer linger on screen after closing the move menu
- ESC key no longer exits battle from the action menu; only the RUN action can flee

### Added
- **21 new location-specific tile types** (tiles 39-59) expanding the tileset from 39 to 60 tiles:
  - **House**: TV (39), bed (40), potted plant (41), stairs (42)
  - **PokéCenter**: pink/white checkered floor (43), pink service counter (44)
  - **PokéMart**: blue/white commercial tile floor (45), merchandise shelf with colored items (46)
  - **Lab**: white tile floor (47), lab equipment/machine with green screen (48)
  - **Museum**: glass display case (49), fossil on pedestal (50)
  - **Gym**: rocky arena floor (51), boulder obstacle (52), battle arena markings (53)
  - **Overworld**: sand (54), small rock (55), bush (56), cliff face (57), cave floor (58), cave wall (59)
- All new overlay tiles use transparent backgrounds for proper compositing with their base floor tiles

- **Two-layer tile rendering with overlay compositing**: Added `OVERLAY_BASE` mapping in `shared.ts` that defines which tiles are "overlay objects" that should have a base ground tile rendered underneath. Overworld overlays (trees, tall grass, flowers, signs, fences, ledges, dense trees) render grass below. Interior overlays (tables, chairs, pokeballs, rugs, mats, PCs, heal machines, gym statues, bookshelves, counters) render floor below. Windows render indoor wall below. Tileset images for overlay tiles now have transparent backgrounds so the base tile shows through. `drawMap()` draws the base layer at depth 0, overlay tiles at depth 0.5, and NPCs at depth 1 for proper layering.

### Changed
- **PokéCenter interiors** (Viridian, Pewter): Now use pink checkered CENTER_FLOOR tiles and PINK_COUNTER instead of generic wood floor/counter. Distinctive healing station feel.
- **PokéMart interior** (Viridian): Now uses blue MART_FLOOR tiles and MART_SHELF with colorful merchandise instead of generic bookshelves.
- **Oak's Lab interior**: Now uses white LAB_FLOOR tiles with lab machine, giving it a scientific laboratory feel.
- **Pewter Gym interior**: Now uses ROCK_FLOOR with BOULDER obstacles and ARENA_MARK battle lines instead of generic gym floor.
- **Pewter Museum interior**: Now uses DISPLAY_CASE and FOSSIL tiles instead of generic bookshelves.
- **Player's House**: Added TV and potted plant for a cozier home feel.

### Fixed
- **Grass tile showing cliff edge**: The grass tile (Tile 0) was using Tuxemon tileset position (4,0) which has a brown cliff/ledge border in the corner — it's a terrain edge tile, not flat grass. Replaced with position (5,5) which is the actual clean flat grass pattern. Also fixed 4 overlay tiles (tree, tall grass, sign, ledge) that used the same bad tile as their base. Replaced water tile (had dirt edge from Tuxemon pond border) with a custom clean blue tile with wave pattern.

- **Interior map centering**: Small interior maps (Oak's Lab, houses, etc.) now render centered in the game window instead of anchored to the top-left corner. Fixed by using direct camera scroll offset instead of `setBounds`+`centerOn` which couldn't scroll past the small map bounds. Added dark background color for the area outside the map.

- **Building entry warp blocking**: Players can now enter buildings before receiving a starter Pokémon. The "You should go see Prof. Oak first!" message now only blocks route exits, not building doors. Previously all warps were blocked when the party was empty, making it impossible to enter Oak's Lab to receive a starter.
- **Pallet Town tile alignment**: Complete rewrite of Pallet Town map grid. Fixed north exit from single P to proper PP (2-wide). Connected house door paths to the main horizontal path (path now spans col 5-20). Fixed Oak's Lab wall gap on row 12 (was 12 tiles instead of 13). All 20 rows now exactly 25 characters matching declared width.
- **Map width consistency**: Normalized all exterior map row widths to match declared dimensions. Fixed viridian-city (rows were 31-32, now all 30), pewter-city (mixed 30/32, now all 30), viridian-forest (rows were 24, now all 25), route-2 (2 rows were 22, now 20).
- **Pewter City warp positions**: Corrected door warp coordinates to match actual tile positions after width normalization — PokéCenter door at col 11, Gym door at col 15, Museum door at col 12.

### Changed
- **Tileset quality upgrade v2**: Using Tuxemon tileset by Buch (CC-BY 3.0) for grass terrain — clean Pokemon Gold/Silver-style green grass with subtle diagonal pattern. Custom warm dirt path tile matching the grass palette. Custom Pokemon-style tall grass with V-shaped blade pattern on grass base. Hand-drawn tree with trunk/canopy on grass base. Buildings and interior tiles refined with proper pixel art shading. Previous ArMM1998 CC0 tiles replaced where they didn't match the Pokemon art direction.

### Added
- **Tileset-Based Map Rendering — Replaced Procedural Rectangles with Sprite Tileset**
  - Generated a clean 16×16 pixel art tileset (`tileset.png`) with all 39 tile types in Pokemon GBA style: grass with checkered pattern, textured paths, blade-pattern tall grass, trees with trunk/canopy, wave-pattern water, brick-pattern house walls, shingle-line roofs, detailed doors with doorknobs, fences with posts/rails, multi-color flowers, signs, ledges, PokéCenter roof with white cross, Mart roof with "M", Gym roof with star, wood-plank floors, baseboard walls, counters, tables, bookshelves with colored books, patterned rugs, exit mats, PC with monitor/keyboard, heal machine, cross-pane windows, chairs, Poké Ball items, stone gym floors, gym statues
  - PreloadScene loads `tileset.png` as a Phaser spritesheet (16×16 frames, 10 columns × 4 rows)
  - OverworldScene `drawMap()` replaced: ~430 lines of procedural rectangle/circle drawing reduced to ~15 lines using `this.add.image()` with tileset frame index, rendered at 2× scale for 32px game tiles
  - Massive reduction in scene object count: each tile is now 1 sprite instead of 2–15 overlapping shapes

- **Phase 3.1-3.4: Side Content**
  - **Fishing System**: 3 rod tiers (Old/Good/Super Rod) as key items, per-route fishing encounter tables (`fishingTables` in encounter-tables.ts) with weighted species, fishing interaction when facing water tiles in OverworldScene, 50% bite rate, dialogue sequence ("...!", "Not even a nibble...")
  - **Day/Night Cycle**: GameClock (`frontend/src/systems/GameClock.ts`) with 10× accelerated time (1 real min = 10 game min), 4 time periods (morning/day/evening/night) with camera tint colors, HH:MM clock, save/restore elapsed minutes
  - **Shiny Pokémon**: `isShiny` field on PokemonInstance, 1/4096 chance in `createWildPokemon`, sparkle particle effect on battle intro (6 rotating sparkles), shiny ★ star on Summary screen species name
  - **Pokédex Scene**: Full `PokedexScene` with scrollable 151-species list, seen/caught status (●/○), detail panel with sprite + types + base stats (caught only), registered in game-config and accessible via POKEDEX in pause menu
  - New constants: `SHINY_CHANCE`, `FISHING_ENCOUNTER_RATE`
  - Rod items added to item-data (old-rod, good-rod, super-rod)

- **Phase 7: Mobile & Accessibility — COMPLETE**
  - **TouchControls** (`frontend/src/ui/TouchControls.ts`): Virtual D-pad (bottom-left) + A/B buttons (bottom-right) as Phaser GameObjects. Auto-detected via `navigator.maxTouchPoints`. D-pad emits directional input, A = confirm, B = cancel. Responsive layout on resize. Integrated into InputManager (touch direction/confirm/cancel merged with keyboard).
  - **Accessibility settings in SettingsScene**: Text Size (small/medium/large), Colorblind Mode (off/protanopia/deuteranopia), Reduced Motion toggle. All persisted to localStorage via GameManager settings.
  - **PWA Support**: `manifest.json` (standalone display, landscape orientation, theme color #ffcc00, app icons), `sw.js` service worker (cache-first for assets, network-first for HTML, cache cleanup on activation). `index.html` updated with manifest link, theme-color meta, apple-mobile-web-app meta, `touch-action: none`, viewport `user-scalable=no`, and SW registration script.
  - Responsive scaling already existed (Phaser.Scale.FIT + CENTER_BOTH)

- **Pokémon Catching — Full Implementation**
  - BattleUIScene: BAG now passes `battleMode: true` to InventoryScene; listens for `use-pokeball` event to trigger catch sequence
  - Catch sequence: CatchCalculator computes catch/shakes from HP%, status, ball multiplier → ball throw arc animation → 0-3 shake wobble animations with SFX → success (sparkle + add to party/PC + Pokédex + victory BGM) or failure (break-free message + enemy free attack)
  - InventoryScene: accepts `battleMode` flag; Poké Ball USE in battle emits `use-pokeball` event with ball item ID, consumes ball from bag, and closes
  - Trainer battles block catching ("You can't catch a trainer's Pokémon!")
  - Uses all existing infrastructure: CatchCalculator, BALL_THROW/BALL_SHAKE/CATCH_SUCCESS SFX keys, addToParty with auto-deposit, markCaught for Pokédex

- **Map UI Overhaul — Enhanced Tile Rendering + Building Interiors**
  - **Enhanced procedural tile rendering**: Replaced flat-color rectangles with multi-layered detail for all 25 overworld tile types. Trees now have trunk + canopy circles + shadow. Paths have pebble texture and edge darkening. Buildings have shingle lines on roofs, brick patterns on walls, door frames with doorknobs and steps. Water has wave highlights and sparkles. Tall grass has 5 blade layers with flower accents. Flowers have stems and colored petals. Signs have post + board detail. Fences have posts + rails. Dense trees have overlapping dark canopy circles.
  - **14 new interior tile types** in `shared.ts`: FLOOR (wood planks), INDOOR_WALL (with baseboard), COUNTER, TABLE, BOOKSHELF (with colored books), RUG (patterned), MAT (exit warp), PC_TILE (monitor + keyboard), HEAL_MACHINE, WINDOW (cross-pane glass), CHAIR, POKEBALL_ITEM, GYM_FLOOR (rocky texture), GYM_STATUE (pedestal + statue)
  - **8 interior maps** with full NPC placement and gameplay logic:
    - `pallet-player-house` (8×8): Table, bookshelf, rug, Mom NPC with flag-gated dialogue
    - `pallet-rival-house` (8×8): Rival's sister NPC, furniture
    - `pallet-oak-lab` (13×12): Bookshelves, lab desks, starter Poké Balls on table, Prof. Oak + 2 lab aides (starter-select + parcel delivery logic moved inside)
    - `viridian-pokecenter` (13×8): Healing counter, Nurse NPC (heal interaction), PC terminal, benches
    - `viridian-pokemart` (10×8): Shop counter, Clerk NPC (parcel quest), shelves, shopper NPC
    - `pewter-pokecenter` (13×8): Same layout as Viridian, Nurse NPC
    - `pewter-gym` (14×12): Rocky gym floor, Brock trainer at back, gym guide NPC, statues
    - `pewter-museum` (14×10): Display cases (bookshelves), guide/scientist/visitor NPCs
  - **Door warp system**: Players can now enter buildings by stepping on door tiles. Warps added to Pallet Town (player house, rival house, Oak's lab), Viridian City (PokéCenter, PokéMart), and Pewter City (PokéCenter, gym, museum). Each interior has a MAT tile that warps back to the exterior.
  - **Door open SFX**: `sfx-door-open.wav` plays when entering/exiting buildings (detected via door/mat tile types)
  - **Interior camera**: Small interior maps that fit on screen use a centered fixed camera instead of following the player
  - **Location name popup**: Entering an interior shows a fade-in/fade-out popup with the building name (e.g., "Oak's Laboratory", "Pokémon Center")
  - **MapDefinition extensions**: Added `isInterior` flag (smaller camera, no encounters) and `displayName` field
  - **BGM mappings**: PokéCenter interiors play `bgm-pokemon-center`, Pewter Gym plays `bgm-battle-gym`

### Changed
- NPCs moved from exterior to interior maps: Mom (→ player house), Prof. Oak + starter logic (→ Oak's lab), Nurse Joy (→ PokéCenter interiors), Mart Clerk + parcel quest (→ PokéMart interior), Brock + gym guide (→ Pewter Gym interior)
- Pallet Town, Viridian City, Pewter City exterior maps updated with door warps and return spawn points

- **Phase 2: Gameplay Depth — Battle System Expansion — COMPLETE**
  - **HeldItemHandler** (`frontend/src/battle/HeldItemHandler.ts`): Held item effect system with hooks for end-of-turn (Leftovers, Black Sludge), after-damage (Focus Sash survive at 1 HP), attack-landed (Life Orb recoil), status-applied (Lum Berry, type-specific cure berries), HP-threshold (Sitrus Berry, Oran Berry), and damage modifiers (Life Orb 1.3×, Choice Band/Specs 1.5×, Muscle Band 1.1×, Wise Glasses 1.1×). Berries consumed on use, permanent items persist.
  - **WeatherManager** (`frontend/src/battle/WeatherManager.ts`): Battle weather system with 4 conditions (Sun, Rain, Sandstorm, Hail), 5-turn default duration, damage multipliers (Sun: Fire ×1.5/Water ×0.5, Rain: Water ×1.5/Fire ×0.5), end-of-turn damage for Sandstorm/Hail (1/16 HP with type immunities), weather tick/expiry, weather indicator in battle UI
  - **Multi-condition evolution**: Updated evolution-data.ts type signature to use `EvolutionCondition` discriminated union supporting level, item, trade, friendship, location, and move-known conditions. Added `ExperienceCalculator.checkLevelUpEvolution()` for unified evolution checking (level + friendship + move-known). Friendship gains on level-up (+2-5 based on current friendship), friendship loss on faint (-1).
  - **Held items in item-data**: Added Leftovers, Life Orb, Choice Band, Choice Specs, Focus Sash, Sitrus Berry, Oran Berry, Lum Berry, Cheri/Rawst/Aspear/Chesto/Pecha berries, and evolution stones (Fire/Water/Thunder/Leaf/Moon Stone)
  - **DamageCalculator integration**: Now applies ability-based immunity checks, ability damage modifiers, held item damage modifiers, and weather damage multipliers
  - **BattleManager integration**: Stores and exposes WeatherManager instance, cleans up on battle end
  - **BattleUIScene integration**: Ability onAfterDamage hooks (contact effects), held item hooks (Life Orb recoil, Focus Sash, status berries, HP threshold berries) after each move, ability/held item/weather end-of-turn effects, weather tick with expiry messages, weather indicator display
  - **Summary screen**: Shows Ability and Held Item on INFO tab
  - AbilityHandler already existed with onSwitchIn, onAfterDamage, onEndOfTurn, modifyDamage, checkImmunity hooks (created by prior agent)
  - **2.5 Expanded Move Effects**: Weather-setting moves (Sunny Day, Rain Dance, Sandstorm, Hail), Protect/Detect with +4 priority and consecutive-use success decay, two-turn moves (Fly, Dig, Solar Beam, Skull Bash, Sky Attack, Razor Wind) with charge-then-attack mechanic and auto-execute on next turn. StatusEffectHandler extended with protect state, protectSuccessRate, twoTurnCharging fields. MoveExecutor handles protect blocking, weather setting via WeatherManager, and two-turn charge/attack flow.

### Added
- **Complete Gen 1 Pokédex (151 Pokémon)** — Expanded from ~44 to all 151 original Pokémon with accurate base stats, learnsets, abilities, catch rates, exp yields, and evolution chains
- **Data folder restructure: pokemon/** — Split `pokemon-data.ts` into `data/pokemon/` folder with per-primary-type files: `normal.ts` (22), `water.ts` (28), `poison.ts` (14), `grass.ts` (12), `fire.ts` (12), `bug.ts` (12), `electric.ts` (9), `rock.ts` (9), `ground.ts` (8), `psychic.ts` (8), `fighting.ts` (7), `ghost.ts` (3), `dragon.ts` (3), `fairy.ts` (2), `ice.ts` (2), and barrel `index.ts`
- **Complete evolution data** — All Gen 1 evolution chains including level-up, stone evolutions (fire/water/thunder/moon/leaf), and trade evolutions

### Changed
- **Data folder restructure: maps/** — Split monolithic `map-data.ts` into `data/maps/` folder with individual files per map (`pallet-town.ts`, `route-1.ts`, `viridian-city.ts`, `route-2.ts`, `viridian-forest.ts`, `pewter-city.ts`), shared tile constants/interfaces in `shared.ts`, and barrel `index.ts`. Import path changed from `@data/map-data` to `@data/maps`
- **Data folder restructure: moves/** — Split monolithic `move-data.ts` (~165 moves) into `data/moves/` folder with per-type files (`normal.ts`, `fire.ts`, `water.ts`, `electric.ts`, `grass.ts`, `ice.ts`, `fighting.ts`, `poison.ts`, `ground.ts`, `flying.ts`, `psychic.ts`, `bug.ts`, `rock.ts`, `ghost.ts`, `dragon.ts`, `dark.ts`) and barrel `index.ts`. Import path changed from `@data/move-data` to `@data/moves`
- Updated all source and test imports to use new paths
- Updated `docs/architecture.md` folder structure to reflect new layout

### Removed
- `frontend/src/data/map-data.ts` (replaced by `data/maps/`)
- `frontend/src/data/move-data.ts` (replaced by `data/moves/`)
- `frontend/src/data/pokemon-data.ts` (replaced by `data/pokemon/`)

## [2026-04-12]
### Fixed
- Fullscreen toggle in Settings now correctly shows ON/OFF — `scale.isFullscreen` is async so the UI was always reading the stale value; now tracks state locally

### Added
- **Phase 1: UI Overhaul & Foundation — COMPLETE**
  - **NinePatchPanel** (`frontend/src/ui/NinePatchPanel.ts`): Procedural nine-patch panel component with rounded corners, drop shadow, inner highlight, configurable fill/border/corner radius. Replaces flat `drawPanel()` rectangles across all menus
  - **MenuController** (`frontend/src/ui/MenuController.ts`): Unified input controller for 1D/2D menu grids — keyboard (arrows, WASD, Enter/Space/Z confirm, ESC/X cancel), mouse hover-to-select and click-to-confirm, wrap-around navigation, audio feedback hooks, disabled state for animation blocking
  - **Dialogue System Upgrade**: Speaker name panel with highlighted label, per-character typewriter SFX (blip every 2 chars), animated bouncing ▼ advance indicator, inline choice prompts (Yes/No rendered inside dialogue box with cursor navigation), nine-patch bordered dialogue boxes
  - **Inventory Scene (Full Implementation)**: Complete bag screen with 5 category tabs (Medicine, Poké Balls, Battle, Key Items, TMs), scrollable item list with scroll indicators, detail panel showing description/effect/quantity, USE action (heals HP, cures status with party target picker), TOSS action with confirmation, key items protected from toss, money display, Q/E tab switching
  - **Battle UI Polish**: Nine-patch panels for message bar and action menu, move type color dots and category indicators (P/S/St) in move selection, PP coloring (white normal, yellow ≤25%, red empty), floating damage number popups that rise and fade with effectiveness-based coloring, themed info boxes with consistent dark card styling
  - **Party Screen Improvements**: Context menu on slot select (SUMMARY/SWITCH/Cancel), SWITCH mode for party reordering (tap source then destination), fainted Pokémon slots visually dimmed with FNT badge, mini-sprite icons if texture loaded, NinePatchPanel background
  - **Settings Scene** (`frontend/src/scenes/SettingsScene.ts`): Accessible from Title Screen and Pause Menu "Options", settings: Text Speed (slow/medium/fast/instant), Music Volume slider (0-100%), SFX Volume slider (0-100%), Battle Animations toggle, Fullscreen toggle. Left/Right to adjust, persisted to localStorage, audio changes applied in real-time
  - **GameManager settings**: New `settings` property with `getSettings()`/`getSetting()`/`setSetting()` methods, settings persisted in localStorage independently and included in save serialization, loaded on singleton construction
  - Registered `SettingsScene` in game config scene list

### Changed
- `DialogueScene` now accepts `DialogueData` interface with optional `speaker`, `choices`, and `onChoice` fields
- `MenuScene` uses NinePatchPanel instead of drawPanel; OPTIONS opens SettingsScene
- `TitleScene` OPTIONS launches SettingsScene as overlay
- `BattleScene` info boxes use themed COLORS.bgCard/border instead of hardcoded hex
- `BattleUIScene` action menu and move menu use NinePatchPanel, FONTS, and COLORS consistently

## [2026-04-12]
### Fixed
- ESC key now opens the pause menu — `InputManager` was calling `JustDown` twice on the same ESC key object, so `cancel` consumed the event before `menu` could read it; now evaluates once and shares the result
- Professor Oak no longer repeats starter selection dialogue after player already received a Pokémon — `starter-select` interaction now checks `receivedStarter` flag; NPCs are respawned after starter selection so the flag-gated `pallet-oak-after` NPC replaces `pallet-oak`
- Rewrote `player-walk.json` atlas — sprite sheet is column-based (col0=down, col1=right, col2=up, col3=left) with 3 frames per direction, not row-based with 4 frames. Updated AnimationHelper to register all 4 directions (removed flipX hack for right) with correct frame range (0–2). Player now faces the correct direction when walking.
- Player walk animation no longer spins/restarts every frame — restored `repeat: -1` for continuous walk cycle during movement, removed per-frame `lastAnimKey` reset that was causing the animation to restart from frame 0 each tick

### Added
- **UI Testing — Scene State Machine & Regression Tests**
  - `overworld-animation.test.ts`: Validates animation key stability to prevent player rotation bugs — idle/walk animation resolution, facing→key mapping, rapid direction change handling
  - `battle-ui-state-machine.test.ts`: Exhaustive state×input matrix for BattleUIScene — documents ESC-exits-battle bug, tests input blocking during animation, action/move menu transitions
  - `scene-lifecycle.test.ts`: Input gating across scene overlays (menu, dialogue, battle), pause/resume correctness, transition guards, battle→overworld return sequence
  - `grid-movement.test.ts`: Pure-logic movement — collision blocking, movement locking during tweens, NPC collision, trainer line-of-sight for all 4 directions
  - `input-manager.test.ts`: Direction priority, WASD alternatives, JustDown vs isDown, shared ESC key documentation
  - `ui-regression.spec.ts` (Playwright): Idle rotation, ESC-in-battle, rapid ESC/direction stress, menu open/close/resume, save option
  - Test suite now at 1172 tests across 38 files

### Fixed
- Player walk animation no longer loops infinitely; plays once per tile move using `repeat: 0` and `duration` matching `WALK_DURATION`

### Added
- CI workflow (`.github/workflows/ci.yml`) runs tests and type-check on PRs and pushes to main
- Test step added to deploy workflow so failing tests block deployment
- **Expanded Testing Suite — 1089 tests across 33 files**
  - 15 new test files covering previously untested modules and deep scenarios
  - Extended unit tests: DamageCalculator (burn/stat stage/formula verification), StatusEffectHandler (all 11 stat stages, escalating toxic, confusion self-hit, trap timing, effect chance gating, single-status rule), AIController (power×effectiveness scoring, PP avoidance), type-chart (exhaustive 324 matchups + 48 SE + 8 immunities), data integrity (learnset sorting/dedup, starter balance, move effect validation, evolution acyclicity, route progression)
  - New unit tests: seeded-random (determinism, distribution, edge seeds), map-data (tile constants, solid tiles, colors), audio-keys (BGM/SFX keys, MAP_BGM validation), constants (all game constants)
  - Extended integration tests: full multi-turn battles, multi-pokemon party battles, trainer multi-enemy parties, priority move turn order, status accumulation over turns, every move in moveData crash-tested, every registered species createWildPokemon tested, all level-based evolutions tested, save/load field preservation (nickname, status, EVs, friendship), multi-cycle save/load
  - New integration tests: DialogueManager, full-battle-scenarios
  - Created `docs/TestingArchitecture.md` documenting all 5 test layers, test structure, coverage goals, and agent workflow
  - Updated `copilot-instructions.md` with testing section referencing TestingArchitecture.md

- **Phase 11: Deployment — GitHub Pages — COMPLETE**
  - Set Vite `base: '/Pokemon-Web/'` for correct asset paths on GitHub Pages
  - Created `.github/workflows/deploy.yml` — GitHub Actions CI/CD: checkout → Node 20 → npm ci → build → upload artifact → deploy to Pages
  - Added `npm run deploy` script (manual deploy via gh-pages package)
  - Production build verified with correct base path in output HTML

- **Phase 10: Polish & Quality of Life — COMPLETE**
  - Battle intro slide-in animation: sprites enter from offscreen (enemy from right, player from left), info boxes slide in from top/bottom with Back.easeOut easing
  - EXP bar in battle HUD: blue progress bar below player HP, animates on EXP gain with SFX
  - Battle transition screen-wipe: 3 styles (stripes, circles, fade) — battles use alternating stripe wipe effect
  - Evolution animation system: detects level-based evolution after level-up in battle, plays rapid flash sequence → white flash → sprite swap → stat recalculation, updates Pokédex
  - Configurable text speed: DialogueScene reads text speed preference (slow/medium/fast/instant), defaults to medium
  - Save game from menu: MenuScene SAVE option writes to localStorage via SaveManager, shows "Game Saved!" confirmation with fade-out
  - Continue from save: TitleScene→OverworldScene properly loads save data via GameManager.loadFromSave(), restores map position, party, flags

### Changed
  - TransitionScene rewritten with 3 transition styles and clean scene handoff
  - BattleScene sprites and info boxes now use intro animation instead of static placement
  - BattleUIScene victory sequence now checks for evolution before ending battle

- **Phase 9: Game Content — World Building — COMPLETE**
  - 4 new maps: Viridian City (30×30), Route 2 (20×30), Viridian Forest (25×40), Pewter City (30×30)
  - 10 new tile types: PokéCenter (wall/roof/door), PokéMart (wall/roof/door), Gym (wall/roof/door), Dense Tree
  - New trainers: Youngster Ben (Route 2), 3 Bug Catchers placed in Viridian Forest, Gym Leader Brock in Pewter City Gym
  - `StarterSelectScene`: overlay UI for choosing Bulbasaur/Charmander/Squirtle with card layout, sprite preview, keyboard+mouse navigation
  - Flag-gated NPC system: `NpcSpawn.requireFlag`, `flagDialogue` (alternative dialogue per flag), `setsFlag`, `interactionType`
  - Story flag flow: Oak gives starter (→ `receivedStarter`), Mart clerk gives parcel (→ `hasParcel`), Oak accepts parcel (→ `deliveredParcel`, `receivedPokedex`), Brock defeated (→ `defeatedBrock`)
  - Pokémon Center healing: fully restores HP, PP, and status for all party members
  - Trainer defeat rewards: money awarded, trainer marked defeated, Boulder Badge granted for Brock
  - Post-battle trainer messages: defeat announcement, money reward, badge, after-dialogue
  - Block warps when player has no Pokémon (directs to Oak)
  - Map transitions: Route 1 north → Viridian City, Viridian City north → Route 2, Route 2 north → Viridian Forest, Forest north → Pewter City

### Changed
  - Mom NPC dialogue is flag-gated (pre/post starter)
  - OverworldScene NPC spawning respects `requireFlag` conditions
  - BattleScene stores `isTrainerBattle` and `trainerId` from transition data
  - BattleUIScene victory sequence handles trainer rewards, money, badges, and after-dialogue
  - ExperienceCalculator now receives proper isTrainer flag for trainer battles

- **Comprehensive Testing System (All 5 Phases)**
  - **Phase 1 — Unit Tests (Vitest):** DamageCalculator, CatchCalculator, ExperienceCalculator, type-chart, BattleStateMachine, StatusEffectHandler, AIController, math-helpers, and full data integrity tests
  - **Phase 2 — Integration Tests:** GameManager (party, bag, money, badges, serialize/deserialize), SaveManager round-trip, BattleManager full battle flow, MoveExecutor (all move types), EncounterSystem, EventManager, evolution, inventory
  - **Phase 3 — E2E Tests (Playwright):** Boot-to-title smoke test, console error check, new game flow, menu navigation
  - **Phase 4 — Deterministic Replay System:** Seeded PRNG (mulberry32), replay runner, replay types/format, starter battle replay JSON
  - **Phase 5 — Fuzz/Monkey Testing:** Seeded random input generator, 2000-input crash test with periodic screenshots
  - Vitest config with path aliases matching the project's Vite config
  - Phaser mock and localStorage mock utilities for Node-based testing
  - 255 tests across 18 test files, all passing
  - `npm run test`, `test:unit`, `test:integration`, `test:watch`, `test:e2e`, `test:fuzz`, `test:coverage`, `test:all` scripts
  - `frontend/src/utils/seeded-random.ts` — mulberry32 PRNG for deterministic replay

- **Status Effect System — Full Wiring**
  - Type-based status immunities: Fire immune to burn, Electric to paralysis, Poison/Steel to poison, Ice to freeze, Grass to Leech Seed
  - Fire-type move thawing: fire moves now thaw frozen targets before dealing damage
  - Leech Seed effect: drains 1/8 max HP per turn and heals the opponent, with Grass-type immunity
  - Trapping move effects for Wrap, Bind, Fire Spin, and Clamp: deal 1/8 HP per turn for 4–5 turns
  - Status condition indicators (BRN, PAR, PSN, SLP, FRZ) displayed on battle HUD with color coding
  - `StatusEffectHandler` integrated into `BattleManager` as single source of truth
  - `BattleManager.selectMove()` now uses StatusEffectHandler for stat stages, priority, status turn-start checks, flinch, and end-of-turn effects
  - `BattleManager.switchPokemon()` now clears volatile statuses on switch-out and initializes new active
  - `BattleManager.cleanup()` method for proper teardown
  - `BattleManager.getStatusHandler()` exposes the handler for UI integration
  - `MoveExecutor` now passes thaw messages through all return paths (OHKO, fixed-damage, level-damage, multi-hit, standard)

### Changed
  - `BattleUIScene` now uses `BattleManager.getStatusHandler()` instead of creating its own StatusEffectHandler
  - `StatusEffectHandler.applyEndOfTurn()` accepts optional opponent parameter for Leech Seed healing
  - `VolatileStatus` type expanded with `'leech-seed' | 'trapped'`
  - `MoveEffect.type` union expanded with `'leech-seed' | 'trap'`
  - `BattlePokemonState` tracks `trapTurns` for trapping move duration
  - Updated end-of-turn flow in `BattleUIScene` to pass opponent reference for Leech Seed

- **Phase 7: Audio System — COMPLETE**
  - Enhanced `AudioManager` singleton with browser autoplay policy handling (queues BGM until user interaction unlocks audio), safe playback (missing audio keys don't crash), current BGM tracking (avoids replaying same track), fade-out method, mute toggle, volume clamping
  - Created `utils/audio-keys.ts` with typed BGM/SFX key constants and map→BGM mapping table
  - Generated 8 placeholder BGM WAV files (title, pallet-town, route, battle-wild, battle-trainer, battle-gym, victory, pokemon-center) using synthesized square-wave melodies
  - Generated 16 placeholder SFX WAV files (cursor, confirm, cancel, error, hit-normal, hit-super, hit-weak, hit-crit, faint, ball-throw, ball-shake, catch-success, exp-fill, level-up, door-open, ledge-jump, bump, encounter)
  - Audio preloading in `PreloadScene` for all BGM and SFX keys
  - BGM wired into `TitleScene` (title theme), `OverworldScene` (per-map BGM with crossfade on map transition), `BattleScene` (wild/trainer battle themes)
  - Victory BGM plays on battle win in `BattleUIScene`
  - SFX wired into `TitleScene` (cursor/confirm), `MenuScene` (cursor/confirm/cancel), `BattleUIScene` (cursor/confirm/cancel, hit variants based on type effectiveness and crits, faint, level-up), `OverworldScene` (encounter sting)

### Fixed
- Battle→Overworld return flow now properly passes `returnScene`/`returnData` through `BattleScene` so the player returns to the correct map and position after battle (previously defaulted to GameManager state which worked by coincidence)

## [Unreleased]

### Phase 1: Environment & Tooling Setup — COMPLETE
- Initialized project with Vite 8 + TypeScript 6 + Phaser 3
- Moved all frontend code into `frontend/` directory for future backend support
- Configured `tsconfig.json` with strict mode and path aliases (`@scenes/*`, `@data/*`, etc.)
- Configured `vite.config.ts` with matching path aliases and `frontend/` as root
- Created full folder structure per architecture.md
- Created `index.html`, `.gitignore`, `package.json` with dev/build/preview scripts
- Dev server running at `localhost:8080` with HMR

### Phase 2: Core Scenes Skeleton — COMPLETE
- Created 12 scene classes: Boot, Preload, Title, Overworld, Battle, BattleUI, Dialogue, Menu, Inventory, Party, Summary, Transition
- Scene flow: Boot → Preload (progress bar) → Title (New Game / Continue) → Overworld → Battle
- TitleScene: keyboard + mouse menu navigation, cursor indicator
- OverworldScene: placeholder grid, player movement (arrow keys + WASD), camera follow
- BattleScene + BattleUIScene: stubs with placeholder sprites, action menu
- TransitionScene: fade-to-black transitions between scenes
- MenuScene: pause overlay with Pokemon/Bag/Save/Options/Exit
- DialogueScene: typewriter text effect with advance-on-input

### Phase 3: Data Layer — COMPLETE
- Defined TypeScript interfaces: PokemonData, MoveData, ItemData, TrainerData, PokemonInstance, SaveData, etc.
- Populated ~30 Pokémon (3 starter lines, route Pokémon, gym Pokémon)
- Populated ~50 moves across all 18 types + status moves
- Populated ~15 items (Potions, Poké Balls, status heals, key items)
- Populated 7 trainers (Rival, Bug Catchers, Youngster, Lass, Gym Leader Brock)
- Populated 3 encounter tables (Route 1, Route 2, Viridian Forest)
- Built 18×18 type effectiveness chart with lookup functions
- Built evolution data for all Pokémon with level/item conditions

### Phase 4: Overworld Systems — PARTIAL
- Grid-based player movement with tween animation (WASD + Arrow keys)
- GridMovement system: collision checking, tile snapping, direction facing
- Player entity class wrapping GridMovement
- NPC entity class with dialogue and direction facing
- Trainer entity class with line-of-sight detection
- InteractableObject entity for signs/doors/items
- WildEncounterZone entity for grass areas
- EncounterSystem: step counter, weighted random Pokémon selection, wild instance creation
- InputManager: unified keyboard input polling
- AnimationHelper: player walk-cycle animation registration
- Player walk-cycle spritesheet loaded and animated (4-direction)
- Overworld tileset loaded as background
- **Not yet done:** Tiled maps, map transitions/warps, NPC spawning from Tiled objects

### Phase 5: Battle System — COMPLETE
- BattleStateMachine FSM with all states (INTRO, PLAYER_TURN, EXECUTE, CHECK_FAINT, VICTORY, DEFEAT, FLEE, CAPTURE)
- BattleManager: orchestrates turns, speed-based turn order, party management
- DamageCalculator: full Pokémon damage formula (level, power, attack/defense, STAB, type effectiveness, critical hits, random factor)
- MoveExecutor: applies damage, deducts PP, status effect handling
- StatusEffectHandler: burn, paralysis, poison, bad poison, sleep, freeze logic with damage/skip/thaw
- AIController: trainer AI prefers super-effective moves, wild Pokémon random selection
- ExperienceCalculator: EXP yield formula, level-up with stat recalculation, nature modifiers (+10%/-10%), new move learning
- CatchCalculator: catch rate formula with HP ratio, ball multiplier, status bonus, shake checks
- Nature system: 25 natures with proper stat modifiers, `getNatureMultiplier()` and `getNatureDescription()` exports
- Real battle flow: player party persists via GameManager, actual Pokémon instances with moves/stats/PP
- Turn execution: speed determines order, both sides attack, damage messages, effectiveness text, crits
- HP bars animate via tweens, change color (green → yellow → red)
- Sprite flash on hit, drop+fade on faint
- EXP bar in player info box, animates on gain
- Level-up sequence: flash effect, stat display, new move prompt (auto-learn if <4, replace choice if 4)
- Victory returns to overworld, defeat shows "blacked out" message

### Phase 6: UI & Menus — COMPLETE
- **Shared theme system** (`ui/theme.ts`): centralized COLORS, FONTS, SPACING, TYPE_COLORS, CATEGORY_COLORS, STATUS_COLORS + helper functions (drawPanel, drawTypeBadge, drawHpBar, drawButton, hpColor)
- **TitleScene**: dark themed background, split title with gold accent, cursor arrow, monospace fonts
- **MenuScene**: auto-sized panel, cursor arrow, themed borders, keyboard + mouse
- **PartyScene**: pulls real party from GameManager, card-style slots with HP bars, type badges, status badges, gold highlight on selection, opens SummaryScene on select
- **SummaryScene** (3-tab detail view):
  - INFO tab: species, dex #, nature (+/-), status, friendship, HP bar, total EXP, EXP to next level with progress bar, actual Pokémon front sprite
  - STATS tab: all 6 stats with value/base/IV/EV columns, visual bars, nature color coding (red=boosted, blue=lowered), stat totals
  - MOVES tab: move cards with type + category badges, power, accuracy, PP, priority, effect descriptions
- **BattleUIScene**: 2×2 action grid (FIGHT/BAG/POKEMON/RUN), move selection from real Pokémon moves, message bar, keyboard + mouse navigation
- **InventoryScene**: tabbed categories stub (Medicine, Poké Balls, Key Items, TMs)
- All menus navigable with arrow keys + Enter/Space/Escape AND mouse hover + click
- Reusable UI components: HealthBar, TextBox, MenuList, ConfirmBox, BattleHUD

### Phase 8: Save / Load System — COMPLETE
- SaveManager singleton: save/load/hasSave/deleteSave via localStorage
- SaveData interface: version, timestamp, player state, party, bag, money, badges, pokedex, flags, trainers defeated
- GameManager: full serialize/deserialize methods
- TitleScene: "Continue" option appears when save exists

### Assets
- Downloaded all 151 Pokémon front/back/icon sprites from PokéAPI
- Player walk-cycle spritesheet (4-direction, 4-frame) from community resources
- NPC spritesheets for overworld characters
- Overworld tileset for map backgrounds
- PreloadScene dynamically loads all Pokémon sprites from pokemon-data registry
- Asset download script (`download-assets.cjs`) for batch sprite fetching

### Infrastructure
- TypeScript compiles cleanly with `tsc --noEmit` (zero errors)
- Vite dev server with HMR on port 8080
- Git repository initialized with proper `.gitignore`
- GitHub Copilot instructions file for project conventions

---

## Not Yet Started
- Phase 7: Audio (BGM crossfade, SFX)
- Phase 9: World Content (Tiled maps, story beats, NPC dialogue wiring, map transitions)
- Phase 10: Polish (battle transitions, move animations, evolution animations)
- Phase 11: Deployment (production build, GitHub Pages)
