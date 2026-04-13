# Pokemon Web Game — Architecture

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Language | TypeScript 6.x | Type safety, interfaces for game data, IDE autocomplete |
| Game Engine | Phaser 3.x | 2D rendering (WebGL/Canvas), physics, input, audio, scene management |
| Bundler | Vite 8.x | HMR dev server, tree-shaking, static asset copying, fast builds |
| Map Editor | Tiled (external) | Visual tilemap creation, exported as JSON for Phaser to consume |
| Art Format | 16×16 or 32×32 pixel-art tilesets & spritesheets | Classic Pokémon aesthetic |
| Sprite Source (Battle) | PokéAPI sprites | Front/back/shiny/icon sprites via API URLs or downloaded |
| Sprite Source (Overworld) | The Spriters Resource + community collections | Walking spritesheets (player, NPCs, follower Pokémon) |
| Hosting | GitHub Pages / Netlify / Vercel | Static site deployment of `dist/` output |

---

## Folder Structure

```
pokemon-web/
├── package.json
├── .gitignore
│
├── docs/                               # Documentation (canonical location)
│   ├── architecture.md                 # This file
│   ├── plan.md                         # Development plan & phases
│   └── CHANGELOG.md                    # Completed work log
│
├── frontend/                           # All client-side code lives here
│   ├── index.html                      # Minimal HTML shell, mounts the Phaser canvas
│   ├── tsconfig.json
│   ├── vite.config.ts                  # Vite config (aliases, build options)
│   │
│   ├── public/                         # Static assets copied verbatim to dist/
│   │   └── assets/
│   │       ├── tilesets/               # Tileset PNGs used by Tiled maps
│   │       │   └── overworld.png
│   │       ├── maps/                   # Tiled JSON exports
│   │       ├── sprites/
│   │       │   ├── player/             # Player walk-cycle spritesheet + atlas JSON
│   │       │   │   ├── player-walk.png
│   │       │   │   └── player-walk.json
│   │       │   ├── npcs/              # NPC spritesheets
│   │       │   └── pokemon/           # Front/back/icon sprites (from PokéAPI)
│   │       │       ├── bulbasaur-front.png
│   │       │       ├── bulbasaur-back.png
│   │       │       ├── bulbasaur-icon.png
│   │       │       └── ... (all 151)
│   │       ├── ui/                     # UI element images
│   │       ├── audio/
│   │       │   ├── bgm/               # Background music (ogg/mp3)
│   │       │   └── sfx/               # Sound effects
│   │       └── fonts/                  # Bitmap fonts
│   │
│   └── src/
│       ├── main.ts                     # Entry point: creates Phaser.Game instance
│       │
│       ├── config/
│       │   └── game-config.ts          # Phaser.Types.Core.GameConfig object
│       │
│       ├── scenes/                     # One file per Phaser Scene
│       │   ├── BootScene.ts            # Loads minimal assets for loading bar
│       │   ├── PreloadScene.ts         # Loads all assets; shows progress bar
│       │   ├── TitleScene.ts           # Main menu (New Game / Continue / Options)
│       │   ├── OverworldScene.ts       # Top-down exploration, player movement
│       │   ├── BattleScene.ts          # Turn-based battle — sprites, HP/EXP bars
│       │   ├── BattleUIScene.ts        # Battle overlay — action menu, move menu, messages
│       │   ├── DialogueScene.ts        # Typewriter text overlay for NPC dialogue
│       │   ├── MenuScene.ts            # Pause menu (Pokémon, Bag, Save, etc.)
│       │   ├── InventoryScene.ts       # Bag / item management
│       │   ├── PartyScene.ts           # Party view — HP, types, status per slot
│       │   ├── SummaryScene.ts         # 3-tab Pokémon detail (INFO/STATS/MOVES)
│       │   ├── TransitionScene.ts      # Fade transitions between scenes
│       │   ├── StarterSelectScene.ts   # Starter Pokémon selection overlay
│       │   ├── SettingsScene.ts        # Settings menu (text speed, volume, etc.)
│       │   └── PokedexScene.ts         # Pokédex species browser (seen/caught)
│       │
│       ├── entities/                   # Game object classes
│       │   ├── Player.ts              # Grid-locked sprite + GridMovement
│       │   ├── NPC.ts                 # Base NPC with dialogue
│       │   ├── Trainer.ts            # NPC subclass with line-of-sight battle trigger
│       │   ├── WildEncounterZone.ts  # Invisible encounter zone
│       │   └── InteractableObject.ts # Signs, PCs, item balls, doors
│       │
│       ├── battle/                     # Battle subsystem
│       │   ├── BattleManager.ts       # Orchestrates turns, win/loss, party
│       │   ├── BattleStateMachine.ts  # FSM: INTRO → PLAYER_TURN → CHECK_FAINT → …
│       │   ├── DamageCalculator.ts    # Pokémon damage formula (STAB, type, crit, weather, abilities, items)
│       │   ├── MoveExecutor.ts        # Applies move effects (damage, status, PP)
│       │   ├── StatusEffectHandler.ts # Burn/paralysis/poison/sleep/freeze logic
│       │   ├── AbilityHandler.ts      # Ability hooks: switch-in, after-damage, end-of-turn, immunity
│       │   ├── HeldItemHandler.ts     # Held item hooks: end-of-turn, after-damage, status cure, HP threshold
│       │   ├── WeatherManager.ts      # Weather conditions (sun/rain/sandstorm/hail) with damage modifiers
│       │   ├── AIController.ts        # Enemy move selection heuristics
│       │   ├── ExperienceCalculator.ts # EXP yield, level-up, stat recalc, natures, evolution checks
│       │   └── CatchCalculator.ts     # Poké Ball catch-rate formula
│       │
│       ├── data/                       # Pure data (no game logic)
│       │   ├── interfaces.ts          # All TypeScript interfaces
│       │   ├── maps/                  # Per-map definitions
│       │   │   ├── index.ts           # Re-exports mapRegistry + shared types
│       │   │   ├── shared.ts          # Tile constants (25 overworld + 14 interior), colors, map interfaces, parseMap
│       │   │   ├── pallet-town.ts     # Pallet Town map definition
│       │   │   ├── route-1.ts         # Route 1 map definition
│       │   │   ├── viridian-city.ts   # Viridian City map definition
│       │   │   ├── route-2.ts         # Route 2 map definition
│       │   │   ├── viridian-forest.ts # Viridian Forest map definition
│       │   │   ├── pewter-city.ts     # Pewter City map definition
│       │   │   ├── pallet-player-house.ts  # Interior: Player's house
│       │   │   ├── pallet-rival-house.ts   # Interior: Rival's house
│       │   │   ├── pallet-oak-lab.ts       # Interior: Oak's Laboratory (starter select)
│       │   │   ├── viridian-pokecenter.ts  # Interior: Viridian PokéCenter (heal)
│       │   │   ├── viridian-pokemart.ts    # Interior: Viridian PokéMart (parcel quest)
│       │   │   ├── pewter-pokecenter.ts    # Interior: Pewter PokéCenter (heal)
│       │   │   ├── pewter-gym.ts           # Interior: Pewter Gym (Brock battle)
│       │   │   ├── pewter-museum.ts        # Interior: Pewter Museum of Science
│       │   │   ├── crystal-cavern.ts       # Dungeon: Crystal Cavern (off Route 2)
│       │   │   ├── route-3.ts              # Route 3: Tide Pool Path (coastal)
│       │   │   ├── coral-harbor.ts         # Coral Harbor: Town 3 (port town)
│       │   │   ├── coral-pokecenter.ts     # Interior: Coral Harbor PokéCenter
│       │   │   ├── coral-pokemart.ts       # Interior: Coral Harbor PokéMart
│       │   │   ├── coral-gym.ts            # Interior: Coral Harbor Gym (Water)
│       │   │   ├── route-4.ts              # Route 4: Basalt Ridge (volcanic)
│       │   │   ├── ember-mines.ts          # Dungeon: Ember Mines (Synthesis lab)
│       │   │   ├── ironvale-city.ts        # Ironvale City: Town 4 (industrial)
│       │   │   ├── ironvale-pokecenter.ts  # Interior: Ironvale PokéCenter
│       │   │   ├── ironvale-pokemart.ts    # Interior: Ironvale PokéMart
│       │   │   ├── ironvale-gym.ts         # Interior: Ironvale Gym (Steel)
│       │   │   ├── route-5.ts              # Route 5: Canopy Trail (forest)
│       │   │   ├── verdantia-village.ts    # Verdantia Village: Town 5
│       │   │   ├── verdantia-pokecenter.ts # Interior: Verdantia PokéCenter
│       │   │   ├── verdantia-pokemart.ts   # Interior: Verdantia PokéMart
│       │   │   ├── verdantia-gym.ts        # Interior: Verdantia Gym (Grass)
│       │   │   ├── voltara-city.ts         # Voltara City: Town 6 (tech)
│       │   │   ├── voltara-pokecenter.ts   # Interior: Voltara PokéCenter
│       │   │   ├── voltara-pokemart.ts     # Interior: Voltara PokéMart
│       │   │   ├── voltara-gym.ts          # Interior: Voltara Gym (Electric)
│       │   │   ├── route-6.ts              # Route 6 (Voltara → Wraithmoor)
│       │   │   ├── wraithmoor-town.ts      # Wraithmoor Town: Town 7
│       │   │   ├── wraithmoor-pokecenter.ts
│       │   │   ├── wraithmoor-pokemart.ts
│       │   │   ├── wraithmoor-gym.ts       # Interior: Wraithmoor Gym (Ghost)
│       │   │   ├── route-7.ts              # Route 7 (Vex blockade)
│       │   │   ├── scalecrest-citadel.ts   # Scalecrest Citadel: Town 8
│       │   │   ├── scalecrest-pokecenter.ts
│       │   │   ├── scalecrest-pokemart.ts
│       │   │   ├── scalecrest-gym.ts       # Interior: Scalecrest Gym (Dragon)
│       │   │   ├── cinderfall-town.ts      # Cinderfall Town: Town 9
│       │   │   ├── cinderfall-pokecenter.ts
│       │   │   ├── cinderfall-pokemart.ts
│       │   │   ├── cinderfall-gym.ts       # Interior: Cinderfall Gym (Fire)
│       │   │   ├── victory-road.ts         # Victory Road dungeon
│       │   │   └── pokemon-league.ts       # Pokémon League (Elite Four + Champion)
│       │   ├── moves/                 # Per-type move definitions
│       │   │   ├── index.ts           # Re-exports combined moveData record
│       │   │   ├── normal.ts          # Normal-type moves (~70)
│       │   │   ├── fire.ts            # Fire-type moves
│       │   │   ├── water.ts           # Water-type moves
│       │   │   ├── electric.ts        # Electric-type moves
│       │   │   ├── grass.ts           # Grass-type moves
│       │   │   ├── ice.ts             # Ice-type moves
│       │   │   ├── fighting.ts        # Fighting-type moves
│       │   │   ├── poison.ts          # Poison-type moves
│       │   │   ├── ground.ts          # Ground-type moves
│       │   │   ├── flying.ts          # Flying-type moves
│       │   │   ├── psychic.ts         # Psychic-type moves
│       │   │   ├── bug.ts             # Bug-type moves
│       │   │   ├── rock.ts            # Rock-type moves
│       │   │   ├── ghost.ts           # Ghost-type moves
│       │   │   ├── dragon.ts          # Dragon-type moves
│       │   │   └── dark.ts            # Dark-type moves
│       │   ├── pokemon/               # Per-type Pokemon definitions (all 151)
│       │   │   ├── index.ts           # Re-exports combined pokemonData record
│       │   │   ├── normal.ts          # Normal-type Pokemon (22)
│       │   │   ├── fire.ts            # Fire-type Pokemon (12)
│       │   │   ├── water.ts           # Water-type Pokemon (28)
│       │   │   ├── electric.ts        # Electric-type Pokemon (9)
│       │   │   ├── grass.ts           # Grass-type Pokemon (12)
│       │   │   ├── ice.ts             # Ice-type Pokemon (2)
│       │   │   ├── fighting.ts        # Fighting-type Pokemon (7)
│       │   │   ├── poison.ts          # Poison-type Pokemon (14)
│       │   │   ├── ground.ts          # Ground-type Pokemon (8)
│       │   │   ├── psychic.ts         # Psychic-type Pokemon (8)
│       │   │   ├── bug.ts             # Bug-type Pokemon (12)
│       │   │   ├── rock.ts            # Rock-type Pokemon (9)
│       │   │   ├── ghost.ts           # Ghost-type Pokemon (3)
│       │   │   ├── dragon.ts          # Dragon-type Pokemon (3)
│       │   │   └── fairy.ts           # Fairy-type Pokemon (2)
│       │   ├── type-chart.ts          # 18×18 type effectiveness matrix
│       │   ├── item-data.ts           # ~20 items (potions, balls, key items)
│       │   ├── trainer-data.ts        # Trainer rosters, dialogue, rewards (rival, gym, grunts)
│       │   ├── encounter-tables.ts    # Per-route wild Pokémon + level ranges
│       │   ├── evolution-data.ts      # Evolution conditions (level, item, trade)
│       │   └── quest-data.ts          # Side quest definitions (steps, flags, rewards)
│       │
│       ├── managers/                   # Singleton service classes
│       │   ├── GameManager.ts         # Central state: party, bag, badges, flags
│       │   ├── AudioManager.ts        # BGM crossfade, SFX playback
│       │   ├── SaveManager.ts         # Serialize/deserialize to localStorage
│       │   ├── EventManager.ts        # Custom event bus for cross-scene comms
│       │   ├── DialogueManager.ts     # Dialogue queue management
│       │   ├── TransitionManager.ts   # Screen fade helpers
│       │   └── QuestManager.ts        # Quest progress tracking via GameManager flags
│       │
│       ├── systems/                    # Reusable gameplay systems
│       │   ├── GridMovement.ts        # Grid-locked tween movement engine
│       │   ├── EncounterSystem.ts     # Step counter → random encounter + fishing
│       │   ├── GameClock.ts           # Accelerated day/night cycle (10× speed)
│       │   ├── InputManager.ts        # Unified WASD/Arrow/touch → direction
│       │   └── AnimationHelper.ts     # Registers shared sprite animations
│       │
│       ├── ui/                         # Reusable UI components
│       │   ├── theme.ts               # Shared colors, fonts, spacing, helpers
│       │   ├── NinePatchPanel.ts      # Nine-patch style panel (rounded, shadowed)
│       │   ├── MenuController.ts      # Unified menu input (1D/2D grid, kb+mouse)
│       │   ├── TouchControls.ts       # Virtual D-pad + A/B buttons for mobile
│       │   ├── HealthBar.ts           # Animated HP bar widget
│       │   ├── TextBox.ts            # Typewriter text display
│       │   ├── MenuList.ts           # Selectable vertical menu (legacy)
│       │   ├── ConfirmBox.ts         # Yes/No prompt
│       │   └── BattleHUD.ts          # Composite: name + level + HP + EXP
│       │
│       └── utils/                      # Pure utility functions
│           ├── constants.ts           # TILE_SIZE, WALK_SPEED, MAX_PARTY_SIZE…
│           ├── type-helpers.ts        # TypeScript types (PokemonType, Nature…)
│           ├── audio-keys.ts          # BGM/SFX key constants, map→BGM mapping
│           └── math-helpers.ts        # clamp, lerp, randomInt, weightedRandom
│
├── tiled/                              # Tiled source files (NOT shipped)
│
└── docs/                               # Documentation
```

