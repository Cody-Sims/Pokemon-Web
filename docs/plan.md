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

## Phase 10: First Impressions & New Game Experience

The current new game flow goes directly from title menu → overworld with no story setup, no character naming, and no professor intro. This phase transforms the opening into a memorable, polished experience.

**Professor Intro Scene (IntroScene.ts):**
- Classic "Welcome to the world of Pokémon!" multi-slide presentation by Professor Willow
- Animated Willow sprite slides in, Pokémon sprite appears alongside narration
- Typewriter text with SFX, player advances with confirm button
- Transition into character naming

**Character Naming & Customization:**
- Text input screen for player name (keyboard + on-screen keyboard for mobile)
- Character gender/appearance selection (boy/girl sprite variant with preview)
- Rival naming option (default: Kael)
- Name saved to GameManager, shown in dialogue, menus, and save file

**Animated Title Screen:**
- Pixel-art logo image (replaces plain text)
- Parallax scrolling background with Pokémon silhouettes
- Starter Pokémon idle animations on title
- Press Start flashing prompt before showing menu options

**Starter Selection Polish:**
- Professor Willow appears on-screen presenting the starters
- Pokémon cry SFX on hover/select
- Stat preview panel (base stats, ability, starting moves)
- "Are you sure?" confirmation before finalizing
- Animated card reveal (slide-in or flip effect)

---

## Phase 11: Battle Animation & Visual Effects System

Battles currently have no move-specific animations, making the combat feel static despite deep mechanics. This is the single highest-impact polish area.

**Move Animation Framework:**
- `MoveAnimationPlayer` system: data-driven animation definitions per move
- Animation types: projectile (flies from attacker → target), contact (attacker lunges), area (fills screen), beam (continuous line), self (buff glow on user)
- Each move maps to an animation key; fallback to category-based default (physical lunge, special flash, status sparkle)
- Animations defined as data in `move-animations.ts`, not hardcoded per move

**Type-Based Particle Effects:**
- Fire: orange/red particles with flickering embers
- Water: blue splash droplets
- Electric: yellow lightning bolt sprites + screen flash
- Grass: green leaf swirl
- Ice: white/cyan frost shards
- Psychic: purple concentric rings
- Poison: green bubbling drip
- Ground: brown rock chunks rising from below
- Fighting: impact shockwave burst
- Ghost: dark wispy tendrils
- Dragon: purple energy breath
- Normal: white hit spark (default)

**Battle Scene Polish:**
- Pokémon emerge-from-ball animation (white silhouette → color)
- Faint animation improvement (slide down + fade, not just disappear)
- Damage number popups (floating text showing HP lost)
- Critical hit screen shake
- Super-effective screen flash + enlarged text
- Weather visual overlays (rain droplet particles, sandstorm dust, hail ice chunks, sun lens flare)

**Pokéball Throw Animation:**
- Visible ball sprite with arc trajectory
- Ball opens with white flash on contact
- Shake wobble animation with suspenseful timing
- Click-sparkle on successful capture
- Break-free red flash on failure

---

## Phase 12: Overworld Atmosphere & World Feel

The overworld is currently static tiles with no ambient life. This phase adds environmental storytelling through weather, animated tiles, NPC behaviors, and lighting.

**Overworld Weather System:**
- Rain: particle emitter with blue droplets, darker tint, splash particles on ground
- Sandstorm: horizontal dust particles with reduced visibility tint
- Snow/Hail: white particle drift with accumulation tint
- Fog: semi-transparent overlay that reduces camera draw distance
- Sunshine: warm golden tint with occasional lens flare particles
- Weather tied to map definitions (`MapDefinition.weather`) and story events

**Animated Tiles:**
- Water tiles: 3-frame wave shimmer animation (cycling tileset frames)
- Tall grass: gentle sway when player is nearby
- Flowers: subtle color pulse
- Lava/magma tiles: flowing red-orange glow cycle
- Aether crystals: pulsing cyan glow in Crystal Cavern

**NPC Behaviors:**
- Idle animations: NPCs occasionally turn to face random directions
- Wander paths: some NPCs walk a short patrol route (2–4 tiles)
- Reaction sprites: `!` and `?` and `♥` bubble emotes above NPCs
- NPCs that notice the player and turn to face them when nearby

**Lighting & Ambiance:**
- Cave/dungeon darkness overlay with player light radius
- Torch/lamp tiles that cast warm glow circles
- Indoor window light shafts during day
- Neon glow effects in Voltara City (electric theme)
- Aether glow in Crystal Cavern and Synthesis areas

