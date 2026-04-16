# Storyline Implementation Inventory

## Research Questions
1. Quest data: Every quest defined with ID, name, steps, flags, rewards
2. Trainer data: All trainers — rivals, gym leaders, Elite Four, Champion, Synthesis Collective, Rook
3. City NPC spawns with names, dialogue, flags, quest connections
4. Route NPCs/story triggers (Rook, Marina, Kael, Synthesis grunts)
5. Dungeon NPCs (Dr. Vex in Ember Mines, etc.)
6. Pokemon League — Elite Four and Champion
7. Abyssal Spire / Collective HQ existence
8. Shattered Isles post-game area existence
9. Event/flag system usage
10. Cutscene/event system beyond dialogue

---

## 1. QUEST DATA (`frontend/src/data/quest-data.ts`)

**12 quests defined** — matches all 12 from the storyline bible.

| # | Quest ID | Name | Steps | Key Flags | Rewards | Status vs Bible |
|---|----------|------|-------|-----------|---------|-----------------|
| 1 | `lost-delivery` | The Lost Delivery | 3 steps: deliver to Viridian, Pewter, return | `quest_lostDelivery_*` | rare-candy x1, super-potion x5, $1000 | **PARTIALLY** — Bible has 3 packages + Bike Voucher; implemented has 2 deliveries, no Coral Harbor delivery, no Bike Voucher |
| 2 | `collectors-challenge` | The Collector's Challenge | 4 steps: show Water, Fire, Flying, return | `quest_collector_*` | leftovers x1, $2000 | **PARTIALLY** — Bible has 10 Pokémon across 3 tiers with Silk Scarf, Expert Belt, Leftovers; implemented has only 3 Pokémon + Leftovers |
| 3 | `lost-pokemon` | The Lost Pokémon | 2 steps: search forest, return Geodude | `quest_lostPokemon_*` | $500 | **PARTIALLY** — Bible says reward is TM Rock Slide; implementation has no item reward |
| 4 | `mine-clearance` | Mine Clearance | 4 steps: enter mine, defeat grunts F1-F3 | `quest_mineClearance_*` | fire-stone x1, $1500 | **PARTIALLY** — Bible says player's choice of stone; implementation gives Fire Stone only |
| 5 | `berry-farming` | Berry Farming | 4 steps: plant R1, R2, forest, return | `quest_berryFarming_*` | sitrus-berry x5, lum-berry x3, $800 | **PARTIALLY** — Bible has 5 locations + Berry Pot key item; implementation has 3 locations, no Berry Pot |
| 6 | `stern-engine` | Captain Stern's Engine | 4 steps: recover 3 parts, return | `quest_sternEngine_*` | mystic-water x1, $1200 | **FULLY IMPLEMENTED** (matches bible) |
| 7 | `chef-special` | The Chef's Special | 6 steps: bring 5 berries, return | `quest_chef_*` | rare-candy x2, $600 | **PARTIALLY** — Bible rewards stat-boosting meals; implementation gives Rare Candies |
| 8 | `power-restore` | Power Restoration | 4 steps: repair 3 conduits, report | `quest_powerRestore_*` | thunder-stone x1, $2000 | **PARTIALLY** — Bible also gives TM Thunderbolt; implementation gives only Thunderstone |
| 9 | `restless-spirit` | The Restless Spirit | 4 steps: find 3 memory fragments, return | `quest_restlessSpirit_*` | spell-tag x1, $1500 | **PARTIALLY** — Bible also has rare Ghost encounter; implementation has no encounter |
| 10 | `dragon-lament` | The Dragon's Lament | 3 steps: herb, mineral, craft & return | `quest_dragonLament_*` | dragon-scale x1, $2500 | **PARTIALLY** — Bible also gives Dragonair joins party (Lv 35); implementation gives only Dragon Scale |
| 11 | `volcanic-survey` | Volcanic Survey | 6 steps: 5 vents + return | `quest_volcanicSurvey_*` | fire-stone x1, charcoal x1, $1800 | **FULLY IMPLEMENTED** |
| 12 | `father-trail` | The Father's Trail | 6 steps: 5 clue locations + find father | `quest_fatherTrail_*` | master-ball x1, $0 | **PARTIALLY** — Quest data defined but Shattered Isles map doesn't exist, so steps 5-6 can't actually be completed |