---

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       Phaser.Game                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Scene Manager                      │    │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │    │
│  │  │BootScene │→│ Preload  │→│   TitleScene      │   │    │
│  │  └──────────┘ └──────────┘ └────────┬──────────┘   │    │
│  │                                     │               │    │
│  │                          ┌──────────▼──────────┐   │    │
│  │                          │  OverworldScene      │   │    │
│  │                          │  (main game loop)    │   │    │
│  │                          └───┬──────────┬───────┘   │    │
│  │                ┌─────────────┤          ├─────────┐ │    │
│  │     ┌──────────▼───┐  ┌─────▼────┐  ┌──▼───────┐ │ │    │
│  │     │ BattleScene  │  │MenuScene │  │Dialogue  │ │ │    │
│  │     │ + BattleUI   │  │(overlay) │  │(overlay) │ │ │    │
│  │     └──────────────┘  └──────────┘  └──────────┘ │ │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌──────────────── Singleton Services ─────────────────┐    │
│  │  GameManager │ AudioManager │ SaveManager │ Events  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Scene Lifecycle & Responsibilities

### BootScene
- Loads **only** the loading-bar graphic and bitmap font.
- Immediately transitions to `PreloadScene`.

### PreloadScene
- Loads every asset (tilesets, spritesheets, Tiled JSONs, audio).
- Displays an animated progress bar using the assets from `BootScene`.
- On completion → `TitleScene`.

