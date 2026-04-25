# Changelog

All notable changes to the Pokemon Web project.

---

## [2026-04-25]

### Added

- **Water and lava tile animation**: Water tiles cycle through 3 frames (base + 2 variants) every 30 ticks; lava tiles cycle through 3 frames every 30 ticks. Animation frames stored in tileset slots 115-118 with frame-swap logic in OverworldScene
- **Elite Four + Champion sprites**: 5 unique type-themed character sprites — Nerida (Water/teal), Theron (Fighting/red), Lysandra (Psychic/purple), Ashborne (Fire/orange), Champion Aldric (mixed/gold-royal). Updated elite-four.ts spriteKeys and PreloadScene
- **Dialogue portrait/avatar**: NPC dialogue boxes now show a 48x48 sprite portrait of the speaking NPC in a bordered frame on the left side of the dialog box; text wraps around the portrait; supported from NPC interaction, trainer battles, and cutscenes via new `portraitKey` field in `DialogueData`
- **Dialogue slide animation**: Dialog box and all associated elements (speaker name, portrait, text) slide in from below on open and slide out downward on close using Back easing

### Changed

- **Dialogue depth ordering**: All dialogue UI elements now use a consistent depth base of 1000 (`DIALOGUE_DEPTH`), with speaker, portrait, text, and choices layered at +1/+2/+3/+4 increments to prevent z-fighting

### Fixed

- **Mobile viewport distortion**: Replaced `ENVELOP` scale mode + CSS `width/height: 100% !important` with `FIT` + `CENTER_BOTH` on all devices. The CSS override was stretching the 4:3 game canvas to fill portrait viewports, causing severe aspect ratio distortion. FIT preserves correct proportions and `computeGameWidth()` ensures landscape phones get near-100% fill
- **Settings key mismatch**: TouchControls and VirtualJoystick were reading from `localStorage('pokemon_settings')` but SettingsScene/GameManager write to `'pokemon-web-settings'` — all touch settings (joystick size, dead zone, swapAB, highVis, oneHandedMode) were silently ignored
- **Phaser backgroundColor**: Added `backgroundColor: '#0f0f1a'` to game config so the canvas background matches the HTML body, eliminating visible seams on any device
- **Dialogue box visibility**: Moved dialog box 20px higher so text is no longer hidden behind the desktop keyboard hints overlay
- **Speaker name panel clipping**: Repositioned the speaker name tag (e.g. "Prof. Willow") to anchor relative to the dialog box top edge with proper left-margin so it stays inside the viewport
- **Controls overlapping dialog**: Desktop keyboard hints (`#desktop-hints`) are now hidden while DiaglogueScene is active and restored when dialog closes
- **Choice panel position**: Updated choice menu to match the new dialog box position
- **TypeScript errors**: Resolved all 14 remaining compilation errors — added `'full-restore' | 'level-up'` to `ItemData.effect.type` union, expanded `MoveEffect.stat` to accept `'accuracy' | 'evasion'`, fixed `StatusEffectHandler.getEffectiveStat` to handle accuracy/evasion with base value of 100

### Changed

- **MoveTutorScene touch scrolling**: Added ScrollContainer for touch-drag scrolling of the move list, with keyboard navigation sync
- **AUDIT-037**: Keyboard listeners leak in move replace menu — added scene shutdown cleanup
- **AUDIT-046**: Confusion self-damage uses flat 10% attack — changed to proper level-based damage formula
- **AUDIT-047**: Level-up doesn't increase currentHp — `recalculateStats` now adds the HP stat gain to currentHp
- **AUDIT-051**: Cancel and Menu inputs return identical value — `menu` now only fires on raw ESC
- **AUDIT-052**: GridMovement has no map boundary validation — added `setMapBounds` and boundary check before collision
- **AUDIT-053**: WeatherRenderer has no resize handler — re-applies weather on viewport resize
- **AUDIT-054**: CryGenerator capped at dex 151 — raised cap to 1010
- **AUDIT-055**: Stat revert can push stats below 0 — SynthesisHandler now floors stats at 1
- **AUDIT-056**: Nickname prompt keyboard listeners not tied to scene lifecycle — added shutdown cleanup

---

## [2026-04-19]

### Fixed

- **AUDIT-008**: Weather never ticks in double battles — wired `tickTurn()` and `applyEndOfTurn()` into DoubleBattleManager
- **AUDIT-009**: Spread move damage can revive fainted Pokemon — capped HP restoration to only apply when defender is still alive
- **AUDIT-010/011**: Post-damage ability/item hooks never fire — wired AbilityHandler.onAfterDamage, HeldItemHandler.onAfterDamage/onAttackLanded/checkHPThreshold into MoveExecutor standard damage path; Static, Flame Body, Focus Sash, Life Orb, Sitrus Berry now functional
- **AUDIT-026**: No accuracy/evasion stats — added `accuracy` and `evasion` to StatStages interface, STAT_NAMES, and state initialization; DamageCalculator.doesMoveHit now applies accuracy/evasion stage multipliers
- **AUDIT-029**: Protect consumed after first check in doubles — Protect now persists for the full turn with `clearProtectAll()` at end of turn
- **AUDIT-038**: AudioManager.setScene kills non-audio tweens — changed `tweens.killAll()` to `tweens.killTweensOf(currentBGM)`
- **AUDIT-039**: Low-HP timer fires on stale scene — added `isSceneActive()` guard before creating timer
- **AUDIT-048**: AchievementManager.reset() doesn't clear onUnlockCallback — now clears it
- **AUDIT-049**: AudioManager has no reset() method — added `reset()` to clear `pendingBGM`, `lowHpActive`, `bgmPaused`
- **AUDIT-050**: MenuController pointer listeners leak — `destroy()` now cleans up pointerover/pointerdown listeners
- **AUDIT-057**: BattleScene missing shutdown — added `shutdown()` with `tweens.killAll()` and `time.removeAllEvents()`
- **Mobile viewport**: Switched Phaser scale mode from `FIT` to `ENVELOP` on mobile so the game canvas fills the full screen without black bars or letterboxing
- **Body background**: Changed `background: #000` to `#0f0f1a` to match the game's dark blue theme, eliminating visible seams on any edge
- **Mobile canvas sizing**: Added `width: 100%; height: 100%` CSS for canvas on coarse-pointer (touch) devices

### Removed

- **Legacy scene copies**: Deleted stale `frontend/src/scenes/TitleScene.ts` and `frontend/src/scenes/OverworldScene.ts` that duplicated the active copies in `title/` and `overworld/` subdirectories, eliminating 16 pre-existing TypeScript compilation errors

---

## [2026-04-18]

### Fixed

- **AUDIT-001**: Save/load crash — `loadAndApply()` now uses `deserialize()` which matches the flat save format from `serialize()`, fixing TypeError on Continue
- **AUDIT-002**: Division by zero in DamageCalculator — defense stat floored at 1
- **AUDIT-003**: Division by zero in CatchCalculator — maxHp floored at 1
- **AUDIT-004/005**: Duplicate scene files — stale top-level `OverworldScene.ts` and `TitleScene.ts` converted to re-exports
- **AUDIT-006**: Enemy replacement sends out fainted Pokemon — now uses `findIndex(p => p.currentHp > 0)` like player side
- **AUDIT-007**: Weather never ticks in single battles — added `tickTurn()` and `applyEndOfTurn()` calls to BattleManager
- **AUDIT-012**: Rare Candy does nothing — added `level-up` effect type with stat recalculation
- **AUDIT-013**: Full Restore doesn't cure status — added `full-restore` effect type that heals HP and clears status
- **AUDIT-014/015**: Softlock on blocked warp and no-starter dialogue — added DialogueScene shutdown listeners to resume OverworldScene
- **AUDIT-016**: Surf never activates — `surfing` is now set to `true` after showing popup
- **AUDIT-017**: Poison Heal applies on top of poison damage — now undoes poison damage before healing
- **AUDIT-018**: localStorage save crash on quota exceeded — wrapped in try/catch
- **AUDIT-019**: QuestManager automation dies after EventManager clear — added `resetAutomation()` method
- **AUDIT-020–025**: Smokescreen, Double Team, Minimize, Focus Energy, Flash, Kinesis all targeted wrong stats — remapped to speed (closest available proxy for accuracy/evasion)
- **AUDIT-027**: Always-hit moves (Swift etc.) always miss — `doesMoveHit` now returns true for null accuracy
- **AUDIT-028**: PartnerAI uses Tackle instead of Struggle when out of PP — fixed to 'struggle'
- **AUDIT-030**: Sleep with 1 turn wakes and acts immediately — minimum sleep turns changed from 1-3 to 2-4
- **AUDIT-031**: OHKO moves ignore type immunity — Fissure now checks type effectiveness before applying
- **AUDIT-032**: Moves with 0 PP still execute — added PP guard before execution
- **AUDIT-036**: fleeAttempts not reset between battles — reset to 0 in `BattleUIScene.create()`
- **AUDIT-040**: EventManager.clear() leaks tagged listeners — now clears `taggedListeners` map too
- **AUDIT-041**: GameManager.reset() doesn't reset berryPlots/gameClockMinutes — added to reset
- **AUDIT-042**: stepCount lost on save/load — added to `serialize()`
- **AUDIT-044**: Encounters only check tall grass — now also checks dark grass
- **AUDIT-045**: Badge achievement names don't match actual badges and are never unlocked — renamed to match gym badge IDs and added unlock trigger in BattleRewardHandler

### Changed

- **Reduced motion cascade**: Wired `isReducedMotion()` into TransitionManager (instant scene transitions), EmoteBubble (skip bounce tweens), and WeatherRenderer (skip particle emitters) so the Settings toggle actually takes effect
- **Touch controls accessibility**: Wired `swapAB` (swap A/B button positions and actions), `highVisControls` (fully opaque buttons with thick outlines), `oneHandedMode` (left/right button placement), and `deadZone` slider (custom joystick sensitivity) settings into TouchControls and VirtualJoystick

### Added

- **Gym trainer teams**: 10 trainer data entries for gym support trainers — engineers (Voltara), mediums (Wraithmoor), dragon tamers (Scalecrest), kindlers (Cinderfall), cooltrainers (Viridian) with type-appropriate teams scaled to gym progression
- **Giovanni gym leader data**: Ground-type team (Rhyhorn, Dugtrio, Nidoqueen, Rhydon, Nidoking) at levels 50-55 with Earth Badge reward and `defeatedGiovanni` victory flag
- **Giovanni trainer battle**: Moved Giovanni from NPC dialogue to trainer array with line-of-sight trigger for proper gym battle flow
- **NPC idle behaviors**: Added `look-around` behavior to house residents (all cities via buildHouse), museum NPCs, and gym guides (Pewter, Viridian, Wraithmoor, Scalecrest, Cinderfall, Voltara) for ambient animation

### Changed

- **Mobile font scaling**: Migrated all remaining hard-coded `fontSize: 'NNpx'` strings to `mobileFontSize(NN)` across 22 files (scenes, UI widgets, battle subsystems, EmoteBubble, PreloadScene) for consistent mobile-responsive text
- **Wraithmoor Gym**: Replaced template copy with Ghost-themed 12x14 layout featuring mist corridors, grave markers, wall pillars, gym guide NPC, and 2 medium trainers
- **Scalecrest Gym**: Replaced template copy with Dragon-themed 12x14 layout featuring fortress walls, dragon statues, scale floor, gym guide NPC, and 2 ace trainers
- **Cinderfall Gym**: Replaced template copy with Fire-themed 12x14 layout featuring volcanic walls, ember vents, lava rock, hot springs, gym guide NPC, and 2 kindler trainers
- **Voltara Gym**: Replaced empty Electric gym with 12x14 layout featuring metal walls, wire floor, conduit paths, electric panels, gym guide NPC, and 2 engineer trainers
- **Clock persistence**: GameClock elapsed minutes now persist across save/load sessions via `gameClockMinutes` field in SaveData; OverworldScene restores clock from save and syncs back on each update
- **Mobile font scaling**: Replaced hard-coded font sizes with `mobileFontSize()` in PCScene (4 instances), SummaryScene (2 EXP rows), MoveTutorScene (move-replace + message), and DialogueScene (speaker label + advance indicator)
- **Hint text migration**: Replaced inline `TouchControls.isTouchDevice()` ternaries with `hintText()` utility or `isMobile()` checks in TitleScene, IntroScene, OverworldScene, TrainerCardScene, HallOfFameScene, NicknameScene, and VoltorbFlipScene for consistent mobile-aware hint strings
- **PCScene tap interactivity**: Added `pointerdown` handlers to box grid cells and party slots so mobile users can tap to select/pick up Pokémon
- **MoveTutorScene tap dismiss**: Added tap-to-dismiss for message panel overlay
- **OverworldScene HUD**: Scaled HUD hint font with `mobileFontSize(14)` and wired `hintText('interact')` for input-aware interaction label
- **Battle platforms**: Replaced single-color ellipses with layered pixel-art platforms (shadow, base, mid-highlight, top-highlight) beneath both Pokémon
- **Move selection grid**: Upgraded text+dot move menu to type-colored rounded-rect button panels with bold move name, right-aligned PP, and category indicator
- **Pewter Museum expansion**: Expanded from 14x10 to 16x12 with themed exhibit areas, 5 NPCs (guide, fossil scientist, Aether researcher, fossil revival NPC, visitor), flag-gated lore dialogue, and display case layout
- **Battle info panels**: Replaced plain rectangle info boxes with NinePatchPanel frames (rounded corners, shadow, highlight) around both enemy and player HP/name displays

### Added

- **Viridian Gym**: New 14x12 Ground-type gym interior with Giovanni as leader, guide NPC, two CoolTrainer opponents, arena marks and boulders; story-gated warp (`badge_7` flag) replaces NPC blocker
- **Overworld clock widget**: Top-left corner display showing game time (HH:MM) with day/night period emoji indicator (sunrise/sun/sunset/moon), updates every frame

### Fixed