---

## 2. TRAINER DATA (`frontend/src/data/trainer-data.ts`)

### Rival Kael (6 encounters — ALL DEFINED)
| # | ID | Location | Lvl Range | Party Size | Placed on Map? |
|---|-----|----------|-----------|------------|----------------|
| 1 | `rival-1` | Prof. Willow's Lab | 5 | 1 | YES — `pallet-oak-lab.ts` |
| 2 | `rival-2` | Route 3 | 14-16 | 3 | YES — `route-3.ts` |
| 3 | `rival-3` | Ironvale City (tag-battle) | 25-28 | 4 | YES — `ironvale-city.ts` (NPC, not trainer battle) |
| 4 | `rival-4` | Route 8 | 34-37 | 5 | YES — `route-8.ts` |
| 5 | `rival-5` | Victory Road entrance | 45-48 | 6 | YES — `victory-road.ts` |
| 6 | `rival-6` | Aether Sanctum (post-game) | 62-65 | 6 | YES — `aether-sanctum.ts` |

**Status: FULLY IMPLEMENTED** — All 6 encounters defined in trainer data AND placed on maps. Dialogue matches bible tone.

### Marina (4 encounters — 2 DEFINED, 2 MISSING)
| # | ID | Location | Lvl Range | Placed? | Status |
|---|-----|----------|-----------|---------|--------|
| 1 | `marina-1` | Route 2 | 10-12 | YES — `route-2.ts` | **IMPLEMENTED** |
| 2 | N/A | Coral Harbor PokéCenter | 20-22 (no battle) | NO | **MISSING** — No NPC for Marina encounter 2 |
| 3 | N/A | Canopy Trail (Route 5) | 30-32 (co-op) | NPC exists on `route-5.ts` but no trainer battle | **PARTIAL** — dialogue NPC only, no co-op battle |
| 4 | `marina-4` | Crystal Cavern Depths | 55-58 | YES — `crystal-cavern-depths.ts` | **IMPLEMENTED** |

### Synthesis Grunts
| ID | Placed On | Status |
|----|-----------|--------|
| `synthesis-grunt-1` | Ember Mines (inferred) | Defined |
| `synthesis-grunt-2` | Ember Mines (inferred) | Defined |
| `synthesis-grunt-3` | Ember Mines (inferred) | Defined |
| `synthesis-grunt-4` | Route 4 (Basalt Ridge) | YES — `route-4.ts` |
| `synthesis-grunt-5` | Ember Mines | YES — `ember-mines.ts` |
| `synthesis-grunt-6` | Route 5 | YES — `route-5.ts` |
| `stern-grunt-1` | Route 3 (engine quest) | YES — `route-3.ts` |
| `stern-grunt-2` | Coral Harbor docks | YES — `coral-harbor.ts` |
| `stern-grunt-3` | Coral Harbor beach | YES — `coral-harbor.ts` |

**Status: PARTIALLY IMPLEMENTED** — Early grunts (1-3) defined in trainer data but unclear if all are placed. Route 7 blockade grunts from the bible (gauntlet of grunts before Vex encounter 2) are not individually defined.

### Dr. Vex Corbin — Admin (3 encounters per bible — 2 DEFINED)
| # | ID | Location | Placed? | Status |
|---|-----|----------|---------|--------|
| 1 | `admin-vex-1` | Ember Mines Floor 2 | YES — `ember-mines.ts` | **IMPLEMENTED** |
| 2 | `admin-vex-2` | Route 7 blockade | YES — `route-7.ts` | **IMPLEMENTED** |
| 3 | N/A | Collective HQ Lab Wing | NO | **MISSING** — Abyssal Spire doesn't exist |

