# Map Improvements Plan

## Executive Summary

**Problem:** 6 of 10 city/town maps use an identical copy-paste template layout. Routes 6 and 7 are barren. Biome-specific tiles (110+ defined) go unused in most maps. Several storyline-critical maps are missing entirely. Many story NPCs referenced in the storyline bible are absent from their maps.

**Goal:** Every map should look and feel distinct, match its storyline biome, contain the correct story NPCs, and use the rich tile palette already defined in `shared.ts`.

---

## Current State Audit

### Uniqueness Ratings

| Map | Size | Biome Tiles Used | Layout Unique? | Rating |
|-----|------|-----------------|----------------|--------|
| Pallet Town | 25×20 | Generic | Yes — custom lab layout | ⭐⭐⭐⭐⭐ |
| Viridian City | 30×30 | Generic | Yes — pond, multiple areas | ⭐⭐⭐⭐ |
| Pewter City | 30×30 | Generic | Yes — museum, distinct placement | ⭐⭐⭐⭐ |
| Coral Harbor | 25×30 | Partial — sand/water/palms | Template grid | ⭐⭐ |
| Ironvale City | 25×30 | None — generic grass | Template grid (identical to Coral) | ⭐ |
| Verdantia Village | 25×25 | Yes — forest border, light grass | Unique forest layout | ⭐⭐⭐⭐ |
| Voltara City | 25×30 | None — generic grass | Template grid (identical to Coral) | ⭐ |
| Wraithmoor Town | 25×25 | None — generic grass | Template grid (identical to Ironvale) | ⭐ |
| Scalecrest Citadel | 25×25 | None — generic grass | Template grid (identical to Ironvale) | ⭐ |
| Cinderfall Town | 25×25 | None — generic grass | Template grid (identical to Ironvale) | ⭐ |
| Route 1 | 20×40 | Generic | Linear north-south with grass | ⭐⭐⭐ |
| Route 2 | 20×30 | Generic | Linear with Crystal Cavern side | ⭐⭐⭐ |
| Route 3 | 20×40 | Coastal — sand, water, tide pools, palms | Excellent biome work | ⭐⭐⭐⭐⭐ |
| Route 4 | 20×30 | Volcanic — cliffs, cave floor | Basalt ridge feel | ⭐⭐⭐ |
| Route 5 | 22×30 | Forest — dark grass, forest border | Dense canopy feel | ⭐⭐⭐⭐ |
| Route 6 | 20×30 | None — generic grass | Flat, sparse, repetitive | ⭐ |
| Route 7 | 20×30 | None — generic grass | Flat, sparse, repetitive | ⭐ |
| Victory Road | 20×25 | Cave — cave floor, quartz | Dungeon layout | ⭐⭐⭐ |
| Pokémon League | 10×10 | League interior | Compact special | ⭐⭐⭐ |

### Copy-Paste Template Problem

These 6 cities share an **identical** layout pattern:
- PokéCenter top-left, House top-right
- PokéMart mid-right
- Gym bottom-left
- Single vertical path through center
- Same building positions, same path widths

**Affected:** Coral Harbor, Ironvale City, Voltara City, Wraithmoor Town, Scalecrest Citadel, Cinderfall Town

---

## Missing Maps (From Storyline)

| Map | Story Reference | Priority |
|-----|----------------|----------|
| **Route 8 (Stormbreak Pass)** | Rival encounter #4 (Kael, Lv 34–37). Between Cinderfall and Victory Road. | HIGH |
| **Abyssal Spire (Collective HQ)** | 5-floor climactic dungeon (Act 3 finale). Dr. Vex final battle, Zara choice, Professor Willow rescue, Aldric confrontation. | HIGH |
| **Shattered Isles** | Post-game area. Destroyed archipelago. Rook, Solatheon legendary, Father's Trail quest conclusion. Lv 55–70 encounters. | MEDIUM |
| **Crystal Cavern (Deep)** | Post-game Marina encounter #4 (Lv 55–58). Noctharion legendary encounter. | MEDIUM |
| **Verdantia Hidden Lab** | Act 2 mini-dungeon. Synthesis lab hidden beneath Verdantia Village roots. | LOW |

---

## Per-Map Improvement Plans

---

### Act 1 Maps

#### Pallet Town ✅ (No major changes)
- **Status:** Good. Unique lab layout, quest NPCs present.
- **Minor:** Add Kael's Grandfather NPC inside rival house (gives Exp. Share post-game per storyline).
- **Minor:** Add Fisherman Wade at the docks area (gives Old Rod per storyline). Currently no dock/water area — consider adding a small southern dock with `DOCK_PLANK` + `WATER` tiles.

