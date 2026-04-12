# Pokemon Web Game — Architecture

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Language | TypeScript 5.x | Type safety, interfaces for game data, IDE autocomplete |
| Game Engine | Phaser 3.90+ | 2D rendering (WebGL/Canvas), physics, input, audio, scene management |
| Bundler | Vite 6.x | HMR dev server, tree-shaking, static asset copying, fast builds |
| Map Editor | Tiled (external) | Visual tilemap creation, exported as JSON for Phaser to consume |
| Art Format | 16×16 or 32×32 pixel-art tilesets & spritesheets | Classic Pokémon aesthetic |
| Sprite Source (Battle) | PokéAPI sprites | Front/back/shiny/icon sprites via API URLs or downloaded |
| Sprite Source (Overworld) | The Spriters Resource + community collections | Walking spritesheets (player, NPCs, follower Pokémon) |
| Hosting | GitHub Pages / Netlify / Vercel | Static site deployment of `dist/` output |

---

## Folder Structure

```
pokemon-web/
├── index.html                          # Minimal HTML shell, mounts the Phaser canvas
├── package.json
├── tsconfig.json
├── vite.config.ts                      # Vite config (aliases, build options)
│
├── public/                             # Static assets copied verbatim to dist/
│   ├── assets/
│   │   ├── tilesets/                   # Tileset PNGs used by Tiled maps
│   │   │   ├── overworld.png
│   │   │   ├── interiors.png
│   │   │   └── battle-backgrounds.png
│   │   ├── maps/                       # Tiled JSON exports
│   │   │   ├── pallet-town.json
│   │   │   ├── route-1.json
│   │   │   ├── viridian-city.json
│   │   │   └── oak-lab.json
│   │   ├── sprites/
│   │   │   ├── player/                 # Player walk-cycle spritesheets (4-dir)
│   │   │   │   ├── player-walk.png     # From The Spriters Resource
│   │   │   │   └── player-walk.json    # Texture atlas metadata
│   │   │   ├── npcs/                   # NPC spritesheets (from Spriters Resource)
│   │   │   │   ├── oak.png
│   │   │   │   ├── rival.png
│   │   │   │   └── generic-trainer.png
│   │   │   └── pokemon/               # Battle sprites — can be loaded from PokéAPI URLs
│   │   │       ├── README.md           # Documents PokéAPI sprite URL format
│   │   │       ├── bulbasaur-front.png # Optional local copies for offline/speed
│   │   │       ├── bulbasaur-back.png
│   │   │       └── ...
│   │   ├── ui/                         # UI elements (health bars, menus, text boxes)
│   │   │   ├── battle-hud.png
│   │   │   ├── dialogue-box.png
│   │   │   ├── menu-frame.png
│   │   │   └── type-icons.png
│   │   ├── audio/
│   │   │   ├── bgm/                    # Background music (ogg/mp3)
│   │   │   │   ├── title-theme.ogg
│   │   │   │   ├── pallet-town.ogg
│   │   │   │   ├── battle-wild.ogg
│   │   │   │   ├── battle-trainer.ogg
│   │   │   │   └── victory.ogg
│   │   │   └── sfx/                    # Sound effects
│   │   │       ├── menu-select.ogg
│   │   │       ├── hit-normal.ogg
│   │   │       ├── hit-super-effective.ogg
│   │   │       ├── level-up.ogg
│   │   │       └── ...
│   │   └── fonts/                      # Bitmap fonts for retro text
│   │       └── pokemon-font.png
│   └── favicon.ico
│
├── src/
│   ├── main.ts                         # Entry point: creates Phaser.Game instance
│   │
│   ├── config/
│   │   └── game-config.ts              # Phaser.Types.Core.GameConfig object
│   │
│   ├── scenes/                         # One file per Phaser Scene
│   │   ├── BootScene.ts                # Loads minimal assets for the loading bar
│   │   ├── PreloadScene.ts             # Loads all heavy assets; shows progress bar
│   │   ├── TitleScene.ts               # Main menu (New Game / Continue / Options)
│   │   ├── OverworldScene.ts           # Top-down world exploration & NPC interaction
│   │   ├── BattleScene.ts             # Turn-based battle (wild & trainer)
│   │   ├── BattleUIScene.ts           # Overlayed UI for battle (HP bars, move menu)
│   │   ├── DialogueScene.ts           # Overlayed scene for NPC dialogue boxes
│   │   ├── MenuScene.ts              # Pause menu (Pokémon, Bag, Save, etc.)
│   │   ├── InventoryScene.ts         # Bag / item management UI
│   │   ├── PartyScene.ts             # Pokémon party view & management
│   │   ├── SummaryScene.ts           # Individual Pokémon summary / stats
│   │   └── TransitionScene.ts        # Screen-wipe transitions between areas
│   │
│   ├── entities/                       # Game object classes
│   │   ├── Player.ts                   # Grid-locked player sprite + movement logic
│   │   ├── NPC.ts                      # Base NPC with dialogue & line-of-sight
│   │   ├── Trainer.ts                  # NPC subclass that triggers battle on sight
│   │   ├── WildEncounterZone.ts        # Invisible zone triggering random encounters
│   │   └── InteractableObject.ts       # Signs, PCs, item balls, doors
│   │
│   ├── battle/                         # Battle subsystem (isolated from scenes)
│   │   ├── BattleManager.ts            # Orchestrates turn order, win/loss conditions
│   │   ├── BattleStateMachine.ts       # FSM: INTRO → PLAYER_TURN → ENEMY_TURN → …
│   │   ├── DamageCalculator.ts         # Pokémon damage formula (type chart, STAB, crit)
│   │   ├── MoveExecutor.ts            # Applies move effects (damage, status, stat changes)
│   │   ├── AIController.ts            # Enemy move selection logic
│   │   ├── ExperienceCalculator.ts    # EXP yield, level-up, evolution checks
│   │   └── CatchCalculator.ts         # Poké Ball catch-rate formula
│   │
│   ├── data/                           # Pure data (no game logic)
│   │   ├── pokemon-data.ts             # Pokédex: base stats, types, learnsets, evolution chains
│   │   ├── move-data.ts                # Move definitions: power, accuracy, type, effect
│   │   ├── type-chart.ts              # 18×18 type effectiveness matrix
│   │   ├── item-data.ts               # Item definitions (potions, balls, key items)
│   │   ├── trainer-data.ts            # Trainer rosters, dialogue, reward money
│   │   ├── encounter-tables.ts        # Per-route wild Pokémon + level ranges
│   │   └── evolution-data.ts          # Evolution conditions (level, item, trade)
│   │
│   ├── managers/                       # Singleton service classes
│   │   ├── GameManager.ts              # Central state: party, badges, playtime, flags
│   │   ├── AudioManager.ts            # BGM crossfade, SFX playback
│   │   ├── SaveManager.ts             # Serialize/deserialize to localStorage
│   │   ├── EventManager.ts            # Custom event bus for cross-scene communication
│   │   ├── DialogueManager.ts         # Queued dialogue display, typewriter effect
│   │   └── TransitionManager.ts       # Screen wipe/fade helpers
│   │
│   ├── systems/                        # Reusable gameplay systems
│   │   ├── GridMovement.ts             # Grid-locked tween movement engine
│   │   ├── EncounterSystem.ts          # Step counter → random encounter trigger
│   │   ├── InputManager.ts            # Unified WASD/Arrow + gamepad + touch → direction
│   │   └── AnimationHelper.ts         # Registers shared sprite animations
│   │
│   ├── ui/                             # Reusable UI components (non-scene)
│   │   ├── HealthBar.ts               # Animated HP bar widget
│   │   ├── TextBox.ts                 # Typewriter text display
│   │   ├── MenuList.ts               # Selectable vertical menu (cursor-driven)
│   │   ├── ConfirmBox.ts             # Yes/No prompt
│   │   └── BattleHUD.ts              # Composite widget: name, level, HP, EXP bar
│   │
│   └── utils/                          # Pure utility functions
│       ├── math-helpers.ts             # Clamp, lerp, random-in-range
│       ├── type-helpers.ts             # TypeScript utility types
│       └── constants.ts                # TILE_SIZE, WALK_SPEED, MAX_PARTY_SIZE, etc.
│
├── tiled/                              # Tiled source project files (NOT shipped)
│   ├── overworld.tsx                   # Tileset XML files
│   ├── interiors.tsx
│   ├── pallet-town.tmx                # Tiled map source files
│   ├── route-1.tmx
│   └── ...
│
└── docs/
    ├── architecture.md                 # (this file)
    └── plan.md                         # Development plan & phases
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

### Data-Driven Design
Pokémon stats, moves, items, encounter tables, and trainer rosters are defined as static TypeScript objects in `src/data/`. No game logic lives in data files. This makes balancing easy and lets Copilot autocomplete data entries.

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
