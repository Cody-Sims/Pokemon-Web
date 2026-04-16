# Pokemon Web Game — Development Plan

## Project Overview

A browser-based Pokémon-style RPG built with **Phaser 3 + TypeScript + Vite**. The player explores a top-down overworld, captures and trains Pokémon in turn-based battles, interacts with NPCs, and progresses through a unique original storyline. The entire game runs client-side as a static web app.

---

## Storyline — The Aurum Region

> Full storyline bible: [docs/storyline.md](storyline.md)

A coastal island chain where ancient ruins dot the landscape and **Aether** flows through underground ley lines. The player arrives in **Littoral Town** and is recruited by Professor Willow to document the region's Pokémon. Meanwhile, **The Synthesis Collective** is siphoning Aether to artificially enhance Pokémon, creating powerful but unstable specimens called **Synthetics**. The player's personal quest—discovering the fate of their missing Pokémon Ranger father—intertwines with the region-wide crisis.

**Key Characters:**
- **Kael Ashford** — Primary rival. Cocky → humbled → loyal ally across 6 encounters.
- **Marina Oleander** — Secondary rival / researcher. Drives Act 2 plot with Aether research.
- **Rook** — Mysterious drifter, ex-Collective scientist. Recurring ally across all acts.
- **Director Aldric Maren** — Collective founder and secret sitting Champion. Final boss.
- **Dr. Vex Corbin** — Collective Admin (Field Ops). 3 boss encounters.
- **Zara Lux** — Collective Admin (PR). Potential defector based on player dialogue choices.

**Story Beats:**
1. **Act 1 — Awakening** (Badges 1–2): Starter, first routes, meet Kael & Marina, Synthesis sensors found, Brock & Coral gym battles, coastal disappearances.
2. **Act 2 — Investigation** (Badges 3–5): Ember Mines Aether extraction, tag-battle with Kael at Ironvale, Synthesis traps in Canopy Trail, Zara reveal, Blitz triangulates HQ location, Professor Willow kidnapped.
3. **Act 3 — Confrontation** (Badges 6–8): Morwen's prophecy, Rook's identity reveal, Abyssal Spire HQ infiltration (5-floor dungeon), Zara defection choice, Willow rescued, Aldric escapes to Champion's chamber.
4. **Act 4 — Resolution**: Victory Road (final Kael battle), Elite Four (Nerida/Theron/Lysandra/Ashborne), Champion Aldric final battle, Solatheon calmed, player crowned Champion.
5. **Post-Game**: Shattered Isles, father's trail quest, Solatheon & Noctharion legendary catches, Gym Leader rematches, Kael Champion challenge.

