<!-- markdownlint-disable-file -->
# Storyline Implementation Plan

## Current State Summary

### What Exists

| Category | Count | Notes |
|----------|-------|-------|
| Cities/Towns | 10 | Pallet through Cinderfall + Pokemon League |
| Routes | 8 | Routes 1-8 |
| Dungeons | 6 | Viridian Forest, Crystal Cavern, Ember Mines, Victory Road, Aether Sanctum, Crystal Cavern Depths |
| Interiors | 32 | PokeCenter, PokeMart, Gym, and generic house for each city, plus Museum, Lab, Rival House |
| Gym Leaders | 8 | All defined in trainer-data with map placement |
| Rival Kael | 6 encounters | All defined and placed on correct maps |
| Marina | 2 encounters | Route 2 battle and Coral Harbor (no battle) |
| Rook | 5 of 6 | Missing post-game Lv 70+ battle team |
| Elite Four | 1 of 4 | Only Nerida implemented |
| Champion Aldric | Partial | Trainer data exists, not placed on league map |
| Dr. Vex | 2 of 3 | Missing final Collective HQ encounter |
| Zara Lux | 0 battles | Only disguised Coral NPC, no battle teams |
| Side Quests | 12 | All defined in quest-data.ts |
| Cutscene Engine | Exists | 16 action types, only 3 cutscenes defined |
| Tile Types | 115 | Rich biome palette including Synthesis, League, Shattered tiles |
| Flag System | Rich | Story flags chain through all 4 acts |

### What's Missing