- **Pewter City unwired houses**: Added warps for west house (tileX:5) and east house (tileX:23) and extra PokéMart double-door warp (tileX:20); added `from-house-1` and `from-house-2` spawn points
- **Viridian City unwired houses**: Added warps for west house (tileX:5) and east house (tileX:26); added `from-house-1` and `from-house-2` spawn points
- **Verdantia Village unwired house**: Added warp for NE house (tileX:16) and `from-house-1` spawn point
- **Ironvale City spawn mismatch**: Renamed `from-house` to `from-house-1` to match generic house exit warp
- **Warp validation cleanup (17 errors fixed)**: Missing `from-abyssal-spire` spawn in route-8; 8 warps on solid tiles in Abyssal Spire F1-F4; 3 misaligned warps in Coral Harbor (PokéMart, Gym, House doors); Verdantia lab entrance on DENSE_TREE; Victory Road north exit on CAVE_WALL

### Added

- **Pewter City house 2** (`pewterHouse2`): East side resident with museum lore dialogue
- **Viridian City house 2** (`viridianHouse2`): East side resident with mysterious pond Pokémon dialogue
- **Type badge sprite sheet** (`assets/ui/type-badges.png`): 18 pixel-art type badges (32x14 each) replacing rectangle-based `drawTypeBadge` across SummaryScene, PartyScene, PokedexScene
- **Status badge sprite sheet** (`assets/ui/status-badges.png`): 6 pixel-art status condition badges (BRN, PAR, PSN, SLP, FRZ, TOX) with `drawStatusBadge` helper in theme.ts
- **Badge sprite loading**: PreloadScene loads both spritesheets; `drawTypeBadge` upgraded to prefer sprites with rectangle fallback; PartyScene status rendering uses `drawStatusBadge`

### Changed

- **BattleScene status indicators**: Replaced text-based status labels with sprite-based `status-badges` images using `STATUS_BADGE_FRAMES` lookup; status now renders as pixel-art badges instead of colored text
- **Area name banner**: Replaced interior-only text popup with styled slide-in/slide-out banner (dark background, gold text, gold border) that shows on ALL maps with a `displayName`
- **Interaction prompt**: Added floating "Z" (desktop) / "Tap" (touch) prompt that appears above NPCs and trainers when the player is adjacent and facing them

- **Map viewport centering**: Maps smaller than the game viewport (e.g. Pallet Town at 800px on a widescreen display) are now centered on both axes instead of showing void space on the right edge. Camera bounds expand to viewport dimensions and a dark background (`0x0f0f1a`) fills any area outside map content

### Changed

- **UI Improvement Plan updated**: Marked Sprints 1-5 as complete, Sprint 6 Step 1 as done, added camera centering section, updated all success criteria checkboxes to reflect current state

## [2026-04-17] — UI Improvement Plan: Sprints 4-6

### Changed

- **Victory Road expansion**: Expanded from 20x25 to 25x35 with summit chamber, crystal cavern (AETHER_CRYSTAL clusters), winding cave passages, boulder puzzle section, and large entry chamber. Repositioned all trainers, NPCs, and vent interactables across the larger layout
- **Ember Mines synthesis lab**: Added Synthesis Collective lab section in lower half (rows 16-24) using SYNTHESIS_FLOOR, SYNTHESIS_WALL, SYNTHESIS_DOOR, CONTAINMENT_POD, AETHER_CONDUIT, and TERMINAL tiles. Mine area preserved in upper half with transition zone
- **PokéCenter deduplication**: Created 3 layout variants by city size — Small (9x8) for Coral/Cinderfall, Medium (11x8) for Verdantia/Voltara/Wraithmoor with waiting benches and PC, Large (13x8) for Ironvale/Scalecrest with full amenities and flavor NPCs
- **PokéMart deduplication**: Created 3 layout variants — Small (9x8) for Coral/Cinderfall/Wraithmoor, Medium (10x8) for Verdantia/Voltara with expanded shelving, Large (12x8) for Ironvale/Scalecrest with multiple aisles and shopper NPCs
- **House biome variants**: Replaced single generic house layout with 4 biome-specific variants — Standard (Pallet/Viridian/Pewter/Verdantia), Coastal (Coral Harbor), Industrial (Ironvale/Voltara/Cinderfall), Haunted (Wraithmoor/Scalecrest)
- **TextBox visual upgrade**: Replaced plain rectangle background with NinePatchPanel for rounded corners, drop shadow, and styled border in all dialogue boxes

## [2026-04-17]

### Changed
- **Victory Road expanded**: Grew map from 20x25 to 25x35 with 5 distinct sections: summit chamber, crystal cavern with AETHER_CRYSTAL clusters, winding cave passage, boulder puzzle section, and entry chamber. Repositioned all NPCs, trainers, warps, and spawn points for the larger layout. Added aether-sanctum side passage at row 16.
- **Ember Mines synthesis lab**: Replaced lower mine section (rows 16-24) with a Synthesis Collective hidden lab using SYNTHESIS_FLOOR, SYNTHESIS_WALL, SYNTHESIS_DOOR, CONTAINMENT_POD, AETHER_CONDUIT, and TERMINAL tiles. Repositioned Dr. Vex, grunts, terminal, and cage NPCs into the lab section. Transition zone at rows 14-15 bridges cave and lab aesthetics.
- **PokéCenter layout variants**: Deduplicated 5 identical 9×8 PokéCenter interiors into 3 size tiers. Coral/Cinderfall keep small (9×8). Verdantia/Voltara/Wraithmoor upgraded to medium (11×8) with waiting benches, PC NPC, and local flavor NPC. Ironvale/Scalecrest upgraded to large (13×8) with grand layout, PC NPC, and local flavor NPC.
- **PokéMart layout variants**: Deduplicated 6 identical 9×8 PokéMart interiors into 3 size tiers. Coral/Cinderfall/Wraithmoor keep small (9×8). Verdantia/Voltara upgraded to medium (10×8) with wider shelving and shopper NPC. Ironvale/Scalecrest upgraded to large (12×8) with expanded shelf variety and shopper NPC.
- **House biome variants**: Added 4 house interior layouts (Standard, Coastal, Industrial, Haunted) with per-city assignments. Coral Harbor uses Coastal; Ironvale, Voltara, Cinderfall use Industrial; Wraithmoor, Scalecrest use Haunted; others keep Standard.
- **TextBox NinePatchPanel upgrade**: Replaced plain rectangle background with NinePatchPanel for rounded-corner, shadow-styled dialogue boxes. Added transparent hitArea for touch-to-skip.
- **Route 1 biome polish**: Added DENSE_TREE borders, extra flowers near path for color on the starter route
- **Route 2 biome polish**: Added PINE_TREE mixed borders, DARK_GRASS patches, ROCK/BUSH obstacles for forest-to-cave transition
- **Route 3 biome polish**: Added LIGHT_GRASS and SAND near coast, PALM_TREE clusters, ROCK/BUSH inland for grassland-to-coastal feel
- **Route 4 biome polish**: Added CLIFF_FACE borders, LAVA_ROCK patches, ASH_GROUND, DARK_GRASS for volcanic approach to Ironvale
- **Route 5 biome polish**: Added VINE overlays, MOSS_STONE/GIANT_ROOT obstacles, BERRY_TREE interactables, DENSE_TREE canopy for thick jungle trail
- **Route 8 biome polish**: Added CLIFF_FACE walls, ROCK/BOULDER obstacles, DARK_GRASS, CAVE_FLOOR patches for rugged mountain approach
- **Weather-per-route**: Added `weather` property to 8 outdoor maps — Coral Harbor (rain), Cinderfall Town (sandstorm), Wraithmoor Town (fog), Route 4 (sandstorm), Route 5 (rain), Route 8 (fog), Shattered Isles Shore (rain), Victory Road (fog)
- **Ironvale City map redesign**: Replaced generic grid with industrial terraced mountain town. Central forge area using METAL_FLOOR, PIPE, GEAR tiles. CLIFF_FACE terracing on borders. Mine entrance hint with CAVE_FLOOR/CAVE_WALL in NE corner. Buildings on terraces with metal walkways between levels
- **Voltara City map redesign**: Replaced generic grid with neon-lit tech hub. METAL_WALL perimeter, CONDUIT channels running through streets, WIRE_FLOOR promenades, ELECTRIC_PANEL decorations, central METAL_FLOOR tech plaza with conduit hub. Buildings radially arranged around the plaza
- **Cinderfall Town map redesign**: Replaced generic grid with volcanic caldera town. VOLCANIC_WALL border, ASH_GROUND primary walkable surface, EMBER_VENT/MAGMA_CRACK decorations, LAVA_ROCK terrain accents, HOT_SPRING pool area on east side
- **Scalecrest Citadel map redesign**: Replaced generic grid with dragon fortress compound. FORTRESS_WALL perimeter, DRAGON_SCALE_FLOOR courtyard, DRAGON_STATUE flanking decorations, CLIFF_FACE east edge, gym moved to SE near cliffs
- **Coral Harbor map redesign**: Replaced generic grid with organic coastal port town. Curved eastern shoreline, DOCK_PLANK pier and boardwalk, TIDE_POOL along beach, PALM_TREE clusters, CORAL_BLOCK gym building
- **Wraithmoor Town map redesign**: Replaced generic grid with haunted ruins town. Graveyard with GRAVE_MARKERs, ruined cathedral using RUIN_WALL/RUIN_PILLAR/CRACKED_FLOOR, MIST overlay, AUTUMN_TREE/DARK_GRASS biome
- **Route 6 biome polish**: Added tech-to-ruins gradient. North: CONDUIT/WIRE_FLOOR/METAL_FLOOR remnants. Middle: DARK_GRASS, AUTUMN_TREE, CRACKED_FLOOR transition. South: RUIN_PILLAR, MIST, full ruins atmosphere
- **Route 7 biome polish**: Mountain pass redesign. CLIFF_FACE walls replacing trees, ROCK/BOULDER obstacles, CAVE_FLOOR overhangs, DARK_GRASS in sheltered areas

### Fixed
- **Map dimension mismatches**: Corrected `width: 25` to `width: 24` in 6 city maps (ironvale-city, cinderfall-town, scalecrest-citadel, verdantia-village, voltara-city, wraithmoor-town) to match actual grid row lengths
- **Verdantia Village ragged rows**: Padded 22 rows from 23 to 24 characters with grass tiles to match declared width
- **Abyssal Spire F4 ragged rows**: Trimmed 13 rows from 16 to 15 characters to match declared width
- **Verdantia Lab ragged rows**: Trimmed rows (16-17 chars) to declared width of 15
- **Shattered Isles Temple ragged rows**: Trimmed 5 rows (19-20 chars) to declared width of 18

### Added
- **UI Improvement Plan** (`docs/UI_IMPROVEMENT_PLAN.md`): Comprehensive visual quality roadmap covering tileset pixel art upgrades, city map redesigns, warp validation pipeline, map preview rendering, and UI component overhaul
- **Tileset pixel art upgrade** (`temp/scripts/tileset/upgrade_tiles.py`): Replaced all 42 solid-color placeholder tiles (IDs 68-109) with hand-crafted GBA-style pixel art. Covers 12 biomes: coastal, volcanic, mine, industrial, forest, electric, ghost/ruin, dragon, fire, synthesis, post-game, and league. Each tile has 6-13 unique colors with proper shading, texture, and depth borders
- **Warp validation script** (`temp/scripts/map-audit/validate-warps.py`): Automated validation of all map warps across 69 maps checking target existence, bidirectional connections, walkable tiles, spawn validity, NPC placement, and dimension consistency. Found 56 errors and 63 warnings
- **Map preview annotation layers** (`temp/scripts/map-preview/render_all_maps.py`): Enhanced the map renderer with warp markers (cyan diamonds), spawn point markers (green circles with direction arrows), NPC markers (blue dots), trainer markers (red dots), placeholder tile highlighting (yellow overlay for tiles 68-109), and a summary stats bar on each annotated preview
- **Two output modes per map**: `{name}_clean.png` (tiles only) and `{name}_preview.png` (annotated with all markers and stats)
- **Tileset reference sheet**: `tileset_reference.png` showing all 110 tiles with index, name, and green/red quality borders
- **Auto-discovery of all maps**: Script now walks the entire maps directory (65 maps) instead of a hardcoded list of 8
- **Extended TILE_NAMES**: Full coverage for tiles 0-109 (TIDE_POOL through CHAMPION_THRONE)

### Changed
- **Service worker v3** (`frontend/public/sw.js`): Expanded precache to include player sprite atlas, overworld tileset, Pallet Town map, and app icon so the starter area works offline
- **Apple touch icon** (`frontend/index.html`): Added `apple-touch-icon` link for iOS home-screen installs
- **Offline/online toasts** (`frontend/src/main.ts`): Network status toasts notify the player when connectivity changes

### Added
- **`layout-on.ts` utility** (`frontend/src/utils/layout-on.ts`): Resize-safe layout helper that runs a callback on create and re-runs on every resize/orientation change, with automatic shutdown cleanup
- **`hint-text.ts` utility** (`frontend/src/utils/hint-text.ts`): Input-mode-aware hint text that returns "Tap A" on mobile vs "Press Z" on desktop
- **UI Improvement Plan** (`docs/UI_IMPROVEMENT_PLAN.md`): Comprehensive visual quality roadmap covering tileset pixel art upgrades (42 solid-color tiles), city map redesigns, warp validation pipeline, map preview rendering, and UI component overhaul. Companion to the Level Up Plan.

