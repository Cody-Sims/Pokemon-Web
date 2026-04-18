# Level Up Plan — Pokemon Web: Aurum Region

> **Game Scientist Analysis** | April 2026
> A strategic roadmap for finishing, polishing, and extending the Aurum Region
> into a memorable, replayable browser RPG.

---

## Current State Assessment

### What Works Well

The Aurum Region is a **functionally complete Pokemon RPG**. The foundation is
strong and the implementation is deep:

| Area | Status | Notes |
|------|--------|-------|
| Main storyline (4 acts) | ✅ Complete | 18 cutscenes, flag-driven progression, champion reveal twist |
| Pokemon roster | ✅ 153 species | Full stats, learnsets, abilities, 2 legendaries |
| Move pool | ✅ 217 moves | 18 types covered, animations for all |
| Map count | ✅ 79 maps | 10 cities, 8 routes, dungeons, 46 interiors |
| Battle system | ✅ Deep | Singles, doubles, tag battles, weather, abilities, held items, synthesis |
| Difficulty modes | ✅ 3 modes | Classic, Hard, Nuzlocke with smart AI |
| Quality of life | ✅ Rich | Fly, bicycle, fishing, day/night, friendship, nicknames |
| Post-game | ✅ Present | Shattered Isles, legendaries, rematches, Aether Sanctum |
| Bug count | ✅ 2 remaining | Down from 110 — exceptional stability |

### What's Missing or Thin

| Gap | Impact | Category |
|-----|--------|----------|
| 6 cities share template layouts | Immersion-breaking — every city looks the same | Visual |
| Routes 6-7 are visually flat | Late-game world feels unfinished | Visual |
| Only 12 side quests | Thin side content for a 20+ hour RPG | Content |
| No Town Map scene | Players can get lost — no orientation tool | UX |
| No follower Pokemon | Most-requested community feature in Pokemon games | Polish |
| No Battle Tower / Frontier | Post-game has exploration but no repeatable battle challenge | Endgame |
| Move type imbalance | Bug (4), Rock (4) are too thin for full-type coverage | Balance |
| 49 items total | Low variety — no berries as hold items in shops | Content |
| No randomizer mode | Huge replay value, easy to implement with data-driven design | Replay |
| No cycling sprite | Bicycle mode has no visual feedback | Polish |

---

## The Level Up Plan

### Tier 0 — Ship It: Critical Finishing Touches

*These are the minimum-viable-complete items. The game can't feel "done"
without them.*

#### 0.1 City Identity Overhaul (6 cities)

**The Problem:** Ironvale, Voltara, Wraithmoor, Scalecrest, Cinderfall, and
Coral Harbor all use the same template grid with different palette swaps. A
player visiting Cinderfall (a volcanic town) should feel heat; Wraithmoor
(haunted ruins) should feel dread. Right now they feel like copypaste.

**The Fix:**

| City | Signature Feature | Key Tiles |
|------|-------------------|-----------|
| Ironvale | Central forge with smoke, molten metal channels | `METAL_FLOOR`, `PIPE`, `GEAR`, `CLIFF_FACE` |
| Voltara | Neon-lit streets, sparking conduits, tech plaza | `CONDUIT`, `ELECTRIC_PANEL`, `WIRE_FLOOR` |
| Wraithmoor | Crumbling ruins, graveyard, perpetual mist | `CRACKED_FLOOR`, `RUIN_WALL`, `GRAVE_MARKER`, `MIST` |
| Scalecrest | Fortress walls, dragon statues, mountain overlook | `FORTRESS_WALL`, `DRAGON_STATUE`, `CLIFF_FACE` |
| Cinderfall | Hot springs, ember vents, lava rock paths | `ASH_GROUND`, `EMBER_VENT`, `HOT_SPRING`, `LAVA_ROCK` |
| Coral Harbor | Boardwalk docks, tide pools, palm-lined beach | `DOCK_PLANK`, `WET_SAND`, `TIDE_POOL`, `PALM_TREE` |

Each city gets: organic (non-grid) building placement, a signature landmark
structure, biome-appropriate ground tiles, at least one visual setpiece visible
on entry.

#### 0.2 Route 6 and Route 7 Visual Pass