### TitleScene
- Animated title screen with menu: **New Game / Continue / Options**.
- "Continue" deserializes `SaveManager` data.
- Transitions → `OverworldScene`.

### OverworldScene
- Parses Tiled JSON, creates tilemap layers (`ground`, `world`, `above-player`).
- Spawns `Player` entity and enables `GridMovement`.
- Spawns NPCs / Trainers from Tiled object layers.
- Runs `EncounterSystem` on grass tiles.
- Launches overlay scenes (`DialogueScene`, `MenuScene`) without stopping itself.
- On encounter or trainer line-of-sight → launches `BattleScene`.

### BattleScene + BattleUIScene
- `BattleScene` manages the background and Pokémon sprites/animations.
- `BattleUIScene` runs as a parallel overlay for the HUD, move menu, and text log.
- `BattleStateMachine` drives the flow: `INTRO → PLAYER_TURN → ENEMY_TURN → CHECK_FAINT → VICTORY/DEFEAT`.
- On battle end → resumes `OverworldScene`.

### MenuScene (Pause Menu)
- Overlays on `OverworldScene` (pauses it).
- Sub-pages: Pokémon party, Bag, Pokédex placeholder, Save, Options.

### DialogueScene
- Simple overlay that receives a dialogue queue from `DialogueManager`.
- Typewriter text effect, advances on input.