#### Viridian City ✅ (Minor tweaks)
- **Status:** Good layout with pond and multiple areas.
- **Missing NPCs:** Old Man Edgar (north gate, catch tutorial), Collector Magnus (house near gym, Collector's Challenge side quest).
- **Action:** Place Edgar near the north warp, Magnus in one of the houses.

#### Pewter City ✅ (Minor tweaks)
- **Status:** Good layout with museum.
- **Missing NPCs:** Museum Curator (inside museum — sells fossils post-game), Youngster Timmy (PokéCenter, trade NPC).
- **Action:** Add trade NPC to PokéCenter interior. Ensure museum interior has Curator with `flagDialogue` for post-game fossil sales.

#### Route 1 ✅ (Minor improvement)
- **Status:** Functional linear route.
- **Missing:** Rook's first appearance. Should have an NPC spawn for Rook that heals party and disappears (via `setsFlag`).
- **Action:** Add Rook NPC near midpoint with heal interaction and story flag.

#### Route 2 ⚠️ (Moderate improvement)
- **Status:** Generic linear route with Crystal Cavern entrance.
- **Missing:** Marina rival encounter #1 (friendly battle, Lv 10–12). She teaches type matchups.
- **Action:** Add Marina as a trainer spawn at the route midpoint. Add a few `BUSH` or `ROCK` tiles for visual variety.

#### Viridian Forest ✅ (Minor tweaks)
- **Status:** Good. Dense forest, bug catcher trainers, Rook appearance, Jerome quest.
- **Missing:** Synthesis Collective Aether sensor device NPC/object (storyline says player discovers it here). 
- **Action:** Add an interactable sign or NPC object representing the sensor device with story-relevant dialogue.

#### Route 3 (Tide Pool Path) ✅ (Good as-is)
- **Status:** Excellent coastal biome. Sand, tide pools, palms, water.
- **Has:** Kael rival encounter #2 (Lv 14–16), multiple trainer types.
- **No changes needed.**

---

### Act 2 Maps

#### Coral Harbor ⚠️ (Major redesign)
**Current issues:** Template city layout. Has some coastal tiles but building arrangement is generic.

**Storyline requirements:**
- Coastal harbor town with docks, boats, marine feel
- Captain Stern at the docks (ferry quest — find 3 stolen engine parts)
- Diver Lena on the beach (gives Good Rod)
- Chef Marco in a restaurant
- Zara Lux disguised as philanthropist at PokéCenter
- Gym Leader Coral (Water-type, free-spirited surfer)

**Redesign plan:**
- **Expand to 30×35** for more breathing room
- **Layout:** L-shaped harbor. Western half = town built along a curved coastline. Eastern half = open water with docks extending out. South = sandy beach area.
- **Tile usage:**
  - `DOCK_PLANK` (70) for pier/dock walkways extending into water
  - `WET_SAND` (69) along shoreline transitions
  - `SAND` (54) for beach areas
  - `TIDE_POOL` (68) in shallow areas near shore
  - `PALM_TREE` (65) scattered along coast
  - `WATER` (4) for deep harbor water
  - `CORAL_BLOCK` (71) for gym and harbor-side buildings
- **Building placement:** NOT on a grid. Stagger buildings along the coastline. Gym should be beach-adjacent or on a pier. PokéCenter inland. Houses scattered organically.
- **New features:** Fishing pier, boat sprites (sign NPCs representing boats), lighthouse or watchtower, coral reef visible in water, sandy paths instead of stone.

**Missing NPCs to add:**
- Captain Stern (docks) — ferry quest with `requireFlag` gating
- Diver Lena (beach) — gives Good Rod item
- Chef Marco (restaurant building) — berry collection side quest
- Zara Lux (near PokéCenter) — disguised, suspicious dialogue, `setsFlag: 'met-zara'`

**New tiles needed:** None — all tiles exist in `shared.ts`.

---

#### Route 4 (Basalt Ridge) ⚠️ (Moderate improvement)
**Current:** Has volcanic cliffs and cave entrance. Decent biome work.

**Storyline requirements:**
- Volcanic terrain between Coral Harbor and Ironvale
- Synthetic Pokémon attack — Rook intervenes (encounter #3)
- Entrance to Ember Mines dungeon

**Improvements:**
- Add `LAVA_ROCK` (72) tiles for dark volcanic ground patches
- Add `MAGMA_CRACK` (73) as hazard obstacles along edges
- Add `VOLCANIC_WALL` (74) replacing generic `CLIFF_FACE` 
- Place Rook NPC at midpoint with story trigger dialogue
- Increase map height to 35 tiles for more exploration space
- Add scattered `ROCK` (55) formations for rugged terrain feel

**New tiles needed:** None — volcanic tiles 72–74 already defined.

---

#### Ironvale City 🔴 (Full redesign)
**Current issues:** Identical template to 5 other cities. No industrial/forge theming despite being a Steel-type gym city with a forge.

**Storyline requirements:**
- Industrial city with Ferris's forge running on a ley line
- Miner Gil at mine entrance (mine clearance side quest)
- Blacksmith's Apprentice at forge (item reforging post-Gym 3)
- Tag battle with Kael vs. Synthesis Admins
- Aldric hologram addresses player after Ember Mines

**Redesign plan:**
- **Size: 30×30**
- **Layout:** Industrial district feel. Central forge/foundry as the dominant feature (large building, not just a gym box). Mine entrance on the eastern edge leading to Route 4/Ember Mines. River or canal running through the city (powered by ley line — use `WATER` with `METAL_FLOOR` bridges).
- **Tile usage:**
  - `METAL_FLOOR` (77) for forge area and industrial walkways
  - `METAL_WALL` (78) for forge/industrial buildings
  - `PIPE` (79) as decoration along forge building
  - `GEAR` (80) decorative elements near forge
  - `ROCK` (55) and `BOULDER` (52) near mine entrance
  - `CAVE_FLOOR` (58) at mine entrance transition
  - Standard `PATH` for main roads but `METAL_FLOOR` for forge district
- **Building placement:** Forge/Gym should be the largest structure, centrally placed. PokéCenter and Mart on opposite sides. Residential houses on the outskirts. Mine shaft entrance is a visible feature on the east side, not just a warp tile.
- **Unique feature:** Ley-line glow running under the forge — use `CONDUIT` (85) tiles in a line through the center of town, converging at the forge.

**Missing NPCs to add:**
- Blacksmith's Apprentice (forge interior) — item reforging service
- Miner Gil (mine entrance) — mine clearance quest

**New tiles needed:** None.

---

#### Route 5 (Canopy Trail) ✅ (Minor improvement)
**Current:** Good dense forest with dark grass and forest borders.

**Storyline requirements:**
- Synthesis traps (cages draining Pokémon energy) — player and Marina free captives
- Zara Lux reveals herself here (encounter #2)

**Improvements:**
- Add `VINE` (81) overlay tiles in dense sections for canopy depth
- Add `MOSS_STONE` (82) as obstacles in forested areas
- Add `GIANT_ROOT` (83) crossing the path in places (minor obstacles)
- Add `BERRY_TREE` (84) in a clearing (Berry Farmer Hana quest tie-in)
- Place NPC objects representing Synthesis traps (interactable signs with story flags)
- Add Zara Lux trainer spawn (triggered after freeing Pokémon, via `requireFlag`)

**New tiles needed:** None.

---

#### Verdantia Village ✅ (Minor tweaks)
**Current:** Already unique with forest borders and light grass. Good.

**Storyline requirements:**
- Ivy's Gym (Grass-type, vine barrier puzzle)
- Elder Moss in village center (Solatheon/Noctharion legend, gives Amulet Coin)
- Berry Farmer Hana (berry garden, regional side quest)
- Hidden Synthesis lab beneath village (mini-dungeon)

**Improvements:**
- Add `BERRY_TREE` (84) tiles in a garden area
- Add `GIANT_ROOT` (83) bordering the "ancient tree" center feature
- Verify Elder Moss NPC is present with correct Amulet Coin dialogue
- Add warp to `verdantia-hidden-lab` dungeon (could be triggered by story flag after Gym 4)

**New tiles needed:** None.

---

#### Voltara City 🔴 (Full redesign)
**Current issues:** Identical template. No tech/electric theming despite being an Electric-type gym city with a power grid.

**Storyline requirements:**
- Industrial tech city powered by Aether conduits
- Blitz (Electric-type Gym Leader, hyperactive inventor)
- Engineer Sparks (power plant — power restoration side quest)
- Move Tutor Bolt (PokéCenter — teaches moves for shards)
- Blitz hacks Collective network to locate their HQ

**Redesign plan:**
- **Size: 30×35** (larger city to reflect tech hub importance)
- **Layout:** Grid-based but with tech infrastructure visible. Central power plant/tower as dominant landmark. Streets lit by conduit lines running along pathways. Eastern district = Gym/training area. Western district = residential. Northern = power plant.
- **Tile usage:**
  - `CONDUIT` (85) running along main streets like glowing power lines
  - `ELECTRIC_PANEL` (86) at power substations (3 locations for Sparks quest)
  - `WIRE_FLOOR` (87) in the power plant area and gym approach
  - `METAL_FLOOR` (77) for industrial zones
  - `METAL_WALL` (78) for the power plant building
  - `PIPE` (79) visible infrastructure
  - Standard `PATH` for residential streets
- **Building placement:** Power plant is a large structure in the north. Gym is near the power plant (makes sense for Electric type). PokéCenter centrally located. Houses in a residential southern quarter. Multiple smaller tech buildings.
- **Unique feature:** Three Aether conduit substations scattered around the city (Engineer Sparks quest targets). Each is a `ELECTRIC_PANEL` tile with an interactable NPC/sign.

**Missing NPCs to add:**
- Engineer Sparks (power plant) — conduit repair quest
- Move Tutor Bolt (PokéCenter interior) — move teaching service

**New tiles needed:** None.

---

#### Ember Mines ⚠️ (Moderate improvement)
**Current:** Two-floor cave dungeon with mine tracks. Has Synthesis presence.

**Storyline requirements:**
- Full Synthesis Aether extraction operation
- Lab equipment, caged Pokémon, data terminals
- Dr. Vex Corbin boss battle (encounter #1)

**Improvements:**
- Add `CONTAINMENT_POD` (102) tiles representing caged Pokémon
- Add `TERMINAL` (104) for data terminals (interactable, story dialogue)
- Add `AETHER_CONDUIT` (103) showing extraction equipment
- Add `SYNTHESIS_FLOOR` (99) and `SYNTHESIS_WALL` (100) in lab areas to contrast with natural cave
- Ensure Dr. Vex is placed as a trainer with correct Lv 22–28 team and post-battle dialogue
- Consider expanding to 25×35 for more exploration space

**New tiles needed:** None.

---

### Act 3 Maps

#### Wraithmoor Town 🔴 (Full redesign)
**Current issues:** Identical template. No ghost/ruin theming despite being the Ghost-type gym town built in ancient ruins.

**Storyline requirements:**
- Misty, eerie town in ruins of a once-great city
- Morwen's Gym inside a crypt (spirit door puzzle)
- Ghost Girl in graveyard (Restless Spirit quest — 3 memory fragments)
- Historian Edith in library (Aether temple lore, gives Temple Map key item)

**Redesign plan:**
- **Size: 28×28**
- **Layout:** Asymmetric, broken. NOT a grid. Paths are cracked and winding. Buildings are partially ruined — some walls are `RUIN_WALL` instead of `HOUSE_WALL`. Central graveyard with `GRAVE_MARKER` tiles. The gym is sunken into the ground (crypt entrance via stairs).
- **Tile usage:**
  - `CRACKED_FLOOR` (89) as the primary walkable ground (replaces `PATH`)
  - `RUIN_WALL` (90) for building walls and scattered ruins
  - `RUIN_PILLAR` (91) throughout the town as ancient remnants
  - `GRAVE_MARKER` (88) in the cemetery area (4–8 markers)
  - `MIST` (92) overlay across the entire map for eerie atmosphere
  - `MOSS_STONE` (82) blocks scattered among ruins
  - `DARK_GRASS` (66) instead of regular grass
  - `DENSE_TREE` (24) or `AUTUMN_TREE` (64) for dead/gnarled trees
- **Building placement:** Scattered among ruins. PokéCenter is the only fully intact building. Library is a larger ruin structure. Gym entrance is in the graveyard. No PokéMart — or a makeshift one in a tent/ruin (story flavor: town is too old for modern commerce).
- **Unique features:**
  - Graveyard occupying ~20% of the map with `GRAVE_MARKER` tiles
  - 3 hidden memory fragment interact points (for Ghost Girl quest)
  - `MIST` overlay tiles covering most of the map
  - Ruined buildings with partial walls (walls have gaps)

**Missing NPCs to add:**
- Ghost Girl (graveyard) — Restless Spirit quest, gives Spell Tag
- Historian Edith (library interior) — Temple Map key item, ancient lore

**New tiles needed:** None — ghost/ruin tiles 88–92 all exist.

---

#### Route 6 🔴 (Full redesign)
**Current issues:** Generic flat route with only grass patches. Should transition between Voltara (tech) and Wraithmoor (ruins).

**Storyline requirements:**
- Connects tech city Voltara to ghost town Wraithmoor
- Should feel like leaving civilization and entering haunted territory

**Redesign plan:**
- **Size: 22×40** (longer for a transition feel)
- **Layout:** Three zones. Southern third = normal route with `CONDUIT` remnants from Voltara. Middle third = transitional with overgrown ruins, `AUTUMN_TREE` trees, `MOSS_STONE`. Northern third = misty and crumbling, `CRACKED_FLOOR` paths, `RUIN_PILLAR` scattered, `MIST` overlay.
- **Tile usage:**
  - Southern: `PATH`, `GRASS`, `TALL_GRASS`, `CONDUIT` (broken/abandoned)
  - Middle: `DARK_GRASS`, `AUTUMN_TREE`, `MOSS_STONE`, `BUSH`
  - Northern: `CRACKED_FLOOR`, `RUIN_PILLAR`, `MIST`, `GRAVE_MARKER` (1–2 roadside)
- **Trainers:** Add Psychic trainers, a Hex Maniac type, and 1 Synthesis grunt
- **NPCs:** Add a traveler NPC warning about Wraithmoor. Add a sign at the zone transition.

**New tiles needed:** None.

---

#### Route 7 🔴 (Full redesign)
**Current issues:** Generic flat route identical to Route 6. Should be mountainous terrain between Wraithmoor and Scalecrest.

**Storyline requirements:**
- Dr. Vex commands a blockade of Synthesis operatives (encounter #2)
- Rook reveals identity and gives Aether Lens key item (encounter #4)
- Mountain path approaching dragon citadel

**Redesign plan:**
- **Size: 22×45** (long mountain path)
- **Layout:** Switchback mountain trail. Path winds left and right as it climbs. Rocky terrain with cliff faces, volcanic rock from nearby Cinderfall. Synthesis blockade at the midpoint (3–4 grunts + Vex positioned blocking path).
- **Tile usage:**
  - `CLIFF_FACE` (57) bordering the path on both sides (mountain walls)
  - `ROCK` (55) scattered obstacles
  - `BOULDER` (52) blocking side paths (push puzzle optional)
  - `LAVA_ROCK` (72) in southern sections near volcanic influence
  - `CAVE_FLOOR` (58) for tunnel sections through the mountain
  - `CAVE_WALL` (59) for tunnel walls
  - `FORTRESS_WALL` (95) appearing in the northern section as Scalecrest approaches
- **Key feature:** Synthesis blockade — a row of grunt NPCs blocking the path. Must defeat them sequentially to advance. Rook appears after the blockade is cleared.

**Missing NPCs to add:**
- Dr. Vex Corbin (blockade, trainer encounter #2)
- Rook (post-blockade, gives Aether Lens, reveals backstory)
- 3–4 Synthesis Elite Grunts (Lv 32–40 teams)

**New tiles needed:** None.

---

#### Scalecrest Citadel 🔴 (Full redesign)
**Current issues:** Identical template. No fortress/dragon theming despite being an ancient citadel with dragon Pokémon.

**Storyline requirements:**
- Ancient fortress carved into a mountain
- Drake's Gym (Dragon-type, multi-stage gauntlet)
- Dragon Keeper Wren (dragon caves — Dragonair quest)
- Veteran Soldier Knox (citadel gate — gives Scope Lens)
- Descendants of ancient ley-line guardians

**Redesign plan:**
- **Size: 30×30**
- **Layout:** Fortress layout, NOT a town grid. Massive walls enclosing the citadel. Single fortified gate entrance from the south (Route 7). Interior is a courtyard with the gym as a central keep. Buildings are stone structures built into walls. Dragon caves accessible from the east.
- **Tile usage:**
  - `FORTRESS_WALL` (95) as the outer perimeter and building walls
  - `DRAGON_SCALE_FLOOR` (93) for the gym courtyard and approach
  - `DRAGON_STATUE` (94) flanking the main gate and gym entrance (4+ statues)
  - `ROCK_FLOOR` (51) or `CAVE_FLOOR` (58) for the dragon cave area
  - Minimal `GRASS` — mostly stone/fortress. Small courtyard garden only.
  - `CLIFF_FACE` (57) on the north/east edges (mountain side)
- **Building placement:** Gym (keep) is central and large. PokéCenter built into the western wall. No PokéMart — a quartermaster NPC inside the PokéCenter instead. Dragon caves are an open area to the east with `CAVE_FLOOR` and `ROCK` tiles.
- **Unique features:**
  - Fortified gate with `DRAGON_STATUE` sentinels
  - Dragon caves visible on the map (not just a warp)
  - Scale-pattern floor leading to the gym
  - Knox standing guard at the gate entrance

**Missing NPCs to add:**
- Dragon Keeper Wren (caves) — Dragonair rescue quest
- Veteran Soldier Knox (gate) — gives Scope Lens, war stories

**New tiles needed:** None — dragon tiles 93–95 all exist.

---

#### Cinderfall Town 🔴 (Full redesign)
**Current issues:** Identical template. No volcanic/fire theming despite being built on a dormant volcano.

**Storyline requirements:**
- Town on a dormant volcano
- Solara's Gym (Fire-type, passionate, former Aldric student)
- Hot Spring Attendant (heals party + cures status)
- Volcanologist Dr. Ash (observatory — volcanic survey side quest)
- Solara confides about Aldric's change

**Redesign plan:**
- **Size: 28×30**
- **Layout:** Built on volcanic slopes. Irregular terrain with elevation changes implied by `CLIFF_FACE` edges. Hot springs in the northeast. Observatory on high ground in the northwest. Town center is in a caldera depression.
- **Tile usage:**
  - `ASH_GROUND` (96) as the primary walkable ground (replaces `GRASS`)
  - `EMBER_VENT` (97) scattered around the edges (steam/smoke features)
  - `HOT_SPRING` (98) in the spa area (3–4 tiles with healing interaction)
  - `LAVA_ROCK` (72) for rocky outcrops and building foundations
  - `MAGMA_CRACK` (73) near the volcano rim (impassable hazards)
  - `VOLCANIC_WALL` (74) for cliff edges and building walls
  - `ROCK` (55) scattered volcanic boulders
  - Minimal vegetation — a few `BUSH` at most, no `TREE` or `GRASS`
- **Building placement:** Gym carved into the volcano slope (entrance faces downhill). Hot springs visible on the map. Observatory is a building on a raised platform. PokéCenter is heat-resistant (use `METAL_WALL` for a different look). Houses use `VOLCANIC_WALL`.
- **Unique features:**
  - Hot springs area — walk onto `HOT_SPRING` tile for full heal (special interaction)
  - Ember vents scattered around creating hazard ambiance
  - Volcanic caldera visible at the map edges (lava cracks, steam)
  - 5 volcanic vent locations for Dr. Ash survey quest (nearby routes too)

**Missing NPCs to add:**
- Hot Spring Attendant (springs) — full heal + status cure
- Dr. Ash (observatory) — volcanic survey quest

**New tiles needed:** None — volcanic tiles 96–98 all exist.

---

#### Route 8 (Stormbreak Pass) 🆕 (New map required)
**Currently missing entirely.** Referenced in storyline for Kael rival encounter #4.

**Storyline requirements:**
- Between Cinderfall and Victory Road
- Kael is frustrated about falling behind — intense 1v1 (Lv 34–37)
- Treacherous mountain/storm pass

**Design plan:**
- **Size: 20×45** (long treacherous pass)
- **Layout:** Narrow mountain pass with frequent switchbacks. Wind/storm aesthetic. Rocky cliffs on both sides with narrow path winding through.
- **Tile usage:**
  - `CLIFF_FACE` (57) dominating both sides
  - `ROCK` (55) and `BOULDER` (52) obstacles
  - `ASH_GROUND` (96) transitioning from Cinderfall
  - `CAVE_FLOOR` (58) for tunnel sections
  - `DARK_GRASS` (66) sparse patches in sheltered alcoves
  - Narrow `PATH` (1) — often only 2–3 tiles wide
- **Trainers:** Kael rival at midpoint, 3–4 ace trainers/hikers
- **NPCs:** Sign warning about the pass. Hiker NPC offering healing item.
- **Encounter table:** Rock/Ground/Flying types, Lv 32–40

**New tiles needed:** None.

---

### Act 4 Maps

#### Victory Road ⚠️ (Moderate improvement)
**Current:** Functional cave dungeon with quartz deposits.

**Storyline requirements:**
- Treacherous cave and mountain path
- Kael final rival battle at entrance (encounter #5, Lv 45–48)
- Kael's dialogue: "Go save the world. I'll hold the line here."

**Improvements:**
- Expand to **25×35** for a more epic feel befitting the final dungeon
- Add a multi-section layout: entrance area (where Kael waits), lower cave, upper cave, exit to League
- Add `AETHER_CRYSTAL` (106) clusters (ley-line energy visible this close to the League)
- Add `BOULDER` (52) push puzzles
- Add `CLIFF_FACE` (57) for elevation changes within the cave
- Add strength/puzzle obstacles requiring backtracking
- Increase trainers to 5–6 ace trainers (Lv 42–48)
- Verify Kael is placed at entrance with correct team and post-battle dialogue

**New tiles needed:** None.

---

#### Pokémon League ⚠️ (Expand significantly)
**Current:** 10×10 single room. Only 1 Elite Four member (Nerida).

**Storyline requirements:**
- 4 Elite Four chambers + Champion's chamber
- Nerida (Water/Ice), Theron (Fighting/Rock), Lysandra (Psychic/Dark), Ashborne (Fire/Dragon)
- Champion = Director Aldric Maren (Lv 50–55 full team)
- Ley-line nexus beneath Champion's chamber
- Ashborne warns player before Champion

**Improvements:**
- Create **5 separate interior maps** (one per Elite Four + Champion) or one large multi-room map
- **Option A (recommended):** Single large map **20×50** with 5 connected chambers
  - Each chamber: 20×10 with unique floor/wall theming per Elite Four type
  - Nerida chamber: `WATER` pools, ice-blue `LEAGUE_FLOOR`
  - Theron chamber: `ROCK_FLOOR`, `BOULDER` decorations
  - Lysandra chamber: `MIST` overlay, dark purple feel
  - Ashborne chamber: `LAVA_ROCK`, `EMBER_VENT`
  - Champion chamber: `LEAGUE_FLOOR`, `CHAMPION_THRONE`, `AETHER_CONDUIT` glowing lines
- **Option B:** 5 separate maps connected by warps (more flexible but more files)
- Add all 4 Elite Four as trainer spawns with correct teams
- Add Aldric as the Champion trainer
- Add Ashborne's pre-battle warning dialogue: "Whatever you find up there... don't lose yourself."

**New tiles needed:** None.

---

### New Dungeon: Abyssal Spire (Collective HQ) 🆕

**Currently missing entirely.** This is the game's climactic dungeon.

**Storyline requirements:**
- Converted ancient temple turned high-tech Synthesis lab
- 5 floors with escalating difficulty
- Floor 1: Entrance breached with Rook (double battle)
- Floor 2: Lab Wing — Dr. Vex final stand (encounter #3)
- Floor 3: Command Center — Zara Lux choice (convince to defect or battle)
- Floor 4: Sanctum — rescue Professor Willow
- Floor 5: Altar — Aldric confrontation (no battle here, he escapes)

**Design plan:**
- **5 separate map files:** `abyssal-spire-f1` through `abyssal-spire-f5`
- **Each floor: 20×20 to 25×25**

**Floor 1 — Entrance:**
- Mix of `RUIN_WALL`/`RUIN_PILLAR` (ancient temple) and `SYNTHESIS_WALL`/`SYNTHESIS_FLOOR` (lab conversion)
- `SYNTHESIS_DOOR` warps between rooms
- 4–5 grunt battles
- Rook as a partner NPC for double battle at the door

**Floor 2 — Lab Wing:**
- Predominantly `SYNTHESIS_FLOOR` and `SYNTHESIS_WALL`
- `CONTAINMENT_POD` (102) lining walls — caged Pokémon
- `TERMINAL` (104) data stations (interactable, story text)
- `AETHER_CONDUIT` (103) running through corridors
- Dr. Vex boss battle (final encounter, strongest team including Synthetic Pokémon)
- 2–3 elite grunts

**Floor 3 — Command Center:**
- Open room layout with `SYNTHESIS_FLOOR`
- Central command console (TERMINAL tiles)
- Zara Lux encounter — dialogue tree with choice
- `ELECTRIC_PANEL` and `PIPE` infrastructure visible

**Floor 4 — Sanctum:**
- Transition: more ancient temple (`RUIN_WALL`, `RUIN_PILLAR`) bleeding through Synthesis overlay
- Professor Willow NPC (captive, dialogue provides ley-line data)
- `AETHER_CRYSTAL` (106) appearing in walls
- 1–2 grunt battles

**Floor 5 — Altar:**
- Fully ancient temple aesthetic — `RUIN_WALL`, `RUIN_PILLAR`, `DRAGON_SCALE_FLOOR`
- Massive `AETHER_CONDUIT` converging at center
- `AETHER_CRYSTAL` formations everywhere
- Aldric NPC — philosophical dialogue, no battle, he escapes
- Visual: the legendary Pokémon silhouette implied by tile arrangement

**New tiles needed:** None.

---

### Post-Game Maps

#### Shattered Isles 🆕 (New map required)

**Storyline requirements:**
- Archipelago destroyed 20 years ago by Aether eruption
- Strongest wild Pokémon (Lv 55–70)
- Rook seeking redemption (encounter #6, optional battle Lv 70+)
- Father's Trail quest conclusion — hidden temple
- Solatheon encounter after badge puzzle

**Design plan:**
- **2–3 maps:** `shattered-isles-shore`, `shattered-isles-interior`, `shattered-isles-temple`
- **Shore (25×35):**
  - `SHATTERED_GROUND` (105) as primary terrain
  - `WATER` separating island fragments (bridges of `DOCK_PLANK`)
  - `AETHER_CRYSTAL` (106) jutting from the ground
  - `RUIN_WALL` and `RUIN_PILLAR` scattered remains
  - Rook NPC near a campfire (sign NPC as campfire)
  - High-level trainers (researchers, veterans)
- **Interior (25×30):**
  - Dense exploration area with `CAVE_FLOOR`, `AETHER_CRYSTAL`, `SHATTERED_GROUND`
  - Wild Pokémon encounters Lv 60–70
  - Father's journal clue locations (interactable NPCs/signs)
- **Temple (20×25):**
  - `DRAGON_SCALE_FLOOR`, `RUIN_PILLAR`, `AETHER_CRYSTAL`
  - Badge puzzle room (8 badge slots)
  - Solatheon legendary encounter
  - Father's final message NPC
  - `AETHER_CONDUIT` convergence point at center

**New tiles needed:** None.

---

#### Crystal Cavern (Deep) 🆕 (New map or expand existing)

**Storyline requirements:**
- Deepest level for post-game Marina encounter #4 (Lv 55–58)
- Noctharion (Shadow legendary) encounter
- Represents entropy and chaos side of Aether

**Design plan:**
- **New map: `crystal-cavern-deep` (25×30)**
- `CAVE_FLOOR` and `CAVE_WALL` base
- Heavy `AETHER_CRYSTAL` (106) formations — the crystal theme turned up to maximum
- `DARK_GRASS` pockets where light filters in
- `MIST` overlay for atmosphere
- Marina NPC at midpoint — optional battle and research dialogue
- Noctharion encounter at deepest point
- Encounter table: Dark, Rock, Ghost types Lv 55–65

**New tiles needed:** None.

---

## Missing Story NPCs Summary

NPCs referenced in the storyline bible but not yet placed in maps:

| NPC | Location | Role | Priority |
|-----|----------|------|----------|
| **Rook** (encounter 1) | Route 1 | Heals party, disappears | HIGH |
| **Old Man Edgar** | Viridian City (north gate) | Catch tutorial | MEDIUM |
| **Collector Magnus** | Viridian City (house) | Collector's Challenge quest | MEDIUM |
| **Museum Curator** | Pewter Museum interior | Fossil sales post-game | MEDIUM |
| **Youngster Timmy** | Pewter PokéCenter interior | Trade NPC | LOW |
| **Captain Stern** | Coral Harbor docks | Ferry quest | HIGH |
| **Diver Lena** | Coral Harbor beach | Gives Good Rod | HIGH |
| **Chef Marco** | Coral Harbor restaurant | Berry collection quest | MEDIUM |
| **Zara Lux (disguised)** | Coral Harbor PokéCenter area | Story encounter #1 | HIGH |
| **Blacksmith's Apprentice** | Ironvale forge interior | Item reforging | MEDIUM |
| **Miner Gil** | Ironvale mine entrance | Mine clearance quest | HIGH |
| **Elder Moss** | Verdantia village center | Solatheon lore, Amulet Coin | HIGH |
| **Berry Farmer Hana** | Verdantia berry garden | Berry Farming quest | MEDIUM |
| **Engineer Sparks** | Voltara power plant | Power restoration quest | HIGH |
| **Move Tutor Bolt** | Voltara PokéCenter interior | Move teaching | MEDIUM |
| **Ghost Girl** | Wraithmoor graveyard | Restless Spirit quest, Spell Tag | HIGH |
| **Historian Edith** | Wraithmoor library | Temple Map key item, lore | HIGH |
| **Dragon Keeper Wren** | Scalecrest dragon caves | Dragonair rescue quest | HIGH |
| **Veteran Soldier Knox** | Scalecrest gate | Scope Lens, war stories | MEDIUM |
| **Hot Spring Attendant** | Cinderfall hot springs | Full heal + status cure | HIGH |
| **Dr. Ash** | Cinderfall observatory | Volcanic survey quest | MEDIUM |
| **Rook** (encounters 2–5) | Viridian Forest, Basalt Ridge, Route 7, Abyssal Spire | Story progression | HIGH |
| **Dr. Vex** (encounters 2–3) | Route 7, Abyssal Spire F2 | Boss battles | HIGH |
| **Zara Lux** (encounters 2–3) | Canopy Trail, Abyssal Spire F3 | Story battles/choice | HIGH |
| **Aldric** (encounters 1–3) | Ironvale hologram, Abyssal Spire F5, Champion Chamber | Boss progression | HIGH |
| **Elite Four** (Theron, Lysandra, Ashborne) | Pokémon League | Missing — only Nerida exists | HIGH |
| **Kael** (Route 8) | Route 8 / Stormbreak Pass | Rival encounter #4 | HIGH |

---

## New Tiles Needed

All 110 tile types in `shared.ts` cover every biome described in the storyline. **No new tile types are needed.** The issue is purely that existing biome tiles are not being used in their intended maps.

However, the following **visual improvements** to the tileset image (`overworld.png`) may be needed:

| Tile ID | Tile Name | Current Visual | Suggested Improvement |
|---------|-----------|---------------|----------------------|
| 92 | `MIST` | May be a simple white overlay | Ensure it's semi-transparent for proper fog effect |
| 98 | `HOT_SPRING` | Basic blue | Add steam/bubble visual distinction from regular `WATER` |
| 93 | `DRAGON_SCALE_FLOOR` | Unknown rendering | Ensure ornate scale pattern is visible at 16×16 |
| 105 | `SHATTERED_GROUND` | Unknown rendering | Ensure cracked/fractured look distinct from `CRACKED_FLOOR` |
| 106 | `AETHER_CRYSTAL` | Unknown rendering | Should glow/shimmer — may need animation or bright color |

---

## Implementation Priority

### Phase 1 — Critical Story Maps (highest impact)
1. **Create Route 8 (Stormbreak Pass)** — missing, blocks story flow
2. **Create Abyssal Spire floors 1–5** — missing, entire Act 3 climax
3. **Expand Pokémon League** — only 1 of 5 chambers exists
4. **Redesign Wraithmoor Town** — ghost/ruin biome, anchors Act 3 mood
5. **Redesign Cinderfall Town** — volcanic biome, final gym city

### Phase 2 — City Uniqueness (visual quality)
6. **Redesign Ironvale City** — industrial/forge theme
7. **Redesign Voltara City** — tech/electric theme
8. **Redesign Scalecrest Citadel** — fortress/dragon theme
9. **Improve Coral Harbor** — better harbor layout (partially themed already)

### Phase 3 — Route Polish
10. **Redesign Route 6** — tech-to-ruins transition
11. **Redesign Route 7** — mountain pass with Synthesis blockade
12. **Improve Route 5** — add forest tiles (vine, moss, roots)
13. **Improve Route 4** — add volcanic tiles
14. **Expand Victory Road** — larger, more challenging

### Phase 4 — Post-Game Content
15. **Create Shattered Isles** (3 maps)
16. **Create Crystal Cavern Deep**
17. **Create Verdantia Hidden Lab** mini-dungeon

### Phase 5 — NPC Placement
18. Add all missing story NPCs (see table above)
19. Add quest-giver NPCs with proper flags and dialogue
20. Add Elite Four members (Theron, Lysandra, Ashborne) + Champion Aldric

---

## Map Design Principles

1. **No two cities should share the same layout.** Each city must have a unique building arrangement, path network, and dominant tile palette.
2. **Biome tiles must match the storyline description.** If the story says "volcanic town," every tile should reinforce that — ash ground, ember vents, lava rock. Not just generic grass with a fire gym.
3. **Routes should transition between biomes.** A route connecting a tech city to a ghost town should visibly shift from one aesthetic to the other.
4. **Dungeons mix ancient and modern.** The Synthesis Collective operates in converted ancient ruins — maps should show both layers (ruin tiles + synthesis tiles).
5. **NPCs should exist where the story places them.** Every NPC mentioned in the storyline bible for a location must have a spawn in that map with appropriate dialogue, flags, and interaction types.
6. **Maps should have environmental storytelling.** Broken conduits in a power city, gravestones in a ghost town, containment pods in an evil lab — these details make the world feel alive without dialogue.