### Zara Lux — Admin (3 encounters per bible — 1 PARTIAL)
| # | Location | Status |
|---|----------|--------|
| 1 | Coral Harbor (disguised) | **PARTIAL** — NPC exists at `coral-harbor.ts` but no battle, just disguise dialogue |
| 2 | Canopy Trail (Route 5) | **MISSING** — Bible says she reveals herself; no Zara trainer battle on Route 5 |
| 3 | Collective HQ Command Center | **MISSING** — Abyssal Spire doesn't exist |

**No `admin-zara-*` trainer data entries exist at all.** Zara has no battle teams defined.

### Director Aldric Maren — Boss/Champion
| # | Location | Status |
|---|----------|--------|
| 1 | Ironvale hologram | **IMPLEMENTED** — NPC in `ironvale-city.ts` with dialogue |
| 2 | Collective HQ Inner Sanctum | **MISSING** — Abyssal Spire doesn't exist |
| 3 | Champion's Chamber | **PARTIALLY** — `champion-aldric` trainer data defined (6 Pokémon Lv 52-55, Mewtwo ace) but NOT placed on Pokémon League map |

### Rook — The Drifter (6 encounters per bible)
| # | Location | Status |
|---|----------|--------|
| 1 | Route 1 | **IMPLEMENTED** — NPC at `route-1.ts`, heals & dialogue, flag `met_rook_route1` |
| 2 | Viridian Forest | **IMPLEMENTED** — NPC at `viridian-forest.ts`, warns about white coats |
| 3 | Basalt Ridge (Route 4) | **IMPLEMENTED** — NPC at `route-4.ts`, tells about synthetic Pokémon, flag `met_rook_basalt` |
| 4 | Route 7 | **IMPLEMENTED** — NPC at `route-7.ts`, reveals identity, gives Aether Lens, flag `rook_identity_revealed` |
| 5 | Collective HQ | **MISSING** — Abyssal Spire doesn't exist |
| 6 | Post-game (Aether Sanctum) | **IMPLEMENTED** — NPC at `aether-sanctum.ts` |

**No Rook trainer battle data exists.** Bible says Rook has a Lv 70+ team for post-game optional battle — NOT defined in trainer-data.ts.

### Gym Leaders (8 gym leaders — ALL 8 DEFINED)
| # | ID | Name | Type | Town | Party | Status |
|---|-----|------|------|------|-------|--------|
| 1 | `gym-brock` | Brock | Rock | Pewter City | Geodude Lv12, Onix Lv14 | **IMPLEMENTED** |
| 2 | `gym-coral` | Coral | Water | Coral Harbor | Staryu Lv18, Shellder Lv18, Starmie Lv21 | **IMPLEMENTED** |
| 3 | `gym-ferris` | Ferris | Steel | Ironvale City | Magnemite Lv24, Magneton Lv24, Onix Lv27 | **IMPLEMENTED** |
| 4 | `gym-ivy` | Ivy | Grass | Verdantia Village | Weepinbell Lv28, Parasect Lv28, Venusaur Lv31 | **IMPLEMENTED** |
| 5 | `gym-blitz` | Blitz | Electric | Voltara City | Voltorb Lv32, Raichu Lv33, Electrode Lv33, Electabuzz Lv35 | **IMPLEMENTED** |
| 6 | `gym-morwen` | Morwen | Ghost | Wraithmoor Town | Haunter x2, Gengar Lv40 | **IMPLEMENTED** |
| 7 | `gym-drake` | Drake | Dragon | Scalecrest Citadel | Dragonair Lv42, Gyarados Lv42, Dragonite Lv45 | **IMPLEMENTED** |
| 8 | `gym-solara` | Solara | Fire | Cinderfall Town | Rapidash Lv44, Arcanine Lv44, Magmar Lv46, Charizard Lv48 | **IMPLEMENTED** |

**Status: FULLY IMPLEMENTED** — All 8 gym leaders defined with teams, dialogue (including story-relevant lines), and placed in their gym maps.