### TransitionScene
- Plays screen-wipe or fade between map changes or battle entry/exit.

---

## Core Design Patterns

### Singleton Managers
`GameManager`, `AudioManager`, `SaveManager`, and `EventManager` are instantiated once and shared across all scenes. They live outside the scene lifecycle.

```typescript
// Access pattern from any scene:
const gm = GameManager.getInstance();
const party = gm.getParty();
```

### Finite State Machine (Battle)
The battle loop is driven by an explicit FSM rather than ad-hoc flags:

```
INTRO → PLAYER_TURN → MOVE_ANIMATION → ENEMY_TURN → MOVE_ANIMATION → CHECK_FAINT → …
```

Each state has `enter()`, `update()`, and `exit()` hooks. This keeps the complex battle logic deterministic and testable.

### Grid Movement (Tween-Based)
Movement is **not** physics-based. On key press, a Phaser Tween smoothly moves the sprite exactly `TILE_SIZE` pixels. New input is blocked until the tween completes.

```
idle → tweening (32px over ~200ms) → idle → …
```

### Event Bus (Decoupled Communication)
Scenes and managers communicate via a typed `EventManager` rather than direct references:

```typescript
EventManager.emit('BATTLE_START', { type: 'wild', pokemonId: 'pikachu', level: 5 });
EventManager.on('BATTLE_END', (result) => { /* resume overworld */ });
```