| Item | Severity | Storyline Reference | Status |
|------|----------|-------------------|--------|
| Abyssal Spire (Collective HQ, 5 floors) | CRITICAL | Act 3 climax dungeon | ✅ DONE |
| Shattered Isles (3 maps) | HIGH | Post-game area, Father's Trail finale, legendary encounters | ✅ DONE |
| Elite Four 2-4 (Theron, Lysandra, Ashborne) | CRITICAL | Act 4 Pokemon League | ✅ DONE |
| Champion Aldric league placement | CRITICAL | Act 4 final boss | ✅ DONE |
| Zara Lux battle teams (2 encounters) | HIGH | Act 2-3 story battles | ✅ DONE |
| Dr. Vex encounter 3 (HQ Lab Wing) | HIGH | Act 3 Abyssal Spire | ✅ DONE |
| Rook post-game battle (Lv 70+) | MEDIUM | Post-game optional fight | ✅ DONE |
| Legendary Pokemon (Solatheon, Noctharion) | HIGH | Post-game encounters | ⚠️ PARTIAL — Solatheon encounter placed (placeholder #144), Noctharion not placed |
| Pokemon League multi-room structure | CRITICAL | Needs 6 rooms: 4 E4 + Champion + Hall of Fame | ✅ DONE |
| Route 7 grunt gauntlet + Vex blockade | HIGH | Act 3 story sequence | ✅ DONE |
| Verdantia underground Synthesis lab | MEDIUM | Act 2 mini-dungeon | ✅ DONE |
| Story cutscenes (20+ needed) | HIGH | Major story beats across all acts | ⚠️ PARTIAL — 12 authored, ~10 remaining |
| Marina encounters 3-4 | MEDIUM | Co-op battle, post-game battle | ⚠️ PARTIAL — Marina-3 partner data exists |
| Missing minor NPCs per city | MEDIUM | Mom dialogue, quest givers, lore NPCs | ✅ DONE |
| Flag chain audit | HIGH | Story flag continuity | ✅ DONE — data-driven victoryFlag system |

---

## Implementation Phases

### PHASE 1: Pokemon League Completion (CRITICAL PATH)

The Pokemon League is the Act 4 resolution and must work end-to-end.

#### 1A. Elite Four Trainer Data

**File**: `frontend/src/data/trainer-data.ts`

Define missing Elite Four members with full teams:

| Trainer | Type Focus | Team (Lv range) | Signature Pokemon |
|---------|-----------|-----------------|-------------------|
| Theron | Fighting/Rock | 6 Pokemon, Lv 48-52 | Machamp, Golem |
| Lysandra | Psychic/Dark | 6 Pokemon, Lv 49-53 | Alakazam, Gengar |
| Ashborne | Fire/Dragon | 6 Pokemon, Lv 50-54 | Arcanine, Dragonite |

Each needs:
- `trainerId`: `'elite-theron'`, `'elite-lysandra'`, `'elite-ashborne'`
- `trainerName`, `trainerClass`: e.g., `'Theron'`, `'Elite Four'`
- `team`: Array of 6 Pokemon with levels, moves, held items
- `dialogue.intro`: Character-specific opening line from storyline bible
- `dialogue.defeat`: Defeat dialogue
- `dialogue.victory`: If player loses
- `rewards.money`: Appropriate prize money
- `ai`: `'smart'` difficulty

**Theron personality**: Boisterous, honorable. Intro: *"So you've made it this far! Let's see if your strength is the real deal!"*
**Lysandra personality**: Enigmatic, riddles. Intro: *"The mind is the sharpest blade. Will yours hold its edge?"*
**Ashborne personality**: Conflicted, warns player. Intro: *"I've waited for someone like you. Whatever you find up there... don't lose yourself."*

#### 1B. Pokemon League Map Restructure

**File**: `frontend/src/data/maps/interiors/pokemon-league.ts`

The current Pokemon League map needs to be restructured into a proper multi-room gauntlet. Create 6 separate map sections or rooms linked by warps:

| Room | Map Key | Size | Theme | Tiles |
|------|---------|------|-------|-------|
| Lobby | `pokemon-league` (existing, rework) | 15x20 | Grand marble entrance | `LEAGUE_FLOOR`, `LEAGUE_WALL` |
| E4 Room 1: Nerida | `pokemon-league-nerida` | 12x16 | Ice/Water arena | `LEAGUE_FLOOR` + water accents |
| E4 Room 2: Theron | `pokemon-league-theron` | 12x16 | Rocky fighting arena | `ROCK_FLOOR`, `BOULDER` accents |
| E4 Room 3: Lysandra | `pokemon-league-lysandra` | 12x16 | Dark psychic chamber | `CRACKED_FLOOR`, `RUIN_PILLAR`, mysterious |
| E4 Room 4: Ashborne | `pokemon-league-ashborne` | 12x16 | Fire/dragon arena | `LAVA_ROCK`, `MAGMA_CRACK` accents |
| Champion Chamber | `pokemon-league-champion` | 15x20 | Grand throne room | `LEAGUE_FLOOR`, `CHAMPION_THRONE`, `AETHER_CONDUIT` |

Each E4 room needs:
- TrainerSpawn for the E4 member blocking the exit warp
- Warp from previous room entrance → this room
- Warp to next room (unlocked after defeating trainer)
- Healing opportunity between rooms (or full heal, classic style)
- Unique visual theming per E4 member's type

**Champion Chamber specifics**:
- Place Champion Aldric trainer spawn
- `CHAMPION_THRONE` at the top center
- `AETHER_CONDUIT` lining the perimeter (story: deepest ley-line nexus)
- Post-battle flag: `defeatedChampion` triggers ending sequence
- After defeat: Hall of Fame cutscene trigger

#### 1C. Hall of Fame Scene

A new simple scene or cutscene sequence:
- **Trigger**: After defeating Aldric
- **Content**: Congratulations text, team display, credits roll
- **Flag**: `enteredHallOfFame`
- **Implementation**: Can use CutsceneEngine with `dialogue`, `wait`, `screenEffect` actions

---

### PHASE 2: Abyssal Spire — Collective HQ (5 Floors)

The single biggest missing piece. This is the Act 3 climax dungeon per the storyline bible.

#### 2A. New Map Files

Create 5 new map definition files in `frontend/src/data/maps/dungeons/`:

| Floor | Map Key | Size | Visual Theme | Key Features |
|-------|---------|------|--------------|--------------|
| F1: Entrance | `abyssal-spire-f1` | 20x25 | Ancient temple exterior converting to lab — mixed `RUIN_WALL`/`SYNTHESIS_WALL` | Rook as NPC partner, double battle with grunts |
| F2: Lab Wing | `abyssal-spire-f2` | 20x25 | Full Synthesis lab — `SYNTHESIS_FLOOR`, `CONTAINMENT_POD`, `TERMINAL` | Dr. Vex final battle, caged Pokemon |
| F3: Command Center | `abyssal-spire-f3` | 18x22 | Operations room — `SYNTHESIS_FLOOR`, `TERMINAL`, `ELECTRIC_PANEL` | Zara Lux confrontation (battle or dialogue choice) |
| F4: Sanctum | `abyssal-spire-f4` | 15x20 | Ancient temple interior — `RUIN_WALL`, `RUIN_PILLAR`, `AETHER_CRYSTAL` | Professor Willow rescue, ley-line data |
| F5: Altar | `abyssal-spire-f5` | 15x18 | Massive aether conduit chamber — `AETHER_CONDUIT`, `AETHER_CRYSTAL`, `SYNTHESIS_FLOOR` | Aldric philosophical confrontation, trigger escape |

#### 2B. Unique Theming per Floor

**Floor 1 — The Breach**: Atmosphere of ancient temple being repurposed. Crumbling stone walls (`RUIN_WALL`) giving way to sleek white panels (`SYNTHESIS_WALL`). Vine-covered ruins outside, clinical corridors inside. Light from cracks in the ceiling.
- *Encounter flavor*: Mixed ancient temple wild Pokemon (Ghost, Psychic) and Synthesis security
- *Design note*: Use `MIST` tiles at entrance, transitioning to clean `SYNTHESIS_FLOOR`

**Floor 2 — The Lab**: Clinical horror. Rows of `CONTAINMENT_POD` tiles with implied trapped Pokemon. `TERMINAL` tiles for interactable data logs. Wire-covered floors. The sterile white is unsettling.
- *Encounter flavor*: Synthesis Elite grunts, 3 Pokemon each Lv 36-42
- *Interactive elements*: Data terminals reveal lore about Synthetic experiments

**Floor 3 — Command Center**: The nerve center. Large screens (use `TERMINAL` clusters), communication equipment, maps on walls. Less lab, more military operations center.
- *Story beat*: Zara Lux confrontation with dialogue choice branching
- *Flag requirements*: `zara_defected` flag if player convinces her; `zara_defeated` if battled

**Floor 4 — The Inner Sanctum**: Ancient temple fully revealed. `RUIN_PILLAR` columns, `AETHER_CRYSTAL` formations growing from walls. The lab equipment is parasitic on the ancient structure.
- *Story beat*: Find Professor Willow, receive ley-line data key item
- *Flag*: `rescued_willow`

**Floor 5 — The Altar**: A vast circular chamber with a massive aether conduit at the center. Crystals pulse with energy. The legendary Pokemon's containment is visible but dormant.
- *Story beat*: Aldric offers player a choice (always refuse in current implementation). He activates the conduit and escapes to the Pokemon League.
- *Flag*: `aldric_escaped_to_league`
- *Post-event*: All floors become re-explorable with reduced encounters

#### 2C. Trainer Data for HQ Battles

**Dr. Vex — Encounter 3** (Lab Wing):
- `trainerId`: `'admin-vex-3'`
- Team: 4 Pokemon, Lv 40-44, Poison/Steel types
- One Synthetic-boosted Pokemon (use SynthesisFormData)
- Defeat dialogue: *"My research... years of data... you understand nothing of what we've built."*
- Flag on defeat: `defeatedVex3`

**Zara Lux — Encounter 2** (Canopy Trail, for backfill):
- `trainerId`: `'admin-zara-2'`
- Team: 3 Pokemon, Lv 32-35, Psychic/Fairy types
- Intro: *"You've freed them? Do you have any idea how long it took to—! Fine. If words won't stop you..."*
- Flag: `defeatedZara2`

**Zara Lux — Encounter 3** (Command Center):
- `trainerId`: `'admin-zara-3'`
- Team: 4 Pokemon, Lv 40-43, Psychic/Fairy types
- Conditional: Only battled if dialogue choice fails
- Regardless of battle outcome, sets `zara_provides_keycard`
- Intro: *"I can't let you pass. Not because I believe in this anymore... but because I need to know you're strong enough to end it."*

**Synthesis Elite Grunts** (Floors 1-2):
- 6-8 grunt trainer entries, Lv 36-42, 2-3 Pokemon each
- Mix of types used by Synthesis (Poison, Steel, Psychic, Dark)
- Grunt dialogue: clinical, dehumanizing toward Pokemon

**Rook Double Battle Partner** (Floor 1):
- Rook needs partner battle data for the double battle on Floor 1
- Team: 3 Pokemon, Lv 42-45, mixed types (former scientist turned rogue)
- Implementation: Use the existing DoubleBattleManager tag battle system

#### 2D. Warps and Connections

- Route 8 or a new connection point → `abyssal-spire-f1` entrance
- Each floor links to the next via warps (one-way until puzzle/boss cleared, two-way after)
- F5 → Post-event: Warp back to Route 8 with flag `cleared_abyssal_spire`

---

### PHASE 3: Shattered Isles (Post-Game Area)

Three new maps forming the post-game exploration zone referenced in the Father's Trail quest.

#### 3A. New Map Files

Create in `frontend/src/data/maps/`:

| Map | Map Key | Size | Visual Theme | Key Features |
|-----|---------|------|--------------|--------------|
| Shattered Isles: Shore | `shattered-isles-shore` | 25x30 | Devastated coastal island — `SHATTERED_GROUND`, `AETHER_CRYSTAL`, dead trees, ruined structures | Entry point, high-level wilds Lv 55-65, Rook NPC |
| Shattered Isles: Ruins | `shattered-isles-ruins` | 20x25 | Ancient civilization ruins — `RUIN_WALL`, `RUIN_PILLAR`, `CRACKED_FLOOR`, `AETHER_CRYSTAL` growing through rubble | Father's journal clues, puzzle elements |
| Shattered Isles: Temple | `shattered-isles-temple` | 18x22 | Pristine ancient temple interior — `DRAGON_SCALE_FLOOR`, `RUIN_PILLAR`, `AETHER_CRYSTAL`, `AETHER_CONDUIT` | Solatheon encounter, Father's final message |

#### 3B. Unique Theming

**Shore**: A once-beautiful island now scarred by the Aether eruption 20 years ago. The ground is fractured (`SHATTERED_GROUND`), with crystalline growths (`AETHER_CRYSTAL`) erupting from the earth. Dead tree stumps, ruins of buildings. The sea is visible but turbulent. Rook stands near a campfire, seeking redemption.
- Wild encounters: Lv 55-65, Ghost/Rock/Ground/Psychic types
- Rook has full dialogue about his past with the Collective
- Rook optional battle: Lv 70+ team (6 Pokemon)

**Ruins**: The remains of the civilization destroyed by the eruption. Collapsed walls, exposed ley-lines (glowing `AETHER_CONDUIT` exposed in the ground), pillars leaning at angles. Father's journal entries are found at specific interactable points.
- Wild encounters: Lv 58-68, Psychic/Ghost/Dragon types
- 5 interactable points with journal fragments (Father's Trail quest steps)
- Environmental storytelling: signs of what happened during the eruption

**Temple**: The convergence point. Unlike the ruined exterior, the temple interior is eerily pristine, protected by the legendary Pokemon's presence. Ornate floor patterns, towering pillars, and a central altar where Solatheon rests.
- Puzzle: Use all 8 gym badges to unlock the inner chamber (flag check)
- Solatheon encounter: Static legendary battle (Lv 70)
- Father's final message: He chose to stay and guard the convergence point
- Father NPC: Can be visited post-quest (heals party, dialogue about pride)

#### 3C. Legendary Pokemon Data

**File**: `frontend/src/data/pokemon/` (new legendary file or add to existing)

**Solatheon** (Aether Guardian):
- Type: Psychic/Fairy (or custom Aether type if desired)
- BST: ~680 (legendary tier)
- Ability: Aether Shield (reduces super-effective damage by 25%)
- Signature move: Aether Pulse (special, 100 power, hits both opponents in doubles)
- Catch rate: 3 (legendary standard)
- Location: Shattered Isles Temple
- Lore: Guardian of the Aether ley lines, dormant for millennia

**Noctharion** (Shadow counterpart):
- Type: Dark/Ghost
- BST: ~680
- Ability: Entropy Aura (opposing Pokemon lose 1/16 HP at end of turn)
- Signature move: Void Rift (special, 110 power, 10% chance to confuse)
- Catch rate: 3
- Location: Crystal Cavern Depths (already exists as a map)
- Lore: Represents the chaotic, entropic side of Aether

#### 3D. Encounter Tables

Add encounter table entries for all 3 Shattered Isles maps in `frontend/src/data/encounter-tables.ts`:
- High-level Pokemon (Lv 55-70)
- Rare species found nowhere else in the game
- Ghost, Psychic, Dragon emphasis

#### 3E. Connection and Access

- Access via ferry from Coral Harbor (Captain Stern quest complete + Hall of Fame)
- New warp in Coral Harbor docks → `shattered-isles-shore`
- Flag required: `enteredHallOfFame` AND `quest_captainStern_complete`

---

### PHASE 4: Story Cutscenes and Event Sequences

The CutsceneEngine supports 16 action types but only 3 cutscenes exist. The storyline requires significant cutscene content.

#### 4A. Critical Story Cutscenes

Define in `frontend/src/data/cutscene-data.ts`:

| Cutscene ID | Trigger Location | Story Beat | Actions |
|-------------|-----------------|------------|---------|
| `intro_mom_house` | Pallet Town, game start | Mom reminds player about Professor Willow | dialogue, camera pan |
| `willow_starter_select` | Oak Lab, first visit | Willow explains Pokedex mission, Kael arrives | dialogue, NPC movement |
| `rook_route1_heal` | Route 1, first encounter | Mysterious stranger heals team | dialogue, screenEffect (heal flash), NPC fadeout |
| `ember_mines_discovery` | Ember Mines F1 | Player discovers Synthesis extraction equipment | dialogue, camera pan to equipment |
| `vex_ember_mines` | Ember Mines F2 | Dr. Vex confrontation before battle | dialogue, NPC movement, screenEffect |
| `aldric_hologram` | Ironvale City, post-mines | Aldric addresses player via hologram projection | dialogue, screenEffect, NPC spawn/despawn |
| `willow_kidnapped` | After Gym 5 (Voltara) | News that Willow has been taken | dialogue, screenEffect |
| `rook_reveal` | Route 7 | Rook reveals his identity, gives Aether Lens | dialogue, NPC movement, item receive |
| `morwen_prophecy` | Wraithmoor Gym, post-battle | Morwen gives cryptic warning | dialogue |
| `solara_confession` | Cinderfall Gym, post-battle | Solara reveals Aldric connection | dialogue |
| `abyssal_breach` | Abyssal Spire F1 | Rook and player breach the defenses | dialogue, NPC movement, camera |
| `zara_choice` | Abyssal Spire F3 | Dialogue choice: convince Zara or battle | dialogue with branching |
| `willow_rescue` | Abyssal Spire F4 | Find and free Professor Willow | dialogue, NPC movement |
| `aldric_offer` | Abyssal Spire F5 | Aldric invites player to join, player refuses, Aldric escapes | dialogue, screenEffect, NPC despawn |
| `kael_victory_road` | Victory Road entrance | Kael's final rival speech | dialogue |
| `ashborne_warning` | E4 Room 4, post-battle | Ashborne warns about the Champion | dialogue |
| `champion_reveal` | Champion Chamber | Aldric revealed as Champion — twist moment | dialogue, screenEffect, camera |
| `post_champion` | Champion Chamber, post-battle | Aether conduit destabilization, Solatheon stirs, resolution | dialogue, screenEffect, camera |
| `credits` | After champion resolution | Credits sequence with scene montage | dialogue (scene descriptions), screenEffect |
| `father_final` | Shattered Isles Temple | Father's message, Solatheon encounter setup | dialogue, NPC spawn |

#### 4B. Cutscene Format Reference

Each cutscene uses the existing CutsceneEngine actions:
```typescript
interface CutsceneAction {
  type: 'dialogue' | 'move' | 'wait' | 'screenEffect' | 'cameraMove' |
        'spawnNpc' | 'despawnNpc' | 'playSound' | 'setFlag' | 'giveItem' |
        'heal' | 'fadeIn' | 'fadeOut' | 'showChoice' | 'battle' | 'warp';
  // ... type-specific params
}
```

#### 4C. Dialogue Choice System for Zara

The Zara Lux encounter in Abyssal Spire F3 requires a dialogue choice branch:
- Choice: "I know you have doubts" vs "Stand aside"
- Correct path: Empathetic options → `zara_defected` flag, no battle
- Wrong path: Confrontational → battle with `admin-zara-3`, then `zara_defeated` flag
- Both paths end with `zara_provides_keycard`
- Implementation: Use `showChoice` cutscene action type

---

### PHASE 5: Route 7 Grunt Gauntlet and Vex Blockade

Route 7 is a critical Act 3 story location that needs the Synthesis blockade encounter.

#### 5A. Route 7 Enhancements

**File**: `frontend/src/data/maps/routes/route-7.ts`

Add to the existing Route 7 map:
- 4-5 Synthesis Elite Grunt trainer spawns blocking the path (gauntlet style)
- Dr. Vex trainer spawn at the end of the gauntlet (encounter 2)
- Rook NPC spawn (post-Vex defeat) who reveals his identity
- Flag gating: Grunts appear only when `has8badges` is false and `defeatedVex2` is false
- After clearing: Route opens permanently

#### 5B. Grunt Trainer Data

Add 4-5 "elite grunt" trainers to `trainer-data.ts`:
- `trainerId`: `'synth-elite-grunt-r7-1'` through `'synth-elite-grunt-r7-5'`
- Teams: 3 Pokemon each, Lv 32-40
- Types: Poison, Steel, Dark mixes
- Dialogue: Military/clinical tone

---

### PHASE 6: Verdantia Underground Lab (Mini-Dungeon)

A small Synthesis lab hidden beneath Verdantia Village, discovered after Gym 4.

#### 6A. New Map

**File**: `frontend/src/data/maps/dungeons/verdantia-lab.ts`

| Map | Map Key | Size | Theme |
|-----|---------|------|-------|
| Verdantia Underground Lab | `verdantia-lab` | 15x18 | Hidden lab beneath tree roots — mix of `GIANT_ROOT`, `SYNTHESIS_FLOOR`, `CONTAINMENT_POD` |

**Design**: The ancient tree roots form natural corridors that the Collective has converted into a lab. Natural and artificial elements clash. Vine-covered lab equipment. Roots breaking through clean white floors.

Features:
- 3 Synthesis grunt battles (Lv 28-32)
- Interactable terminals with lore about Aether research
- Warp entrance from Verdantia Village (hidden, unlocked after Gym 4 with `defeatedIvy` flag)
- Encounter table: Poison/Grass wild Pokemon Lv 25-32

---

### PHASE 7: Missing NPC Population

Cities need to be populated with the supporting cast from the storyline bible.

#### 7A. Pallet Town (Littoral Town) NPCs

| NPC | Location | Interaction | Flags |
|-----|----------|-------------|-------|
| Mom | Player's House interior | Heal party when visited. Dialogue changes with story progress. Post-league: *"Your father would be so proud."* | Progressive flag dialogue |
| Kael's Grandfather | Rival's House interior | Battle tips, post-game Exp Share gift | `enteredHallOfFame` for gift |
| Fisherman Wade | Docks area (near water) | Teaches fishing, gives Old Rod | `hasOldRod` flag |
| Delivery Girl Pip | Near PokeMart | Quest giver: The Lost Delivery | `quest_lostDelivery_started` |

#### 7B. Viridian City NPCs

| NPC | Location | Interaction | Flags |
|-----|----------|-------------|-------|
| Old Man Edgar | North gate area | Catch tutorial | `!caughtFirstPokemon` (shows tutorial if not caught) |
| Collector Magnus | House interior | Quest: Collector's Challenge | `quest_collector_started` |

#### 7C. Pewter City NPCs

| NPC | Location | Interaction | Flags |
|-----|----------|-------------|-------|
| Museum Curator | Pewter Museum interior | Aether lore exposition, post-game fossil sales | Progressive dialogue |
| Hiker Jerome | Near Gym | Quest: Lost Pokemon | `quest_lostPokemon_started` |

#### 7D. Coral Harbor NPCs

| NPC | Location | Interaction | Flags |
|-----|----------|-------------|-------|
| Captain Stern | Harbor docks | Ferry service quest + ferry access | `quest_captainStern_complete` unlocks ferry |
| Diver Lena | Beach area | Gives Good Rod, underwater lore | `hasGoodRod` |
| Chef Marco | Interior (restaurant) | Quest: bring berries for meals | `quest_chef_started` |
| Zara Lux (disguised) | Near PokeCenter | Appears as philanthropist, suspicious dialogue | `!cleared_abyssal_spire` |

#### 7E. Ironvale City NPCs

| NPC | Location | Interaction | Flags |
|-----|----------|-------------|-------|
| Blacksmith's Apprentice | Forge area (interior) | Reforge held items (upgrading mechanic) | `defeatedFerris` |
| Miner Gil | Mine entrance area | Quest: Mine Clearance | `quest_mineClearance_started` |

#### 7F. Verdantia Village NPCs

| NPC | Location | Interaction | Flags |
|-----|----------|-------------|-------|
| Elder Moss | Village center | Solatheon/Noctharion legend, gives Amulet Coin | Story lore |
| Berry Farmer Hana | Near gardens | Quest: Berry Farming | `quest_berryFarming_started` |

#### 7G. Voltara City NPCs

| NPC | Location | Interaction | Flags |
|-----|----------|-------------|-------|
| Engineer Sparks | Power Plant area | Quest: Power Restoration | `quest_powerRestoration_started` |
| Move Tutor Bolt | PokeCenter interior | Teaches powerful moves for shards | `interactionType: 'move-tutor'` |

#### 7H. Wraithmoor Town NPCs

| NPC | Location | Interaction | Flags |
|-----|----------|-------------|-------|
| Ghost Girl | Graveyard area | Cryptic NPC, gives Spell Tag, references future | Progressive dialogue |
| Historian Edith | Library (interior or town) | Aether temple lore, gives Temple Map key item | Story exposition |

#### 7I. Scalecrest Citadel NPCs

| NPC | Location | Interaction | Flags |
|-----|----------|-------------|-------|
| Dragon Keeper Wren | Dragon caves area | Quest: Dragon's Lament | `quest_dragonLament_started` |
| Veteran Knox | Citadel gate | War stories, gives Scope Lens | Flavor/gift |

#### 7J. Cinderfall Town NPCs

| NPC | Location | Interaction | Flags |
|-----|----------|-------------|-------|
| Hot Spring Attendant | Hot springs area | Full heal + status cure | `interactionType: 'heal'` (similar to PokeCenter) |
| Volcanologist Dr. Ash | Observatory area | Quest: Volcanic Survey | `quest_volcanicSurvey_started` |

---

### PHASE 8: Rook Post-Game Battle and Marina Encounters 3-4

#### 8A. Rook — Shattered Isles Battle

**File**: `frontend/src/data/trainer-data.ts`

- `trainerId`: `'rook-postgame'`
- Team: 6 Pokemon, Lv 70-75
- Mixed types reflecting his complex background (former scientist)
- Suggested team: Alakazam, Gengar, Steelix, Arcanine, Gyarados, Metagross-equivalent
- Location: `shattered-isles-shore` NPC spawn
- Flag requirement: `enteredHallOfFame`
- Dialogue: Reflective, seeking redemption through battle

#### 8B. Marina — Encounter 3 (Canopy Trail Co-op)

- `trainerId`: `'marina-3-partner'` (as partner in double battle)
- Team: 3 Pokemon, Lv 30-32
- Location: Route 5 (Canopy Trail)
- Context: Player and Marina vs Synthesis trap grunts
- Implementation: DoubleBattleManager tag battle

#### 8C. Marina — Encounter 4 (Post-Game Optional)

- `trainerId`: `'marina-postgame'`
- Team: 6 Pokemon, Lv 55-58
- Location: `crystal-cavern-depths`
- Flag requirement: `enteredHallOfFame`
- Context: She's researching the legendary Pokemon

---

### PHASE 9: Map Theming and Visual Identity

Each location should have a distinct visual identity using the rich tile palette.

#### 9A. City Theming Guidelines

| City | Biome | Signature Tiles | Visual Identity |
|------|-------|-----------------|-----------------|
| Pallet Town | Coastal starter village | `GRASS`, `PATH`, `SAND`, `PALM_TREE` | Small, warm, homey. Beach to the south, lab prominent |
| Viridian City | Transitional forest edge | `GRASS`, `DARK_GRASS`, `PINE_TREE` | Larger city, forest encroaching from north |
| Pewter City | Rocky highlands | `ROCK_FLOOR`, `BOULDER`, `CLIFF_FACE` | Museum as focal point, rocky terrain around edges |
| Coral Harbor | Coastal port town | `SAND`, `WET_SAND`, `DOCK_PLANK`, `PALM_TREE`, `TIDE_POOL`, `CORAL_BLOCK` | Docks, boats, surf shops, ocean everywhere |
| Ironvale City | Industrial mountain | `METAL_FLOOR`, `PIPE`, `GEAR`, `CLIFF_FACE` | Forge chimneys, steam vents, mountain backdrop |
| Verdantia Village | Deep forest | `DARK_GRASS`, `VINE`, `MOSS_STONE`, `GIANT_ROOT`, `BERRY_TREE` | Built around/into a massive ancient tree |
| Voltara City | Tech/industrial | `METAL_FLOOR`, `CONDUIT`, `ELECTRIC_PANEL`, `WIRE_FLOOR` | Power lines, conduit networks, neon-like accents |
| Wraithmoor Town | Haunted ruins | `CRACKED_FLOOR`, `RUIN_WALL`, `RUIN_PILLAR`, `GRAVE_MARKER`, `MIST` | Perpetual fog, graveyard, crumbling old city |
| Scalecrest Citadel | Mountain fortress | `DRAGON_SCALE_FLOOR`, `DRAGON_STATUE`, `FORTRESS_WALL`, `CLIFF_FACE` | Ancient fortress carved into mountaintop |
| Cinderfall Town | Volcanic | `ASH_GROUND`, `LAVA_ROCK`, `EMBER_VENT`, `HOT_SPRING`, `MAGMA_CRACK` | Built on dormant volcano, hot springs, ash soil |

#### 9B. Route Theming Guidelines

| Route | Connects | Biome | Signature Features |
|-------|----------|-------|-------------------|
| Route 1 | Pallet → Viridian | Gentle grasslands | `GRASS`, `TALL_GRASS`, `PATH`, `FLOWER` — beginner-friendly |
| Route 2 | Viridian → Pewter | Forest approach | `DARK_GRASS`, `PINE_TREE`, increasingly rocky |
| Route 3 (Tide Pool Path) | Pewter → Coral Harbor | Coastal | `SAND`, `WET_SAND`, `TIDE_POOL`, `PALM_TREE` — beach walk |
| Route 4 (Basalt Ridge) | Coral Harbor → Ironvale | Volcanic ridge | `LAVA_ROCK`, `CLIFF_FACE`, `VOLCANIC_WALL` — dramatic terrain |
| Route 5 (Canopy Trail) | Ironvale → Verdantia | Dense forest | `DARK_GRASS`, `VINE`, `GIANT_ROOT`, `MOSS_STONE` — jungle feel |
| Route 6 | Verdantia → Wraithmoor | Transitional | Forest giving way to misty ruins, `DARK_GRASS` → `CRACKED_FLOOR`, `MIST` |
| Route 7 (Stormbreak Pass) | Wraithmoor → Scalecrest | Mountain pass | `CLIFF_FACE`, `ROCK`, `FORTRESS_WALL` remnants — treacherous |
| Route 8 | Scalecrest → Cinderfall | Volcanic descent | `ASH_GROUND`, `EMBER_VENT`, `LAVA_ROCK` — heat builds |

#### 9C. Dungeon Theming

| Dungeon | Theme | Signature Tiles | Atmosphere |
|---------|-------|-----------------|------------|
| Viridian Forest | Classic forest | `DARK_GRASS`, `DENSE_TREE`, `PINE_TREE` | Dappled light, bug-type haven |
| Crystal Cavern | Ice/crystal cave | `CAVE_FLOOR`, `CAVE_WALL`, `AETHER_CRYSTAL` | Glowing crystals in darkness |
| Ember Mines | Volcanic mine system | `CAVE_FLOOR`, `MINE_TRACK`, `MINE_SUPPORT`, `LAVA_ROCK` | Industrial meets volcanic |
| Victory Road | Mountain gauntlet | `CAVE_FLOOR`, `CLIFF_FACE`, `BOULDER`, `ROCK` | Challenging, multi-level |
| Abyssal Spire | Temple-turned-lab | See Phase 2 for detailed per-floor theming | Ancient meets clinical |
| Shattered Isles | Post-apocalyptic island | See Phase 3 for detailed theming | Devastation meets beauty |

---

### PHASE 10: UI Additions

#### 10A. Quest Journal Enhancements

The quest journal exists but may need updates:
- **Story Quest Tab**: Separate main story progression tracker distinct from side quests
- **Progress indicator**: Show current act (1-4) and major objective
- **Completed quest archive**: Review finished quests

#### 10B. Story Progress Indicator

A new UI element showing the player's story progression:
- **Location**: Accessible from the menu or always-visible mini indicator
- **Content**: Current act name, next objective, relevant flag state
- **Implementation**: New section in MenuScene or extension of QuestTrackerScene

#### 10C. Map/Town Map Feature

- **Town Map UI**: Shows which cities/routes the player has visited
- **Current objective marker**: Indicator showing where to go next
- **Map data**: Use the existing map registry keys to build a simple node graph
- **Implementation**: New scene `TownMapScene` or integrate into existing Pokedex area map

#### 10D. Key Item: Aether Lens

- **Visual indicator**: When Aether Lens is in inventory, certain hidden elements become visible on maps
- **Implementation**: Check for `hasAetherLens` flag, render hidden warp points or interactables
- **Used on**: Hidden ley-line doors in dungeons and routes

#### 10E. NPC Relationship / Story Tracker

- **Concept**: Show relationship status with key NPCs (Kael, Marina, Rook, Gym Leaders)
- **Implementation**: Simple list in the quest journal showing last interaction location and context
- **Updates**: Each major NPC interaction updates their entry

#### 10F. Dialogue Choice UI

- **For Zara Lux encounter and any future branching moments**
- **Implementation**: The `showChoice` cutscene action type exists. Ensure the visual presentation handles 2-4 choices displayed in a clear, selectable format
- **Style**: Box with numbered choices, current selection highlighted

#### 10G. Double Battle UI Polish

- **For Rook partner battles and Marina co-op**
- **Already exists**: DoubleBattleManager handles 2v2
- **Polish needed**: Partner Pokemon HP display, partner action indication, clear messaging about who is acting

#### 10H. Hall of Fame Screen

- **New UI screen**: Displayed after defeating Champion Aldric
- **Content**: All 6 party Pokemon displayed with names, levels, sprites
- **Trainer card**: Player name, play time, Pokedex completion count
- **Scroll**: Credits sequence below the team display

---

### PHASE 11: Encounter Tables and Wild Pokemon Updates

#### 11A. New Area Encounter Tables

**File**: `frontend/src/data/encounter-tables.ts`

| Area | Pokemon Types | Level Range | Notes |
|------|--------------|-------------|-------|
| `abyssal-spire-f1` | Ghost, Psychic | 36-42 | Ancient temple Pokemon |
| `abyssal-spire-f2` | Poison, Steel | 38-44 | Lab escapees |
| `verdantia-lab` | Poison, Grass | 25-32 | Contaminated forest Pokemon |
| `shattered-isles-shore` | Ghost, Rock, Ground | 55-65 | Post-apocalyptic survivors |
| `shattered-isles-ruins` | Psychic, Ghost, Dragon | 58-68 | Ancient guardians |
| `shattered-isles-temple` | Psychic, Dragon | 60-70 | Temple protectors |
| `pokemon-league-*` | None | N/A | No wild encounters in league |

---

### PHASE 12: Flag and Progression System Audit

Ensure flag chains properly gate story progression.

#### 12A. Main Story Flag Chain

```
game_started
  → receivedStarter → defeatedKael1
    → defeatedBrock → defeatedCoral
      → found_mines_terminal → defeatedVex1
        → defeatedKael3 (Ironvale tag battle) → defeatedFerris
          → defeatedZara2 (Canopy Trail) → defeatedIvy
            → cleared_verdantia_lab → defeatedBlitz
              → willow_kidnapped → blitz_hq_discovery
                → defeatedMorwen → morwen_prophecy
                  → defeatedVex2 (Route 7) → rook_revealed → hasAetherLens
                    → defeatedDrake → solara_confession → defeatedSolara
                      → cleared_abyssal_spire
                        → aldric_escaped_to_league
                          → defeatedKael5 (Victory Road)
                            → defeatedNerida → defeatedTheron
                              → defeatedLysandra → defeatedAshborne
                                → defeatedChampion → enteredHallOfFame
```

#### 12B. Post-Game Flag Chain

```
enteredHallOfFame
  → quest_fathersTrail_started (auto-trigger)
    → fathersTrail_clue1 → fathersTrail_clue2 → ... → fathersTrail_clue5
      → solatheon_encountered → solatheon_caught (optional)
        → father_found → quest_fathersTrail_complete
```

#### 12C. Side Quest Flag Audit

Verify each of the 12 quests has:
- Start flag properly set by quest giver NPC interaction
- Step completion flags triggered by the right game events
- Completion flag gates reward delivery
- Quest givers have proper `flagDialogue` entries for each state

---

## Priority Order

| Priority | Phase | Effort | Dependencies |
|----------|-------|--------|-------------|
| 1 | Phase 1: Pokemon League | Large | None |
| 2 | Phase 2: Abyssal Spire | Very Large | Phase 1 tiles/patterns |
| 3 | Phase 4: Story Cutscenes | Large | Phase 1, 2 (for triggers) |
| 4 | Phase 5: Route 7 Gauntlet | Medium | Phase 2 trainer patterns |
| 5 | Phase 3: Shattered Isles | Large | Phase 1 (post-game) |
| 6 | Phase 7: NPC Population | Medium | Can parallel with anything |
| 7 | Phase 6: Verdantia Lab | Small | None |
| 8 | Phase 8: Rook/Marina battles | Small | Phase 3 (Rook location) |
| 9 | Phase 10: UI Additions | Medium | Phases 1-4 inform needs |
| 10 | Phase 11: Encounter Tables | Small | Phases 2, 3 (new maps) |
| 11 | Phase 9: Map Theming Polish | Medium | All maps exist first |
| 12 | Phase 12: Flag Audit | Small | All content defined |

## Subagent Delegation Guide

Each phase can be assigned to a subagent with these inputs:

| Phase | Key Files to Read | Key Files to Modify/Create | Validation |
|-------|------------------|---------------------------|------------|
| 1 | `trainer-data.ts`, `pokemon-league.ts`, storyline.md Elite Four section | `trainer-data.ts`, `pokemon-league.ts`, 5 new league room maps | `npm run test` passes, all E4 trainers defined |
| 2 | `shared.ts` (tile types), existing dungeon maps for format, storyline.md Act 3 | 5 new map files in `dungeons/`, `trainer-data.ts`, `maps/index.ts` | Maps parse correctly, trainers defined, warps connected |
| 3 | Storyline.md post-game section, existing dungeon format | 3 new map files, pokemon data (legendaries), encounter tables | Maps parse, legendaries have valid stats |
| 4 | `cutscene-data.ts` format, storyline.md all acts | `cutscene-data.ts` (expand), trigger flags in map NPCs | Cutscenes play without crash |
| 5 | `route-7.ts`, `trainer-data.ts` | `route-7.ts` (add NPCs), `trainer-data.ts` (grunts + Vex) | Route loads, battles trigger |
| 6 | Existing dungeon format, `verdantia-village.ts` | New `verdantia-lab.ts`, warp in village, encounter table | Map loads, warp works |
| 7 | Each city map file, storyline.md NPC tables | City map files (add NPC spawns), possibly new interiors | NPCs render, dialogues display |
| 8 | `trainer-data.ts` format, storyline.md character encounters | `trainer-data.ts` additions | Trainers defined with valid teams |
| 9 | All city/route/dungeon map files, `shared.ts` tile palette | Map files (visual tile updates) | Visual verification, no broken tiles |
| 10 | Existing UI files, scene files | New/modified UI scenes and components | Scenes load, navigation works |
| 11 | `encounter-tables.ts` format, pokemon data | `encounter-tables.ts` | Valid pokemon/level references |
| 12 | All flag usage across codebase | Map NPC flagDialogue, quest-data | Flag chain is gapless, no dead ends |