### Changed
- **Mobile detection improved** (`frontend/src/ui/theme.ts`): `isMobile()` now uses multi-signal heuristic (touch + coarse pointer + screen size) instead of `maxTouchPoints` alone; added `isTablet()` helper
- **Scene mobile scaling** (Phase 1): `StarterSelectScene`, `MoveTutorScene`, `ShopScene`, and `PCScene` now use `mobileFontSize()` for all text and enforce `MIN_TOUCH_TARGET` (48px) for interactive elements on mobile
- **Dialogue choice touch targets** (`DialogueScene`): Choice rows expand to 48px height on mobile with padding for comfortable tapping; font scaled via `mobileFontSize()`
- **Mobile menu button enlarged** (`index.html`): Hamburger button increased from 36×36px to 48×48px to meet touch target minimum
- **Orientation prompt persistence** (`index.html`, `main.ts`): "Continue Anyway" dismissal persists via `sessionStorage` so the rotate prompt does not reappear on every resize within a session
- **`ScrollContainer` widget** (`frontend/src/ui/widgets/ScrollContainer.ts`): Momentum scroll container with drag-to-scroll, inertia decay, overscroll rubber-banding, and configurable vertical/horizontal direction for mobile list scenes
- **Performance tiering expansion** (`frontend/src/utils/perf-profile.ts`): Added 6 quality-gated feature flags (`battleAnimFrameSkip`, `shouldShowWeather`, `shouldShowShadows`, `shouldShowTextEffects`, `shouldCrossFadeTiles`, `maxActiveTweens`) and an FPS auto-downgrade monitor that drops quality after sustained low frame rates
- **Swipe tab navigation** (`SummaryScene`): Horizontal swipe gesture switches between INFO/STATS/MOVES tabs on mobile
- **Long-press context menu** (`PartyScene`): 500ms long-press on a party slot opens the context menu directly, bypassing select-then-confirm flow
- **Double-tap run toggle** (`TouchControls`, `OverworldScene`): Double-tap the joystick to toggle running on mobile (requires running shoes)
- **Quick-save floating button** (`OverworldScene`): Semi-transparent save icon appears on mobile for one-tap quick saves
- **Accessibility settings** (`SettingsScene`): Added One-Handed Mode, Swap A/B, Joystick Dead Zone slider, and High Visibility Controls toggle
- **`layoutOn` import** added to `OverworldScene`, `DialogueScene`, and `MenuScene` for future resize-safe layout migration

## [2026-04-16]

### Fixed — Remaining Bug Sweep (28 bugs)
- **Trainer spawn ordering (4.7)**: Trainers now spawn before NPCs so NPC behavior collision checks include trainer positions
- **`as any` casts reduced from 19 to 4**: Expanded `SaveData` interface type, added `BerryGarden._clockTime` static property, used Phaser `setData()`/`getData()` in HallOfFameScene, removed unnecessary cast in BattleUIScene synthesis check
- **Stale IntroScene.ts duplicate**: Removed lingering copy from scenes root
- **BUG-017: EventManager listener cleanup** — Added `clearByTag()` and `onTagged()` methods for scene-scoped listener registration and bulk cleanup
- **BUG-027: Dream Eater works on awake targets** — Added `requireSleep` field; MoveExecutor now fails Dream Eater if target is not asleep
- **BUG-031: Thrash/Petal Dance no multi-turn lock** — Added `multi-turn-lock` effect type to both moves (3-turn lock)
- **BUG-033: Stale flinch volatile persists** — Added `clearFlinchAll()` called at turn start in `doExecuteTurn()`
- **BUG-036: Rival starter hardcoded** — Rival now dynamically picks type-advantage starter based on player's `starterChoice` flag via Proxy-wrapped data
- **BUG-039: Dual evolution data sources** — Documented as accepted architectural pattern; existing tests validate consistency
- **BUG-048: Spread damage retroactive reversal** — Added clarifying comment; HP restoration approach is net-correct but documented as known limitation
- **BUG-049: Catch formula 3 shakes** — Changed to 4 shake checks per Gen III+ formula
- **BUG-050: Foul Play wrong stat** — DamageCalculator now uses defender's Attack for Foul Play
- **BUG-051: Jump Kick/HJK no crash damage** — MoveExecutor now applies 50% max HP crash damage on miss
- **BUG-052: Unimplemented status moves** — MoveExecutor now shows "But nothing happened!" for status moves with no effect
- **BUG-058: GameClock not persisted** — Added `gameClockMinutes` to GameManager with serialize/deserialize support
- **BUG-090: MenuScene keyboard cleanup** — Already had `shutdown()` method from prior fix; verified working
- **BUG-091: Drake non-Dragon team** — Replaced Aerodactyl with second Dragonair; Gyarados kept as Dragon Rage user
- **NEW-001: TransitionManager dead scene callback** — Added `scene.isActive()` guard before fade-in
- **NEW-002: CutsceneEngine hardcoded resume** — Changed to `this.scene.scene.key` for dynamic scene resume
- **NEW-003: BerryGarden persistence broken** — Added `berryPlots` field to GameManager with proper getter/setter/serialization
- **NEW-004: GridMovement hop y conflict** — Removed `y` from tween targets; handled entirely in `onUpdate`
- **NEW-005: isCycling not reset** — Added `this.isCycling = false` to OverworldScene `init()`
- **NEW-007: LightingSystem resize** — Added `scale.on('resize')` handler to recreate RenderTexture
- **NEW-008: Double fishing resume** — Removed manual resume; second DialogueScene uses `callingScene` param
- **NEW-009: Protect rate resets on failure** — Rate now continues halving even on failure
- **NEW-010: TitleScene stale HoF** — Now also checks `SaveManager.hasSave()` before showing option
- **NEW-011: Quest tracker duplicates** — Added `isSleeping` check alongside `isActive`
- **NEW-012: Trainer walk-toward destruction** — Added `scene.isActive()` and `trainer.active` guards
- **NEW-013: PCScene stale highlight** — Placement now uses last-focused panel instead of stale data property

### Added
- `clearByTag()`, `onTagged()`, `offAll()` methods on EventManager for scene-scoped cleanup
- `clearFlinchAll()` method on StatusEffectHandler
- `requireSleep` and `turns` fields on MoveEffect interface
- `multi-turn-lock` effect type for Thrash/Petal Dance
- `berryPlots` and `gameClockMinutes` fields on GameManager with serialization
- Dynamic rival starter selection via Proxy pattern

## [2026-04-16]

### Added
- **Scene shutdown() methods (3.3)**: OverworldScene, BattleUIScene, MenuScene, and DialogueScene now clean up keyboard listeners and sub-systems on shutdown, preventing listener accumulation
- **Vite data chunk splitting (1.2)**: Pokemon, moves, and type-chart data split into a separate `data` bundle chunk
- **Typed EventManager (4.6)**: EventManager now uses a typed `EventMap` interface for compile-time verification of event names and payload types
- **Vite maps chunk (1.3)**: All map definitions split into a separate `maps` bundle chunk to reduce initial load
- **CSS minification (1.2)**: Enabled `cssMinify` in Vite build config

### Changed
- **HealthBar Rectangle optimization (2.4)**: Replaced `Graphics.clear()` + `fillRect()` redraw with two Rectangle game objects that only update `width` and `fillColor`
- **Accessibility import fix (1.5)**: Replaced ineffective dynamic `import()` in theme.ts with direct static import since the module is already in the main bundle
- **MoveAnimationPlayer texture-based particles (2.2)**: Replaced per-animation `scene.add.circle()` calls with a pre-generated circle texture (`__move-particle`) using `scene.add.image()` + `setTint()`, reducing GC pressure from move animations

### Fixed
- **AudioManager stale scene guard (3.4)**: All audio methods now check `isSceneActive()` before accessing the scene's sound/tween/timer plugins, preventing crashes on destroyed scenes
- **BattleManager turn-order duplication (4.4)**: `selectMove()` now calls shared `calculateTurnOrder()` from BattleTurnRunner instead of inline priority/speed logic
- **GameManager `as any` casts (5.1)**: Expanded `loadFromSave()` and `deserialize()` parameter types to eliminate all `as any` casts (gender, gameStats, hallOfFame, visitedMaps, trainerId)
- **CutsceneEngine async error handling (5.2)**: `executeAction()` now wraps all action dispatches in try/catch with console.warn for graceful degradation
- **Stale OverworldScene.ts duplicate**: Removed lingering copy that reappeared after stash operation
- **BUG-059: Professor identity crisis** — Unified all Oak references to Prof. Willow across pallet-oak-lab, OverworldScene, item-data, tm-data, viridian-pokemart, pallet-player-house, and pallet-town NPC dialogue
- **BUG-060: Pallet Town → Littoral Town** — Updated all player-facing text from "Pallet Town" to "Littoral Town" in NPC dialogue, signs, dock pier, generic-house, route-1 sign, and cutscene comments
- **BUG-061: Missing quest reward items** — Added rare-candy, master-ball, mystic-water, spell-tag, dragon-scale, and charcoal to item-data.ts
- **BUG-062: End-of-turn faint skips party check** — All faint paths (poison/burn, recoil, confusion self-hit) now check for alive party members before triggering blackout; added `promptPartySwitch` for forced switch
- **BUG-063: Voluntary Pokemon switch does nothing** — PartyScene now launched in selectMode from battle; switch queues enemy-only attack turn
- **BUG-064: BAG non-Pokeball items don't consume a turn** — InventoryScene emits `use-battle-item` event; BattleUIScene executes enemy turn after item use
- **BUG-065: Failed flee allows player to act again** — Failed flee now executes enemy-only attack turn
- **BUG-066: AchievementScene and TrainerCardScene not registered** — Added both scenes to game-config.ts scene array
- **BUG-067: ConfirmBox zero touch support** — Added pointer/touch handlers on YES/NO buttons; added ESC cancel support
- **BUG-068: MenuList no touch support** — Menu items now interactive with pointer-to-select behavior
- **BUG-069: willow-lab-intro replays infinitely** — Added `setFlag` action for `willow_lab_intro_seen`
- **BUG-070: Kael says "Gramps"** — Changed to "the Professor" to match Aurum storyline
- **BUG-071: IntroScene duplicate click handler** — Removed duplicate girlPreviewBg handler that incorrectly set appearance to boy
- **BUG-072: IntroScene generic professor sprite** — Changed from `npc-professor` to `npc-oak` (the dedicated professor sprite)
- **BUG-073/074: FLY menu scene lifecycle** — FLY now sleeps MenuScene instead of stopping it; cancel returns to menu instead of dropping to overworld
- **BUG-075: DialogueScene hard-coded resume** — Added `callingScene` parameter; defaults to OverworldScene but can be overridden
- **BUG-076: Pokedex hardcoded to 151** — Now dynamically detects max Pokemon ID from data
- **BUG-077: Dragon Dance missing Speed boost** — Added `statChanges` array support; Dragon Dance now raises ATK and SPD
- **BUG-078: Close Combat missing Sp.Def drop** — Close Combat now lowers both DEF and Sp.DEF
- **BUG-079: StarterSelectScene no back handler** — Added ESC/back handler to return to lab
- **BUG-080: Starter cards overflow on mobile** — Cards now use relative spacing based on screen width
- **BUG-081: TextBox no touch-to-skip** — Added pointerdown handler on text box background to skip typewriter
- **BUG-082: ConfirmBox prompt text not destroyed** — Stored prompt text reference and destroy it in cleanup
- **BUG-083: ConfirmBox keyboard conflicts** — Added `active` guard flag to prevent pass-through when dismissed
- **BUG-084: TrainerCard trainerId lost on reload** — Added `trainerId` as proper GameManager field, serialized in saves
- **BUG-085: StatisticsScene/HallOfFameScene close on any click** — Replaced global pointerdown with dedicated close button
- **BUG-086: HallOfFameScene destroys children during iteration** — Copy children array before iterating
- **BUG-087: Dead fatherTrail_active flag** — Removed unused flag from post-champion-victory cutscene
- **BUG-088: HealthBar division-by-zero** — Added guard for maxValue <= 0
- **BUG-089: IntroScene finishIntro no cleanup** — Added `tweens.killAll()` and input listener removal before transition
- **BUG-092: Tri Attack only paralysis** — Added `randomStatus` support; Tri Attack now randomly picks burn/freeze/paralysis
- **BUG-093: Encounter fallback creates Pidgey** — Added console.warn when BattleScene receives no enemy Pokemon
- **BUG-094: NPC stale collision after map transition** — Added `preDestroy` hook to disable physics body
- **BUG-095: PCScene box cursor persists across box switches** — Reset `boxCursor` to 0 when switching boxes
- **BUG-096: 151 Pokémon count in lab dialogue** — Changed to "so many Pokémon to discover!"
- **BUG-097: Oak's parcel references wrong professor** — Updated to "Prof. Willow's Parcel" with corrected description
- **Pre-existing: IntroScene TouchControls import** — Fixed incorrect import path from `@ui/TouchControls` to `@ui/controls/TouchControls`

### Added
- `statChanges` array field on `MoveEffect` interface for multi-stat moves (Dragon Dance, Close Combat)
- `randomStatus` array field on `MoveEffect` for random status selection (Tri Attack)
- `trainerId` field on GameManager with serialization/deserialization support
- `callingScene` parameter on DialogueScene for flexible scene resumption
- `executeEnemyOnlyTurn` and `promptPartySwitch` methods on BattleUIScene
- `hasAlivePartyMember` helper on BattleUIScene for party-check on faint

## [2026-04-16]
### Added
- **Vite code splitting**: Phaser and battle subsystem split into separate chunks for faster initial load and better cache invalidation
- **Dynamic game resize**: Game width recomputes on viewport/orientation changes so mobile devices fill the full screen width after rotation instead of showing black side bars
- **Desktop chrome**: Styled background gradient, canvas frame with rounded corners and glow border, fullscreen toggle button (F11), mute toggle button (M key), and keyboard shortcut hints overlay
- **Desktop mute button**: Persistent mute state via localStorage, wired to AudioManager

### Changed
- **Overworld cosmetic throttling (2.6)**: Tall grass alpha randomization reduced from every 15 frames to every 60 frames
- **weightedRandom optimization (2.5)**: Accepts optional precomputed total parameter to avoid redundant `reduce()` calls
- **Duplicated SPREAD_MOVES (4.5)**: `PartnerAI` now imports `SPREAD_MOVES` from `DoubleBattleManager` instead of maintaining a duplicate set

### Removed
- **Duplicate scene files (6.1)**: Deleted 3 stale scene copies (`BattleScene.ts`, `IntroScene.ts`, `OverworldScene.ts`) from `scenes/` root that broke TypeScript compilation
- **Dead updateGrassCrop method (6.2)**: Removed unused method from OverworldScene
- **AudioManager dual low-HP warning (3.5)**: Removed `setInterval`-based oscillator implementation; unified on Phaser timer-based `startLowHpWarning()`

