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

### Phase 9: Story & Quest Wiring (In Progress)
> **Rival Encounters Placed**: Kael rival-1 in Oak's Lab (post-starter), Kael rival-2 on Route 3, Kael tag-battle NPC in Ironvale City, Kael rival-5 on Victory Road. Marina encounter on Route 2. **Missing Quest Definitions Added**: Captain Stern's Engine, The Chef's Special, Power Restoration, The Restless Spirit, The Dragon's Lament, Volcanic Survey, The Father's Trail (7 new quest definitions in quest-data.ts, total 12). **Dr. Ash NPC** placed in Cinderfall Town (Volcanic Survey quest giver). **Remaining work**: Kael encounter 4 needs Route 8 (Stormbreak Pass) map. Kael encounter 6 + Marina encounter 4 need post-game areas. Quest step trigger automation (observer pattern for flag→step mapping). Quest log/journal UI.

---

## Remaining Phases

### Phase 9 Completion — Story & Quest Wiring (Immediate Next)

**Rival System:**
- Route 8 (Stormbreak Pass) map + Kael encounter 4 placement
- Post-game Aether Sanctum map + Kael encounter 6
- Crystal Cavern depths expansion + Marina encounter 4
- Tag-battle system for Ironvale Kael/player vs. Synthesis Admins co-op

**Quest Step Automation:**
- Observer pattern: game events (defeated trainer, picked item, entered area) → auto-complete quest steps
- Collector's Challenge: "show Pokémon" interaction with Magnus (detect party type)
- Mine Clearance: link Ember Mines grunt defeats to quest step flags
- Berry Farming: berry planting mechanic at route locations
- Lost Pokémon: Geodude encounter trigger in Viridian Forest
- Stern's Engine: place 3 grunt encounters guarding engine parts on Route 3 / Coral Harbor
- Power Restoration: place 3 conduit interaction points in Voltara City
- Restless Spirit: place 3 memory fragment objects in Wraithmoor Town
- Dragon's Lament: place herb/mineral pickup objects in Verdantia and Ember Mines
- Volcanic Survey: place 5 vent interaction points near Cinderfall/Victory Road

**Quest UI:**
- Quest Journal scene (accessible from pause menu)
- Active quest tracker (HUD overlay showing current step)
- Quest completion notifications

**House Interiors:**
- Generic reusable house interior (8×8) for residential buildings
- Add warps from city house doors to generic interiors
- Per-town NPC dialogue in houses for flavor and lore

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