**Environmental SFX Layer:**
- Per-map ambient sound loops (ocean waves, forest birds, cave drips, city bustle, wind)
- Volume ducking when BGM plays
- Footstep SFX that changes by terrain (grass rustle, stone tap, sand crunch, wood plank)

---

## Phase 13: Player Movement & Exploration Upgrades

The player currently only walks. Adding movement variety and overworld abilities transforms exploration.

**Running Shoes:**
- Obtained from Mom after first badge (or NPC gift on Route 2)
- Hold B/shift to run at 2× speed
- Running animation (faster walk cycle or separate run frames)
- Running through tall grass increases encounter rate

**Bicycle:**
- Obtained from Bike Shop NPC in Ironvale City (or quest reward)
- 3× movement speed, distinct cycling sprite/animation
- Cannot ride indoors or on certain terrain (sand, ledges)
- Dismount animation

**Overworld HM/TM Abilities (No HM Slaves):**
- Cut: Interact with small trees to clear them (requires badge + party Pokémon that knows Cut)
- Surf: Walk onto water tiles if party has Surf user — player sprite swaps to surfing
- Strength: Push boulder puzzles in caves/dungeons
- Flash: Expand light radius in dark caves
- Fly: Fast travel to any visited PokéCenter from pause menu
- Rock Smash: Break cracked rocks in routes/caves for hidden items

**Ledge System Enhancement:**
- One-way jump animation (player hops down with brief airborne frame)
- Ledge SFX on jump
- Proper collision so player can't walk up ledges

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

## Phase 15: Sound & Music Expansion

The game has 8 BGM tracks and 17 SFX. A full Pokémon experience needs richly layered audio.

**Pokémon Cries:**
- Per-species sound effect (synthesized chip-tune cries, not copyrighted originals)
- Play on: encounter start, Pokédex view, evolution, sending out in battle, fainting
- 151 unique cries (can use pitch/speed variants of base waveforms to reduce asset count)

**Expanded BGM:**
- Per-town themes (at least 5 distinct town BGMs beyond pallet-town)
- Gym Leader battle theme (distinct from trainer battle)
- Rival battle theme
- Legendary encounter theme
- Evolution fanfare (short jingle)
- Collective hideout/villain theme
- Victory Road tension theme
- Credits/ending theme

**Context-Sensitive Music:**
- Low-HP warning beep that layers over battle BGM
- Gym Leader "last Pokémon" dramatic BGM variant
- Night-time softer variants of town themes
- Seamless transition when entering buildings (BGM continues, no restart)

**Expanded SFX:**
- Menu navigation clicks/chimes
- Item pickup jingle
- Badge acquisition fanfare
- Level-up chime
- Pokémon Center healing jingle (the classic 6-note ditty)
- Door open/close
- Stat raise/lower sound
- Weather ambient loops

---

## Phase 16: Advanced Battle Features

Deepen the battle system with features that add strategic depth and spectacle.

**Mega Evolution / Synthetic Boost (Unique Mechanic):**
- "Synthesis Mode" — unique to this game's lore. Once per battle, player can Synthesize a compatible Pokémon
- Temporary stat boost + visual aura glow + type enhancement
- Available after Act 2 story event provides Synthesis Bracelet
- Limited roster of compatible Pokémon (story-tied)
- Boss trainers also use Synthesis Mode (Vex, Aldric)

**Double Battles:**
- 2v2 battle format for tag battles (Kael co-op at Ironvale) and Collective admin fights
- Target selection UI: pick which opponent to hit
- Spread moves hit both opponents
- Partner AI for NPC ally in tag battles

**Battle Frontier / Battle Tower (Post-Game):**
- Endless streak mode with scaling difficulty
- Rental Pokémon option (pick from random pool)
- Battle points currency for exclusive items/TMs
- Leaderboard (local high scores)

**Move Tutor & TM System:**
- TM items consumable (or reusable, configurable)
- Move Tutor NPCs in select cities teaching rare moves
- Heart Scale currency for Move Reminder (re-learn forgotten moves)
- Move Deleter NPC

---

## Phase 17: Cutscene & Story Presentation System

The game has story beats but no cinematic presentation. This system turns key moments into memorable scenes.