### Fixed
- **LightingSystem per-frame allocation (2.1)**: Reuse a single persistent `Phaser.GameObjects.Image` in `drawLight()` instead of creating and destroying one per light per frame (eliminated ~360 alloc/GC cycles per second in caves)
- **TouchControls DOM listener leak (3.1)**: All ~20 canvas/DOM event listeners now tracked and removed in `destroy()`, preventing accumulation on scene restart
- **VirtualJoystick DOM listener leak (3.2)**: All 7 canvas event listeners now tracked and removed in `destroy()`
- **O(n) NPC collision check (2.3)**: Replaced linear NPC scan with `Set<string>` lookup for O(1) tile occupancy checks
- **ExperienceCalculator level cap (5.6)**: Added `MAX_LEVEL = 100` guard to `awardExp()` while-loop to prevent infinite loop on malformed data
- **BattleManager ignores AIController (5.5)**: `getEnemyMove()` now routes through `AIController.selectMove()` instead of pure random selection; fixed 'tackle' fallback to 'struggle'
- **EncounterSystem nature modifiers (5.7)**: `createWildPokemon()` now applies nature multipliers during stat calculation, producing correct stat values
- **Swallowed error in theme.ts (5.3)**: Accessibility module import failure now logs `console.warn` instead of silently discarding
- **BUG-001**: Player faint no longer auto-loses battle; prompts party switch when alive Pokemon remain
- **BUG-002**: PP now deducted before accuracy check so missed moves still cost PP
- **BUG-003**: Removed phantom Bulbasaur injection; battle returns to overworld if party is empty
- **BUG-004**: Added `rival_intro_seen` flag to rival-intro cutscene to prevent infinite replay
- **BUG-005**: SaveManager now uses GameManager.serialize() to persist all state including achievements
- **BUG-006**: CutsceneEngine.execSetFlag() now emits 'flag-set' event so QuestManager automation receives cutscene flags
- **BUG-007**: QuestManager.initAutomation() now guards against duplicate listener registration across scene transitions
- **BUG-008**: Tag battle handler now uses correct `targetScene`/`targetData` keys for TransitionScene
- **BUG-010**: Run action now uses speed-based flee formula with failure chance; blocked in trainer battles
- **BUG-011**: Speed Boost now actually increments the speed stat stage via StatusEffectHandler
- **BUG-012**: Poison Heal now skips poison damage and heals 1/8 HP instead of applying damage then healing
- **BUG-013**: Focus Sash hpBeforeHit now correctly computed before damage clamping
- **BUG-014**: CHECK_FAINT now searches entire party for alive Pokemon, not just forward indices
- **BUG-016**: Added GameManager.reset() method for clean new game state
- **BUG-018**: EventManager.emit() now wraps listeners in try/catch for error isolation
- **BUG-025**: Enemy fallback move changed from 'tackle' to 'struggle' when all PP exhausted
- **BUG-026**: Speed ties now resolved by random coin flip instead of always favoring player
- **BUG-028**: Fixed Smokescreen, Sand Attack, Double Team, Minimize, and Focus Energy to target correct stats
- **BUG-029**: Hyper Beam now has recharge turn via two-turn move system
- **BUG-030**: Phantom Force now uses two-turn move system (vanish then strike)
- **BUG-032**: Enemy switch-in now runs initPokemon and ability triggers (Intimidate, weather setters)
- **BUG-034**: Repel now uses proper 'repel' effect type instead of 'key'
- **BUG-035**: Evolution stones now use 'evolution-stone' effect type with proper category
- **BUG-037**: Added shop inventories for 8 missing cities (coral-harbor through pokemon-league)
- **BUG-038**: Held items (Leftovers, Life Orb, Choice Band/Specs, Focus Sash) now use 'held-passive' effect type
- **BUG-040**: GridMovement now updates tile position when tween completes, not at start
- **BUG-042**: AudioManager.setScene() now cancels in-flight crossfade tweens from old scene
- **BUG-043**: ESC/cancel input now uses shared flag instead of separate simultaneous triggers
- **BUG-044**: Post-champion cutscene now sets both quest flag and active flag for QuestManager
- **BUG-045**: completeQuest() now checks quest is active before awarding rewards
- **BUG-046**: Wild Pokemon now get a random nature from all 25 natures instead of always 'hardy'
- **BUG-047**: SettingsScene now uses wake() to match MenuScene's sleep(), with resume() fallback
- **BUG-054**: Gym Leader Ferris now uses iron-tail on Onix (steel move on steel gym)
- **BUG-055**: Gym Leaders Morwen and Drake now have 4 Pokemon each (added Marowak and Aerodactyl)
- **BUG-056**: Elite Four Nerida now has 6 Pokemon (added Tentacruel)
- **BUG-057**: TM48 changed from duplicate brick-break to flash-cannon

### Added
- Steel moves file (steel.ts) with iron-tail, steel-wing, metal-claw, meteor-mash, flash-cannon, bullet-punch, iron-head, gyro-ball
- Dragon moves: dragon-claw, dragon-pulse, draco-meteor, outrage, dragon-dance, dragon-breath, twister
- Fighting moves: brick-break, focus-punch, cross-chop, close-combat
- Flying moves: aerial-ace, brave-bird, air-slash
- Grass moves: energy-ball, giga-drain
- Medicine items: hyper-potion, max-potion, full-restore, max-revive
- Input validation on GameManager.addMoney() and spendMoney() to prevent negative values
- SaveManager.loadAndApply() method for clean save restoration with GameManager reset
- Save version migration from v1 to v2 format (BUG-020)
- Achievement persistence via SaveManager (BUG-015)
- Starter choice flag (`starterChoice_{id}`) for future rival adaptation
- `rechargeOnly` and `_escRaw` fields to MoveEffect and InputState types
- `evolution` item category and `repel`/`held-passive`/`evolution-stone` effect types

### Changed
- SaveManager now delegates to GameManager.serialize()/deserialize() for full-fidelity save/load

### Added — Mobile Improvements (Phases 1–7 Complete)
- **Side-panel touch controls in landscape** (Phase 1.2): On phones in landscape (max-height: 500px), joystick pins to left margin and A/B buttons pin to right margin via CSS media query, keeping the canvas unobstructed. Mobile menu button (☰) added.
- **Battle UI compact mode** (Phase 2.2): When `isMobile()` and viewport height < 400px, action and move menus collapse from 2×2 grid to a single row (50px tall) for better visibility on small screens.
- **Dialogue responsive font** (Phase 2.3): Dialogue font size now scales based on viewport width (15px on narrow, 17px mid, 19px wide).
- **Touch target enforcement** (Phase 3.1): Settings arrow buttons now have 14px padding for minimum 48×48 touch targets.
- **Haptic feedback** (Phase 3.2): `hapticTap()` and `hapticHeavy()` utilities call `navigator.vibrate()` on touch button presses. Gated behind a "Haptics" toggle in Settings.
- **Configurable joystick** (Phase 3.4): Joystick radius, thumb size, and dead zone are configurable via "Joystick Size" setting (small/medium/large). Reads from localStorage on construction.
- **Safe-area utility** (Phase 4): `getSafeAreaInsets()` reads CSS `env(safe-area-inset-*)` values for in-canvas use. Cache invalidated on orientation change.
- **Mobile performance profile** (Phase 5.1): `particleMultiplier()` and `maxParticleMultiplier()` scale particle counts by render quality. WeatherRenderer rain/sandstorm/snow/sunshine particle emitters now respect quality setting.
- **Render quality setting** (Phase 5.2): "Render Quality" (high/medium/low) in Settings, applied in real-time.
- **Visibility-based pausing** (Phase 5.3): Game loop sleeps when tab is backgrounded via `visibilitychange` event.
- **Enhanced service worker** (Phase 6.1): Upgraded to v2 with stale-while-revalidate for JS/CSS, cache-first with background revalidation for game assets, network-first for HTML, offline fallback page, and versioned cache naming.
- **PWA install prompt** (Phase 6.2): `beforeinstallprompt` event shows a dismissible in-game install banner.
- **Manifest improvements** (Phase 6.3): Icons marked `purpose: "any maskable"`, added `categories` field.
- **Accessibility: text scaling** (Phase 7.1): `textScale` setting (small/medium/large) applies 0.85×/1.0×/1.25× multiplier to `mobileFontSize()` via `accessibility.ts`.
- **Accessibility: reduced motion** (Phase 7.2): `isReducedMotion()` checks both in-game setting and OS `prefers-reduced-motion`.
- **Accessibility: colorblind mode** (Phase 7.3): SVG `feColorMatrix` filters (protanopia/deuteranopia) applied to canvas in real-time.
- **iOS "Add to Home Screen" install banner**: On iOS Safari, a bottom banner prompts users to install the app via Share → Add to Home Screen for a fullscreen experience.

### Added — New Utility Modules
- `frontend/src/utils/haptics.ts` — Haptic feedback gated behind settings
- `frontend/src/utils/safe-area.ts` — Safe-area inset reader with caching
- `frontend/src/utils/perf-profile.ts` — Mobile performance profile (render quality, particle multipliers)
- `frontend/src/utils/accessibility.ts` — Accessibility settings sync without circular imports

### Fixed
- **iOS Safari landscape fullscreen**: iPhone landscape mode now collapses Safari address/tab bars via scroll-to-minimize trick.

## [2026-04-16]
### Added — Six Remaining Features from plan.md
- **FlyMapScene** (`scenes/menu/FlyMapScene.ts`): Fly fast-travel scene showing visited towns on a list, badge-gated via OverworldAbilities. Accessible from pause menu when Fly is available.
- **StatisticsScene** (`scenes/menu/StatisticsScene.ts`): GameStats viewer displaying 14 tracked stats (battles, catches, steps, money, etc.). Accessible from pause menu under STATS.
- **HallOfFameScene** (`scenes/menu/HallOfFameScene.ts`): Paginated champion record viewer showing party, playtime, and date. Accessible from both title screen and pause menu.
- **PartnerAI** (`battle/core/PartnerAI.ts`): Smart NPC ally move selection for tag/double battles. Considers STAB, effectiveness, ally safety (penalizes spread moves), prioritizes finishing low-HP targets. Wired into DoubleBattleManager.
- **Trainer Rematches** (`data/trainers/rematch.ts`): Post-game rematch teams for all 8 Gym Leaders (Lv 60–65), 4 Elite Four (Lv 70–75), Champion Aldric (Lv 72–78 with Synthesis), and rival Kael (Lv 60–65). Registered in trainer data index.
- **Boss Trainer Synthesis**: `useSynthesis` field on TrainerData interface. BattleUIScene triggers Synthesis activation on first turn for boss trainers with eligible Pokémon. Champion Aldric rematch uses Synthesis on Mewtwo.
- **GameManager extensions**: `GameStats` interface (11 tracked stats), `HallOfFameEntry` interface, `visitedMaps` Set, `incrementStat()`, `getStat()`, `addHallOfFameEntry()`, `hasVisitedMap()`, `markMapVisited()`. All persisted via serialize/deserialize.
- **MenuScene**: Added STATS, HALL OF FAME, and conditional FLY options to pause menu.
- **TitleScene**: Conditional "Hall of Fame" option when save has entries.

### Fixed
- Fixed rematch Gym Leader Ivy using nonexistent `moonlight` move (replaced with `mega-drain`)

### Added — Mobile Landscape Experience
- **Widescreen-aware resolution**: Game width now dynamically adapts to the device aspect ratio (clamped 4:3–21:9, height fixed at 600). Phones with 19.5:9 screens get a ~1300×600 canvas instead of letter-boxed 800×600, eliminating black bars in landscape.
- **`ui()` layout helper** (`utils/ui-layout.ts`): Camera-relative positioning utility that returns viewport dimensions, center point, edges, and proportional coordinate functions. Replaces hardcoded `GAME_WIDTH`/`GAME_HEIGHT` constants in scene layouts.
- **Orientation lock**: Attempts `screen.orientation.lock('landscape')` on first user interaction. On mobile, also requests fullscreen to maximize viewport and enable orientation lock.
- **Rotate-to-landscape prompt**: Portrait mobile users see a full-screen overlay prompting them to rotate their device, with a "Continue Anyway" dismiss button. Automatically hides when the device enters landscape.
- **Mobile improvements plan** (`docs/mobile-improvements-plan.md`): Comprehensive 7-phase plan covering widescreen resolution, responsive UI, touch polish, safe-area handling, performance, PWA, and accessibility.

### Changed
- **Battle scenes migrated to `ui()` helper**: `BattleScene`, `BattleUIScene`, `BattleVictorySequence`, and `BattleCatchHandler` now use camera-relative positioning instead of `GAME_WIDTH`/`GAME_HEIGHT` constants. All UI elements (menus, HP bars, message boxes) anchor to actual viewport edges.

### Changed — Architecture cleanup phases 2–7
- **Reorganized `scenes/`** into 7 domain subdirectories: `boot/`, `title/`, `overworld/`, `battle/`, `menu/`, `pokemon/`, `minigame/` (25 files moved)
- **Organized `battle/`** into 4 subdirectories: `core/`, `calculation/`, `effects/`, `execution/` (14 files moved, barrel index.ts added)
- **Organized `systems/`** into 4 subdirectories: `audio/`, `overworld/`, `rendering/`, `engine/` (17 files moved, barrel index.ts added)
- **Organized `ui/`** into 2 subdirectories + root: `controls/`, `widgets/` (10 files moved, barrel index.ts added)
- **Reorganized test directories** to mirror source structure: `tests/unit/{battle,data,systems,scenes,managers,utils}/`, `tests/integration/{battle,managers,systems}/` (41 files moved)
- Updated all source and test imports for new directory structure
- Updated `docs/architecture.md` directory tree and file path references

### Changed — BattleUIScene extraction
- **Extracted `BattleCatchHandler.ts`** (~210 lines): catch sequence, shake animation, success/failure, nickname prompt
- **Extracted `BattleVictorySequence.ts`** (~260 lines): victory sequence, level-up, move learning/replacement, evolution, trainer rewards
- Reduced `BattleUIScene.ts` from 1345 to 882 lines using context-interface delegation pattern
- Removed dead imports (`itemData`, `EventManager`, `BGM`) from `BattleUIScene.ts`
- Updated barrel `index.ts` with new exports

