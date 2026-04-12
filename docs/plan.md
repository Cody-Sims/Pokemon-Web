# Pokemon Web Game — Development Plan

## Project Overview

A browser-based Pokémon-style RPG built with **Phaser 3 + TypeScript + Vite**. The player explores a top-down overworld, captures and trains Pokémon in turn-based battles, interacts with NPCs, and progresses through gym challenges. The entire game runs client-side as a static web app.

---

## Phase 1: Environment & Tooling Setup

**Goal:** A running dev server with Phaser rendering a blank scene.

### 1.1 — Initialize the Project
- Scaffold using the official Phaser Vite TypeScript template:
  ```bash
  git clone https://github.com/phaserjs/template-vite-ts.git pokemon-web
  cd pokemon-web && npm install
  ```
- Alternatively: `npm create vite@latest pokemon-web -- --template vanilla-ts` then `npm install phaser`.
- Verify `npm run dev` opens `localhost:8080` with the Phaser splash.

### 1.2 — Configure the Project
- Set up `tsconfig.json` with `strict: true` and path aliases (`@scenes/*`, `@entities/*`, `@data/*`, etc.).
- Configure `vite.config.ts` to resolve those aliases.
- Add ESLint + Prettier for consistent code style.
- Create the folder structure defined in [architecture.md](architecture.md).