- **Route 6** (Voltara → Wraithmoor): Tech-to-ruins transition. Start with
  `CONDUIT` remnants and clean grass, gradually shift to `DARK_GRASS`,
  `AUTUMN_TREE`, then `CRACKED_FLOOR` and `MIST` near Wraithmoor.
- **Route 7** (Wraithmoor → Scalecrest): Mountain pass. `CLIFF_FACE` walls,
  narrow switchback paths, `BOULDER` obstacles, fog in the valleys.

#### 0.3 Town Map Scene

A key item (`Town Map`) with an openable scene showing:

- All visited locations on a stylized region map
- Current position indicator
- Quest objective marker for active quest
- Fly integration (select a city → confirm → fly)

This is the single most impactful UX feature still missing.

#### 0.4 Fix Remaining 2 Bugs

- **BUG-039** (dual evolution data) — accepted risk, but add a CI validation
  test that fails if the two sources disagree.
- **NEW-006** (surf state on water spawn) — auto-detect water tile at spawn
  and toggle surfing state.

---

### Tier 1 — Polish Pass: Make It Feel Great

*These transform the game from "functional" to "delightful."*

#### 1.1 Follower Pokemon

The lead Pokemon follows the player in the overworld using a 1-tile offset
behind the player sprite. This is the #1 quality-of-life feature in every
Pokemon community poll.

**Implementation:**

- Reuse existing NPC sprite rendering. The follower is a special entity
  that mirrors the player's movement buffer with a 1-step delay.
- Map the 153 species to overworld sprites. Start with 16x16 icon sprites
  as placeholders; upgrade over time.
- Toggle via Settings or party screen.
- Interaction: pressing A while facing your follower triggers a short
  affection dialogue based on friendship level.

**Game Feel Payoff:** Massive. Players form real emotional bonds when they see
their Pokemon walking with them.

#### 1.2 Cycling Sprite & Animation

When the player toggles bicycle mode (B key), swap to a cycling spritesheet:

- 4-directional cycling animation (8 frames per direction)
- Dust particles behind the bike at speed
- Speed lines at the edges of the screen

Small effort, big visual completeness.

#### 1.3 Dynamic Music Transitions

Currently, music swaps hard-cut on map change. Add:

- 500ms crossfade between area themes
- Battle intro stinger (1-second drum roll) before battle BGM starts
- Low-HP heartbeat filter (already partially implemented, polish it)
- Victory fanfare that crossfades back to the route theme

#### 1.4 NPC Schedule System

NPCs already have behavior types (wander, pace, look-around). Extend this:

- NPCs move between locations based on GameClock time period
- Day NPCs are indoors at night; night NPCs emerge after dark
- 2-3 NPCs per city with schedules (shopkeeper closes at night, ghost girl
  only appears at night in Wraithmoor)

**Game Feel Payoff:** The world feels alive and responsive to time.

#### 1.5 Weather-Per-Route

Tie WeatherRenderer to map data:

- Coral Harbor: occasional rain
- Cinderfall: ash particles always
- Wraithmoor: permanent fog
- Route 4 (volcanic): heat shimmer
- Crystal Cavern: underground drip particles

Currently weather only activates in battle. Overworld weather makes the late
game feel distinct from the early game.

---

### Tier 2 — Content Expansion: More To Do

*These add hours of meaningful content to the game.*

#### 2.1 Battle Tower

**Location:** Post-game, accessible from the Pokemon League lobby.

**Structure:**

- 7-battle streaks. Win 7 → earn Battle Points (BP).
- 3 tiers: Normal (Lv 50 cap), Super (Lv 100 open), Rental (pre-built
  teams).
- Every 7th battle is a "Tower Tycoon" boss with a unique team and
  dialogue.
- BP shop: exclusive held items (Choice Specs, Assault Vest, Life Orb),
  rare berries, ability capsules.

**Why:** The #1 post-game complaint in Pokémon games is "nothing to do after
the champion." A Battle Tower gives the battle system a repeatable, infinitely
scalable endgame.

**Data model:**

```typescript
interface BattleTowerConfig {
  tier: 'normal' | 'super' | 'rental';
  streakLength: number;
  enemyPool: TowerTrainer[];
  tycoons: Record<number, TowerTrainer>; // streak milestone → boss
  bpRewards: Record<number, number>; // streak → BP
}
```

