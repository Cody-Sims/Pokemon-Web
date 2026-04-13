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

---

## Remaining Phases

### Phase 3.5–3.7: Side Content (Remaining)

**3.5 — Optional Dungeon: Crystal Cavern**
- Multi-floor cave off Route 2, dark overlay, rock/ground encounters.
- Strength-boulder puzzle, boss encounter (rare Pokémon), TM + held item rewards.

**3.6 — Rival Encounters**
- 6 story-gate encounters with **Kael** (escalating team, adapts to starter choice): Lab, Route 3, Ironvale (tag-battle), Route 8, Victory Road, post-game.
- 4 encounters with **Marina** (friendly/co-op): Route 2, Coral Harbor, Canopy Trail, post-game Crystal Cavern.
- Mandatory battles, pre/post dialogue with win/loss variants.
- See [storyline.md — Kael](storyline.md#rival--kael) and [storyline.md — Marina](storyline.md#secondary-rival--marina-oleander) for full schedules.

**3.7 — NPC Side Quests**
- 12 side quests tracked via `GameManager.flags` (see [storyline.md — Side Quests](storyline.md#side-quests--detailed)).
- Key quests: Lost Delivery (multi-town, unlocks Bike Voucher), Collector's Challenge (show 10 Pokémon), Mine Clearance (3-floor dungeon), The Father's Trail (post-game legendary quest).
- Rewards: rare items, move tutors, evolutionary stones, Dragon-type Pokémon, Master Ball.

---

### Phase 4.5: Art Assets & Tileset Expansion

**Goal:** Expand the tileset (`tileset.png`) and create battle backgrounds to support all remaining maps. Current tileset has 68 tiles (IDs 0–67). New tiles are added to `shared.ts` and painted into the spritesheet.

#### New Overworld Tiles Needed

| ID Range | Tile Name | Biome/Location | Description |
|----------|-----------|----------------|-------------|
| 68 | TIDE_POOL | Coastal | Shallow tidal pool (walkable, fishable) |
| 69 | WET_SAND | Coastal | Damp sand near water's edge (walkable) |
| 70 | DOCK_PLANK | Coastal | Wooden dock/pier plank (walkable) |
| 71 | CORAL_BLOCK | Coral Harbor | Decorative coral-marked building wall (solid) |
| 72 | LAVA_ROCK | Volcanic | Dark volcanic rock ground (walkable) |
| 73 | MAGMA_CRACK | Volcanic | Glowing magma crack (solid/hazard) |
| 74 | VOLCANIC_WALL | Volcanic | Basalt cliff wall (solid) |
| 75 | MINE_TRACK | Mine/Dungeon | Minecart track on cave floor (walkable) |
| 76 | MINE_SUPPORT | Mine/Dungeon | Wooden mine beam (solid) |
| 77 | METAL_FLOOR | Industrial | Steel/iron plating floor (walkable) |
| 78 | METAL_WALL | Industrial | Riveted metal wall (solid) |
| 79 | PIPE | Industrial | Exposed pipe decoration (solid) |
| 80 | GEAR | Industrial | Decorative/puzzle gear on wall (solid) |
| 81 | VINE | Forest | Hanging vine (walkable overlay) |
| 82 | MOSS_STONE | Forest | Mossy stone block (solid) |
| 83 | GIANT_ROOT | Forest | Large tree root (solid) |
| 84 | BERRY_TREE | Forest/Village | Berry-bearing tree (interactable, solid) |
| 85 | CONDUIT | Electric/Tech | Aether energy conduit on floor (walkable, glows) |
| 86 | ELECTRIC_PANEL | Electric/Tech | Control panel (interactable, solid) |
| 87 | WIRE_FLOOR | Electric/Tech | Floor with cable runs (walkable) |
| 88 | GRAVE_MARKER | Ghost/Ruin | Tombstone (solid) |
| 89 | CRACKED_FLOOR | Ghost/Ruin | Broken stone floor (walkable) |
| 90 | RUIN_WALL | Ghost/Ruin | Ancient crumbling wall (solid) |
| 91 | RUIN_PILLAR | Ghost/Ruin | Stone column (solid) |
| 92 | MIST | Ghost/Ruin | Low fog overlay (walkable) |
| 93 | DRAGON_SCALE_FLOOR | Dragon | Ornate scale-pattern stone (walkable) |
| 94 | DRAGON_STATUE | Dragon | Dragon statue decoration (solid) |
| 95 | FORTRESS_WALL | Dragon | Ancient fortress masonry (solid) |
| 96 | ASH_GROUND | Volcanic/Fire | Ashy gray soil (walkable) |
| 97 | EMBER_VENT | Volcanic/Fire | Steam/ember vent (solid/hazard) |
| 98 | HOT_SPRING | Volcanic/Fire | Hot spring pool (solid, heal point) |
| 99 | SYNTHESIS_FLOOR | Collective HQ | Clean white lab tile (walkable) |
| 100 | SYNTHESIS_WALL | Collective HQ | Teal-white paneled wall (solid) |
| 101 | SYNTHESIS_DOOR | Collective HQ | Sliding lab door (warp) |
| 102 | CONTAINMENT_POD | Collective HQ | Pokémon containment unit (solid, interactable) |
| 103 | AETHER_CONDUIT | Collective HQ | Glowing Aether pipe (solid) |
| 104 | TERMINAL | Collective HQ | Data terminal (interactable, solid) |
| 105 | SHATTERED_GROUND | Post-game | Fractured earth from Aether eruption (walkable) |
| 106 | AETHER_CRYSTAL | Post-game | Exposed Aether crystal formation (solid, glows) |
| 107 | LEAGUE_FLOOR | Pokémon League | Grand marble floor (walkable) |
| 108 | LEAGUE_WALL | Pokémon League | Ornate marble wall (solid) |
| 109 | CHAMPION_THRONE | Pokémon League | Champion's throne (solid, interactable) |

#### Battle Backgrounds Needed

Currently battles use a procedurally-drawn solid color. Each biome should have a 16-color pixel-art battle background (256×128 base, scaled 2×). Stored in `frontend/public/assets/ui/battle-bg/`.

| File Name | Used On | Scene Description |
|-----------|---------|-------------------|
| `bg-grass.png` | Routes 1–2, Viridian Forest | Grass meadow with trees in background |
| `bg-cave.png` | Crystal Cavern, Ember Mines | Dark cave with stalactites |
| `bg-coastal.png` | Route 3 (Tide Pool Path) | Sandy shore with ocean horizon |
| `bg-harbor.png` | Coral Harbor | Docks and boats in background |
| `bg-volcanic.png` | Basalt Ridge, Cinderfall | Lava glow, basalt columns, smoke |
| `bg-mine.png` | Ember Mines (lab areas) | Mine tunnels with Synthesis equipment |
| `bg-industrial.png` | Ironvale City, Voltara City | Metal walls, gears, sparks |
| `bg-forest.png` | Canopy Trail, Verdantia | Dense canopy, dappled light, vines |
| `bg-ruins.png` | Wraithmoor Town | Crumbling stone, mist, ghostly glow |
| `bg-citadel.png` | Scalecrest Citadel | Fortress interior, dragon banners |
| `bg-fire.png` | Cinderfall Gym | Embers, lava pools, volcanic rock |
| `bg-lab.png` | Collective HQ (Abyssal Spire) | White-teal lab, containment pods in bg |
| `bg-league.png` | Pokémon League, Elite Four | Grand marble hall, pillars, banners |
| `bg-champion.png` | Champion's Chamber | Aether conduit glow, throne room |
| `bg-shattered.png` | Shattered Isles (post-game) | Ruined landscape, Aether crystals, stormy sky |
| `bg-water.png` | Fishing encounters, Coral Gym | Underwater/ocean surface view |
| `bg-gym-rock.png` | Pewter Gym (Brock) | Rocky arena, boulders |
| `bg-gym-water.png` | Coral Harbor Gym | Tidal pools, rising water |
| `bg-gym-steel.png` | Ironvale Gym | Anvils, molten metal |
| `bg-gym-grass.png` | Verdantia Gym | Vine-covered arena, giant tree |
| `bg-gym-electric.png` | Voltara Gym | Tesla coils, sparking conduits |
| `bg-gym-ghost.png` | Wraithmoor Gym | Ghostly crypt, floating candles |
| `bg-gym-dragon.png` | Scalecrest Gym | Dragon cave, treasure hoard |
| `bg-gym-fire.png` | Cinderfall Gym | Volcanic caldera, embers |

#### NPC Sprites Needed

Each sprite needs a 4-direction walk cycle spritesheet (4 frames × 4 directions = 16 frames, 16×32 per frame). Stored in `frontend/public/assets/sprites/npcs/`.

| Sprite Key | Character | Priority |
|------------|-----------|----------|
| `rival-kael` | Kael (rival) — replace current generic `rival` | Phase 3.6 |
| `rival-marina` | Marina (secondary rival) | Phase 3.6 |
| `npc-rook` | Rook (the drifter) — cloaked traveler | Phase 5 |
| `npc-professor-willow` | Professor Willow | Phase 5 |
| `gym-coral` | Gym Leader Coral — surfer | Phase 5 |
| `gym-ferris` | Gym Leader Ferris — blacksmith | Phase 5 |
| `gym-ivy` | Gym Leader Ivy — herbalist | Phase 5 |
| `gym-blitz` | Gym Leader Blitz — inventor | Phase 5 |
| `gym-morwen` | Gym Leader Morwen — ghost mystic | Phase 8 |
| `gym-drake` | Gym Leader Drake — dragon knight | Phase 8 |
| `gym-solara` | Gym Leader Solara — fire performer | Phase 8 |
| `admin-vex` | Dr. Vex Corbin — lab coat, monocle | Phase 5 |
| `admin-zara` | Zara Lux — elegant, teal accents | Phase 5 |
| `boss-aldric` | Director Aldric Maren — dark suit, Champion cloak | Phase 8 |
| `grunt-synthesis` | Synthesis Collective grunt — white-teal lab coat | Phase 5 |
| `elite-nerida` | Elite Four Nerida | Phase 8 |
| `elite-theron` | Elite Four Theron | Phase 8 |
| `elite-lysandra` | Elite Four Lysandra | Phase 8 |
| `elite-ashborne` | Elite Four Ashborne | Phase 8 |

#### Map-Specific Background Music

Stored in `frontend/public/assets/audio/bgm/`. OGG format preferred.

| Track Key | Location | Mood |
|-----------|----------|------|
| `bgm-littoral` | Littoral Town | Warm, nostalgic, hometown |
| `bgm-route-coastal` | Routes 3, Tide Pool Path | Breezy, upbeat, ocean waves |
| `bgm-coral-harbor` | Coral Harbor | Lively port, steel drums |
| `bgm-basalt-ridge` | Basalt Ridge (Route 4) | Tense, percussive, volcanic rumble |
| `bgm-ember-mines` | Ember Mines dungeon | Dark, industrial, dripping |
| `bgm-ironvale` | Ironvale City | Steady, metallic, forge sounds |
| `bgm-canopy-trail` | Canopy Trail (Route 5) | Mysterious, layered, birdsong |
| `bgm-verdantia` | Verdantia Village | Gentle, pastoral, wind chimes |
| `bgm-voltara` | Voltara City | Energetic, synth-heavy, buzzing |
| `bgm-wraithmoor` | Wraithmoor Town | Eerie, organ, whispers |
| `bgm-scalecrest` | Scalecrest Citadel | Epic, brass, ancient |
| `bgm-cinderfall` | Cinderfall Town | Warm but intense, strings |
| `bgm-collective-hq` | Abyssal Spire | Sinister, electronic, pulsing |
| `bgm-victory-road` | Victory Road | Dramatic, building tension |
| `bgm-pokemon-league` | Pokémon League halls | Grand, orchestral |
| `bgm-champion` | Champion battle | Intense, climactic, full orchestra |
| `bgm-shattered-isles` | Shattered Isles (post-game) | Haunting, desolate, hopeful undertones |
| `bgm-synthesis-battle` | Battles vs Synthesis grunts/admins | Aggressive, electronic, teal-coded |
| `bgm-rival-battle` | Battles vs Kael | Fast, competitive, guitar-driven |
| `bgm-boss-battle` | Battles vs Vex/Zara/Aldric | Intense, layered, dramatic |

---

### Phase 5: Act 2 Maps & Story Progression

**Goal:** Expand from 6 to ~12 maps, Gyms 2–5. Introduce Synthesis Collective encounters and key NPCs (Rook identity hints, Zara/Vex boss battles).

**New tiles required (from Phase 4.5):** Coastal set (68–71), Volcanic set (72–74), Mine set (75–76), Industrial set (77–80), Forest set (81–84), Electric/Tech set (85–87).  
**Battle backgrounds required:** `bg-coastal`, `bg-harbor`, `bg-volcanic`, `bg-mine`, `bg-industrial`, `bg-forest`, `bg-gym-water`, `bg-gym-steel`, `bg-gym-grass`, `bg-gym-electric`.  
**NPC sprites required:** `rival-kael`, `rival-marina`, `npc-rook`, `npc-professor-willow`, `gym-coral`, `gym-ferris`, `gym-ivy`, `gym-blitz`, `admin-vex`, `admin-zara`, `grunt-synthesis`.

- **Tide Pool Path** (Route 3): coastal, fishable, Synthesis scouts, Kael rival battle #2. Uses SAND, WET_SAND, TIDE_POOL, PALM_TREE, WATER tiles.
- **Coral Harbor** (Town 3): Gym 2 (Water — Coral), PokéMart, fishing NPC (Diver Lena gives Good Rod), Captain Stern ferry quest, Chef Marco Berry quest. Zara disguised as philanthropist. Uses DOCK_PLANK, CORAL_BLOCK, SAND, WATER tiles.
- **Basalt Ridge** (Route 4): volcanic, fire/rock encounters. Rook saves player from Synthetic Pokémon. Uses LAVA_ROCK, MAGMA_CRACK, VOLCANIC_WALL, ASH_GROUND tiles.
- **Ember Mines** (Dungeon): 2-floor cave, Synthesis lab, Dr. Vex boss battle #1. Uses CAVE_FLOOR, CAVE_WALL, MINE_TRACK, MINE_SUPPORT + Synthesis tiles for lab areas.
- **Ironvale City** (Town 4): Gym 3 (Steel — Ferris), Kael tag-battle vs. Synthesis Admins, Miner Gil side quest. Aldric hologram address. Uses METAL_FLOOR, METAL_WALL, PIPE, GEAR tiles.
- **Canopy Trail** (Route 5): dense forest, bug/grass encounters, Synthesis Pokémon traps, Marina + player co-op event, Zara Lux boss battle #1. Uses DARK_GRASS, VINE, MOSS_STONE, GIANT_ROOT, DENSE_TREE tiles.
- **Verdantia Village** (Town 5): Gym 4 (Grass — Ivy), hidden Synthesis lab beneath village, Berry Farmer Hana quest, Elder Moss Aether lore. Uses LIGHT_GRASS, BERRY_TREE, VINE, GIANT_ROOT tiles.
- **Voltara City** (Town 6): Gym 5 (Electric — Blitz), Power Grid quest, Move Tutor Bolt, HQ triangulation scene, Professor Willow kidnapped. Uses METAL_FLOOR, CONDUIT, ELECTRIC_PANEL, WIRE_FLOOR tiles.
- **Gym puzzles**: Gym 2 (rising tides — WATER/TIDE_POOL), Gym 3 (gear switches — GEAR/METAL_FLOOR), Gym 4 (vine barriers — VINE/GIANT_ROOT), Gym 5 (circuit routing — CONDUIT/WIRE_FLOOR).

---

### Phase 6: Difficulty Modes & Replayability

**Goal:** Add replay value with difficulty selection at New Game.

- **Classic**: Standard experience.
- **Nuzlocke**: Fainted = released, first encounter per route only, mandatory nicknames, game over on wipe.
- **Hard Mode**: Trainer levels +3–5, gym leaders use held items + smart AI, no items in trainer battles, 0.75× money.
- **Randomizer** (stretch): Seed-based shuffle of encounters/teams/starters.

---

### Phase 8: Act 3+ World Expansion

**Goal:** Complete storyline through Gym 8, Pokémon League, and post-game. See [storyline.md](storyline.md#act-3--confrontation-badges-68) for full narrative details.

**New tiles required (from Phase 4.5):** Ghost/Ruin set (88–92), Dragon set (93–95), Volcanic/Fire set (96–98), Collective HQ set (99–104), Post-game set (105–106), League set (107–109).  
**Battle backgrounds required:** `bg-ruins`, `bg-citadel`, `bg-fire`, `bg-lab`, `bg-league`, `bg-champion`, `bg-shattered`, `bg-gym-ghost`, `bg-gym-dragon`, `bg-gym-fire`.  
**NPC sprites required:** `gym-morwen`, `gym-drake`, `gym-solara`, `boss-aldric`, `elite-nerida`, `elite-theron`, `elite-lysandra`, `elite-ashborne`.  
**Music tracks required:** `bgm-wraithmoor`, `bgm-scalecrest`, `bgm-cinderfall`, `bgm-collective-hq`, `bgm-victory-road`, `bgm-pokemon-league`, `bgm-champion`, `bgm-shattered-isles`, `bgm-boss-battle`.

**Act 3 — Confrontation (Badges 6–8):**
- **Wraithmoor Town**: Gym 6 (Ghost — Morwen), crypt puzzle, Ghost Girl side quest, Historian Edith lore. Uses GRAVE_MARKER, CRACKED_FLOOR, RUIN_WALL, RUIN_PILLAR, MIST tiles.
- **Route 7**: Dr. Vex blockade, grunt gauntlet, Vex boss battle #2, Rook identity reveal + Aether Lens key item.
- **Scalecrest Citadel**: Gym 7 (Dragon — Drake), multi-stage gauntlet, Dragon Keeper Wren quest. Uses DRAGON_SCALE_FLOOR, DRAGON_STATUE, FORTRESS_WALL tiles.
- **Cinderfall Town**: Gym 8 (Fire — Solara, Aldric's former student), Dr. Ash volcanic survey quest. Uses ASH_GROUND, EMBER_VENT, HOT_SPRING, LAVA_ROCK tiles.
- **Abyssal Spire** (Collective HQ): 5-floor climactic dungeon — Rook double battle, Vex final boss, Zara defection choice, Willow rescue, Aldric confrontation. Uses SYNTHESIS_FLOOR, SYNTHESIS_WALL, SYNTHESIS_DOOR, CONTAINMENT_POD, AETHER_CONDUIT, TERMINAL tiles.

**Act 4 — Resolution:**
- **Victory Road**: Kael rival battle #5, final gauntlet. Uses CAVE_FLOOR, CAVE_WALL, BOULDER, CLIFF_FACE tiles + bg-cave background.
- **Pokémon League**: Uses LEAGUE_FLOOR, LEAGUE_WALL tiles + bg-league background.
- **Elite Four**: Nerida (Water/Ice), Theron (Fighting/Rock), Lysandra (Psychic/Dark), Ashborne (Fire/Dragon — warns player about Champion). Each Elite Four room uses LEAGUE_FLOOR with type-themed decorations.
- **Champion Aldric Maren**: Final boss (6 Pokémon, Lv 50–55). Uses CHAMPION_THRONE, AETHER_CONDUIT tiles + bg-champion background. Aether conduit destabilization. Solatheon calmed. Player crowned Champion.

**Post-Game:**
- **Shattered Isles**: Ruined archipelago, Lv 55–70 wild Pokémon, Rook rematch (Lv 70+). Uses SHATTERED_GROUND, AETHER_CRYSTAL, RUIN_WALL, WATER tiles + bg-shattered background.
- **Legendary quests**: Solatheon (Shattered Isles temple), Noctharion (Crystal Cavern depths).
- **The Father's Trail**: 5-location quest following father's journal → reunion + Master Ball.
- **Rematches**: All 8 Gym Leaders (Lv 60+), Elite Four (Lv 70+), Kael as Champion challenger (Lv 60–65).
- **Endgame dungeon**: Deep Crystal Cavern expansion.

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