**Side Quests:** 12 tracked side quests across all towns (see [storyline.md](storyline.md#side-quests--detailed)), including multi-town deliveries, Pokémon collection challenges, mine clearance, Berry farming, and the post-game Father's Trail quest line.

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

### Phase 3.5–3.7: Side Content ✓
> Crystal Cavern dungeon (20×30, 7-species encounter table, 3 hiker trainers). Rival Kael (6 encounters Lv 5→65) + Marina (2 encounters). Synthesis Collective grunts (3 entries). QuestManager singleton + 5 quest definitions (Lost Delivery, Collector's Challenge, Lost Pokémon, Mine Clearance, Berry Farming). Quest NPCs in Pallet Town, Viridian City, Pewter City, Viridian Forest. Story NPCs: Rook warning, Synthesis sensor device.

### Phase 4.5: Art Assets & Tileset Expansion ✓
> 42 new tile types (IDs 68–109) across 10 biomes: Coastal, Volcanic, Mine, Industrial, Forest, Electric, Ghost/Ruin, Dragon, Synthesis HQ, League. All with colors, solid flags, overlay bases, foreground tiles, char mappings. Battle background system (`MapDefinition.battleBg` + `BattleScene` image-based bg with procedural fallback).

### Phase 5: Act 2 Maps & Story Progression ✓
> Route 3 (Tide Pool Path), Coral Harbor (Gym 2 Water—Coral), Route 4 (Basalt Ridge), Ember Mines (Dr. Vex boss #1), Ironvale City (Gym 3 Steel—Ferris), Route 5 (Canopy Trail), Verdantia Village (Gym 4 Grass—Ivy), Voltara City (Gym 5 Electric—Blitz). 15 interior maps (PokéCenters, PokéMarts, Gyms). Encounter tables for all routes + fishing tables. Synthesis grunt encounters, story NPCs (Rook, Marina co-op, Aldric hologram, Willow kidnapping).

### Phase 6: Difficulty Modes & Replayability ✓
> Three modes: Classic (standard), Hard (trainer Lv+4, smart AI with STAB/status awareness, no items in trainer battles, 0.75× money, gym leaders use held items), Nuzlocke (fainted = released, first encounter per route, mandatory nicknames, game over on wipe). `DifficultyConfig` data, `GameManager` difficulty state, enhanced `AIController` with smart move selection, difficulty selection screen on New Game. Saved/loaded with game state.

### Phase 8: Act 3+ World Expansion ✓
> Route 6, Wraithmoor Town (Gym 6 Ghost—Morwen), Route 7 (Vex boss #2, Rook identity reveal), Scalecrest Citadel (Gym 7 Dragon—Drake), Cinderfall Town (Gym 8 Fire—Solara), Victory Road (3 Ace Trainers), Pokémon League (Elite Four Nerida + Champion Aldric). 9 interior maps. Encounter tables for Route 6/7/Victory Road. Gym Leaders 6–8, Elite Four Nerida, Champion Aldric (6 Pokémon Lv 52–55). Full map connection chain from Voltara → League.

### Gameplay Polish ✓
> Trainer walk-toward-player on LoS trigger with wall-blocked line of sight. Trainer sprites in battle (enemy trainer + player character behind Pokémon). Player depth fix (renders between ground and tall grass). Quit-to-title button in pause menu. Delete Save option on title screen.

### Phase 9: Story & Quest Wiring ✓
> **Rival Encounters Placed**: Kael rival-1 in Oak's Lab (post-starter), Kael rival-2 on Route 3, Kael tag-battle NPC in Ironvale City, Kael rival-4 on Route 8 (Stormbreak Pass), Kael rival-5 on Victory Road, Kael rival-6 in Aether Sanctum (post-game). Marina encounter on Route 2, Marina encounter-4 in Crystal Cavern Depths (post-game). **Quest Definitions Complete**: 12 quests with full step automation — triggerFlags/triggerEvents for Volcanic Survey (5 vents), Power Restoration (3 conduits), Restless Spirit (3 fragments), Dragon's Lament (herb+mineral), Captain Stern's Engine (3 grunt defeats), Chef's Special (5 berries). **Quest UI**: QuestJournalScene (Active/Complete tabs, scrollable list, step detail with checkmarks), QuestTrackerScene HUD overlay (auto-updating active quest step in top-right corner). **New Maps**: Route 8 (Stormbreak Pass, 20×30, connects Cinderfall→Victory Road), Aether Sanctum (post-game dungeon, 20×25), Crystal Cavern Depths (post-game, 20×30). **Generic House Interiors**: Reusable 8×8 template with factory function, 10 per-city houses with flavor dialogue. **Quest Interaction NPCs**: Conduit repair (Voltara), memory fragments (Wraithmoor), volcanic vents (Victory Road), herb/mineral pickups (Verdantia/Ember Mines), engine part grunts (Route 3/Coral Harbor). **Map Connection Chain**: Cinderfall → Route 8 → Victory Road → Aether Sanctum, Crystal Cavern ↔ Crystal Cavern Depths.

### Phase 10: First Impressions & New Game Experience ✓
> IntroScene with multi-slide Professor Willow presentation, typewriter text, animated fade transitions. Character naming screen with keyboard input, preset quick-picks, blinking cursor. Confirmation slide before overworld transition. Running Shoes from Mom (flag-gated NPC dialogue with `setFlag` support).

### Phase 11: Battle Animation & Visual Effects System ✓
> MoveAnimationPlayer system with 6 animation styles (contact, projectile, beam, area, self, shake). 18 type-based particle color palettes. 16 specific move animation overrides. Screen flash and screen shake effects. All animations play before damage is applied in BattleUIScene.

### Phase 15: Sound & Music Expansion ✓
> **Procedural Cry Generator** (CryGenerator.ts): Runtime Web Audio API synthesis of 151 unique chip-tune cries using multi-pulse envelopes, frequency sweeps, and vibrato. Hand-tuned starter families, algorithmic generation for all others. **Expanded Audio**: 13 new BGM keys (rival/legendary/villain battle, 5 town variants, cave, evolution, credits, victory road, villain lair) + 14 new SFX keys (stat raise/lower, synthesis activate, footsteps, badge get, heal jingle, etc.). **Context-Sensitive Music**: Distinct BGM per town theme (coastal, industrial, spooky, mountain, cave). AudioManager enhancements: `playFanfare()`, low-HP warning beep, `pauseBGM()`/`resumeBGM()`, `playSFXWithRate()`. **ProceduralAudio** placeholder generator for missing audio assets.

### Phase 16: Advanced Battle Features (Partial) ✓
> **Synthesis Mode** (SynthesisHandler.ts + synthesis-data.ts): Game's unique "Mega Evolution" equivalent. 19 eligible Pokémon with +100 BST thematic boosts, optional type/ability overrides. One activation per battle, reverts on faint/battle-end. **Double Battle Manager** (DoubleBattleManager.ts): Full 2v2 system with 4 active slots, priority+speed turn ordering, spread move targeting (0.75× reduction), tag battle support with NPC ally parties. BattleState expanded with EXECUTE_TURN and REPLACE states. **Move Tutor & TM System** (tm-data.ts): 50 reusable TMs across all types (8 gym rewards), 5 Move Tutor NPCs, `canLearnMove()` compatibility function, Heart Scale item.

### Phase 12: Overworld Atmosphere & World Feel ✓
> **WeatherRenderer system** (WeatherRenderer.ts): 6 weather types (rain, sandstorm, snow, fog, sunshine, none) using Phaser particle emitters with programmatic textures. Camera-fixed overlays (depth 90) with alpha-blended tint rects (depth 89) to avoid conflict with GameClock day/night. Per-map weather via `MapDefinition.weather` field. Route 6 (rain), Route 7 (fog), Ember Mines (sandstorm). **NPC Behavior system** (NPCBehavior.ts): 4 behavior types — stationary, look-around (random facing 2–5s), wander (random 1-tile moves within radius 3–8s), pace (fixed direction route 2s). `NPCBehaviorController` with timer-based actions and collision-aware movement. `NpcSpawn.behavior` field. **EmoteBubble system** (EmoteBubble.ts): 6 emote types (exclamation, question, heart, sweat, music, zzz) as styled text with pop-in/fade-out tweens. **LightingSystem** (LightingSystem.ts): RenderTexture-based darkness overlay (depth 85) with radial gradient light circles. Player light follows camera, static lights for torches. `MapDefinition.isDark` and `lightSources` fields. Crystal Cavern and Crystal Cavern Depths marked dark with torch sources.

### Phase 13: Player Movement & Exploration Upgrades ✓
> **Bicycle system**: B key toggle via InputManager, 3× speed (63ms/tile via `GridMovement.setCycling()`), auto-dismount indoors, mutually exclusive with running. `bicycle` key item in item-data.ts. **Running encounter modifier**: Running increases encounter rate by 1.5× via `rateMultiplier` parameter in `EncounterSystem.checkEncounter()`. **OverworldAbilities** (OverworldAbilities.ts): 6 field abilities (Cut, Surf, Strength, Flash, Fly, Rock Smash) with badge requirements and party move checks. `canUse()`, `getUser()`, `getAvailable()` static methods. New tiles: CUT_TREE (110), CRACKED_ROCK (111), STRENGTH_BOULDER (112). Cut and Rock Smash wired into `tryInteract()` with live tile replacement. **Surfing**: `surfing` state in OverworldScene with collision override for water tiles, auto-disembark on non-water tiles. **Ledge system**: One-way directional jumps via `LEDGE_TILES` direction map. `LEDGE_LEFT` (113) and `LEDGE_RIGHT` (114) tile types. Parabolic hop animation (12px arc, 1.2× walk duration) in GridMovement with `setLedgeCheck()` callback. **Strength boulder-pushing**: directional push with collision/bounds check, tile swap animation. **Flash integration**: auto-expands player light radius from 96px to 192px in dark caves when party knows Flash. **Not yet implemented**: Fly fast-travel UI scene, cycling sprite/animation.

### Phase 15–16 Remaining UI Integration ✓
> **Synthesis Mode UI**: SYNTH button in BattleUIScene action menu (conditional on bracelet + eligibility), camera flash on activation, pulsing cyan aura (0x00ffdd) on synthesized Pokémon sprite. Synthesis Bracelet key item added. **Double Battle Scene**: 4-Pokémon layout in BattleScene (2 per side, 3x/1.5x scale), target selection arrows for single-target moves (left/right navigation), `isDouble` flag on TrainerData, tag battle routing from OverworldScene. **Move Tutor/TM Scene**: MoveTutorScene with full flow (move list → cost check → party filter via `canLearnMove()` → teach/replace → cost deduction), TM usage from InventoryScene (reusable, launches MoveTutorScene in TM mode), Heart Scale item, 5 tutor NPCs placed in Verdantia/Ironvale/Scalecrest/Wraithmoor/League.

### Phase 17: Cutscene & Story Presentation System ✓
> **CutsceneEngine** (CutsceneEngine.ts): Data-driven scripted sequence player with 16 action types (dialogue, moveCameraTo, moveNPC, faceNPC, facePlayer, wait, fadeToBlack, fadeFromBlack, flashScreen, playBGM, playSFX, screenShake, showEmote, setFlag, parallel, movePlayer). `CutsceneSceneAccess` interface for decoupled NPC/player access. Async `play()` method blocks player input until complete. `triggerCutscene` field on NpcSpawn for interaction-triggered cutscenes. 3 sample cutscenes in cutscene-data.ts (rival-intro, willow-lab-intro, route-1-blockade). **Not yet implemented**: 8 key story cutscenes, flashback system.

### Phase 18: Pokémon Personality & Bond System ✓
> **Friendship system**: `adjustFriendship()` on GameManager, friendship changes on battle victory (+3), level-up (+5), fainting (−1), PokéCenter heal (+1), walking (every 128 steps, +1 to lead). Battle effects at friendship ≥ 220: 10% survive KO with 1 HP, 10% cure status at end of turn. **Nickname system**: NicknameScene with keyboard input (reuses IntroScene pattern), nickname prompt after catch in BattleUIScene, `nickname` field on PokemonInstance, nicknames displayed in BattleScene/PartyScene/SummaryScene. Name Rater NPC in Verdantia Village with `interactionType: 'name-rater'` and PartyScene select mode. **Nature polish**: 25 nature flavor texts in SummaryScene INFO tab.

### Phase 12 Remaining: Animated Tiles & Environmental SFX ✓
> **Animated tiles**: Water tile tint cycling (3 blue shades every 30 frames), tall grass alpha pulse (0.85–1.0 every 15 frames), lava/magma red-orange tint cycling. Sprite references collected during `drawMap()`. **AmbientSFX system** (AmbientSFX.ts): `AmbientType` union (ocean/forest/cave/city/wind/rain/none), `ambientSfx` field on MapDefinition, infrastructure for future ProceduralAudio integration. **Terrain footstep SFX**: per-tile-type footstep sounds (grass/sand/water/wood/stone/metal), new SFX keys in audio-keys.ts.

### Phase 9 Remaining: Tag-Battle & Berry Mechanics ✓
> **Tag-battle system**: Ironvale Kael/player vs 2 Synthesis Grunts co-op via DoubleBattleManager. `tag-battle` interaction type on NPC spawns, `victoryFlag` support in BattleScene/BattleUIScene. **Show-Pokémon interaction**: `show-pokemon` interaction type with PartyScene select mode for Collector's Challenge quest (Magnus NPC in Viridian City). **Wild encounter trigger**: `wild-encounter` interaction type for Lost Pokémon quest (Geodude in Viridian Forest). **Berry fixes**: Sitrus Berry percentage-based healing in InventoryScene.

### Phase 17 Remaining: Key Story Cutscenes ✓
> 8 story cutscenes authored in cutscene-data.ts: game-intro, willow-lab-intro, rival-kael-lab, ember-mines-discovery, willow-kidnapping, rook-reveal, champion-reveal, credits-roll. **Flashback system**: `setSepia` action type in CutsceneEngine with full-screen sepia overlay (0xd4a574, alpha 0.3). `fathers-journal-1` flashback cutscene. Mom NPC in pallet-player-house wired with `triggerCutscene: 'game-intro'`.

### Phase 18 Remaining: Bond System Stretch Goals ✓
> **Affection dialogue**: 20% chance friendship-based messages on battle start (≥150), crit hit praise (≥200), survival/status cure messages. **Heart meter**: 5-heart visual (♥/♡) on SummaryScene INFO tab replacing raw friendship number. **EXP bonus**: +10% at friendship ≥200, +20% at ≥250 with "Boosted by friendship!" message. **Crit boost**: +1 crit stage at friendship ≥220 via DamageCalculator.

### Phase 19: World Enrichment & Side Activities ✓
> **Berry Growing System** (BerryGarden.ts): Plant/water/harvest cycle with GameClock timestamps. BERRY_SOIL tile (ID 115), `berryPlots` on MapDefinition. **Trainer Card Scene** (TrainerCardScene.ts): Full stat display (name, badges, Pokédex, playtime, money, difficulty, trainer ID) in NinePatchPanel. Added to pause menu. **Hidden Items System** (HiddenItems.ts): 16 hidden items across maps, Itemfinder key item with F-key scanning (5-tile radius), flag-gated collection. Missing items added (rare-candy, pearl, nugget, pp-up, max-elixir, iron, dusk-stone). **Voltorb Flip** (VoltorbFlipScene.ts): 5×5 card game with progressive levels, row/column hints, coin rewards. Game Corner NPC in Voltara City.

### Phase 20: Achievement & Completion Tracking ✓
> **AchievementManager** (singleton): 50 achievements across 5 categories (story/collection/battle/exploration/challenge). Serialized in SaveManager. **AchievementToast**: Gold banner slide-in notification, auto-dismiss 3s. **AchievementScene**: Grid gallery with category tabs, progress counter, keyboard+pointer nav. Added to pause menu. **GameStats**: 12 tracked statistics (battles won/lost, catches, steps, money, evolved, crits, highest damage) in GameManager with `incrementStat()`/`getStat()`. **Hall of Fame**: `HallOfFameEntry` data structure persisted on champion victory. **Achievement triggers**: Wired into BattleUIScene (victories, catches, evolution, badges) and OverworldScene (steps, surf, bicycle, fishing).

---

## Remaining Phases

### Phase 12–13 Remaining Work

**Phase 12 — Overworld Atmosphere (Partial):**
- Window light shafts in interiors, neon glow in Voltara City
- Aether crystal pulse animation

**Phase 13 — Movement Upgrades (Partial):**
- Fly fast-travel UI scene (map selection from visited towns)
- Cycling sprite/animation (distinct visual for bicycle mode)

### Post-Game Content (Not Yet Implemented)

- **Abyssal Spire** (Collective HQ): 5-floor climactic dungeon — Rook double battle, Vex final boss, Zara defection choice, Willow rescue, Aldric confrontation.
- **Shattered Isles**: Ruined archipelago, Lv 55–70 wild Pokémon, Rook rematch (Lv 70+).
- **Legendary quests**: Solatheon (Shattered Isles temple), Noctharion (Crystal Cavern depths).
- **The Father's Trail**: 5-location quest following father's journal → reunion + Master Ball.
- **Rematches**: All 8 Gym Leaders (Lv 60+), Elite Four (Lv 70+), Kael as Champion challenger (Lv 60–65).
- **Endgame dungeon**: Deep Crystal Cavern expansion.
- **Remaining Elite Four**: Theron (Fighting/Rock), Lysandra (Psychic/Dark), Ashborne (Fire/Dragon).
- **Randomizer mode** (stretch): Seed-based shuffle of encounters/teams/starters.

---

## Phase 14: UI Art & Custom Pixel Font

Everything is rendered with Phaser's built-in text. Custom art makes the game feel like a finished product rather than a prototype.

**Custom Pixel Font:**
- Generate or source a Pokémon-style bitmap font (BMFont format)
- Use across all dialogue, menus, battle text, HUD elements
- Support uppercase, lowercase, numbers, punctuation, special chars (♂♀★●)
- Mobile-friendly scaling

**UI Sprite Sheet:**
- Nine-patch panel art (replaces programmatic `NinePatchPanel` with actual pixel-art borders)
- Type icons (16×16 colored type emblems for each of the 17 types)
- Status condition icons (BRN/PAR/PSN/SLP/FRZ as pixel icons, not text)
- Gender icons (♂ blue, ♀ red)
- Button prompts (A/B/START icons for tutorials and HUD hints)
- Pokéball mini-icons for party HUD display
- Badge case artwork (8 gym badges as unique pixel-art icons)
- Arrow/cursor sprites (replaces text cursors ▶)

**HUD Improvements:**
- Mini-map or location indicator in corner
- Party quick-view (6 Pokéball icons showing party health at a glance)
- Clock display refinement (pixel-art clock icon + time)
- Quest tracker overlay (active quest name + current step)

---

## Phase 15–16 Remaining Work

**Boss Trainer Synthesis (Not Yet Implemented):**
- Boss trainers (Vex, Aldric) use Synthesis Mode in their battles
- Partner AI move selection for NPC allies in double battles

**Battle Frontier / Battle Tower (Post-Game):**
- Endless streak mode with scaling difficulty
- Rental Pokémon option (pick from random pool)
- Battle points currency for exclusive items/TMs
- Leaderboard (local high scores)

---

## Phase 19 Remaining: Side Activities

**Not Yet Implemented:**
- Photo Mode (pause → free camera → place Pokémon → screenshot)
- Bug-catching contest (timed encounter with scoring)
- Slot machine (cosmetic prizes)
- Secret base entrance in Crystal Cavern (stretch)
- Easter eggs and hidden NPC encounters

---

## Phase 20 Remaining: Completion Tracking

**Not Yet Implemented:**
- Statistics sub-menu scene (view detailed stats)
- Hall of Fame scene on title screen
- Wire remaining achievement triggers (all gym badges, champion, sweep-trainer, underdog-win, etc.)
- Pokémon Camp / Petting Minigame (stretch goal)

---

## Remaining Backlog

### Content
- Breeding & Egg hatching
- Follower Pokémon in overworld
- Safari Zone
- Trainer rematch system

### Multiplayer (Stretch)
- WebRTC peer-to-peer battles
- Trading system
- Leaderboards

### Technical
- Localization (i18n)
- Mod support (custom JSON content)
- Performance optimization (texture atlases, object pooling)
- Enhanced testing (visual regression, expanded E2E)
- Randomizer mode (seed-based shuffle of encounters/teams/starters)

---

## Development Principles

- **Data-driven**: Pokémon, moves, items, trainers defined as data objects, not code.
- **Scene isolation**: Scenes communicate via `EventManager` and `GameManager` only.
- **Build small, test often**: Each phase has a concrete deliverable.
- **Typed everything**: Interfaces and enums for all game data structures.