#### 2.2 Expanded Side Quest Line (8 New Quests, 20 Total)

| # | Quest | Location | Type | Reward |
|---|-------|----------|------|--------|
| 13 | **Aether Anomalies** | Regional (6 spots) | Exploration | Aether Charm (boosts shiny rate ×2) |
| 14 | **The Photographer** | Routes 1-8 | Collection | Camera key item + Photo Album scene |
| 15 | **Voltorb Tournament** | Voltara City | Minigame | Coin Case + Game Corner access |
| 16 | **The Fossil Collector** | Pewter Museum → Caves | Fetch | Fossil revival (2 fossil Pokemon) |
| 17 | **Rook's Redemption** | Post-game, Shattered Isles | Story | Rook joins as optional partner |
| 18 | **The Gym Leader Gauntlet** | Post-game, League | Battle | All 8 leaders in sequence → Gold Trainer Card |
| 19 | **Marina's Research Expedition** | Post-game, 3 rare habitats | Exploration | Access to 3 new encounter zones |
| 20 | **The Synthesis Cure** | Post-game, Verdantia Lab | Story | Cure item for any Synthetic Pokemon |

#### 2.3 Fossil Pokemon

Two new species (IDs 154-155) revived from fossils found in Crystal Cavern
and Ember Mines:

| ID | Name | Type | Fossil | Location |
|----|------|------|--------|----------|
| 154 | Lithoclaw | Rock/Water | Claw Fossil | Crystal Cavern Depths |
| 155 | Aerolith | Rock/Flying | Wing Fossil | Ember Mines |

Revival at Pewter Museum for 5000 money. Adds meaningful content to two
existing dungeons and rewards exploration.

#### 2.4 Move Pool Expansion

Target: **30 new moves** to fill type gaps and give underrepresented types
more strategic options.

| Type | Current | Target | Examples |
|------|---------|--------|---------|
| Bug | 4 | 8 | Lunge, First Impression, U-Turn, Pollen Puff |
| Rock | 4 | 8 | Power Gem, Head Smash, Stealth Rock, Accelerock |
| Electric | 5 | 8 | Volt Switch, Wild Charge, Electroweb |
| Ice | 6 | 9 | Freeze-Dry, Icicle Crash, Aurora Veil |
| Ghost | 7 | 10 | Phantom Force, Spirit Shackle, Poltergeist |
| Steel | 7 | 9 | Bullet Punch, Heavy Slam |

**Balance goal:** Every type should have at least 8 moves covering physical,
special, and status categories.

#### 2.5 Berry & Held Item Expansion

- Add 15 holdable berries (Sitrus, Lum, Chesto, Rawst, Aspear, Leppa,
  Oran, Persim, Pecha, Cheri, Figy, Wiki, Mago, Aguav, Iapapa)
- Berry trees on routes that regrow with GameClock
- Add 10 competitive held items: Choice Specs, Assault Vest, Rocky Helmet,
  Eviolite, Black Sludge, Weakness Policy, Light Clay, Heat Rock, Damp
  Rock, Smooth Rock

---

### Tier 3 — Replayability: Keep Them Coming Back

*These features turn a one-playthrough game into a game with hundreds of hours
of potential.*

#### 3.1 Randomizer Mode

A seed-based game mode that shuffles:

- **Starter options** (any 3 random base-form Pokemon)
- **Wild encounters** (shuffled per route, maintaining level curve)
- **Trainer teams** (shuffled species, maintaining level curve)
- **TM contents** (randomized moves)
- **Shop inventories** (shuffled items per tier)

The data-driven architecture makes this surprisingly clean. Pokemon, trainers,
encounters, and TMs are all JSON-style data objects. A `Randomizer` system
would wrap the data layer, applying a seeded shuffle at game start.

```typescript
interface RandomizerConfig {
  seed: string;
  shuffleWild: boolean;
  shuffleTrainers: boolean;
  shuffleStarters: boolean;
  shuffleTMs: boolean;
  shuffleShops: boolean;
  levelScaling: 'match' | 'progressive' | 'random';
}
```

**Replay value:** Infinite. Randomizers are the lifeblood of the Pokemon ROM
hack community. A built-in one is a major differentiator for a web game.

#### 3.2 New Game+ Mode

After beating the champion:

- Start a new save with a **single Pokemon** carried from the previous run
- All trainers scaled +5 levels
- Gym leaders use competitive-quality teams (held items, EVs, coverage moves)
- New dialogue acknowledging the player's champion status
- Exclusive NG+ encounter: **Noctharion** appears at the end of Victory Road

#### 3.3 Speed Run Timer

Built-in timer overlay for competitive runs:

- Splits at each gym badge, each act transition, and champion defeat
- Personal best tracking in GameStats
- Display toggle in Settings
- Export splits as JSON for community leaderboards

#### 3.4 Challenge Run Presets

Extend the difficulty system beyond Classic/Hard/Nuzlocke:

| Mode | Rules |
|------|-------|
| Monotype | Only Pokemon of one chosen type |
| Solo Run | Only your starter, no party members |
| No Items | Items disabled entirely (heal only at centers) |
| Minimal Catches | Beat the game with ≤6 total Pokemon |
| Randomizer Nuzlocke | Randomizer + Nuzlocke combined |

Each is a checkbox in the New Game screen. Track completion per mode in
achievements.

---

### Tier 4 — Dream Features: The Long Tail

*These are ambitious features that would elevate the game from a great fan
project to a standout indie title.*

#### 4.1 Multiplayer Battles (WebRTC)

Peer-to-peer battling using WebRTC data channels:

- **Lobby system:** Generate a room code, share with a friend
- **Team preview:** See opponent's 6 Pokemon (no items/moves), pick your
  lead
- **Battle protocol:** Turn data serialized as JSON, validated on both
  clients
- **Spectator mode:** Read-only feed of battle state for a third client

This is complex but transformative. Even 1v1 link battles would be a massive
draw.

#### 4.2 Trading System

WebRTC-based Pokemon exchange:

- Room code pairing (same as battles)
- Offer/confirm/trade flow with preview
- Trade evolutions trigger on receive
- GTS-style async trading (stretch): post a wanted Pokemon on a simple
  backend, matches happen later

#### 4.3 Safari Zone

A special area with unique catch mechanics:

- No battling — throw bait (raises catch rate, lowers flee chance) or rocks
  (raises flee chance, lowers catch rate)
- 30 Safari Balls per entry, 500 step limit
- Exclusive Pokemon not found elsewhere (5-8 species)
- Rotating daily Pokemon (tied to GameClock day)

#### 4.4 Breeding & Egg Hatching

- Pokemon Nursery in Verdantia Village
- Egg groups based on species compatibility
- Egg inherits moves from parents (egg moves)
- Steps-to-hatch counter, accelerated by Bicycle
- Enables move breeding for competitive team building

#### 4.5 Photo Mode

- Pause → free camera w/ zoom and filters
- Frame your Pokemon in the overworld
- Save as PNG to device
- Photo Album scene in the menu
- Achievement: "Capture all 8 gym cities in photos"

---

### Tier 5 — Technical Excellence

*Performance and infrastructure investments that compound over time.*

#### 5.1 Code Splitting & Lazy Loading

The current single bundle is 1.85 MB. Split into:

| Chunk | Contents | Load Trigger |
|-------|----------|-------------|
| `vendor` | Phaser 3 (~1.5 MB) | Initial |
| `core` | Scenes, managers, entities | Initial |
| `data` | Pokemon, moves, type chart | On first battle / Pokedex |
| `maps` | All map definitions | On overworld entry |
| `battle` | Battle subsystem | On battle start |

Target: initial load under 500 KB, total under 2 MB.

#### 5.2 Texture Atlas Batching

521 individual sprite PNGs → 4-6 texture atlases:

- `pokemon-battle.atlas` (front/back/shiny)
- `pokemon-icons.atlas` (party/PC icons)
- `npcs.atlas` (all NPC spritesheets)
- `ui.atlas` (UI elements, type icons, status icons)
- `overworld.atlas` (player, items, objects)

Reduces HTTP requests from 500+ to <10. Massive load time improvement.

#### 5.3 Object Pooling

High-allocation hot paths identified in the performance audit:

- LightingSystem images (create/destroy per frame per light)
- Damage number text objects
- Particle emitters for weather/moves
- BattleManager message queue entries

Pool these instead of GC-churn creating/destroying them.

#### 5.4 Save System Cloud Sync (Optional Backend)