### Changed — Documentation consolidation
- **Rewrote `docs/plan.md`**: Consolidated all completed phases into concise summaries. Merged remaining work from `storyline-implementation-plan.md`, `code-cleanup-plan.md`, and `map-improvements.md` into a single prioritized "Remaining Work" section covering map redesigns, gameplay features, content, UI, technical debt, and stretch goals.
- **Removed 4 redundant docs**: `storyline-implementation-plan.md` (all 12 phases complete), `code-cleanup-plan.md` (all phases complete), `map-improvements.md` (consolidated into plan.md), `TestingPlan.md` (superseded by TestingArchitecture.md).
- Retained docs: `plan.md`, `architecture.md`, `storyline.md` (reference bible), `TestingArchitecture.md`, `CHANGELOG.md`.

### Changed — Architecture cleanup phase 2 (prior)
- **OverworldScene tryInteract extraction** (1128→818 lines): Moved ~310-line `tryInteract()` method into `scenes/overworld/OverworldInteraction.ts` with `InteractionContext` callback interface. Scene retains a thin delegating wrapper.
- **Split `data/maps/shared.ts`** (629→6 lines): Decomposed monolithic shared file into 4 focused modules:
  - `tiles.ts` — Tile enum/constants and LEDGE_TILES (~170 lines)
  - `tile-metadata.ts` — OVERLAY_BASE, FOREGROUND_TILES, TILE_COLORS, SOLID_TILES (~260 lines)
  - `map-interfaces.ts` — NpcSpawn, TrainerSpawn, WarpDefinition, SpawnPoint, MapDefinition (~85 lines)
  - `map-parser.ts` — CHAR_TO_TILE mapping and parseMap function (~120 lines)
  - `shared.ts` retained as backwards-compatible re-export stub (6 lines)
- Updated `data/maps/index.ts` to import directly from split modules.
- Updated `scenes/overworld/index.ts` barrel exports with OverworldInteraction.

---

## [2026-04-16] (2)
### Added
- **Move effect integration tests**: 107 new tests covering all 18 fairy/dark/ghost moves — stat-change effects, flinch, paralysis, burn, confusion, priority, level-damage, data integrity, and status-move validation.

---