### Mobile / Touch Controls
The game supports mobile devices via a virtual touch overlay managed by three collaborating modules:

- **`TouchControls`** (`src/ui/TouchControls.ts`): Renders a virtual **D-pad** (bottom-left) and **A/B action buttons** (bottom-right) as Phaser `Circle` game objects in a `Container` pinned to the camera (`setScrollFactor(0)`, depth 1000). The D-pad sets `activeDirection` on `pointerdown` and clears it on `pointerup`/`pointerout`. The A button sets a `confirmPressed` flag; B sets `cancelPressed`. Both are consumed via `consumeConfirm()` / `consumeCancel()` (poll-and-clear pattern).
- **`InputManager`** (`src/systems/InputManager.ts`): Instantiates `TouchControls` when `navigator.maxTouchPoints > 0`. Its `getState()` method merges keyboard and touch input into a unified `InputState { direction, confirm, cancel, menu }` — keyboard is checked first, touch fills in the gaps.
- **`MenuController`** (`src/ui/MenuController.ts`): Handles menu navigation via keyboard events. It does **not** currently read touch input directly — menus rely on the A/B buttons being wired through `InputManager` or through Phaser `pointerdown` listeners on individual menu items.

**Visibility control:** `TouchControls` exposes `setDpadVisible(bool)` and `setVisible(bool)` so scenes can hide the D-pad during menus or hide the entire overlay during battles. The overlay auto re-layouts on `scale.resize`.