Current saves are localStorage only. Add:

- Export/import save as JSON file (zero-backend solution)
- Optional: tiny backend (Cloudflare Worker + KV) for cloud saves
- Save versioning with migration functions

---

## Priority Roadmap

```
Phase A: Ship-Ready (Tier 0)                    ───────────▶ "1.0 Release"
  └─ City redesigns, Route 6/7, Town Map, last 2 bugs

Phase B: Feel Great (Tier 1)                     ───────────▶ "1.1 Polish"
  └─ Follower Pokemon, cycling sprite, dynamic music, NPC schedules, weather

Phase C: Content Drop (Tier 2)                   ───────────▶ "1.2 Content"
  └─ Battle Tower, 8 new quests, fossils, 30 moves, berry/item expansion

Phase D: Infinite Replay (Tier 3)                ───────────▶ "1.3 Replay"
  └─ Randomizer, NG+, speed timer, challenge modes

Phase E: Dream Update (Tier 4, selective)        ───────────▶ "2.0 Multiplayer"
  └─ WebRTC battles, trading, Safari Zone

Phase F: Performance (Tier 5, ongoing)           ───────────▶ Continuous
  └─ Code splitting, atlases, pooling — weave into every phase
```

---

## Game Scientist Notes

### Why This Order Matters

**Tier 0 comes first** because the game's visual identity is its weakest link.
A player who walks into Ironvale City and sees the same grid layout as
Littoral Town will lose immersion — and immersion is what separates "I played
it for an hour" from "I played it for 20 hours." The battle system, story, and
mechanics are already strong. The world just needs to look as good as it
plays.

**Tier 1 is polish, not features.** Follower Pokemon, weather-per-route, and
NPC schedules don't add new systems — they leverage existing ones (NPC
spawner, WeatherRenderer, GameClock) to make the world feel alive. Maximum
impact, minimum new code.

**Tier 2 is where the content moat forms.** Battle Tower alone could add 10+
hours of endgame. Combined with expanded quests and fossil Pokemon, the game
transitions from "short RPG" to "I haven't finished everything yet."

**Tier 3 is the multiplier.** Every feature here multiplies the content from
Tiers 0-2. A randomizer turns 79 maps into infinite permutations. NG+ makes
every team viable again. Challenge modes give completionists 5+ reasons to
replay.

**Tier 4 is the moonshot.** Multiplayer turns a single-player game into a
platform. It's high effort but uniquely possible here — the battle system is
already turn-based and data-driven, which is the ideal architecture for
network play.

### Key Design Principles

1. **Leverage what's built.** 153 Pokemon, 217 moves, 79 maps, 50
   achievements — the data exists. New features should remix and recombine
   this data, not replace it.

2. **Respect the player's time.** Every new feature should either reduce
   tedium (Town Map, weather transitions) or add meaningful choice
   (Randomizer, Battle Tower team building).

3. **Reward exploration.** Hidden items, schedule-based NPCs, time-gated
   encounters, post-game areas — the world should keep surprising players
   who look closely.

4. **Maintain the data-driven architecture.** Every new feature should be
   configurable via data objects, not hardcoded. This is what makes
   Randomizer mode, modding, and future content trivial to add.

5. **Ship incrementally.** Each tier is a shippable milestone. Don't wait
   for Tier 4 dreams to delay the Tier 0 finish line.

---

## Quick Win List

For when you have a few hours and want maximum visible impact:

| Effort | Feature | Impact |
|--------|---------|--------|
| 1-2h | Town Map scene (basic) | High — solves navigation UX |
| 2-3h | Cycling sprite swap | Medium — completes bicycle feature |
| 2-3h | Weather-per-route data | High — 5 lines per map definition |
| 1h | Fix NEW-006 surf bug | Low — but clears the bug list to zero |
| 3-4h | Music crossfade system | Medium — major audio polish |
| 2h | Save export/import as JSON | Medium — safety net for players |
| 4-6h | 3 new side quests | Medium — more things to do |
| 2-3h | Berry hold items (15 berries) | Medium — battle depth |

---

*This plan was generated from a full audit of 153 Pokemon, 217 moves, 79
maps, 41 scene files, 106 trainers, 50 achievements, 18 cutscenes, 12 quests,
and 49 items across the Aurum Region codebase.*