### Elite Four (4 members per bible — ONLY 1 DEFINED)
| # | Name | Type | Trainer Data? | Map Placed? | Status |
|---|------|------|---------------|-------------|--------|
| 1 | Nerida | Water/Ice | YES — `elite-nerida` (5 Pokémon Lv 50-52) | YES — `pokemon-league.ts` | **IMPLEMENTED** |
| 2 | Theron | Fighting/Rock | **NO** | **NO** | **MISSING** |
| 3 | Lysandra | Psychic/Dark | **NO** | **NO** | **MISSING** |
| 4 | Ashborne | Fire/Dragon | **NO** | **NO** | **MISSING** |

### Champion Aldric
- Trainer data: YES — `champion-aldric` (6 Pokémon Lv 52-55, ace: Mewtwo #150)
- Map placed: **NO** — Not in `pokemon-league.ts`
- **Status: PARTIALLY IMPLEMENTED** — Data exists but not placed on any map

---

## 3. CITY NPCs (Story NPCs per city)

### Pallet Town (Littoral Town in bible)
| NPC | Bible Name | Status | Flags |
|-----|-----------|--------|-------|
| Generic NPC x2 | N/A | Flavor NPCs | — |
| Pip (Delivery Girl) | Delivery Girl Pip | **IMPLEMENTED** | `quest_lostDelivery_started/complete` |
| Wade (Fisherman) | Fisherman Wade | **IMPLEMENTED** | `received_old_rod` |
| Mom | Mom (heals party) | **MISSING** — No Mom NPC in player house | — |
| Kael's Grandfather | Retired trainer | **MISSING** | — |

### Viridian City
| NPC | Bible Name | Status | Flags |
|-----|-----------|--------|-------|
| Gym block NPC | N/A | **IMPLEMENTED** | — |
| Old Man route guide | Old Man Edgar | **PARTIAL** (no catch tutorial) | — |
| Collector Magnus | Collector Magnus | **IMPLEMENTED** | `quest_collector_started/complete` |
| Delivery receiver | N/A (quest step) | **IMPLEMENTED** | `quest_lostDelivery_viridian` |
| Nurse Joy | Nurse Joy (unusual injuries) | **MISSING** — Generic PokéCenter | — |

### Pewter City
| NPC | Bible Name | Status |
|-----|-----------|--------|
| Hiker Jerome | Hiker Jerome | **IMPLEMENTED** — quest giver for Lost Pokémon |
| Museum Curator | Museum Curator | **MISSING** — Pewter Museum map exists but needs checking |
| Delivery receiver | N/A (quest step) | **IMPLEMENTED** |
| Youngster Timmy | Trade NPC | **MISSING** |

### Coral Harbor
| NPC | Bible Name | Status | Flags |
|-----|-----------|--------|-------|
| Captain Stern | Captain Stern | **IMPLEMENTED** | `quest_sternEngine_*` |
| Diver Lena | Diver Lena | **IMPLEMENTED** | `receivedGoodRod` |
| Chef Marco | Chef Marco | **IMPLEMENTED** | `quest_chef_*` |
| Zara Lux (disguised) | Zara Lux enc. 1 | **IMPLEMENTED** | `met_zara_disguise` |
| Marina (enc. 2) | Marina in PokéCenter | **MISSING** | — |

### Ironvale City
| NPC | Bible Name | Status | Flags |
|-----|-----------|--------|-------|
| Miner Gil | Miner Gil | **IMPLEMENTED** | `quest_mineClearance_*` |
| Aldric hologram | Aldric enc. 1 | **IMPLEMENTED** | `found_mines_terminal` → `saw_aldric_hologram` |
| Kael (tag-battle) | Kael enc. 3 | **IMPLEMENTED** (NPC dialogue only, no actual tag-battle mechanic) | `met_kael_ironvale` |
| Blacksmith's Apprentice | Blacksmith's Apprentice | **MISSING** | — |
| Move Tutor | N/A | **IMPLEMENTED** | — |

### Verdantia Village
| NPC | Bible Name | Status | Flags |
|-----|-----------|--------|-------|
| Elder Moss | Elder Moss | **IMPLEMENTED** | `heard_solatheon_legend` |
| Berry Farmer Hana | Berry Farmer Hana | **IMPLEMENTED** | `quest_berryFarming_*` |
| Herb pickup | Dragon's Lament ingredient | **IMPLEMENTED** | `dragon-herb-found` |
| Name Rater | N/A | **IMPLEMENTED** | — |
| Move Tutor | N/A | **IMPLEMENTED** | — |

### Voltara City
| NPC | Bible Name | Status | Flags |
|-----|-----------|--------|-------|
| Engineer Sparks | Engineer Sparks | **IMPLEMENTED** | `quest_powerRestore_*` |
| Move Tutor Bolt | Move Tutor Bolt | **IMPLEMENTED** | — |
| Blitz story NPC | Blitz (HQ discovery) | **IMPLEMENTED** | `blitz_hq_discovery` |
| 3 Conduit repairs | Power Restoration quest | **IMPLEMENTED** | `conduit-1/2/3-repaired` |
| Willow kidnapping event | Prof. Willow kidnapped | **IMPLEMENTED** | `willow_kidnapped` |

### Wraithmoor Town
| NPC | Bible Name | Status | Flags |
|-----|-----------|--------|-------|
| Ghost Girl | Ghost Girl | **IMPLEMENTED** | `quest_restlessSpirit_started` |
| Historian Edith | Historian Edith | **IMPLEMENTED** | `received_temple_map` |
| 3 Memory fragments | Restless Spirit quest | **IMPLEMENTED** | `memory-1/2/3-found` |
| Shadow Tutor | N/A | **IMPLEMENTED** | — |

### Scalecrest Citadel
| NPC | Bible Name | Status | Flags |
|-----|-----------|--------|-------|
| Dragon Keeper Wren | Dragon Keeper Wren | **IMPLEMENTED** | `quest_dragonLament_started` |
| Dragon Tutor | N/A | **IMPLEMENTED** | — |
| Veteran Soldier Knox | Veteran Soldier Knox | **MISSING** | — |

### Cinderfall Town
| NPC | Bible Name | Status | Flags |
|-----|-----------|--------|-------|
| Solara story NPC | Solara confession | **IMPLEMENTED** | `solara_confession` |
| Hot Spring Attendant | Hot Spring Attendant | **IMPLEMENTED** (heal interaction) | — |
| Dr. Ash | Volcanologist Dr. Ash | **IMPLEMENTED** | `quest_volcanicSurvey_*` |

---

## 4. ROUTE NPCs / Story Triggers

### Route 1
- Rook encounter 1: **IMPLEMENTED** — heals, dialogue, flag `met_rook_route1`
- Trainers: Bug catchers, youngsters — basic encounters

### Route 2
- Marina encounter 1: **IMPLEMENTED** — trainer battle `marina-1`
- Trainers: Youngsters, Lass, Camper — with story-flavored dialogue (white coats mention)

### Route 3 (Tide Pool Path)
- Kael encounter 2: **IMPLEMENTED** — trainer battle `rival-2`
- Stern quest grunt 1: **IMPLEMENTED** — `stern-grunt-1`
- Coastal trainers (swimmers, fisher, sailor): **IMPLEMENTED** with story dialogue (mystery boats, strange water)

### Route 4 (Basalt Ridge)
- Rook encounter 3: **IMPLEMENTED** — NPC dialogue, flag `met_rook_basalt`
- Synthesis grunt: **IMPLEMENTED** — `synthesis-grunt-4`
- Hikers with story dialogue: **IMPLEMENTED**

### Route 5 (Canopy Trail)
- Marina encounter 3 (co-op): **PARTIAL** — NPC dialogue about traps, flags `found_synthesis_trap`/`helped_marina_traps`, but no actual co-op battle mechanic
- Synthesis grunt: **IMPLEMENTED** — `synthesis-grunt-6`
- Zara Lux reveal (encounter 2): **MISSING** — Bible says Zara reveals herself here; no Zara NPC on Route 5

### Route 6
- Trainers: Psychic Elena — **IMPLEMENTED**
- No specific story events in bible for this route

### Route 7
- Dr. Vex encounter 2: **IMPLEMENTED** — trainer battle `admin-vex-2`
- Rook identity reveal (encounter 4): **IMPLEMENTED** — gives Aether Lens, flag `rook_identity_revealed`
- Bible says gauntlet of grunts: **MISSING** — no grunt gauntlet defined

### Route 8 (Stormbreak Pass)
- Kael encounter 4: **IMPLEMENTED** — trainer battle `rival-4`
- Ace Trainers: **IMPLEMENTED** — `ace-trainer-4`, `ace-trainer-5`

---

## 5. DUNGEON NPCs

### Viridian Forest
- Rook encounter 2: **IMPLEMENTED** — warning about white coats
- Synthesis sensor discovery: **IMPLEMENTED** — flag `found_synthesis_sensor`
- Jerome's Geodude (quest): **IMPLEMENTED** — flag `quest_lostPokemon_found`
- Bug catchers: **IMPLEMENTED**

### Crystal Cavern
- Hikers: **IMPLEMENTED** — `hiker-1` through `hiker-5`
- Item pickups with flags: **IMPLEMENTED**

### Crystal Cavern Depths
- Marina encounter 4: **IMPLEMENTED** — trainer battle `marina-4`

### Ember Mines
- Dr. Vex encounter 1: **IMPLEMENTED** — trainer battle `admin-vex-1`
- Synthesis grunt 5: **IMPLEMENTED**
- Data terminal: **IMPLEMENTED** — flag `found_mines_terminal`
- Caged Pokémon: **IMPLEMENTED** — flag `found_caged_pokemon`
- Dragon mineral (quest): **IMPLEMENTED** — flag `dragon-mineral-found`

### Victory Road
- Kael encounter 5: **IMPLEMENTED** — trainer battle `rival-5`
- Ace trainers: **IMPLEMENTED** — `ace-trainer-1` through `ace-trainer-3`
- Volcanic vents (quest): **IMPLEMENTED** — flags `vent-1` through `vent-5-recorded`

### Aether Sanctum
- Rook encounter 6: **IMPLEMENTED** — NPC dialogue (post-game), requires `champion_defeated`
- Kael encounter 6: **IMPLEMENTED** — trainer battle `rival-6`

---

## 6. POKEMON LEAGUE (`frontend/src/data/maps/interiors/pokemon-league.ts`)

Current state of the Pokemon League map:
- **Map layout**: 10x10 room with basic floor tiles
- **NPCs**: League Tutor (move tutor), League Guide (generic welcome)
- **Trainers placed**: Only **Nerida** (Elite Four #1) at position (4,2)
- **Missing from map**: Theron (#2), Lysandra (#3), Ashborne (#4), Champion Aldric
- **Warps**: Goes back to Victory Road only

**Status: MINIMALLY IMPLEMENTED** — Only 1 of 5 required trainers placed. No sequential room structure for Elite Four gauntlet. No Champion chamber.

---

## 7. ABYSSAL SPIRE / COLLECTIVE HQ

**STATUS: DOES NOT EXIST**

No map files for:
- `abyssal-spire-f1` through `abyssal-spire-f5`
- `collective-hq`
- `synthesis-hq`

This is the **Act 3 climax dungeon** — the single largest missing storyline content. It should contain:
- Floor 1: Rook double battle
- Floor 2: Dr. Vex final stand (encounter 3)
- Floor 3: Zara Lux choice/battle (encounter 3)
- Floor 4: Professor Willow rescue
- Floor 5: Aldric confrontation (encounter 2)

**Impact**: Without this dungeon, Act 3 of the main story cannot be completed.

---

## 8. SHATTERED ISLES (Post-Game)

**STATUS: DOES NOT EXIST**

No map files for:
- `shattered-isles-shore`
- `shattered-isles-interior`
- `shattered-isles-temple`

This blocks:
- Father's Trail quest steps 5-6
- Solatheon legendary encounter
- Rook post-game battle
- Post-game content in general

---

## 9. EVENT/FLAG SYSTEM

### Flag System Implementation
- `GameManager.ts` provides `getFlag(flag)`, `setFlag(flag, value)`, `getFlags()`
- Flags stored as `Record<string, boolean>` on GameManager
- NPC spawns support `setsFlag`, `requireFlag`, and `flagDialogue` for conditional behavior
- Trainer spawns support `condition` field for visibility

### Story Flags Inventory (discovered across all maps)

**Core Progression Flags:**
- `receivedStarter` — Gate for Rook/Route access
- `hasParcel` — Viridian PokéMart parcel quest
- `oakOfferedStarter` — Lab intro sequence
- `found_synthesis_sensor` — Viridian Forest discovery
- `found_mines_terminal` — Ember Mines data terminal
- `found_caged_pokemon` — Ember Mines caged Pokémon
- `saw_aldric_hologram` — Ironvale City hologram (requires `found_mines_terminal`)
- `met_kael_ironvale` — Kael tag-battle encounter (requires `found_mines_terminal`)
- `blitz_hq_discovery` — Voltara Blitz reveals HQ location (requires `saw_aldric_hologram`)
- `willow_kidnapped` — Professor Willow kidnapped (requires `blitz_hq_discovery`)
- `rook_identity_revealed` — Route 7 Rook reveal (requires `saw_aldric_hologram`)
- `solara_confession` — Cinderfall Solara confession (requires `rook_identity_revealed`)
- `champion_defeated` — Unlocks post-game content

**Rook Encounter Flags:**
- `met_rook_route1`, `met_rook_basalt`

**Zara Flag:**
- `met_zara_disguise` — Coral Harbor disguised encounter

**Quest Flags (12 quest chains):**
- `quest_lostDelivery_started/viridian/pewter/complete`
- `quest_collector_started/water/fire/flying/complete`
- `quest_lostPokemon_started/found/complete`
- `quest_mineClearance_started/entered/f1/f2/f3/complete`
- `quest_berryFarming_started/route1/route2/forest/complete`
- `quest_sternEngine_started/part1/part2/part3/complete`
- `quest_chef_started/oran/pecha/rawst/cheri/aspear/complete`
- `quest_powerRestore_started/gym/center/north/complete`
- `quest_restlessSpirit_started/frag1/frag2/frag3/complete`
- `quest_dragonLament_started/herb/mineral/complete`
- `quest_volcanicSurvey_started/vent1-5/complete`
- `quest_fatherTrail_started/clue1-5/complete`

**Item/Utility Flags:**
- `received_old_rod`, `receivedGoodRod`, `heard_solatheon_legend`, `received_temple_map`
- `conduit-1/2/3-repaired`, `memory-1/2/3-found`, `dragon-herb-found`, `dragon-mineral-found`
- `vent-1` through `vent-5-recorded`
- Various dungeon item pickups (`crystalCavernItem1/2`, `crystalDepthsItem1/2`)

**Status: WELL IMPLEMENTED** — Flag system is robust and used extensively across the game with proper flag chaining (e.g., `found_mines_terminal` → `saw_aldric_hologram` → `blitz_hq_discovery` → `willow_kidnapped`).

---

## 10. CUTSCENE / EVENT SYSTEM

### CutsceneEngine (`frontend/src/systems/CutsceneEngine.ts`)
- **Exists and is integrated** into OverworldScene
- Supports 16 action types: `dialogue`, `cameraPan`, `moveNPC`, `movePlayer`, `faceNPC`, `wait`, `fadeToBlack`, `fadeFromBlack`, `flashScreen`, `playBGM`, `playSFX`, `screenShake`, `showEmote`, `setFlag`, `parallel`
- NPC spawns support `triggerCutscene` field to trigger cutscenes on interaction
- CutsceneEngine blocks player input during playback

### Defined Cutscenes (`frontend/src/data/cutscene-data.ts`)
Only **3 cutscenes** defined:
1. `rival-intro` — Kael exclamation + dialogue (4 actions)
2. `willow-lab-intro` — Prof. Willow lab welcome (1 dialogue action)
3. `route-1-blockade` — Old Man warns about tall grass (5 actions)

**Status: SYSTEM IMPLEMENTED, CONTENT MINIMAL** — The engine supports rich cutscenes but only 3 simple ones exist. The bible describes many scripted events that should be cutscenes:
- Starter selection sequence
- Synthesis Collective confrontations
- Aldric hologram reveal
- Rook identity reveal
- Zara defection choice
- Victory/defeat scenes
- Act endings / transitions
- Champion reveal twist

---

## SUMMARY: Implementation Status vs Storyline Bible

### FULLY IMPLEMENTED
- All 8 Gym Leaders (trainer data + map placement + story dialogue)
- All 6 Kael rival encounters (trainer data + map placement)
- Rook encounters 1-4, 6 (NPCs placed with dialogue and flags)
- Dr. Vex encounters 1-2 (trainer battles placed)
- Quest data for all 12 side quests (structure complete)
- Flag system (robust, with proper chaining)
- CutsceneEngine system architecture
- City/route/dungeon map connectivity

### PARTIALLY IMPLEMENTED
- Elite Four: Only Nerida (1 of 4)
- Champion Aldric: Trainer data exists but not placed on map
- Marina: 2 of 4 encounters (missing #2 Coral Harbor, #3 is dialogue-only)
- Zara Lux: Disguised appearance only (no battle data, no encounters 2-3)
- Quest rewards: Several quests have simplified/reduced rewards vs bible
- Cutscene content: Only 3 basic cutscenes (engine exists but content sparse)
- Pokemon League: Single room with 1 trainer (needs full E4 gauntlet)
- Aldric encounter 1: Hologram dialogue only (no actual hologram visual)
- Tag-battle with Kael: NPC exists but no tag-battle mechanic

### MISSING
- **Abyssal Spire (5-floor dungeon)** — Entire Act 3 climax
- **Shattered Isles (post-game area)** — 3 maps
- **Elite Four members 2-4**: Theron, Lysandra, Ashborne (no trainer data, no map)
- **Rook trainer data**: No battle team defined (bible says Lv 70+)
- **Dr. Vex encounter 3**: No trainer data for final Abyssal Spire battle
- **Zara Lux trainer data**: No battle team defined at all
- **Zara Lux encounters 2-3**: Route 5 reveal and Abyssal Spire choice
- **Aldric encounter 2**: Abyssal Spire philosophical confrontation
- **Noctharion legendary**: No data or encounter
- **Solatheon legendary**: No data or encounter
- **Route 7 grunt gauntlet**: Bible says multiple grunts before Vex
- **Professor Willow rescue**: Event referenced but no actual rescue gameplay
- **Key NPCs**: Mom (heal in player house), Kael's Grandfather, Museum Curator (fossil revival), Nurse Joy (story dialogue), Youngster Timmy (trade), Blacksmith's Apprentice, Veteran Knox
- **Many scripted cutscenes**: Starter selection, Synthesis confrontations, act transitions, champion reveal

### CRITICAL PATH GAPS
The main story can be played through Acts 1 and 2 with reasonable completeness. **Act 3 is broken** at the point where the player should enter the Abyssal Spire. The Pokemon League is also incomplete (only 1 of 5 trainers). Post-game content doesn't exist yet.

---

## References
- Storyline bible: `docs/storyline.md`
- Quest data: `frontend/src/data/quest-data.ts`
- Trainer data: `frontend/src/data/trainer-data.ts`
- Cutscene engine: `frontend/src/systems/CutsceneEngine.ts`
- Cutscene data: `frontend/src/data/cutscene-data.ts`
- Pokemon League map: `frontend/src/data/maps/interiors/pokemon-league.ts`
- City maps: `frontend/src/data/maps/cities/*.ts`
- Route maps: `frontend/src/data/maps/routes/*.ts`
- Dungeon maps: `frontend/src/data/maps/dungeons/*.ts`
- GameManager flags: `frontend/src/managers/GameManager.ts`
- Map improvements plan: `docs/map-improvements.md`