**Detection:** `TouchControls.isTouchDevice()` checks `navigator.maxTouchPoints > 0`. On desktop browsers this returns `false` and no touch UI is created.

### Data-Driven Design
Pokémon stats, moves, items, encounter tables, and trainer rosters are defined as static TypeScript objects in `src/data/`. No game logic lives in data files. This makes balancing easy and lets Copilot autocomplete data entries.

### Audio System
`AudioManager` wraps Phaser's `SoundManager` with convenience features:
- **BGM crossfade**: `playBGM(key)` fades out the current track and fades in the new one (~500ms). If the requested key matches the current track, it's a no-op.
- **Safe playback**: Missing audio keys silently no-op instead of crashing.
- **Autoplay policy**: If the browser blocks audio, the manager queues the BGM and starts it after the first user interaction.
- **Per-map BGM**: `MAP_BGM` in `audio-keys.ts` maps each map key to a BGM track. `OverworldScene` reads this on create to play the correct music, and crossfades automatically on map transitions.
- **Battle BGM**: `BattleScene` plays `BATTLE_WILD` or `BATTLE_TRAINER`, and `BattleUIScene` switches to `VICTORY` on win.
- **SFX**: One-shot sounds triggered throughout menus (cursor, confirm, cancel) and battle (hit variants, faint, level-up, encounter sting).

---

## Data Flow

```
Player Input
    │
    ▼
InputManager (normalizes WASD / Arrow / Gamepad / Touch)
    │
    ▼
Current Active Scene (OverworldScene or BattleScene)
    │
    ├──▶ GridMovement system (overworld)
    │       │
    │       ▼
    │    EncounterSystem (step on grass → random check)
    │       │
    │       ▼
    │    EventManager.emit('BATTLE_START')
    │
    ├──▶ BattleStateMachine (battle)
    │       │
    │       ▼
    │    DamageCalculator / MoveExecutor
    │       │
    │       ▼
    │    BattleUIScene updates HUD
    │
    ▼
GameManager (party HP, EXP, items mutated)
    │
    ▼
SaveManager (on explicit Save → localStorage)
```

---

## Tilemap Layer Convention (Tiled)

Each Tiled map should have these layers (bottom → top):