## [2026-04-16]
### Added — Wire all 18 cutscenes to triggers + fairy/dark/ghost move expansion
- **Map-entry cutscene system**: Added `onEnterCutscene` and `onEnterCutsceneRequireFlag` fields to `MapDefinition` interface. OverworldScene `create()` now plays cutscenes on map entry with smart flag-skip logic.
- **NPC triggerCutscene smart-skip**: Enhanced OverworldScene NPC interaction to auto-detect already-played cutscenes by checking if all `setFlag` actions are satisfied, falling through to regular dialogue.
- **4 NPC-triggered cutscenes**: Wired `rook-reveal` (route-7), `willow-rescue` (abyssal-spire-f4), `aldric-spire-offer` (abyssal-spire-f5), `father-reunion` (shattered-isles-temple) via `triggerCutscene` property.
- **2 additional NPC-triggered cutscenes**: Wired `ember-mines-discovery` (mines-terminal NPC) and `rival-kael-lab` (new lab-kael-intro NPC in pallet-oak-lab).
- **4 map-entry cutscenes**: Wired `game-intro` (pallet-town), `willow-kidnapping` (verdantia-village, requires `defeatedIvy`), `champion-reveal` (pokemon-league-champion, requires `aldric_escaped_to_league`), `fathers-journal-discovery` (shattered-isles-shore, requires `quest_fatherTrail_started`).
- **Fairy moves** (new type file): `moonblast`, `dazzling-gleam`, `play-rough`, `fairy-wind`, `disarming-voice`, `charm` — registered in moves index.
- **Dark moves** (+6): `dark-pulse`, `crunch`, `sucker-punch`, `nasty-plot`, `pursuit`, `foul-play`.
- **Ghost moves** (+6): `shadow-ball`, `shadow-claw`, `hex`, `phantom-force`, `will-o-wisp`, `destiny-bond`.
- **Legendary learnsets**: Updated Solatheon (#152) with proper Psychic/Fairy STAB moves; updated Noctharion (#153) with proper Ghost/Dark STAB moves.

---

## [2026-04-17]
### Added — Post-game quest triggers, legendary Pokémon, flag-gated warps, story cutscenes
- **WarpDefinition `requireFlag`**: Extended `WarpDefinition` interface with optional `requireFlag` field (supports `!`-negation). Updated `OverworldScene` warp logic to check flag gates before warping; shows "The way ahead is blocked..." dialogue when gate is closed.
- **Verdantia Lab warp gate**: Added `requireFlag: 'defeatedIvy'` to Verdantia Village → Verdantia Lab warp.
- **Coral Harbor ferry gate**: Added `requireFlag: 'quest_sternEngine_complete'` to Coral Harbor → Shattered Isles ferry warp.
- **Father's Trail auto-trigger**: Post-champion-victory cutscene now sets `quest_fatherTrail_started` flag and hints at the journal quest.
- **Solatheon** (#152): Custom legendary Pokémon (Psychic/Fairy, BST 650) added to `psychic.ts`. Shattered Isles temple encounter updated from Articuno #144 placeholder.
- **Noctharion** (#153): Custom legendary Pokémon (Ghost/Dark, BST 650) added to `ghost.ts`. Encounter NPC placed in Crystal Cavern Depths.
- **10 story cutscenes**: `game-intro`, `rival-kael-lab`, `ember-mines-discovery`, `willow-kidnapping`, `rook-reveal`, `zara-defection`, `willow-rescue`, `champion-reveal`, `fathers-journal-discovery`, `father-reunion`.
- **Voltara bolt fix**: Added `interactionType: 'move-tutor'` and `interactionData: 'tutor-voltara'` to voltara-bolt NPC.

### Fixed
- **Father's Trail naming**: Fixed `fathersTrail_clueN` → `fatherTrail_clueN` (5 flags) in shattered-isles-ruins.ts and `quest_fathersTrail_complete` → `quest_fatherTrail_complete` in shattered-isles-temple.ts to match quest-data.ts.

### Added — Storyline Implementation Phases 3, 6, 7, 11, 12

#### Phase 3: Shattered Isles (Post-Game Area)
- **Shattered Isles Shore** (`frontend/src/data/maps/dungeons/shattered-isles-shore.ts`): 25×30 post-game area with shattered ground, aether crystal obstacles, sand edges, water borders. Rook NPC with redemption dialogue (requireFlag `enteredHallOfFame`), trainer spawn for `rook-postgame` (talk-to-battle). Ferry warp from Coral Harbor docks.
- **Shattered Isles Ruins** (`frontend/src/data/maps/dungeons/shattered-isles-ruins.ts`): 20×25 ruin dungeon with cracked floors, ruin walls/pillars, aether conduits. 5 Father's Trail journal fragment interactables with sequential `setsFlag` (`fatherTrail_clue1` through `fatherTrail_clue5`).
- **Shattered Isles Temple** (`frontend/src/data/maps/dungeons/shattered-isles-temple.ts`): 18×22 temple with dragon scale floor, ruin pillars, aether crystals. Solatheon legendary encounter (interactionType `wild-encounter`), Father NPC (requireFlag `quest_fatherTrail_complete`).
- **3 encounter tables**: Shore (Lv 55-65), Ruins (Lv 58-68), Temple (Lv 60-70) — Ghost/Psychic/Dragon emphasis with rare Dragonite, Aerodactyl, Lapras, Snorlax.
- **Coral Harbor ferry warp**: warp at dock to Shattered Isles Shore + `from-shattered-isles` spawn point.

#### Phase 6: Verdantia Underground Lab
- **Verdantia Lab** (`frontend/src/data/maps/dungeons/verdantia-lab.ts`): 15×18 hidden Synthesis lab beneath tree roots with giant roots, synthesis floor/walls, containment pods, terminals, vines. 3 interactable terminals with Aether research lore, 3 Synthesis grunt trainer spawns.
- **3 new grunt trainers** in `trainer-data.ts`: `synth-grunt-verdantia-1/2/3` with Poison/Grass teams Lv 28-32.
- **Verdantia Village warp** at (23,14) to underground lab entrance + `from-verdantia-lab` spawn point.
- **Encounter table**: Oddish, Gloom, Grimer, Koffing, Venonat, Bellsprout, Muk (Lv 25-32).

#### Phase 7: NPC Population
- **Pallet Town**: Mom (npc-mom) at (3,7) with `interactionType: 'heal'` and post-league flagDialogue.
- **Viridian City**: Old Man Edgar (npc-oldman) with catch tutorial dialogue and `caughtFirstPokemon` flagDialogue.
- **Pewter City**: Museum Curator (npc-male-1) near museum with Aether lore and post-game fossil dialogue.
- **Ironvale City**: Blacksmith's Apprentice (npc-male-6) near forge with `defeatedFerris` flagDialogue.
- **Scalecrest Citadel**: Veteran Knox (npc-ace-trainer) near south gate with `givesItem: 'scope-lens'`.
- 5 other cities (Coral Harbor, Verdantia, Voltara, Wraithmoor, Cinderfall) already had Phase 7 NPCs from prior work.

#### Phase 12: Flag Chain Audit & Data-Driven Victory Flags
- **`victoryFlag` and `badgeReward`** optional fields added to `TrainerData` interface in `interfaces.ts`. BattleUIScene now sets trainer defeat flags and badges generically from data instead of hardcoded if-else chains.
- **21 trainers** updated with `victoryFlag` (8 gym leaders, 2 rival, 3 Vex, 2 Zara, 4 E4, champion, 1 Verdantia grunt). 8 gym leaders also given `badgeReward`.
- **Ironvale tag battle** flag renamed `ironvale_tag_battle_won` → `defeatedKael3` to match main story chain.
- **Route 7 Rook NPC** fixed: `requireFlag` → `defeatedVex2`, `setsFlag` → `rook_revealed`, added `hasAetherLens` via flagDialogue.
- **Abyssal Spire F5** altar NPC now sets `cleared_abyssal_spire` via flagDialogue.
- **Route 5** Zara trainer placed with `condition: 'helped_marina_traps'`.

## [2026-04-16]
## [2026-04-16]
### Fixed — Intro Scene & Fishing
- **Gender selection**: IntroScene appearance screen now displays actual player sprite previews (male from `player-walk` atlas, female from `player-walk-female` atlas) instead of generic ♂/♀ symbols. Selected gender affects the overworld player sprite and all walk/idle animations.
- **Female player sprite**: Loaded `npc-lass` atlas as `player-walk-female` in PreloadScene; registered separate `player-girl-walk-*` and `player-girl-idle-*` animations in AnimationHelper; OverworldScene and CutsceneEngine now use gender-aware animation prefix.
- **Intro Pokemon sprite**: Fixed Pokemon not displaying during intro slides — `pikachu-front` sprite is now preloaded in PreloadScene so it's available when IntroScene references it.
- **Old Rod not given**: Fisherman Wade NPC now actually gives the `old-rod` item to the player's bag via new `givesItem` field on NpcSpawn interface, handled in OverworldScene NPC interaction code. Previously only set the `received_old_rod` flag without adding the item.
- **Pallet Town fishing**: Added `pallet-town` entry to `fishingTables` (Magikarp Lv 3-8 on Old Rod) so fishing works in the area where the Old Rod is obtained.

### Added — Phases 7+8: NPC Population & Missing Battle Encounters
- **3 new trainers** in `trainer-data.ts`: Rook post-game rematch (Lv 70-74), Marina encounter 3 partner (Lv 30-32), 3 Synthesis Elite grunts for Route 7 gauntlet (Lv 33-36).
- **Mom healer** in `pallet-player-house.ts`: added `interactionType: 'heal'` and progressive flagDialogue for `defeatedBrock` and `enteredHallOfFame` milestones.
- **Route 7 elite grunt gauntlet**: 3 elite Synthesis grunts with `condition: '!defeatedVex2'` added alongside existing grunts, blocking progression until Dr. Vex is defeated.
- **5 story cutscenes** in `cutscene-data.ts`: Morwen Prophecy (post-Gym 6), Solara Confession (post-Gym 8), Ashborne Warning (post-E4 #4), Aldric Spire Offer (Abyssal Spire F5), Post-Champion Victory (sets `enteredHallOfFame`).
- Verified existing NPCs already present: Fisherman Wade & Pip (Pallet Town), Jerome (Pewter City), Captain Stern & Diver Lena (Coral Harbor), Elder Moss & Berry Farmer Hana (Verdantia Village), Ghost Girl & Historian Edith (Wraithmoor Town), Hot Spring Attendant & Dr. Ash (Cinderfall Town).

## [2026-04-16]
### Added — Phase 2 (Storyline): Abyssal Spire Dungeon (5 Floors)
- **Abyssal Spire F1** (`frontend/src/data/maps/dungeons/abyssal-spire-f1.ts`): "The Breach" — 20×20 ancient temple entrance with ruin/Synthesis hybrid tileset, mist, Rook partner NPC, 2 Synthesis Elite trainers. Warps to route-8 and F2.
- **Abyssal Spire F2** (`frontend/src/data/maps/dungeons/abyssal-spire-f2.ts`): "Lab Wing" — 20×20 full Synthesis lab with containment pods, terminals, wire floors, 2 elite grunts, Dr. Vex boss battle (encounter 3). Lore terminals reveal Project Chimera.
- **Abyssal Spire F3** (`frontend/src/data/maps/dungeons/abyssal-spire-f3.ts`): "Command Center" — 18×18 ops room with terminal clusters and electric panels. Zara Lux NPC with branching flagDialogue (defect vs battle path). Admin Zara encounter 3.
- **Abyssal Spire F4** (`frontend/src/data/maps/dungeons/abyssal-spire-f4.ts`): "Inner Sanctum" — 15×16 ancient temple with cracked floors, ruin pillars, aether crystals, and parasitic lab equipment. Professor Willow rescue NPC (sets `rescued_willow` flag). Lore interactables.
- **Abyssal Spire F5** (`frontend/src/data/maps/dungeons/abyssal-spire-f5.ts`): "The Altar" — 15×14 circular chamber with aether conduit ring and crystals. Aldric confrontation (cutscene only, sets `aldric_escaped_to_league` flag, escapes to Champion's chamber).
- **8 new trainers** in `trainer-data.ts`: Admin Vex encounter 3 (Lv 41-44), Admin Zara encounters 2 (Lv 32-35) and 3 (Lv 40-43), 4 Synthesis Elite Grunts (Lv 38-42).
- **Abyssal Spire encounter table** in `encounter-tables.ts`: Haunter, Golbat, Kadabra, Grimer, Magnemite, Gastly (Lv 34-42).
- **Map registry**: all 5 floors registered in `maps/index.ts`.

## [2026-04-16]
### Added — Phase 20: Achievement & Completion Tracking
- **AchievementManager** (`frontend/src/managers/AchievementManager.ts`): singleton manager tracking unlocked achievements with serialize/deserialize, unlock callback, and auto-completionist detection.
- **Achievement data** (`frontend/src/data/achievement-data.ts`): 50 achievements across 5 categories (Story, Collection, Battle, Exploration, Challenge).
- **AchievementToast** (`frontend/src/ui/AchievementToast.ts`): slide-in gold banner notification on achievement unlock with auto-dismiss after 3s.
- **AchievementScene** (`frontend/src/scenes/AchievementScene.ts`): grid gallery of all achievements with category tabs, progress counter, description panel, and keyboard/pointer navigation. Registered in `game-config.ts`.
- **GameStats tracking** in `GameManager`: `totalBattlesWon`, `totalBattlesLost`, `wildBattles`, `trainerBattles`, `totalCatches`, `totalSteps`, `moneyEarned`, `moneySpent`, `pokemonEvolved`, `criticalHits`, `highestDamage` with `incrementStat()`/`getStat()` methods.
- **Hall of Fame** in `GameManager`: `HallOfFameEntry` interface and `hallOfFame` array with `addHallOfFameEntry()` method for champion completions.
- **Save/load integration**: achievements, stats, and hall of fame persisted via `SaveManager` and `SaveData` interface (backwards-compatible with defaults).
- **Achievement triggers** wired in `BattleUIScene` (battle wins, catches, evolution, badges, rival), `OverworldScene` (steps, surf, bicycle, fishing, starter selection).
- **ACHIEVEMENTS menu option** added to `MenuScene` pause menu between QUESTS and TRAINER CARD.

## [2026-04-16]
### Added — Phase 19: World Enrichment & Side Activities
- **Berry Growing System** (`frontend/src/systems/BerryGarden.ts`): plantable berry plots on maps with `berryPlots` count in `MapDefinition`. Growth stages: empty → planted → growing → ready. Watering speeds growth by 50%. Harvest yields 2-4 berries. Uses `GameClock` time. Berry plot data persists via GameManager serialization.
- **BERRY_SOIL tile** (ID 115): new walkable/interactable tile type in `shared.ts` with color, overlay base, and OverworldScene interaction handler (plant/water/harvest dialogue flows).
- **Trainer Card Scene** (`frontend/src/scenes/TrainerCardScene.ts`): displays player name, trainer ID, difficulty mode, 8 badge slots, Pokédex seen/caught counts, playtime, money, and player sprite. Accessible from pause menu as "TRAINER CARD" option.
- **Hidden Items System** (`frontend/src/systems/HiddenItems.ts`): 16 hidden items placed across routes, forests, caves, and cities. Each has a collection flag. Tile interaction in OverworldScene checks for uncollected hidden items on interaction.
- **Itemfinder key item**: press F in the overworld to scan a 5-tile radius for hidden items. Shows "! Item nearby!" popup with SFX or "No reaction..." if none found.
- **Voltorb Flip Mini-game** (`frontend/src/scenes/VoltorbFlipScene.ts`): 5×5 card-flipping number game with Voltorbs (bombs). Row/column hints show sum + Voltorb count. Progressive levels. Coin rewards added to player money. Accessible via Game Corner NPC in Voltara City.
- **Game Corner NPC** in Voltara City: new `voltara-game-corner` NPC at (18, 11) with `voltorb-flip` interaction type.
- **New items in item-data.ts**: `rare-candy`, `max-potion`, `pearl`, `nugget`, `iron`, `pp-up`, `max-elixir`, `dusk-stone`, `itemfinder`.
- Registered `TrainerCardScene` and `VoltorbFlipScene` in `game-config.ts`.
- Added "TRAINER CARD" menu option to `MenuScene` pause menu (between QUESTS and SAVE).
- Berry plots and trainer ID persist through GameManager serialize/deserialize.

## [2026-04-17]### Added — Tag-Battle System & Berry Mechanics (Phase 9)
- **Tag-battle wiring for Ironvale City**: Kael NPC (`ironvale-kael`) now initiates a 2v2 tag battle (player + Kael vs 2 Synthesis Grunts) when interacted with, gated by `found_mines_terminal` flag. Uses `DoubleBattleManager` tag-battle path with ally party from `rival-3` trainer data.
- **Two new Ironvale Synthesis Grunts** in `trainer-data.ts`: `synthesis-grunt-ironvale-1` (Weezing Lv26 + Golbat Lv25) and `synthesis-grunt-ironvale-2` (Arbok Lv26 + Muk Lv25). Combined enemy party for the tag battle.
- **`victoryFlag` system**: BattleScene accepts optional `victoryFlag` string; BattleUIScene sets the flag on victory. Used by tag battle to set `ironvale_tag_battle_won`.
- **Ally party support in BattleScene**: `setupDoubleBattle` now accepts `allyParty` data passed through transition, placing the ally's lead Pokémon in the second player slot.
- **Three new NPC interaction types** in `NpcSpawn`: `'tag-battle'`, `'show-pokemon'`, `'wild-encounter'`.
- **"Show Pokémon" interaction**: Collector Magnus in Viridian City now opens PartyScene for Pokémon type-checking against quest requirements (Water, Fire, Flying). Sets corresponding `quest_collector_*` flags on match.
- **Wild encounter from NPC interaction**: Lost Geodude in Viridian Forest (`forest-lost-geodude`) now triggers a wild battle with Geodude Lv25 after dialogue, in addition to setting `quest_lostPokemon_found`.
- **Sitrus Berry manual use fixed**: Changed `amount` from 0 to -25 (percentage-based). InventoryScene now interprets negative heal amounts as percentage of max HP.
- **Berry item effects verified**: All 8 berries (Oran, Sitrus, Cheri, Chesto, Pecha, Rawst, Aspear, Lum) have correct `heal-hp` or `heal-status` effects for manual use from inventory.

## [2026-04-16]### Added — Pokémon Personality & Bond System
- **Friendship gameplay logic**: `adjustFriendship(pokemonIndex, amount)` in `GameManager` clamps friendship to [0, 255]. Friendship changes: battle win +3, faint -1, heal at PokéCenter +1, every 128 walking steps +1 to lead Pokémon (level-up +2/3/5 already existed via `ExperienceCalculator`).
- **Friendship battle effects**: 10% chance to survive a KO at 1 HP when friendship ≥ 220 ("hung on with love!"). 10% chance to cure a status condition at end of turn when friendship ≥ 220 ("shook off [status] with sheer determination!").
- **Nickname system**: After catching a Pokémon, player is prompted "Give a nickname?". YES opens `NicknameScene` with keyboard input (letters/numbers/spaces/hyphens, max 12 chars, DONE/SKIP buttons, blinking cursor). Nickname displays in BattleScene HP bars.
- **Name Rater NPC**: Added to Verdantia Village. Interaction launches PartyScene in select mode, then NicknameScene to rename the chosen Pokémon.
- **PartyScene select mode**: New `selectMode` flag allows launching PartyScene for single Pokémon selection, emitting `pokemon-selected` event instead of showing the context menu.
- **Nature characteristic flavor text**: SummaryScene INFO tab now shows an italic personality description for each of the 25 natures (e.g., Hardy → "Takes plenty of siestas", Adamant → "Proud of its power").
- Registered `NicknameScene` in `game-config.ts`, added `'name-rater'` to `NpcSpawn.interactionType` union.

## [2026-04-16]
### Added — Animated Tiles, Environmental SFX, Flash HM, Strength Boulders
- **Animated tile effects** in `OverworldScene.update()`: water tiles shimmer (3 blue tint cycles every 500ms), tall grass has subtle alpha pulse, lava/magma tiles cycle red-orange tints.
- **AmbientSFX system** (`frontend/src/systems/AmbientSFX.ts`): infrastructure for per-map ambient sound types (`ocean`, `forest`, `cave`, `city`, `wind`, `rain`, `none`). Added `ambientSfx` field to `MapDefinition`. Wired into `OverworldScene.create()`.
- **Terrain footstep SFX**: `onPlayerStep()` plays different SFX based on tile type (grass, sand, water, wood, metal, stone). Added `FOOTSTEP_METAL` to `audio-keys.ts`.
- **Flash HM integration**: dark cave maps auto-expand player light radius from 96px to 192px when party has a Flash-knowing Pokémon with sufficient badges. Shows "Used FLASH!" popup.
- **Strength boulder pushing**: interacting with `STRENGTH_BOULDER` tiles pushes them one tile in facing direction with slide animation. Checks bounds and walkability of destination. Updates map data and redraws tiles.

## [2026-04-16]
### Added — Move Tutor Scene & TM Usage from Inventory
- **MoveTutorScene** (`frontend/src/scenes/MoveTutorScene.ts`): full interactive scene for Move Tutors with move list (type dots, PP, power, cost), party selection filtered by `canLearnMove()`, move replacement UI for Pokémon with 4 moves, and cost deduction (money or Heart Scales).
- **5 Move Tutor NPCs** added to city maps: Verdantia Village, Ironvale City, Scalecrest Citadel, Wraithmoor Town, Pokémon League. Each uses `interactionType: 'move-tutor'` with `interactionData` linking to `moveTutorData`.
- **TM usage from InventoryScene**: selecting USE on a TM item launches `MoveTutorScene` in TM mode — shows eligible party Pokémon, handles move replacement, TMs are reusable (not consumed). TM action menu shows USE/Cancel (no TOSS).
- **Heart Scale** item added to `item-data.ts` as a key item for Move Tutor payments.
- **NpcSpawn** interface extended with `interactionData?: string` field and `'move-tutor'` interaction type.
- **OverworldScene** wired to launch `MoveTutorScene` with dialogue → tutor flow for move-tutor NPCs.
- Registered `MoveTutorScene` in `game-config.ts` scene array.

## [2026-04-16]
### Added — Synthesis Mode UI & Double Battle Scene
- **Synthesis Bracelet** key item added to `item-data.ts`. Required to activate Synthesis Mode in battle.
- **SYNTH button** in `BattleUIScene`: appears in the action menu when the player has the Synthesis Bracelet, hasn't used synthesis this battle, and the active Pokémon is eligible. Activates synthesis with a camera flash, displays boost messages, then auto-opens the FIGHT menu.
- **Synthesis aura** in `BattleScene`: pulsing cyan ellipse (0x00ffdd) behind the player Pokémon sprite after synthesis activation.
- **SynthesisHandler** integration: cleanup on battle end to revert stat boosts.
- **Double battle scene layout**: `BattleScene` accepts `isDouble` flag. When enabled, positions 4 Pokémon sprites (2 per side) with reduced scale. Public arrays for sprites/slots (`playerSprites`, `enemySprites`, `playerPokemonSlots`, `enemyPokemonSlots`).
- **Target selection UI** in `BattleUIScene`: arrow-based enemy target selection for single-target moves in double battles. Uses `getMoveTarget()` from `DoubleBattleManager` for targeting classification.
- **TrainerData.isDouble** optional field: trainers can be flagged for double battles.
- **OverworldScene** passes `isDouble` and full `enemyParty` to BattleScene when trainer data includes `isDouble: true`.

## [2026-04-16]
### Added — Cutscene Engine
- **CutsceneEngine** (`frontend/src/systems/CutsceneEngine.ts`): Data-driven scripted sequence player supporting 16 action types — dialogue, camera pan, NPC/player movement, face direction, wait, fade to/from black, screen flash, BGM/SFX, screen shake, emote bubbles, flag setting, and parallel action execution.
- **CutsceneAction union type** and **CutsceneDefinition** interface for type-safe cutscene authoring.
- **Cutscene data file** (`frontend/src/data/cutscene-data.ts`): Sample cutscenes — `rival-intro`, `willow-lab-intro`, `route-1-blockade`.
- **NpcSpawn.triggerCutscene** field: NPCs can trigger cutscenes on interaction instead of normal dialogue.
- **OverworldScene integration**: CutsceneEngine initialized in `create()`, input processing skipped during cutscene playback, `tryInteract()` checks for cutscene triggers.

## [2026-04-16]
### Added — Ledge System
- **One-way ledge mechanics**: LEDGE tiles (down), LEDGE_LEFT, LEDGE_RIGHT with directional collision checks. Player can only step onto ledges from the matching direction.
- **Hop animation**: Parabolic arc tween (12px height) when jumping over a ledge, 1.2x walk duration.
- **GridMovement ledge callback**: `setLedgeCheck()` enables the hop animation on ledge tiles.

## [2026-04-16]
### Added — Cave Darkness & Lighting System
- **LightingSystem** (`frontend/src/systems/LightingSystem.ts`): RenderTexture-based darkness overlay (depth 85) with radial gradient light circles. Player light follows camera, static lights for torches/lamps with off-screen culling.
- **MapDefinition fields**: `isDark?: boolean` and `lightSources?: Array<{tileX, tileY, radius?, color?}>` for per-map darkness.
- **Dark caves**: Crystal Cavern and Crystal Cavern Depths marked as `isDark: true` with torch light sources.
- **Flash-ready**: `setPlayerLightRadius()` method for future Flash HM integration.

## [2026-04-16]
### Added — Bicycle & Movement Upgrades
- **Bicycle system**: B key toggles cycling (3x speed, 63ms/tile). Key item `bicycle` in item-data.ts. Auto-dismount indoors. Mutually exclusive with running.
- **GridMovement cycling**: 3-tier speed: walk (180ms), run (99ms), cycle (63ms).
- **Encounter rate modifier**: Running increases encounter rate by 1.5x in tall grass.
- **InputManager**: Added `bicycle` input state with B key binding (JustDown toggle).

## [2026-04-16]
### Added — Overworld Weather System
- **WeatherRenderer system** (`frontend/src/systems/WeatherRenderer.ts`): Renders visual weather effects on the overworld using Phaser particle emitters and camera-fixed overlays. Supports 6 weather types: rain (diagonal blue droplets), sandstorm (horizontal dust), snow (drifting flakes), fog (pulsing white overlay), sunshine (warm tint + lens flare), and none.
- **MapDefinition `weather` field**: Optional `weather?: OverworldWeather` field on `MapDefinition` interface for per-map weather configuration.
- **OverworldScene integration**: WeatherRenderer created during `create()` and updated each frame. Weather automatically set from map definition.
- **Map weather assignments**: Route 6 (rain), Route 7 (fog), Ember Mines (sandstorm).

## [2026-04-16]
### Added — Overworld Abilities System
- **OverworldAbilities.ts**: New system for field moves (Cut, Surf, Strength, Flash, Fly, Rock Smash) with badge requirements and party move checks.
- **New tile types**: CUT_TREE (110), CRACKED_ROCK (111), STRENGTH_BOULDER (112) added to Tile enum, SOLID_TILES, OVERLAY_BASE, and FOREGROUND_TILES.
- **Cut and Rock Smash interactions**: Tile-based interactions in OverworldScene.tryInteract() that remove obstacles and show popup text.
- **Surf support**: Surfing state in OverworldScene with modified collision check to allow water tile traversal; auto-disembark on non-water tiles.
- **Helper methods**: redrawTile() for live tile replacement, showFieldAbilityPopup() for ability-use feedback.

## [2026-04-16]
### Added — NPC Behaviors & Emote System
- **NPCBehavior system** (`frontend/src/systems/NPCBehavior.ts`): Four behavior types — `stationary`, `look-around` (random facing every 2-5s), `wander` (random 1-tile moves within radius every 3-8s), `pace` (follows fixed direction route every 2s). `NPCBehaviorController` class manages per-NPC timers and movement with collision checking.
- **EmoteBubble system** (`frontend/src/systems/EmoteBubble.ts`): Six emote types (`exclamation`, `question`, `heart`, `sweat`, `music`, `zzz`) rendered as styled text above sprites. Pop-in tween (scale 0→1) with auto-fade and destroy.
- **NpcSpawn `behavior` field**: Added optional `behavior?: NPCBehaviorConfig` to `NpcSpawn` interface in `shared.ts`.
- **OverworldScene wiring**: Behavior controllers created during `spawnNPCs()`, updated every frame via `update()`, cleaned up in `respawnNPCs()`.
- **Sample NPC behaviors**: Pallet Town `pallet-npc-1` (look-around), Route 1 `route1-npc-2` (wander, radius 2), Viridian City `viridian-npc-1` (pace left-left-right-right).

## [2026-04-16]
### Added — Phase 9 Completion: Story & Quest Wiring
- **Route 8 — Stormbreak Pass**: New 20×30 route connecting Cinderfall Town to Victory Road. Mountain pass terrain with cliffs, tall grass, 3 trainers (2 Ace Trainers, 1 Synthesis Grunt), and Kael rival encounter 4 placement. Full encounter table (Lv 36–44 Graveler, Marowak, Golbat, Rhydon, Nidoking/queen, Electabuzz).
- **Aether Sanctum**: Post-game 20×25 dungeon accessed from Victory Road. Synthesis-themed tile layout with containment pods and Aether conduits. 3 grunts + Kael encounter 6 (Lv 62–65 rematch). High-level encounter table (Lv 55–65 including Porygon, Snorlax, Dragonite rare spawns). Rook NPC with post-champion dialogue.
- **Crystal Cavern Depths**: Post-game 20×30 deeper level of Crystal Cavern. Connected via new north passage warps. Marina encounter 4 placement (Lv 55–58). Encounter table with Lv 50–60 Pokémon (Aerodactyl, Lapras, Dragonair rare). Item pickups (Max Revive, Rare Candy).
- **Generic House Interior system**: Reusable 8×8 house interior template (`createGenericHouse()` factory) with TV, bed, bookshelf, chair, plant, and table tiles. 10 pre-built house interiors (one per city) with city-specific flavor dialogue NPCs. Warps added to Voltara, Wraithmoor, Scalecrest, and Cinderfall cities.
- **Quest HUD Tracker (QuestTrackerScene.ts)**: Overlay scene showing active quest name and current step in the top-right corner. Auto-updates on flag-set and quest-completed events. Launched automatically from OverworldScene.
- **QuestJournalScene + QuestTrackerScene registration**: Both scenes now properly registered in game-config.ts (QuestJournalScene was missing from Phaser scene list).
- **Quest step trigger automation**: Added `triggerFlag` to Volcanic Survey vents (5 steps), Dragon's Lament herb/mineral, and Chef's Special berries. Added `triggerEvent` to Captain Stern engine parts (trainer-defeated events). All auto-complete via QuestManager's existing observer pattern.
- **Quest interaction NPCs**: Conduit repair points (3) in Voltara City for Power Restoration quest. Memory fragment pickups (3) in Wraithmoor Town for Restless Spirit quest. Volcanic vent recording points (5) in Victory Road for Volcanic Survey quest. Herb pickup in Verdantia Village and mineral pickup in Ember Mines for Dragon's Lament quest.
- **Captain Stern engine grunt trainers**: 3 new trainer entries (stern-grunt-1/2/3, Lv 14–15) placed on Route 3 and Coral Harbor docks/beach.
- **Route 8 Ace Trainers**: 2 new trainer entries (ace-trainer-4 Rex, ace-trainer-5 Luna, Lv 37–39) for Stormbreak Pass.
- **Map connection chain update**: Cinderfall → Route 8 → Victory Road → Aether Sanctum. Crystal Cavern ↔ Crystal Cavern Depths. All warps and spawn points bidirectional.

### Fixed
- **CUT_TREE/CRACKED_ROCK/STRENGTH_BOULDER tile colors**: Added missing `TILE_COLORS` entries for field ability target tiles (IDs 110–112), fixing map-data test failures.
- **shadow-ball move reference**: Replaced invalid `shadow-ball` move on ace-trainer-5 with `night-shade` (valid Ghost move), fixing data-integrity test.

### Added — Phase 15: Sound & Music Expansion
- **Procedural Pokémon Cry Generator (CryGenerator.ts)**: Runtime synthesis of 151 unique chip-tune cries using Web Audio API. Each Pokémon's cry is deterministic (seeded by dex number + base stat total) with multi-pulse envelopes, frequency sweeps, and vibrato. Hand-tuned parameters for starter families, algorithmic generation for all others.
- **Expanded audio keys**: 13 new BGM keys (rival/legendary/villain battle themes, 5 town variants, cave, evolution, credits, victory road, villain lair) and 14 new SFX keys (stat raise/lower, status inflict, synthesis activate, item obtain, badge get, heal jingle, save, Pokédex register, 4 footstep types, water splash).
- **Context-sensitive music**: Distinct BGM per town theme (coastal, industrial, spooky, mountain, cave). Updated MAP_BGM mapping for all 30+ maps.
- **AudioManager enhancements**: `playFanfare()` (fade BGM → play jingle → restore), `playLoHpWarning()`/`stopLoHpWarning()` (layered beep over BGM), `pauseBGM()`/`resumeBGM()`, `playSFXWithRate()` for pitch-shifted variants, `previousBGMKey` tracking.
- **Procedural audio placeholders (ProceduralAudio.ts)**: Runtime generation of placeholder audio buffers for missing BGM/SFX keys, with mood-based BGM (7 moods) and profile-based SFX patterns.

### Added — Phase 16: Advanced Battle Features
- **Synthesis Mode (SynthesisHandler.ts + synthesis-data.ts)**: The game's unique "Mega Evolution" equivalent. 19 eligible Pokémon with +100 BST thematic boosts, optional type/ability overrides. One activation per battle, reverts on faint/battle-end. Includes starter final evos, gym leader aces, legendaries, and fan favorites (Gengar, Alakazam, Machamp, etc.).
- **Double Battle system (DoubleBattleManager.ts)**: Full 2v2 battle manager with 4 active slots, priority+speed turn ordering, spread move targeting (0.75× damage reduction), tag battle support with NPC ally parties, multi-trainer enemy configs, and slot-based faint/replacement tracking. BattleState expanded with EXECUTE_TURN and REPLACE states.
- **Move Tutor & TM system (tm-data.ts)**: 50 reusable TMs across all types (8 gym rewards, route pickups, shop purchases). 5 Move Tutor NPCs in key cities. `canLearnMove()` compatibility function with universal move set, type matching, and per-Pokémon override lists. Heart Scale item for Move Reminder.

### Added — Previous (same day)
- **Professor Intro Scene (IntroScene.ts)**: Classic "Welcome to the world of Pokémon!" multi-slide professor intro with animated fade transitions between slides, Professor Willow sprite, and Pokémon showcase. Includes typewriter-style text progression, mobile tap support, and smooth transitions.
- **Character Naming Screen**: After the professor intro, players type their name (max 10 characters) with a blinking cursor, preset quick-picks (Red, Ash, Gold, Ethan), keyboard and tap input, and a DONE button. Defaults to "Red" if left empty. Name saved to GameManager and used throughout the game.
- **Confirmation Slide**: Final slide confirms the player's name with a farewell message before transitioning to the overworld via white flash + fade.
- **Move Animation System (MoveAnimationPlayer.ts)**: Data-driven battle move animations with 6 animation styles (contact, projectile, beam, area, self, shake). 18 type-based default particle color palettes. 16 specific move overrides for signature moves (Earthquake, Hyper Beam, Thunder, Flamethrower, Fire Blast, Ice Beam, Blizzard, Hydro Pump, Surf, Psychic, Shadow Ball, Sludge Bomb, Explosion, Self-Destruct, Dream Eater, Solar Beam, Thunderbolt). Screen flash and screen shake effects for high-impact moves. All animations play before damage is applied in BattleUIScene.
- **Running Shoes**: GridMovement now supports a running state at ~1.8× walk speed (55% of normal tween duration). Hold SHIFT to run in the overworld. Running requires the `runningShoes` game flag.
- **Running Shoes Gift**: Mom in Pallet Town player house gives Running Shoes after the player receives their starter Pokémon (flag-gated dialogue with `setFlag` support).
- **flagDialogue setFlag support**: NPC flag-gated dialogue entries can now optionally set a flag on interaction via the `setFlag` field, enabling item/ability grants through NPC conversations.

### Changed
- **New Game flow**: Selecting "New Game" on the title screen now launches IntroScene (professor intro → naming → confirmation → overworld) instead of going directly to the overworld.
- **Battle move execution flow**: BattleUIScene now plays move animations via `playMoveAnimation()` before calling `MoveExecutor.execute()`, adding visual flair to every attack. The execution logic was refactored into a separate `applyMoveResult()` method for clarity.
- **Development plan expanded (plan.md)**: Added Phases 10–20 covering: First Impressions & New Game Experience, Battle Animation & Visual Effects, Overworld Atmosphere & World Feel, Player Movement & Exploration, UI Art & Custom Pixel Font, Sound & Music Expansion, Advanced Battle Features (Synthesis Mode, Double Battles, Battle Tower), Cutscene System, Pokémon Personality & Bond System, World Enrichment & Side Activities, and Achievement & Completion Tracking.

## [2026-04-13]
### Fixed
- **Starter Pokémon missing in battle**: Back sprites for the chosen starter were never loaded because StarterSelectScene only preloaded front sprites, and MapPreloader ran before the party had any Pokémon. Now StarterSelectScene loads both front and back sprites for all starters.
- **BattleScene sprite safety net**: Added `init()`/`preload()` to BattleScene so it loads any missing player/enemy front+back sprites before rendering, preventing invisible Pokémon in edge cases.

### Added
- **Bug Catcher sprite** (`npc-bug-catcher`): New palette-swapped sprite with green/olive nature tones for Bug Catcher trainers.
- **Ace Trainer sprites** (`npc-ace-trainer`, `npc-ace-trainer-f`): Male and female Ace Trainer sprites with bold red/elite look.
- **Unique Gym Leader sprites**: `npc-gym-brock` (dark earthy tones), `npc-gym-blitz` (electric blue/yellow), `npc-gym-ferris` (steel gray/forge orange) — each gym leader now visually distinct from generic NPCs.
- **Admin Vex sprite** (`npc-admin-vex`): Dark purple outfit, distinct from regular Synthesis Grunts.
- **Synthesis Grunt sprite** (`npc-grunt`): Dark purple/magenta menacing palette swap, distinct from scientists and Admin Vex.
- **Marina sprite** (`npc-marina`): Blue/teal research assistant palette, unique from generic Lass trainers.
- **Psychic sprite** (`npc-psychic`): Dark purple mystical palette for Psychic trainer class.
- **Rival sprite overhaul**: Rival Kael now has a distinct blue-toned sprite instead of sharing identical pixels with Professor Oak.

### Changed
- **NPC sprite audit & reassignment**: Comprehensive review of all trainer sprite assignments.
- Bug Catchers (5) now use `npc-bug-catcher` instead of generic `npc-male-3`.
- Synthesis Grunts (6) now use `npc-grunt` instead of `npc-scientist`.
- Admin Vex (2 encounters) now uses `npc-admin-vex` instead of `npc-scientist`.
- Ace Trainer Victor/Rex use `npc-ace-trainer`; Ace Trainer Luna uses `npc-ace-trainer-f`.
- Gym Leader Brock, Blitz, and Ferris each have unique sprites.
- Marina (secondary rival) uses `npc-marina` instead of generic `npc-lass`.
- Psychic Elena uses `npc-psychic` instead of generic sprite.
- Blitz story NPC in Voltara City uses `npc-gym-blitz` instead of `npc-scientist`.
- `npc-scientist` reduced from 13+ characters to just actual scientists/engineers (lab aides, Dr. Ash, Voltara engineers).
- Updated all map files (routes 4-7, ember-mines, voltara-city, route-6) with correct sprite keys.

### Fixed
- **Rival/Professor identity crisis**: `rival.png` was pixel-identical to `npc-professor.png` — rival Kael now has a distinct palette.
- **Gender mismatch**: Ace Trainer Luna (female) was using male sprite `npc-male-5` → now uses `npc-ace-trainer-f`.
- **Gender mismatch**: Camper Rosa (female) was using male sprite `npc-male-1` → now uses `npc-female-4`.
- **Psychic Elena** was using generic `npc-female-3` → now uses dedicated `npc-psychic` sprite.

## [2026-04-13]
### Fixed
- **Mobile dialogue stuck**: A/B touch buttons now advance dialogue and battle UI on mobile. Added `update()` polling of `TouchControls.consumeConfirm/Cancel` in DialogueScene and BattleUIScene since raw DOM touch events bypass Phaser's scene-scoped pointer system.
- **Dialogue re-trigger on tap**: Added resume cooldown (2 frames) and touch input drain in OverworldScene so tapping to close dialogue doesn't immediately re-open a new conversation with the same NPC.

### Changed
- **Mobile controls: restored A/B buttons** alongside joystick, tap-to-confirm, and menu hamburger button. A (green, confirm) and B (red, cancel) buttons are back in both the in-canvas overlay (bottom-right) and the DOM control bar. Taps on A/B buttons are excluded from tap-to-confirm detection.
- **Pallet Town**: Expanded map from 25×20 to 25×30 with a southern dock and sea area. Path from Oak's Lab opens south to a wooden pier (DOCK_PLANK tiles) extending into the ocean. Shore has proper sand → wet sand → water transitions with a palm tree. Added Fisherman Wade NPC on the dock (gives Old Rod), and a pier sign.
- **Route 1**: Complete ground redesign with coherent design zones. North has dense contiguous meadows flanking the path; upper-mid has a solid east meadow block with ledge shortcut; center has organized flower beds forming a clearing (Rook rest area); lower section has a large east meadow block; south is clean and open near Pallet. Replaced scattered random grass/rock/bush placements with intentional natural formations. Repositioned trainers to guard meadow edges.
- **Route 2**: Complete ground redesign with four clear zones. North has dense forest-edge meadows on both sides; cave area has a solid cliff-face wall with a dark cave mouth opening (cliff surrounds cave floor tiles like a proper Pokemon cave entrance); center has a symmetrical flower clearing for the Marina rival battle; south has contiguous west and east meadow blocks with a ledge shortcut. South border changed from trees to fence line matching Viridian City boundary style. Repositioned trainers to guard meadows.

### Fixed
- **Pewter City**: Fixed row 19 width mismatch (31→30 chars). All rows now consistently 30 characters wide. Fixed east exit path to Route 3 with proper connectivity.
- **Viridian City**: Fixed rows 14 and 19 width mismatches (29→30 chars). All rows now consistently 30 characters wide.
- **Route 3 (Tide Pool Path)**: Complete ground redesign — sand, wet sand, and tide pool tiles now correctly border the water on the west coast instead of floating disconnected in the middle. Two distinct coastal beach sections separated by an inland meadow. Path properly connects north-south with smooth bends. Updated swimmer/fisherman NPC positions to be near the coastline.

### Added
- **Pewter City PokéMart**: Added PokéMart building exterior (MMMMMM tiles) next to PokéCenter, with matching interior map, warp, and spawn point. Created `pewter-pokemart.ts` and registered in map index.
- **Crystal Cavern crystals**: Added AETHER_CRYSTAL (÷) formations scattered throughout the cave, making it visually distinct as a crystal cavern rather than a plain cave.
- **Route 1 Rook NPC**: Added Rook's first story appearance at route midpoint — heals party, mysterious dialogue, appears after receiving starter (`requireFlag: 'receivedStarter'`).

### Changed
- **Mobile controls: replaced A/B buttons with joystick + tap-to-confirm**. Removed the A and B action buttons from both the in-canvas overlay and the DOM control bar. Tapping anywhere on screen now acts as spacebar/confirm for dialog advancement and world interactions. The virtual joystick remains for movement (activates on left 60% of screen). Added SPACE as a confirm key in InputManager alongside ENTER. Updated overworld HUD hints for mobile.

### Added
- **Extended tileset**: Expanded tileset.png from 70 to 110 frames, providing textured tiles for all Phase 4.5 biome types (Coastal, Volcanic, Mine, Industrial, Forest, Electric, Ghost/Ruin, Dragon, Synthesis HQ, League)
- **24 distinct NPC sprite atlases**: Generated individual character sprite atlases from M_01-M_12 and F_01-F_12 source sheets: npc-mom, npc-nurse, npc-professor, npc-scientist, npc-hiker, npc-swimmer, npc-sailor, npc-oldman, npc-lass, npc-male-1 through npc-male-6, npc-female-1 through npc-female-9
- **NPC sprite diversity**: Updated 175+ NPC and trainer textureKey/spriteKey assignments across all maps and trainer-data.ts (nurses, professors, gym leaders, quest givers, route trainers, dungeon NPCs all now have visually distinct sprites)
- **Mobile DOM controls below canvas**: On portrait mobile, the game canvas now anchors to the top of the screen and a dedicated touch-controls bar appears in the previously-black space below. Includes a floating virtual joystick (left zone) and A/B action buttons (right side).
- **Adaptive layout**: Controls automatically switch between the below-canvas DOM bar (portrait, >100 px of space) and the existing in-canvas overlay (landscape or desktop). Responds to orientation changes and window resize.

### Fixed
- **NPC/Trainer facing sprites**: NPCs and trainers now display the correct sprite frame matching their `facing` direction on spawn and when turning. Previously all NPCs showed the default frame regardless of facing direction, so trainers with line-of-sight checks appeared to look the wrong way.
- **Mobile canvas centering**: Switched from `CENTER_BOTH` to `CENTER_HORIZONTALLY` on touch devices so the canvas sits at the top of the viewport, maximizing the area available for controls.

### Fixed
- **Double-tap zoom**: Blocked `dblclick` and Safari gesture events to prevent accidental zoom-in on mobile that couldn't be reversed due to touch controls consuming pinch gestures.
- **Long-press copy/select**: Added `user-select: none`, `-webkit-touch-callout: none` on html/body/canvas and blocked `contextmenu` event to prevent accidental text selection and copy sheet on mobile.
- **Battle continue stuck on mobile**: `waitForConfirmThen()` in BattleUIScene now listens for `pointerdown` (tap) in addition to keyboard events, fixing the inability to dismiss the "Press Enter to continue" screen on touch devices.
- **Mobile battle prompt text**: Changed "Press Enter to continue..." to "Tap to continue..." on mobile devices.

---

## [2026-04-12]
### Fixed
- **Map edge openings**: Replaced solid tree/wall borders adjacent to warp exits with grass/floor tiles across all 51 maps, creating visible path openings at every map transition point.
- **Path connectivity in cities**: Added continuous PATH tile walkways connecting main roads to edge exits in viridian-city, pewter-city, ironvale-city, voltara-city, wraithmoor-town, scalecrest-citadel, cinderfall-town.
- **Pewter museum path**: Shrunk museum from 5 to 4 tiles wide to route south path alongside it to exit.
- **Dungeon entrances**: Widened cave entrance openings in victory-road, crystal-cavern, ember-mines and cleared interior wall obstructions.
- **Coral Harbor**: Closed false south exit opening on row 29 and ensured proper path to south warp tiles.

## [2026-04-12]
### Added
- **Proximity-based map preloading (MapPreloader system)**: New `MapPreloader` system in `frontend/src/systems/` that defers Pokémon front/back sprite loading from boot to on-demand, based on map proximity. Reduces initial boot asset count from 453 images to 151 (icons only). Front/back sprites are loaded per-map when entering a new area, and preloaded in the background when the player is within 8 tiles of a warp exit.
- **On-demand sprite loading in StarterSelectScene**: Starter Pokémon front sprites are loaded just-in-time if not already cached.
- **On-demand sprite loading in PokedexScene**: Pokémon front sprites load lazily when viewing a Pokédex entry.

### Changed
- **PreloadScene**: No longer loads all 302 Pokémon front/back sprites at boot; only loads icon sprites. Core assets (tilesets, player atlas, NPC atlases, audio) remain in the boot preload.
- **OverworldScene**: Integrates MapPreloader — calls `ensureMapReady()` on map create (loads current map encounters + player party sprites), `preloadAdjacentMaps()` for fire-and-forget background loading of connected maps, and `checkProximity()` on each player step for warp-proximity preloading.

## [2026-04-12]
### Added
- **Virtual joystick for mobile**: Replace static D-pad with a dynamic virtual joystick that appears at the user's touch location in the overworld. Drag to move in 4 cardinal directions; auto-hides on release.
- **Mobile-scaled UI**: Added `mobileFontSize()`, `MOBILE_SCALE`, and `isMobile()` helpers in theme.ts. Menus, battle actions, dialogue, and move lists all scale up 1.35× on touch devices for readability.
- **Tap-to-advance dialogue**: DialogueScene now responds to touch/tap to advance text and make choices.
- **Tappable close/exit buttons**: InventoryScene, PokedexScene, ShopScene, and PCScene now show prominent tappable close buttons on mobile instead of keyboard-only hints.
- **Larger A/B action buttons**: Touch control action buttons (confirm/cancel) increased from 52px to 72px with bigger labels for easier tapping.
- **Multi-touch support**: Enabled 3 active pointers in Phaser config so joystick and action buttons work simultaneously.
- **VirtualJoystick.ts**: New UI component in `frontend/src/ui/` for the floating joystick with dead zone, angle-based 4-way direction, and mouse fallback for desktop testing.

### Changed
- **TouchControls.ts**: Rewrote to use VirtualJoystick instead of static D-pad. Joystick is hidden during menus. Action buttons repositioned and enlarged.
- **BattleUIScene**: Action and move menu items scaled for mobile with padding for touch targets.
- **TitleScene**: Menu items scaled and padded for mobile touch.
- **MenuScene**: Panel and menu items scale with MOBILE_SCALE for touch devices.

## [2026-04-12]
### Added
- **Rival encounters placed on maps**: Kael rival-1 in Oak's Lab (post-starter trigger), Kael rival-2 on Route 3 (Tide Pool Path), Kael tag-battle NPC in Ironvale City (story-gated), Kael rival-5 on Victory Road entrance, Marina encounter on Route 2
- **7 missing quest definitions**: Added Captain Stern's Engine, The Chef's Special, Power Restoration, The Restless Spirit, The Dragon's Lament, Volcanic Survey, and The Father's Trail to quest-data.ts (12 total quests now defined)
- **Dr. Ash NPC**: Placed Volcanologist Dr. Ash in Cinderfall Town as Volcanic Survey quest giver with flag-gated dialogue
- **Phase 9 in plan.md**: New "Story & Quest Wiring" phase documenting rival placement, quest definitions, and itemized remaining work (quest step automation, quest UI, house interiors, Route 8/post-game maps)

### Fixed
- **Map connection audit & fixes**: Audited all 51 maps (195 warps, 123 spawn points) for connection integrity.
  - Fixed default spawn in viridian-city landing on GYM_ROOF tile — moved to PATH.
  - Fixed default spawn in pewter-city landing on GYM_WALL tile — moved to PATH.
  - Fixed default spawn in pewter-museum landing on DISPLAY_CASE tile — moved to FLOOR.
  - Fixed coral-harbor north warps to route-3 landing on TREE tiles — moved to PATH opening.
  - Fixed coral-harbor PokéMart warp on MART_WALL — moved to MART_DOOR tile.
  - Fixed gym warp tiles in coral-harbor, ironvale-city, verdantia-village, voltara-city, wraithmoor-town, scalecrest-citadel, and cinderfall-town from GYM_WALL to GYM_DOOR.
  - Updated all corresponding from-gym and from-pokemart spawn points to align with corrected door positions.
  - Opened victory-road north wall (rows 0–1) to create passable entrance for Pokémon League warps and from-league spawn.
- **Battle trainer sprite size**: Increased enemy trainer sprite scale from 1.5 to 3 so the trainer appears larger than the Pokémon, and increased alpha from 0.7 to 0.85 for better visibility.
- **Difficulty screen overlay**: Made difficulty selection background fully opaque so title screen no longer bleeds through. Disabled title menu keyboard/pointer handlers while difficulty screen is open and restored them on cancel.

### Changed
- **Map file organization**: Moved 51 map definition files from flat `data/maps/` into `cities/`, `routes/`, `interiors/`, and `dungeons/` subdirectories. Updated all imports in `index.ts` and `../shared` references.

### Fixed
- **ShopScene tab navigation**: Added LEFT/RIGHT arrow keys to switch between Buy/Sell tabs (previously only Q/E worked), updated hint text
- **Nurse Joy counter interaction**: Extended NPC interaction check to reach across counter tiles (COUNTER, PINK_COUNTER), allowing players to talk to NPCs behind counters

### Added
- **Phase 6 — Difficulty modes**: Classic, Hard (Lv+4, smart AI, no items in trainer battles, 0.75× money), Nuzlocke (permadeath, first-encounter-only). Difficulty selection on New Game.
- **Phase 8 — Act 3+4 maps**: Route 6, Wraithmoor (Gym 6 Ghost—Morwen), Route 7 (Vex #2, Rook reveal), Scalecrest (Gym 7 Dragon—Drake), Cinderfall (Gym 8 Fire—Solara), Victory Road, Pokémon League (Elite Four Nerida + Champion Aldric). 9 interior maps. Encounter tables for Route 6/7/Victory Road. 15+ new trainers.

### Fixed
- **PC missing from Oak's Lab**: Added a PC terminal at the right-side lab machine so players can access the Pokémon Storage System from the lab
- **Pokéball placement in Oak's Lab**: Moved starter Poké Balls one tile down so they appear ON the table instead of floating above it
- **Starter selection flow**: Player must now talk to Prof. Oak first (sets `oakOfferedStarter` flag), then walk to the Poké Balls on the table and interact with them to trigger starter selection. Interacting with the balls before talking to Oak shows a hint message.

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