**Cutscene Engine:**
- Scripted sequence player: camera pan, NPC walk-to, dialogue, sprite animations, screen effects
- Data-driven cutscene definitions (JSON/TS arrays of actions)
- Actions: `moveCameraTo`, `moveNPC`, `showDialogue`, `wait`, `fadeToBlack`, `playBGM`, `screenShake`, `showEmote`, `flashScreen`
- Cutscenes block player input and restore control on completion

**Key Cutscenes to Implement:**
- Game intro: player arrives in Littoral Town by boat, Mom greets them
- Professor Willow's lab: Willow introduces the Pokédex quest
- Kael rival encounter 1: post-starter challenge in the lab
- Ember Mines discovery: Vex operating the Aether rig (camera pan across the machine)
- Willow kidnapping: Synthesis grunts grab Willow while player watches helplessly
- Rook identity reveal: dramatic unmasking on Route 7
- Champion reveal: Aldric removes his disguise in the Champion chamber
- Credits roll: montage of locations visited with character art

**Flashback System:**
- Father's journal entries trigger playable flashback sequences
- Sepia/desaturated tint during flashbacks
- Young-father NPC sprite exploring the same locations

---

## Phase 18: Pokémon Personality & Bond System

Make each Pokémon feel unique and deepen the trainer-Pokémon connection.

**Nature System Enhancement:**
- 25 natures affecting stats (already partially in data layer)
- Nature displayed on Summary screen
- Nature-influenced dialogue ("Pikachu is jolly and loves to play!")

**Friendship/Affection System:**
- Friendship grows from: battles, walking, leveling up, using items, visiting PokéCenters
- Friendship decreases from: fainting, using bitter medicine
- Friendship thresholds trigger: extra EXP bonus, crit chance boost, "held on with 1 HP" clutch, status self-cure
- Affection dialogue in battle ("Pikachu is looking at you with trusting eyes!")
- Visible friendship indicator on Summary screen (heart meter)

**Pokémon Camp / Petting Minigame (Stretch):**
- Accessible from pause menu or specific rest areas
- Simple interaction: feed berries, play with sprite (tap/click minigame)
- Boosts friendship rapidly
- Pokémon reactions (happy bounce, hearts, refusing disliked berries)

**Nickname System:**
- Prompt to nickname after every catch
- Name Rater NPC in Verdantia Village to rename later
- Nicknames shown in battle, party, and summary

---

## Phase 19: World Enrichment & Side Activities

Activities beyond battling that make the world feel alive and worth exploring.

**Berry Growing System:**
- Plant berries at designated soil patches on routes
- Berries grow over real game-time (tied to GameClock)
- Water/tend berries to speed growth
- Harvest berries for held items, healing, and cooking

**Trainer Card / Profile:**
- Viewable from pause menu
- Shows: player sprite, name, badges, Pokédex completion %, playtime, money, difficulty
- Secret ID for shiny determination (behind the scenes)

**Photo Mode (Unique Feature):**
- Pause in overworld → camera pans freely, player places Pokémon from party into the scene
- Screenshot capture → saves to browser download
- Fun poses and expression variants for Pokémon sprites

**Mini-games:**
- Voltorb Flip (gambling in Game Corner)
- Slot machine (cosmetic prizes only)
- Bug-catching contest (timed encounter with scoring)

**Hidden Items & Secrets:**
- Invisible items on certain tiles (Itemfinder/Dowsing Machine detects them)
- Secret base entrance in Crystal Cavern (player-customizable room, stretch goal)
- Easter eggs: references, hidden NPCs, unusual encounters (e.g., Mew under a specific truck tile)

---

## Phase 20: Achievement & Completion Tracking

Gives completionists and replayability-focused players long-term goals.

**Achievement System:**
- `AchievementManager` tracking 50+ achievements
- Categories: Story (beat each gym, beat champion), Collection (catch 50/100/151), Battle (win 100 battles, land a crit, survive with 1 HP), Exploration (visit all towns, find all hidden items), Challenge (beat Nuzlocke, beat champion under 10 hours)
- Toast notification on unlock (slides in from top with icon + title)
- Achievement gallery scene accessible from pause menu

**Statistics Tracker:**
- Total battles (wild/trainer), total catches, total steps, money earned/spent
- Most-used Pokémon, highest damage dealt, longest win streak
- Pokédex completion percentage by type
- Displayed on Trainer Card and in Stats sub-menu

**Hall of Fame:**
- After beating the Champion, team is recorded in Hall of Fame
- Hall of Fame viewable from title screen
- Shows team sprites, levels, natures, date cleared

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