| Layer Name | Type | Purpose |
|-----------|------|---------|
| `Ground` | Tile Layer | Base terrain (grass, dirt, water) |
| `World` | Tile Layer | Buildings, trees, fences — **collision enabled** |
| `Above Player` | Tile Layer | Rooftops, treetops — rendered above the player |
| `Encounters` | Object Layer | Rectangles marking tall-grass encounter zones |
| `Spawns` | Object Layer | Player spawn point, NPC positions, door warps |
| `Warps` | Object Layer | Rectangles with custom properties (target map, target spawn) |

---

## Asset Sourcing Strategy

### Battle Sprites — PokéAPI

PokéAPI provides front sprites, back sprites, shiny variants, and menu icons for every Pokémon across all generations. The API response for any Pokémon (e.g., `https://pokeapi.co/api/v2/pokemon/pikachu`) includes a `sprites` object with direct image URLs.

**Two loading strategies:**

1. **Remote (on-the-fly):** Pass PokéAPI sprite URLs directly into Phaser's loader. The game downloads images at runtime. Simplest setup, smallest repo, but requires internet.
2. **Local (bundled):** Download sprites from the [PokeAPI/sprites](https://github.com/PokeAPI/sprites) GitHub repo into `public/assets/sprites/pokemon/`. Faster load times, works offline.

```typescript
// Strategy 1: Load from PokéAPI URL
this.load.image('pikachu-front', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png');

// Strategy 2: Load from local file
this.load.image('pikachu-front', 'assets/sprites/pokemon/pikachu-front.png');
```

### Overworld Walking Sprites — The Spriters Resource & Community

Walking sprites are **spritesheets** — a single image with a grid of frames covering all directions and step animations. These cannot be sourced from PokéAPI.

**Sources:**
- **The Spriters Resource** (`spriters-resource.com`): Ripped spritesheets from official games (FireRed, HeartGold, etc.). Search by game title.
- **r/PokemonRMXP** (Reddit): Community-compiled "Ultimate Sprite Collections" formatted for RPG Maker / game engines.

```typescript
// Loading a walking spritesheet in Phaser
this.load.spritesheet('player', 'assets/sprites/player/player_walk.png', {
    frameWidth: 32,
    frameHeight: 32
});
```

### Art Style Consistency

All assets should be sourced from the **same generation** to maintain visual coherence. Choose one:

| Generation | Style | Resolution | Pros |
|-----------|-------|-----------|------|
| Gen 3 (GBA) | FireRed / LeafGreen / Emerald | 16×16 tiles, 64×64 battle sprites | Classic feel, abundant community assets |
| Gen 4 (NDS) | HeartGold / SoulSilver | 16×16 tiles, 80×80 battle sprites | Polished pixel art, great walking sprites |
| Gen 5 (NDS) | Black / White | 16×16 tiles, animated battle sprites | Animated sprites, modern pixel art |

---

## Build & Deploy Pipeline

```bash
# Development
npm run dev          # Vite dev server on localhost:8080 with HMR

# Production
npm run build        # TypeScript compiled + tree-shaken → dist/
npm run preview      # Preview production build locally

# Deploy (GitHub Pages example)
npx gh-pages -d dist
```

---

## Key Phaser Configuration

```typescript
// src/config/game-config.ts
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,                   // WebGL with Canvas fallback
  width: 800,                          // 25 tiles × 32px
  height: 600,                         // ~18.75 tiles × 32px
  pixelArt: true,                      // Nearest-neighbor scaling (no blur)
  scale: {
    mode: Phaser.Scale.FIT,            // Scale canvas to fit window
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',                 // Lightweight physics for tile collisions
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [BootScene, PreloadScene, TitleScene, OverworldScene, BattleScene, BattleUIScene, DialogueScene, MenuScene],
};
```

---

## Scaling Strategy

- **Canvas resolution:** 800×600 (or 480×320 for authentic GBA feel) with `pixelArt: true`.
- **Phaser Scale Manager** set to `FIT` + `CENTER_BOTH` → fills browser while preserving aspect ratio.
- All art authored at native pixel resolution; Phaser's nearest-neighbor filtering keeps it crisp at any display size.