### 1.3 — Install External Tooling
- **Tiled Map Editor** — download from [mapeditor.org](https://www.mapeditor.org/). Used offline to paint maps, exported as JSON.
- **TexturePacker or free alternative (e.g., Leshy SpriteSheet Tool)** — pack spritesheets into texture atlases with JSON metadata.
- **Aseprite or Piskel** — pixel art editor for custom sprites (optional; can use open-source tilesets to start).

### 1.4 — Source Art Assets

#### Battle Sprites & Icons — PokéAPI
- PokéAPI (`https://pokeapi.co/api/v2/pokemon/{name}`) returns a `sprites` object with direct URLs to **front sprites**, **back sprites**, **shiny variants**, and **menu icons** for every generation.
- These URLs point to the open-source [PokeAPI/sprites](https://github.com/PokeAPI/sprites) GitHub repository.
- Sprites can be loaded directly from those URLs in Phaser's `preload()`, so the game downloads them on the fly — no need to bundle battle sprites locally.
- Alternatively, download the sprites from the repo and place them in `public/assets/sprites/pokemon/` for offline/faster loading.

#### Walking Sprites (Spritesheets) — The Spriters Resource & Community Collections
- Overworld walking sprites require **spritesheets** — a single image containing a grid of frames (facing 4 directions, stepping animation per direction).
- **The Spriters Resource** (`spriters-resource.com`) is the primary source: search for Pokémon FireRed/LeafGreen, HeartGold/SoulSilver, or other titles to find ripped player, NPC, and Pokémon-follower spritesheets.
- **r/PokemonRMXP** community on Reddit maintains "Ultimate Sprite Collections" — pre-formatted spritesheets for hundreds of Pokémon ready for RPG Maker or Phaser use.
- Download spritesheets and place them in `public/assets/sprites/player/`, `public/assets/sprites/npcs/`, etc.
- Load in Phaser with `this.load.spritesheet(key, path, { frameWidth: 32, frameHeight: 32 })`.

#### Tilesets
- Use open-source tilesets to bootstrap (e.g., [Tuxemon](https://github.com/Tuxemon/Tuxemon) CC-BY-SA tiles, or community-made Gen-style tilesets from The Spriters Resource).
- Choose a consistent art style / generation (e.g., GBA Gen 3 or NDS Gen 4) and source all spritesheets and tilesets from the same generation for visual coherence.

#### Organization
- Organize all assets into `public/assets/` per the architecture spec.
- Create placeholder spritesheets (solid-color rectangles) for anything not yet sourced.

### Deliverable
A `npm run dev` command that opens a browser with a Phaser canvas displaying "Hello World" text. Folder structure matches the architecture document. Git repo initialized with `.gitignore` for `node_modules/` and `dist/`.

---

## Phase 2: Core Scenes Skeleton

**Goal:** Every scene exists as a stub class. You can flow through Boot → Preload → Title → Overworld with placeholder visuals.

### 2.1 — BootScene
- Loads a single loading-bar sprite and bitmap font.
- Immediately starts `PreloadScene`.

### 2.2 — PreloadScene
- Iterates over all asset manifests (images, spritesheets, tilemaps, audio).
- Draws a progress bar using `this.load.on('progress', ...)`.
- On complete → starts `TitleScene`.

### 2.3 — TitleScene
- Background image or animated logo.
- Cursor-selectable menu: **New Game**, **Continue**, **Options**.
- "New Game" → starts `OverworldScene` (no intro cutscene yet).
- "Continue" → loads save data via `SaveManager`, then starts `OverworldScene`.

### 2.4 — OverworldScene (Stub)
- Loads a placeholder tilemap (even a colored rectangle).
- Spawns a placeholder player sprite.
- Camera follows the player.

### 2.5 — BattleScene + BattleUIScene (Stubs)
- `BattleScene`: black background, two placeholder Pokémon sprites (front/back).
- `BattleUIScene`: empty overlay launched in parallel.
- Triggered manually (e.g., press B to test battle entry).

### 2.6 — TransitionScene
- Implements fade-to-black and fade-from-black using Phaser camera effects.
- Used between scene switches for polish.

### Deliverable
You can press Start on TitleScene, see a placeholder overworld, press a key to enter a stub battle screen, and return to the overworld. All transitions have a fade effect.

---

## Phase 3: The Data Layer

**Goal:** All Pokémon, moves, items, and type interactions are defined as typed data objects. No game logic here — just pure data that other systems consume.

### 3.1 — TypeScript Interfaces

```typescript
// Core interfaces (src/data/ or src/utils/type-helpers.ts)

interface PokemonData {
  id: number;
  name: string;
  types: [PokemonType] | [PokemonType, PokemonType];
  baseStats: Stats;
  learnset: { level: number; moveId: string }[];
  evolutionChain: EvolutionNode[];
  catchRate: number;
  expYield: number;
  spriteKeys: { front: string; back: string; icon: string };
}

interface Stats {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

interface MoveData {
  id: string;
  name: string;
  type: PokemonType;
  category: 'physical' | 'special' | 'status';
  power: number | null;        // null for status moves
  accuracy: number;            // 0–100
  pp: number;
  effect?: MoveEffect;
  priority?: number;           // default 0
}

interface PokemonInstance {
  dataId: number;              // Reference to PokemonData.id
  nickname?: string;
  level: number;
  currentHp: number;
  stats: Stats;                // Calculated from base + IVs + EVs + nature
  ivs: Stats;
  evs: Stats;
  nature: Nature;
  moves: MoveInstance[];       // Max 4
  status: StatusCondition | null;
  exp: number;
  friendship: number;
}

interface MoveInstance {
  moveId: string;
  currentPp: number;
}

interface ItemData {
  id: string;
  name: string;
  category: 'pokeball' | 'medicine' | 'battle' | 'key' | 'tm';
  description: string;
  effect: ItemEffect;
}

interface TrainerData {
  id: string;
  name: string;
  spriteKey: string;
  party: { pokemonId: number; level: number; moves?: string[] }[];
  dialogue: { before: string[]; after: string[] };
  rewardMoney: number;
}

interface EncounterEntry {
  pokemonId: number;
  levelRange: [number, number];
  weight: number;              // Relative probability
}
```

### 3.2 — Type Effectiveness Chart
- 18×18 matrix mapping `AttackingType → DefendingType → multiplier` (0, 0.5, 1, 2).
- Stored as a `Record<PokemonType, Record<PokemonType, number>>`.

### 3.3 — Starter Pokédex (Initial Scope)
- Define **~30 Pokémon** for the initial build (3 starters + their evolutions, route Pokémon, gym leader teams).
- Define **~40 moves** covering all 18 types + key status moves (Tackle, Ember, Water Gun, Thunder Shock, Growl, Leer, etc.).
- Define **~15 items** (Potion, Super Potion, Poké Ball, Great Ball, Antidote, Paralyze Heal, Repel, Key Items).

### 3.4 — Encounter Tables
- Per-route tables: e.g., Route 1 → Pidgey (40%), Rattata (40%), Pikachu (20%), levels 2–5.
- Structured so adding new routes is just adding a new object.

### Deliverable
Running `tsc --noEmit` compiles cleanly. All data files export typed constants. A test script (or console log in BootScene) can print "Bulbasaur has 45 base HP and learns Tackle at level 1."

---

## Phase 4: Overworld Systems

**Goal:** The player walks around a Tiled map with grid-based movement, collides with walls, talks to NPCs, and triggers encounters in tall grass.

### 4.1 — Tiled Map Creation
- Create the first map in Tiled: **Pallet Town** (small, 30×30 tiles).
  - Layers: `Ground`, `World` (collidable), `Above Player`, `Encounters` (object layer), `Spawns` (object layer), `Warps`.
  - Mark collidable tiles using a custom `collides: true` property in the Tileset Editor.
  - Export as JSON into `public/assets/maps/`.

### 4.2 — Tilemap Loading in OverworldScene
```typescript
// OverworldScene.ts — create()
const map = this.make.tilemap({ key: 'pallet-town' });
const tileset = map.addTilesetImage('overworld', 'overworld-tiles');
const ground = map.createLayer('Ground', tileset);
const world = map.createLayer('World', tileset);
const above = map.createLayer('Above Player', tileset);
world.setCollisionByProperty({ collides: true });
above.setDepth(10); // Rendered above player
```

### 4.3 — Grid-Based Player Movement
- `Player` extends `Phaser.GameObjects.Sprite` (not physics sprite — movement is tween-based).
- `GridMovement` system:
  1. Listen for directional input via `InputManager`.
  2. Face the direction immediately (update sprite frame).
  3. Check if the target tile is walkable (no collision, in-bounds).
  4. If walkable → start a `Phaser.Tweens.Tween` moving the sprite `TILE_SIZE` pixels over ~180ms.
  5. Block new movement input until tween completes.
  6. On tween complete → check for encounter zone / warp / event trigger.

### 4.4 — Camera
- `this.cameras.main.startFollow(player, true)` for smooth camera tracking.
- Set camera bounds to the map dimensions so it doesn't scroll past edges.
- Optional: slight camera deadzone for a more natural feel.

### 4.5 — NPC System
- NPCs are spawned from Tiled object layer (`Spawns` layer, type = "npc").
- Each NPC has custom properties in Tiled: `npcId`, `direction`, `dialogue`.
- On player interaction (press Confirm while facing NPC):
  - Launch `DialogueScene` as an overlay with the NPC's dialogue text.
  - NPC turns to face the player during conversation.
- **Trainer NPCs** have a `lineOfSight` range. If the player walks into their LOS → exclamation mark animation → forced walk → battle.

### 4.6 — Dialogue System
- `DialogueManager` holds a queue of text strings.
- `DialogueScene` displays a text box at the bottom of the screen.
- Text appears with a typewriter effect (~30 chars/sec).
- Press Confirm to advance to the next line or dismiss.

### 4.7 — Map Transitions (Warps)
- Warp objects in Tiled have properties: `targetMap`, `targetSpawnId`.
- When the player steps on a warp tile:
  1. `TransitionScene` plays fade-to-black.
  2. `OverworldScene` restarts with the new map key.
  3. Player placed at the target spawn position.
  4. Fade-from-black.
- Works for both outdoor-to-outdoor (Route 1 → Viridian City) and outdoor-to-indoor (enter a building).

### 4.8 — Encounter System
- `EncounterSystem` increments a hidden step counter when the player moves into a tile tagged as an encounter zone.
- After each step in grass, roll a random check (e.g., ~10% per step, scaling with Repel usage).
- On trigger:
  1. Flash the screen (battle transition animation).
  2. Pick a Pokémon from the route's encounter table (weighted random).
  3. Launch `BattleScene` with the wild Pokémon data.

### Deliverable
The player can walk around Pallet Town, collide with walls/trees, talk to an NPC (Professor Oak placeholder), walk to Route 1 (map transition), encounter wild Pokémon in tall grass (BattleScene stub launches), and walk to Viridian City.

---

## Phase 5: Battle System

**Goal:** A fully functional turn-based battle system for wild encounters and trainer battles.

### 5.1 — Battle State Machine

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  INTRO ──▶ PLAYER_TURN ──▶ EXECUTE_MOVES ──▶ CHECK_FAINT     │
│              │                                    │            │
│              │ (Run / Bag /                  ┌────┴────┐       │
│              │  Switch)                      │ Nobody  │       │
│              │                               │ fainted │       │
│              ▼                               └────┬────┘       │
│         SPECIAL_ACTION                            │            │
│         (item use, switch,                        ▼            │
│          run attempt)                     NEXT_TURN (loop)     │
│                                                                │
│  CHECK_FAINT branches:                                         │
│    • Enemy fainted → EXP_GAIN → VICTORY (or next Pokémon)     │
│    • Player fainted → switch or DEFEAT                         │
│    • Both fainted → resolve simultaneously                     │
└────────────────────────────────────────────────────────────────┘
```

### 5.2 — Battle Flow Detail

#### INTRO State
1. Screen transition from overworld.
2. Slide in the enemy Pokémon sprite (front) from the right.
3. Display "A wild [Pokémon] appeared!" or "Trainer [Name] wants to battle!"
4. Slide in the player Pokémon sprite (back) from the left.
5. HP bars animate filling up.
6. → `PLAYER_TURN`.

#### PLAYER_TURN State
Player chooses from four options:
- **Fight** → show 4 moves with PP / type info → select a move.
- **Bag** → open inventory overlay (Poké Balls, Potions, etc.).
- **Pokémon** → open party overlay to switch active Pokémon.
- **Run** → attempt to flee (formula based on Speed stats; always succeeds vs. wild at higher speed; cannot run from trainer battles).

#### EXECUTE_MOVES State
1. Determine turn order: compare Speed stats (+ move priority).
2. First attacker's move resolves:
   - Play move animation.
   - `DamageCalculator` computes damage (see §5.3).
   - HP bar animates down.
   - Display effectiveness text ("It's super effective!", "It's not very effective...").
3. Check if defender fainted. If yes → skip their turn.
4. Second attacker's move resolves (same sub-steps).
5. → `CHECK_FAINT`.

#### CHECK_FAINT State
- If enemy fainted:
  - Wild: award EXP, prompt catch? (already fainted = no), → `VICTORY`.
  - Trainer: if trainer has more Pokémon → they send out next; otherwise → `VICTORY`.
- If player's Pokémon fainted:
  - If player has more conscious Pokémon → force switch.
  - If none left → `DEFEAT` (white out, lose money, warp to Pokémon Center).
- If nobody fainted → `PLAYER_TURN` (next turn loop).

### 5.3 — Damage Formula

Following the standard Pokémon damage formula:

$$
\text{Damage} = \left(\frac{(2 \times \text{Level} / 5 + 2) \times \text{Power} \times A / D}{50} + 2\right) \times \text{Modifier}
$$

Where:
- $A$ = attacker's Attack (physical) or Sp. Attack (special)
- $D$ = defender's Defense (physical) or Sp. Defense (special)
- **Modifier** = STAB × TypeEffectiveness × Critical × Random(0.85–1.0)
  - **STAB** (Same Type Attack Bonus) = 1.5 if the move type matches the attacker's type.
  - **Type Effectiveness** = looked up from `type-chart.ts` (0×, 0.25×, 0.5×, 1×, 2×, 4× for dual types).
  - **Critical** = 1.5 on a critical hit (~6.25% base chance).
  - **Random** = uniform random between 0.85 and 1.00.

### 5.4 — Status Conditions
| Status | Effect |
|--------|--------|
| Burn | Halves physical Attack; deals 1/16 max HP per turn |
| Paralysis | Halves Speed; 25% chance to miss turn |
| Poison | Deals 1/8 max HP per turn |
| Bad Poison | Damage increases each turn (1/16, 2/16, 3/16…) |
| Sleep | Cannot act for 1–3 turns |
| Freeze | Cannot act; 20% chance to thaw each turn |
| Confusion | 33% chance to hurt self each turn |
| Flinch | Skips turn (only applies same turn from certain moves) |

### 5.5 — EXP and Leveling

$$
\text{EXP Gained} = \frac{b \times L}{7}
$$

Where $b$ = base EXP yield of defeated Pokémon, $L$ = defeated Pokémon's level. Trainer battles give 1.5× EXP.

On level up:
1. Recalculate stats from base stats + IVs + EVs + nature.
2. Check learnset: if a new move is available at this level → prompt to learn it (replace one of 4 moves or skip).
3. Check evolution conditions.

### 5.6 — Catching Pokémon

$$
\text{CatchRate} = \frac{(3 \times \text{MaxHP} - 2 \times \text{CurrentHP}) \times \text{CatchRate} \times \text{BallBonus}}{3 \times \text{MaxHP}}
$$

- If CatchRate ≥ 255 → guaranteed catch.
- Otherwise perform up to 3 shake checks with the standard probability formula.
- Status bonuses: Sleep/Freeze ×2, Paralysis/Burn/Poison ×1.5.
- Display the ball rocking animation (0–3 rocks, then capture or escape).

### 5.7 — AI Controller (Enemy Moves)
- **Wild Pokémon:** random move selection (weighted slightly toward super-effective moves at higher difficulty).
- **Trainer Pokémon:** simple heuristic AI:
  1. If a super-effective move is available, prefer it.
  2. If HP < 25% and a healing item is scripted, use it.
  3. Otherwise, pick the highest-power available move.
  4. Future enhancement: difficulty tiers with smarter switching and prediction.

### Deliverable
A complete wild battle: encounter a Pidgey, select Fight, choose Tackle, see damage calculated, enemy attacks back, KO the Pidgey, gain EXP, level up, return to overworld. Catching with a Poké Ball works. Trainer battles with multi-Pokémon teams work end-to-end.

---

## Phase 6: UI & Menus

**Goal:** All in-game menus are functional and navigable entirely with keyboard/gamepad.

### 6.1 — Pause Menu (MenuScene)
Opened by pressing Escape / Start. Options:
- **Pokémon** — view party, reorder, check summary, use field moves.
- **Bag** — categorized item list (Medicine, Poké Balls, Key Items, TMs). Use items on Pokémon.
- **[Trainer Card]** — name, badges, playtime (placeholder).
- **Save** — serialize full game state to `localStorage`.
- **Options** — text speed, battle animation toggle, audio volume.
- **Exit** — close the menu, resume overworld.

### 6.2 — Party Screen (PartyScene)
- Shows 1–6 Pokémon with icons, names, levels, HP bars.
- Select a Pokémon to see options: Summary, Switch position, Use item on, Cancel.

### 6.3 — Summary Screen (SummaryScene)
- Multi-tab view: Info (type, OT, ID), Stats (hex chart or numerical), Moves (with PP & type).

### 6.4 — Inventory Screen (InventoryScene)
- Tab-based categories.
- Select an item → Use (on which Pokémon?), Toss, Cancel.

### 6.5 — Reusable UI Components
- **MenuList**: Vertical selectable list with a cursor sprite. Takes an array of labels, emits `onSelect(index)`.
- **HealthBar**: Animated bar that tweens width; changes color (green → yellow → red).
- **TextBox**: Nine-patch background with typewriter text and blinking advance indicator.
- **ConfirmBox**: "Yes / No" prompt with cursor.

### Deliverable
All menus are navigable with arrow keys + Enter/Escape. Items can be used on Pokémon. The game can be saved and loaded from the title screen.

---

## Phase 7: Audio

**Goal:** Background music and sound effects bring the game to life.

### 7.1 — AudioManager
- Singleton that wraps Phaser's `SoundManager`.
- `playBGM(key)` — crossfades from current track to new one (~500ms fade).
- `playSFX(key)` — fires and forgets a one-shot sound.
- `setVolume(bgm, sfx)` — user-configurable from Options menu.
- Respects browser autoplay policies (music starts muted until first user interaction, then fades in).

### 7.2 — Music Assignments
| Context | Track |
|---------|-------|
| Title Screen | `title-theme` |
| Pallet Town | `pallet-town` |
| Route 1 | `route-1` (or reuse a generic route theme) |
| Wild Battle | `battle-wild` |
| Trainer Battle | `battle-trainer` |
| Gym Leader Battle | `battle-gym` |
| Victory | `victory-fanfare` |
| Pokémon Center | `pokemon-center` |

### 7.3 — SFX List
- Menu: cursor move, confirm, cancel, error buzz.
- Battle: hit (normal / super-effective / not very effective), critical hit, faint cry, ball throw, ball shake, catch success, EXP bar fill, level up.
- Overworld: door open, ledge jump, bump into wall.

### Deliverable
Music plays and crossfades correctly when moving between areas and entering battles. SFX trigger on all appropriate actions.

---

## Phase 8: Save / Load System

**Goal:** The player can save their progress and resume later.

### 8.1 — SaveManager
- `save()`: serializes a `SaveData` object to `localStorage` as JSON.
- `load()`: deserializes and returns `SaveData`, or `null` if none exists.
- `hasSave()`: checks for existing save data (used by TitleScene to enable "Continue").
- `deleteSave()`: clears save data (used by a "New Game" confirmation in future).

### 8.2 — SaveData Interface

```typescript
interface SaveData {
  version: number;               // For future migration
  timestamp: number;
  player: {
    name: string;
    position: { mapKey: string; x: number; y: number; direction: string };
    party: PokemonInstance[];
    bag: { itemId: string; quantity: number }[];
    money: number;
    badges: string[];
    pokedex: { seen: number[]; caught: number[] };
    playtime: number;            // Seconds
  };
  flags: Record<string, boolean>;  // Story progress flags (e.g., 'receivedStarter', 'defeatedBrock')
  trainersDefeated: string[];      // Prevents trainer re-battles
}
```

### 8.3 — Auto-Save (Optional Enhancement)
- Save automatically on map transitions or after battles.
- Keep a single auto-save slot separate from the manual save.

### Deliverable
Save from the pause menu, refresh the browser, click "Continue" on the title screen, and resume exactly where you left off with the same party, items, and position.

---

## Phase 9: Game Content — World Building

**Goal:** Build out the game world from a single town to a multi-route adventure.

### 9.1 — Maps to Create

| Map | Size (tiles) | Key Features |
|-----|-------------|--------------|
| Pallet Town | 30×30 | Player's house, Rival's house, Oak's Lab |
| Route 1 | 20×60 | Tall grass (Pidgey, Rattata), ledges |
| Viridian City | 40×40 | Pokémon Center, PokéMart, Gym (locked initially) |
| Route 2 | 20×40 | Tall grass, entrance to Viridian Forest |
| Viridian Forest | 50×50 | Dense grass (Caterpie, Weedle, Pikachu), Bug Catcher trainers |
| Pewter City | 40×40 | Pokémon Center, Gym (Brock — Rock type) |

### 9.2 — Key Story Beats
1. **Intro:** Player leaves house → walks to Oak's Lab → receives starter Pokémon (choose from 3).
2. **Rival Battle 1:** Rival picks the type-advantaged starter → battle in the lab.
3. **Oak's Parcel:** Deliver a package from Viridian City PokéMart to Oak → receive Pokédex.
4. **Route 1 → Viridian City:** First wild encounters.
5. **Viridian Forest:** Trainer gauntlet, catch new Pokémon.
6. **Pewter Gym:** First Gym battle vs. Brock (Geodude + Onix).
7. **Badge earned:** Game loop validated end-to-end.

### 9.3 — Story Flags System
Use `GameManager.flags` (a `Record<string, boolean>`) to track progress:
- `receivedStarter`, `deliveredParcel`, `receivedPokedex`, `defeatedBrock`, etc.
- NPCs and warps check flags to gate content (e.g., Oak's aide blocks Route 2 until you have the Pokédex).

### Deliverable
A playable adventure from Pallet Town through Pewter Gym, with 6 maps, 3 starter Pokémon, ~15 wild species, ~10 trainer battles, and the first badge.

---

## Phase 10: Polish & Quality of Life

**Goal:** The game *feels* good. Animations, transitions, and small details.

### 10.1 — Animations
- **Player walk cycle:** 4 frames per direction (idle, step-left, idle, step-right).
- **NPC idle animations:** Occasional blink or shift.
- **Battle intro:** Pokémon slide in; trainer throws ball; ball opens with flash.
- **Move animations:** Per-move sprite effects or simple particle effects (e.g., fire particles for Ember, water splash for Water Gun).
- **Fainting animation:** Sprite drops and fades.
- **Level-up animation:** Flash + stat display.
- **Evolution animation:** Sprite morphs (white flash → new sprite).

### 10.2 — Battle Transitions
- Screen-wipe effect when entering a battle (classic mosaic/spiral/shatter pattern).
- Reverse wipe when returning to overworld.

### 10.3 — UI Polish
- Button hover/press states for menus.
- HP bar color grades: green > 50%, yellow 20–50%, red < 20%.
- EXP bar smooth fill animation on gain.
- Pokémon cry sound on encounter and on sending out.

### 10.4 — Performance
- Only load assets for the current map + adjacent maps.
- Destroy distant map layers when transitioning.
- Use texture atlases to minimize draw calls.
- Profile with Chrome DevTools and Phaser's built-in debug mode.

### 10.5 — Accessibility
- Full keyboard navigation (no mouse required).
- Configurable text speed (Slow / Medium / Fast / Instant).
- Battle animation toggle (skip animations for faster battles).
- High-contrast mode consideration for colorblind players (type icons supplement colors).

### Deliverable
The game feels polished: smooth transitions, satisfying battle animations, responsive menus, no visual glitches.

---

## Phase 11: Deployment

**Goal:** The game is live on the web for anyone to play.

### 11.1 — Production Build
```bash
npm run build    # Outputs to dist/
```
- Vite tree-shakes, minifies, and bundles all TypeScript + assets.
- Verify the `dist/` folder runs locally via `npm run preview`.

### 11.2 — Hosting Options

| Platform | Method | Notes |
|----------|--------|-------|
| **GitHub Pages** | `npx gh-pages -d dist` or GitHub Actions | Free, simple, custom domain support |
| **Netlify** | Drag-and-drop `dist/` or Git integration | Free tier, automatic deploys on push |
| **Vercel** | Git integration | Free tier, fast CDN |
| **itch.io** | Upload `dist/` as HTML game | Game-focused community, embed support |

### 11.3 — CI/CD (Optional)
- GitHub Actions workflow: on push to `main` → `npm ci` → `npm run build` → deploy to GitHub Pages.
- Run `tsc --noEmit` as a type-check step before building.

### Deliverable
A public URL where anyone can play the game in their browser.

---

## Phase 12: Future Enhancements (Post-MVP)

These are stretch goals to expand the game after the core loop is complete:

### Content Expansion
- More towns, routes, and gyms (8 gym badges → Elite Four).
- Full 151 Pokédex (or a custom regional dex).
- Side quests and optional areas (caves, Safari Zone).
- Day/night cycle affecting encounters and NPC schedules.

### Features
- **Pokémon Evolution animations** with multi-condition support (level, item, trade-simulated).
- **TMs and HMs** — teach moves from items; HMs usable in overworld (Cut, Surf, Strength).
- **Pokémon Center & PokéMart** — healing animation, buy/sell items.
- **PC Storage System** — box-based Pokémon storage (Bill's PC).
- **Fishing** — rod items + water encounter tables.
- **Egg Hatching** — breeding-lite system.
- **Abilities** — passive effects per Pokémon species.
- **Held Items** — items with in-battle effects.
- **Weather** — rain, sun, sandstorm affecting battles and overworld visuals.
- **Mini-games** — Slot machines, Bug-Catching Contest.

### Multiplayer (Ambitious)
- WebSocket or WebRTC peer-to-peer battles.
- Trade Pokémon between players.
- Shared leaderboard.

### Technical
- **Mobile touch controls** — virtual D-pad overlay.
- **PWA support** — offline play via service worker.
- **Localization (i18n)** — multi-language text support.
- **Mod support** — load custom Pokémon/maps from JSON.
- **Automated testing** — unit tests for damage calc, save/load; integration tests for battle flow using Phaser's headless mode.

---

## Development Principles

### Modular & Data-Driven
Every Pokémon, move, item, and trainer is defined as data, not code. Adding new content means adding objects to arrays, not writing new classes.

### Scene Isolation
Scenes communicate only through `EventManager` and `GameManager`. No scene directly references another scene's internals.

### Build Small, Test Often
Each phase has a concrete deliverable. Test that deliverable manually before moving on. Don't build Phase 5 (battles) before Phase 4 (overworld) is solid.

### Copilot-Friendly Code
- **Descriptive function and variable names** — Copilot fills in logic better when names are clear.
- **Rich comments before complex functions** — describe intent, inputs, outputs, and edge cases.
- **Small, focused files** — one class or system per file. Copilot struggles with 500+ line files.
- **Typed everything** — interfaces and enums give Copilot the context to generate correct code.

### Version Control
- Commit at the end of each sub-phase.
- Use feature branches for large systems (e.g., `feature/battle-system`).
- Write brief commit messages describing what works now.

---

## Estimated Scope per Phase

| Phase | Description | Relative Effort |
|-------|-------------|----------------|
| 1 | Environment Setup | Small |
| 2 | Scene Skeleton | Small |
| 3 | Data Layer | Medium |
| 4 | Overworld Systems | Large |
| 5 | Battle System | Large |
| 6 | UI & Menus | Medium |
| 7 | Audio | Small |
| 8 | Save / Load | Small |
| 9 | World Content | Large |
| 10 | Polish | Medium |
| 11 | Deployment | Small |
| 12 | Future Enhancements | Ongoing |

---

## Quick-Start Checklist

- [x] Clone Phaser Vite TS template & verify dev server runs
- [x] Set up folder structure per architecture.md
- [x] Create all Scene stub classes (Boot → Preload → Title → Overworld → Battle)
- [x] Define TypeScript interfaces for PokemonData, MoveData, ItemData
- [x] Populate data for 3 starters + 10 route Pokémon + 20 moves
- [ ] Build first Tiled map (Pallet Town) with collision layers
- [x] Implement grid-based player movement with tween
- [ ] Implement NPC dialogue system
- [ ] Implement map transitions (warps)
- [ ] Implement wild encounter trigger in tall grass
- [x] Build the battle state machine (INTRO → turns → VICTORY/DEFEAT)
- [x] Implement damage formula with type effectiveness
- [x] Implement Poké Ball catching mechanic
- [x] Implement EXP gain and level-up
- [x] Build pause menu with party/bag/save options
- [x] Implement save/load to localStorage
- [ ] Add background music and sound effects
- [ ] Build maps for Route 1, Viridian City, Viridian Forest, Pewter City
- [ ] Implement first gym battle (Brock)
- [ ] Polish animations and transitions
- [ ] Deploy to GitHub Pages
