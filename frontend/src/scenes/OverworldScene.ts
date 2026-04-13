import Phaser from 'phaser';
import { TILE_SIZE, GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';
import { Player } from '@entities/Player';
import { NPC } from '@entities/NPC';
import { Trainer } from '@entities/Trainer';
import { AnimationHelper } from '@systems/AnimationHelper';
import { InputManager } from '@systems/InputManager';
import { Direction } from '@utils/type-helpers';
import { GameManager } from '@managers/GameManager';
import { EncounterSystem } from '@systems/EncounterSystem';
import { TransitionManager } from '@managers/TransitionManager';
import { PokemonInstance, SaveData } from '@data/interfaces';
import { trainerData } from '@data/trainer-data';
import { moveData } from '@data/moves';
import {
  mapRegistry,
  MapDefinition,
  NpcSpawn,
  Tile,
  TILE_COLORS,
  SOLID_TILES,
} from '@data/maps';
import { AudioManager } from '@managers/AudioManager';
import { BGM, SFX, MAP_BGM } from '@utils/audio-keys';

export class OverworldScene extends Phaser.Scene {
  private player!: Player;
  private inputManager!: InputManager;
  private encounterSystem!: EncounterSystem;
  private npcs: NPC[] = [];
  private trainers: Trainer[] = [];
  private mapDef!: MapDefinition;
  private mapKey = 'pallet-town';
  private spawnId = 'default';
  private lastAnimKey = '';
  private lastFlipX = false;
  private transitioning = false;

  constructor() {
    super({ key: 'OverworldScene' });
  }

  init(data?: { mapKey?: string; spawnId?: string; saveData?: SaveData }): void {
    // Restore from save data if provided
    if (data?.saveData) {
      const gm = GameManager.getInstance();
      gm.loadFromSave(data.saveData);
      this.mapKey = gm.getCurrentMap();
      this.spawnId = '__resume';
    } else {
      this.mapKey = data?.mapKey ?? GameManager.getInstance().getCurrentMap();
      this.spawnId = data?.spawnId ?? 'default';
    }
    this.transitioning = false;
    this.npcs = [];
    this.trainers = [];
    this.lastAnimKey = '';
    this.lastFlipX = false;
  }

  create(): void {
    const gm = GameManager.getInstance();

    // Ensure player has a starter Pokemon (fallback — normally received from Oak)
    if (gm.getParty().length === 0 && gm.getFlag('receivedStarter')) {
      const starter = EncounterSystem.createWildPokemon(1, 5);
      starter.nickname = 'Bulbasaur';
      gm.addToParty(starter);
    }

    // Load map definition
    this.mapDef = mapRegistry[this.mapKey];
    if (!this.mapDef) {
      console.error(`Map not found: ${this.mapKey}`);
      return;
    }

    gm.setCurrentMap(this.mapKey);

    const mapW = this.mapDef.width;
    const mapH = this.mapDef.height;

    // Draw tile map
    this.drawMap(mapW, mapH);

    // Init encounter system
    this.encounterSystem = new EncounterSystem();

    // Register player animations and create player
    AnimationHelper.registerPlayerAnimations(this);

    // Determine spawn position
    let spawnX: number;
    let spawnY: number;
    let spawnDir: string;
    if (this.spawnId === '__resume') {
      // Returning from battle — use saved position
      const pos = gm.getPlayerPosition();
      spawnX = pos.x;
      spawnY = pos.y;
      spawnDir = pos.direction;
    } else {
      const spawn = this.mapDef.spawnPoints[this.spawnId] ?? this.mapDef.spawnPoints['default'];
      spawnX = spawn.x;
      spawnY = spawn.y;
      spawnDir = spawn.direction;
    }

    this.player = new Player(this, spawnX, spawnY);
    this.player.setScale(2);
    const animDir = spawnDir === 'right' ? 'left' : spawnDir;
    this.player.play(`player-idle-${animDir}`);
    if (spawnDir === 'right') this.player.setFlipX(true);

    gm.setPlayerPosition({ x: spawnX, y: spawnY, direction: spawnDir });

    // Spawn NPCs and Trainers from map data
    this.spawnNPCs();
    this.spawnTrainers();

    // Set up collision: solid tiles + NPC positions
    this.player.gridMovement.setCollisionCheck((tx, ty) => {
      if (tx < 0 || ty < 0 || ty >= mapH || tx >= mapW) return true;
      if (SOLID_TILES.has(this.mapDef.ground[ty][tx])) return true;
      // Block NPC/Trainer tiles
      for (const npc of this.npcs) {
        const npcTX = Math.floor(npc.x / TILE_SIZE);
        const npcTY = Math.floor(npc.y / TILE_SIZE);
        if (npcTX === tx && npcTY === ty) return true;
      }
      return false;
    });

    // On each step complete: check warps, encounters, trainer LoS
    this.player.gridMovement.setMoveCompleteCallback(() => this.onPlayerStep());

    // Camera
    const mapPixelW = mapW * TILE_SIZE;
    const mapPixelH = mapH * TILE_SIZE;

    if (this.mapDef.isInterior && mapPixelW <= GAME_WIDTH && mapPixelH <= GAME_HEIGHT) {
      // Small interior — center the camera on the map, don't follow player
      this.cameras.main.stopFollow();
      this.cameras.main.setBounds(0, 0, mapPixelW, mapPixelH);
      this.cameras.main.centerOn(mapPixelW / 2, mapPixelH / 2);
    } else {
      this.cameras.main.startFollow(this.player, true);
      this.cameras.main.setBounds(0, 0, mapPixelW, mapPixelH);
    }

    // Input
    this.inputManager = new InputManager(this);

    // ── Audio: play map BGM ──
    const audio = AudioManager.getInstance();
    audio.setScene(this);
    const bgmKey = MAP_BGM[this.mapKey] ?? BGM.PALLET_TOWN;
    audio.playBGM(bgmKey);

    // HUD label
    const { width } = this.cameras.main;
    const mapLabel = this.mapDef.displayName
      ?? this.mapKey.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    this.add.text(width / 2, 20, `${mapLabel}  |  ENTER = Talk  |  ESC = Menu`, {
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    // Show location name popup for interiors
    if (this.mapDef.isInterior && this.mapDef.displayName) {
      const namePopup = this.add.text(width / 2, 50, this.mapDef.displayName, {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#00000088',
        padding: { x: 12, y: 6 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);

      this.tweens.add({
        targets: namePopup,
        alpha: { from: 0, to: 1 },
        duration: 300,
        yoyo: true,
        hold: 1500,
        onComplete: () => namePopup.destroy(),
      });
    }
  }

  // ── Map rendering ────────────────────────────────────────
  private drawMap(mapW: number, mapH: number): void {
    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        const tile = this.mapDef.ground[y][x];
        const color = TILE_COLORS[tile] ?? 0x5a9e3e;
        const px = x * TILE_SIZE + TILE_SIZE / 2;
        const py = y * TILE_SIZE + TILE_SIZE / 2;
        const S = TILE_SIZE;

        // Base tile
        this.add.rectangle(px, py, S, S, color);

        // ── Enhanced tile detail ──
        // Seeded variation per tile for consistency
        const seed = (x * 7 + y * 13) % 17;

        switch (tile) {
          // ── GRASS ──
          case Tile.GRASS: {
            // Subtle shade variation
            if (seed < 5) {
              this.add.rectangle(px - 4, py - 2, 3, 3, 0x6db04e);
            }
            if (seed > 10) {
              this.add.rectangle(px + 3, py + 4, 2, 2, 0x4d8e2e);
            }
            break;
          }

          // ── PATH ──
          case Tile.PATH: {
            // Pebble/texture dots
            if (seed < 4) {
              this.add.rectangle(px - 5, py - 3, 2, 2, 0xb89848).setAlpha(0.6);
            }
            if (seed > 8) {
              this.add.rectangle(px + 4, py + 2, 2, 1, 0xd4b46a).setAlpha(0.5);
            }
            // Subtle border darkening on edges
            if (y > 0 && this.mapDef.ground[y - 1][x] !== Tile.PATH) {
              this.add.rectangle(px, py - S / 2 + 1, S, 2, 0xb09040).setAlpha(0.3);
            }
            break;
          }

          // ── TALL GRASS ──
          case Tile.TALL_GRASS: {
            // Multiple grass blades
            this.add.rectangle(px - 6, py - 3, 2, 10, 0x4a8b32);
            this.add.rectangle(px + 6, py - 2, 2, 10, 0x4a8b32);
            this.add.rectangle(px, py - 5, 2, 10, 0x4a8b32);
            this.add.rectangle(px - 3, py - 4, 2, 8, 0x55a038);
            this.add.rectangle(px + 3, py - 3, 2, 9, 0x55a038);
            // Flower accent on some
            if (seed % 7 === 0) {
              this.add.circle(px + 2, py - 6, 2, 0xf0e040);
            }
            break;
          }

          // ── TREE ──
          case Tile.TREE: {
            // Shadow under tree
            this.add.ellipse(px, py + 6, 20, 8, 0x1a3a10).setAlpha(0.3);
            // Trunk
            this.add.rectangle(px, py + 4, 6, 12, 0x6b4226);
            this.add.rectangle(px, py + 4, 4, 12, 0x7b5236);
            // Canopy (overlapping circles)
            this.add.circle(px, py - 6, 10, 0x2d6a1e);
            this.add.circle(px - 5, py - 3, 7, 0x357a24);
            this.add.circle(px + 5, py - 3, 7, 0x357a24);
            this.add.circle(px, py - 8, 6, 0x3d8a2e);
            break;
          }

          // ── WATER ──
          case Tile.WATER: {
            // Wave highlights
            const waveOffset = (seed % 3) * 4;
            this.add.rectangle(px - 6 + waveOffset, py - 3, 8, 2, 0x5a9edf).setAlpha(0.4);
            this.add.rectangle(px + 2 - waveOffset, py + 3, 6, 2, 0x5a9edf).setAlpha(0.3);
            // Sparkle
            if (seed % 5 === 0) {
              this.add.rectangle(px + 4, py - 5, 2, 2, 0x8acfff).setAlpha(0.6);
            }
            break;
          }

          // ── HOUSE WALL ──
          case Tile.HOUSE_WALL: {
            // Foundation line at bottom
            this.add.rectangle(px, py + S / 2 - 1, S, 2, 0xb0a080);
            // Brick pattern
            if (seed % 3 === 0) {
              this.add.rectangle(px - 4, py - 4, 8, 1, 0xc0b490).setAlpha(0.4);
              this.add.rectangle(px + 4, py + 2, 8, 1, 0xc0b490).setAlpha(0.4);
            }
            break;
          }

          // ── HOUSE ROOF ──
          case Tile.HOUSE_ROOF: {
            // Shingle lines
            this.add.rectangle(px, py - 4, S - 2, 1, 0x903030).setAlpha(0.5);
            this.add.rectangle(px, py + 2, S - 2, 1, 0x903030).setAlpha(0.5);
            this.add.rectangle(px, py + 8, S - 2, 1, 0x903030).setAlpha(0.5);
            break;
          }

          // ── HOUSE DOOR ──
          case Tile.HOUSE_DOOR: {
            // Door frame
            this.add.rectangle(px, py, S - 8, S - 4, 0x8b5a30);
            // Door panel
            this.add.rectangle(px, py - 2, S - 14, S - 10, 0x7a4a22);
            // Doorknob
            this.add.circle(px + 4, py, 2, 0xd4a820);
            // Step
            this.add.rectangle(px, py + S / 2 - 2, S - 4, 3, 0xa09070);
            break;
          }

          // ── FLOWER ──
          case Tile.FLOWER: {
            // Grass base already from color
            // Stem
            this.add.rectangle(px, py + 2, 1, 6, 0x3d7a28);
            // Petals
            const flowerColor = seed % 3 === 0 ? 0xf06060 : seed % 3 === 1 ? 0xf0e040 : 0x6060f0;
            this.add.circle(px - 2, py - 3, 3, flowerColor);
            this.add.circle(px + 2, py - 3, 3, flowerColor);
            this.add.circle(px, py - 5, 3, flowerColor);
            // Center
            this.add.circle(px, py - 3, 2, 0xf0e840);
            break;
          }

          // ── SIGN ──
          case Tile.SIGN: {
            // Post
            this.add.rectangle(px, py + 6, 3, 10, 0x6b4226);
            // Board
            this.add.rectangle(px, py - 4, 18, 12, 0xa08040);
            this.add.rectangle(px, py - 4, 16, 10, 0xb89848);
            break;
          }

          // ── FENCE ──
          case Tile.FENCE: {
            // Posts
            this.add.rectangle(px - 8, py, 4, S, 0x7b5a3a);
            this.add.rectangle(px + 8, py, 4, S, 0x7b5a3a);
            // Rails
            this.add.rectangle(px, py - 4, S, 3, 0x8b6a4a);
            this.add.rectangle(px, py + 4, S, 3, 0x8b6a4a);
            break;
          }

          // ── LAB WALL ──
          case Tile.LAB_WALL: {
            this.add.rectangle(px, py + S / 2 - 1, S, 2, 0xa0a0a0);
            if (seed % 4 === 0) {
              this.add.rectangle(px, py, 8, 1, 0xb8b8b8).setAlpha(0.3);
            }
            break;
          }

          // ── LAB ROOF ──
          case Tile.LAB_ROOF: {
            this.add.rectangle(px, py - 3, S - 2, 1, 0x606090).setAlpha(0.5);
            this.add.rectangle(px, py + 4, S - 2, 1, 0x606090).setAlpha(0.5);
            break;
          }

          // ── LAB DOOR ──
          case Tile.LAB_DOOR: {
            this.add.rectangle(px, py, S - 8, S - 4, 0x7a6a5a);
            this.add.rectangle(px, py - 2, S - 14, S - 10, 0x6a5a4a);
            this.add.circle(px + 4, py, 2, 0xc0a020);
            this.add.rectangle(px, py + S / 2 - 2, S - 4, 3, 0x908070);
            break;
          }

          // ── LEDGE ──
          case Tile.LEDGE: {
            this.add.rectangle(px, py + S / 2 - 3, S, 4, 0x3a7a2a);
            this.add.rectangle(px, py + S / 2 - 1, S, 2, 0x2a5a1a);
            break;
          }

          // ── POKECENTER ──
          case Tile.CENTER_ROOF: {
            this.add.rectangle(px, py - 3, S - 2, 1, 0xc03030).setAlpha(0.4);
            // Cross
            this.add.rectangle(px, py, 8, 3, 0xffffff);
            this.add.rectangle(px, py, 3, 8, 0xffffff);
            break;
          }
          case Tile.CENTER_WALL: {
            this.add.rectangle(px, py + S / 2 - 1, S, 2, 0xd09090);
            break;
          }
          case Tile.CENTER_DOOR: {
            this.add.rectangle(px, py, S - 8, S - 4, 0xe09070);
            this.add.rectangle(px, py + S / 2 - 2, S - 4, 3, 0xc08060);
            // Sliding door lines
            this.add.rectangle(px, py - 2, 1, S - 8, 0xb07050);
            break;
          }

          // ── MART ──
          case Tile.MART_ROOF: {
            this.add.rectangle(px, py - 3, S - 2, 1, 0x3070b0).setAlpha(0.4);
            this.add.text(px, py, 'M', { fontSize: '10px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
            break;
          }
          case Tile.MART_WALL: {
            this.add.rectangle(px, py + S / 2 - 1, S, 2, 0x90b0d0);
            break;
          }
          case Tile.MART_DOOR: {
            this.add.rectangle(px, py, S - 8, S - 4, 0x7090b0);
            this.add.rectangle(px, py + S / 2 - 2, S - 4, 3, 0x6090b0);
            this.add.rectangle(px, py - 2, 1, S - 8, 0x5080a0);
            break;
          }

          // ── GYM ──
          case Tile.GYM_ROOF: {
            this.add.rectangle(px, py - 3, S - 2, 1, 0x707070).setAlpha(0.4);
            this.add.text(px, py, '★', { fontSize: '10px', color: '#ffcc00' }).setOrigin(0.5);
            break;
          }
          case Tile.GYM_WALL: {
            this.add.rectangle(px, py + S / 2 - 1, S, 2, 0xc0a070);
            break;
          }
          case Tile.GYM_DOOR: {
            this.add.rectangle(px, py, S - 8, S - 4, 0x908060);
            this.add.rectangle(px, py + S / 2 - 2, S - 4, 3, 0x807050);
            this.add.circle(px + 4, py, 2, 0xd4a820);
            break;
          }

          // ── DENSE TREE ──
          case Tile.DENSE_TREE: {
            this.add.circle(px, py - 4, 12, 0x0d380a);
            this.add.circle(px - 4, py - 1, 8, 0x154010);
            this.add.circle(px + 4, py - 1, 8, 0x154010);
            this.add.circle(px, py - 7, 7, 0x1a4810);
            break;
          }

          // ── INTERIOR: FLOOR ──
          case Tile.FLOOR: {
            // Wood plank lines
            if (x % 2 === 0) {
              this.add.rectangle(px, py - 4, S, 1, 0xc0a880).setAlpha(0.3);
              this.add.rectangle(px, py + 6, S, 1, 0xc0a880).setAlpha(0.3);
            } else {
              this.add.rectangle(px, py, S, 1, 0xc0a880).setAlpha(0.3);
              this.add.rectangle(px, py + 10, S, 1, 0xc0a880).setAlpha(0.3);
            }
            break;
          }

          // ── INTERIOR: WALL ──
          case Tile.INDOOR_WALL: {
            // Baseboard
            this.add.rectangle(px, py + S / 2 - 2, S, 4, 0xb0986a);
            // Wall texture
            if (seed % 5 === 0) {
              this.add.rectangle(px, py - 2, 1, 8, 0xd8ccb8).setAlpha(0.3);
            }
            break;
          }

          // ── INTERIOR: COUNTER ──
          case Tile.COUNTER: {
            // Counter top
            this.add.rectangle(px, py - 4, S, 6, 0xa07a20);
            // Front panel
            this.add.rectangle(px, py + 4, S, S - 8, 0x7a5a14);
            break;
          }

          // ── INTERIOR: TABLE ──
          case Tile.TABLE: {
            // Table surface
            this.add.rectangle(px, py - 2, S - 4, S - 8, 0xb08c50);
            // Legs visible at bottom
            this.add.rectangle(px - 8, py + 8, 3, 6, 0x7a5a30);
            this.add.rectangle(px + 8, py + 8, 3, 6, 0x7a5a30);
            break;
          }

          // ── INTERIOR: BOOKSHELF ──
          case Tile.BOOKSHELF: {
            // Shelf back
            this.add.rectangle(px, py, S - 4, S - 2, 0x7a5230);
            // Books (colored rectangles)
            this.add.rectangle(px - 6, py - 6, 4, 8, 0xe04040);
            this.add.rectangle(px - 2, py - 6, 4, 8, 0x4040e0);
            this.add.rectangle(px + 2, py - 6, 4, 8, 0x40a040);
            this.add.rectangle(px + 6, py - 6, 4, 8, 0xe0a040);
            // Bottom shelf
            this.add.rectangle(px - 4, py + 4, 4, 8, 0xa04040);
            this.add.rectangle(px + 0, py + 4, 4, 8, 0x4080a0);
            this.add.rectangle(px + 4, py + 4, 4, 8, 0xa0a040);
            break;
          }

          // ── INTERIOR: RUG ──
          case Tile.RUG: {
            // Rug border
            this.add.rectangle(px, py, S - 2, S - 2, 0xa03030);
            // Pattern
            this.add.rectangle(px, py, S - 8, S - 8, 0xc04040);
            this.add.rectangle(px, py, S - 14, S - 14, 0xa03030);
            break;
          }

          // ── INTERIOR: MAT (exit warp) ──
          case Tile.MAT: {
            // Brown mat
            this.add.rectangle(px, py, S - 4, S - 6, 0x90a860);
            this.add.rectangle(px, py, S - 8, S - 10, 0xa0b870);
            break;
          }

          // ── INTERIOR: PC ──
          case Tile.PC_TILE: {
            // Monitor
            this.add.rectangle(px, py - 4, 14, 12, 0x303030);
            this.add.rectangle(px, py - 4, 10, 8, 0x4080c0);
            // Stand
            this.add.rectangle(px, py + 4, 4, 6, 0x404040);
            // Keyboard
            this.add.rectangle(px, py + 8, 12, 3, 0x505050);
            break;
          }

          // ── INTERIOR: HEAL MACHINE ──
          case Tile.HEAL_MACHINE: {
            // Machine base
            this.add.rectangle(px, py + 2, 18, 20, 0xf08080);
            // Screen
            this.add.rectangle(px, py - 4, 10, 6, 0x40e040);
            // Ball tray
            this.add.circle(px - 4, py + 4, 3, 0xf0f0f0);
            this.add.circle(px + 4, py + 4, 3, 0xf0f0f0);
            break;
          }

          // ── INTERIOR: WINDOW ──
          case Tile.WINDOW: {
            // Wall base
            this.add.rectangle(px, py, S, S, 0xe8dcc8);
            // Window frame
            this.add.rectangle(px, py - 2, 14, 12, 0x6b4226);
            // Glass
            this.add.rectangle(px, py - 2, 12, 10, 0x90c8e0);
            // Cross pane
            this.add.rectangle(px, py - 2, 12, 1, 0x6b4226);
            this.add.rectangle(px, py - 2, 1, 10, 0x6b4226);
            break;
          }

          // ── INTERIOR: CHAIR ──
          case Tile.CHAIR: {
            // Floor underneath
            this.add.rectangle(px, py, S, S, TILE_COLORS[Tile.FLOOR]);
            // Chair seat
            this.add.rectangle(px, py + 2, 12, 8, 0x8b6914);
            // Chair back
            this.add.rectangle(px, py - 6, 12, 4, 0x9b7924);
            break;
          }

          // ── INTERIOR: POKEBALL ITEM ──
          case Tile.POKEBALL_ITEM: {
            // Floor underneath
            this.add.rectangle(px, py, S, S, TILE_COLORS[Tile.FLOOR]);
            // Pokéball - top half red
            this.add.circle(px, py - 2, 6, 0xe04040);
            // Bottom half white (overlap)
            this.add.rectangle(px, py + 1, 12, 6, 0xf0f0f0);
            // Center line
            this.add.rectangle(px, py - 2, 12, 2, 0x303030);
            // Center button
            this.add.circle(px, py - 2, 3, 0xf0f0f0);
            this.add.circle(px, py - 2, 2, 0x303030);
            break;
          }

          // ── INTERIOR: GYM FLOOR ──
          case Tile.GYM_FLOOR: {
            // Rocky texture
            if (seed % 3 === 0) {
              this.add.rectangle(px - 3, py + 2, 4, 3, 0xb8a888).setAlpha(0.4);
            }
            if (seed % 4 === 0) {
              this.add.rectangle(px + 5, py - 3, 3, 3, 0xb0a080).setAlpha(0.3);
            }
            // Battle lines on floor
            if (x % 4 === 0) {
              this.add.rectangle(px, py, 1, S, 0xd0c0a0).setAlpha(0.15);
            }
            break;
          }

          // ── INTERIOR: GYM STATUE ──
          case Tile.GYM_STATUE: {
            // Floor underneath
            this.add.rectangle(px, py, S, S, TILE_COLORS[Tile.GYM_FLOOR]);
            // Pedestal
            this.add.rectangle(px, py + 4, 16, 8, 0x808080);
            // Statue
            this.add.rectangle(px, py - 4, 10, 14, 0xa0a0a0);
            this.add.rectangle(px, py - 8, 6, 6, 0xb0b0b0);
            break;
          }
        }
      }
    }
  }

  // ── NPC / Trainer spawning ────────────────────────────────
  private spawnNPCs(): void {
    const gm = GameManager.getInstance();
    for (const def of this.mapDef.npcs) {
      // Check flag requirement
      if (def.requireFlag) {
        const negate = def.requireFlag.startsWith('!');
        const flagName = negate ? def.requireFlag.slice(1) : def.requireFlag;
        const flagVal = gm.getFlag(flagName);
        if (negate ? flagVal : !flagVal) continue;
      }
      const npc = new NPC(
        this, def.tileX, def.tileY,
        def.textureKey, def.id, def.dialogue, def.facing,
      );
      npc.setScale(2);
      npc.setDepth(1);
      // Store the full spawn definition for special interactions
      (npc as NPC & { spawnDef?: NpcSpawn }).spawnDef = def;
      this.npcs.push(npc);
    }
  }

  /** Destroy and re-create NPCs so flag-gated spawns update. */
  private respawnNPCs(): void {
    for (const npc of this.npcs) npc.destroy();
    this.npcs = [];
    this.trainers = [];
    this.spawnNPCs();
    this.spawnTrainers();
  }

  private spawnTrainers(): void {
    const gm = GameManager.getInstance();
    for (const def of this.mapDef.trainers) {
      if (gm.isTrainerDefeated(def.trainerId)) continue;
      const tData = trainerData[def.trainerId];
      const trainer = new Trainer(
        this, def.tileX, def.tileY,
        def.textureKey, def.id, def.trainerId,
        tData?.dialogue?.before ?? ['...'],
        def.facing, def.lineOfSight,
      );
      trainer.setScale(2);
      trainer.setDepth(1);
      this.trainers.push(trainer);
      this.npcs.push(trainer); // also in NPC list for collision
    }
  }

  // ── Per-step hooks ────────────────────────────────────────
  private onPlayerStep(): void {
    if (this.transitioning) return;

    const { x: tx, y: ty } = this.player.getTilePosition();
    const gm = GameManager.getInstance();

    // Persist position
    gm.setPlayerPosition({
      x: tx, y: ty, direction: this.player.getFacing(),
    });

    // Warps
    for (const warp of this.mapDef.warps) {
      if (warp.tileX === tx && warp.tileY === ty) {
        // Block leaving town without a starter
        if (gm.getParty().length === 0) {
          this.scene.pause();
          this.scene.launch('DialogueScene', {
            dialogue: ['You should go see Prof. Oak first!'],
          });
          return;
        }
        this.doWarp(warp.targetMap, warp.targetSpawnId);
        return;
      }
    }

    // Only check battles if player has Pokémon
    if (gm.getParty().length === 0) return;

    // Trainer line-of-sight
    for (const trainer of this.trainers) {
      if (!trainer.defeated && trainer.isInLineOfSight(tx, ty)) {
        this.triggerTrainerBattle(trainer);
        return;
      }
    }

    // Wild encounters in tall grass
    if (
      this.mapDef.encounterTableKey &&
      this.mapDef.ground[ty]?.[tx] === Tile.TALL_GRASS
    ) {
      const wild = this.encounterSystem.checkEncounter(this.mapDef.encounterTableKey);
      if (wild) {
        this.triggerWildEncounter(wild);
      }
    }
  }

  // ── Warp transition ───────────────────────────────────────
  private doWarp(targetMap: string, targetSpawnId: string): void {
    this.transitioning = true;

    // Check if entering/exiting a building (door tile or interior exit)
    const { x: tx, y: ty } = this.player.getTilePosition();
    const currentTile = this.mapDef.ground[ty]?.[tx];
    const isDoorEntry = currentTile === Tile.HOUSE_DOOR || currentTile === Tile.LAB_DOOR
      || currentTile === Tile.CENTER_DOOR || currentTile === Tile.MART_DOOR
      || currentTile === Tile.GYM_DOOR || currentTile === Tile.MAT;

    if (isDoorEntry) {
      AudioManager.getInstance().playSFX(SFX.DOOR_OPEN);
    }

    TransitionManager.getInstance().fadeTransition(this, () => {
      this.scene.restart({ mapKey: targetMap, spawnId: targetSpawnId });
    });
  }

  // ── Wild encounter ────────────────────────────────────────
  private triggerWildEncounter(pokemon: PokemonInstance): void {
    this.transitioning = true;
    AudioManager.getInstance().playSFX(SFX.ENCOUNTER);
    this.cameras.main.flash(500, 255, 255, 255);
    this.time.delayedCall(500, () => {
      this.scene.start('TransitionScene', {
        targetScene: 'BattleScene',
        returnScene: 'OverworldScene',
        targetData: { enemyPokemon: pokemon },
        returnData: { mapKey: this.mapKey, spawnId: '__resume' },
        style: 'stripes',
      });
    });
  }

  // ── Trainer battle ────────────────────────────────────────
  private triggerTrainerBattle(trainer: Trainer): void {
    this.transitioning = true;

    // Trainer faces the player
    const { x: px, y: py } = this.player.getTilePosition();
    const trainerTX = Math.floor(trainer.x / TILE_SIZE);
    const trainerTY = Math.floor(trainer.y / TILE_SIZE);

    let faceDir: Direction = 'down';
    if (px < trainerTX) faceDir = 'left';
    else if (px > trainerTX) faceDir = 'right';
    else if (py < trainerTY) faceDir = 'up';

    trainer.faceDirection(faceDir);

    // Exclamation mark
    const excl = this.add.text(trainer.x, trainer.y - 30, '!', {
      fontSize: '24px', color: '#ff0000', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);

    const tData = trainerData[trainer.trainerId];

    this.time.delayedCall(800, () => {
      excl.destroy();
      // Show pre-battle dialogue
      this.scene.pause();
      this.scene.launch('DialogueScene', {
        dialogue: tData?.dialogue?.before ?? ['...'],
      });

      this.scene.get('DialogueScene').events.once('shutdown', () => {
        this.scene.resume();
        const enemyParty = tData.party.map(p =>
          EncounterSystem.createWildPokemon(p.pokemonId, p.level),
        );
        this.scene.start('TransitionScene', {
          targetScene: 'BattleScene',
          returnScene: 'OverworldScene',
          targetData: {
            enemyPokemon: enemyParty[0],
            isTrainer: true,
            trainerId: trainer.trainerId,
          },
          returnData: { mapKey: this.mapKey, spawnId: '__resume' },
          style: 'stripes',
        });
      });
    });
  }

  // ── NPC interaction ───────────────────────────────────────
  private tryInteract(): void {
    const { x: px, y: py } = this.player.getTilePosition();
    const facing = this.player.getFacing();

    let targetX = px;
    let targetY = py;
    switch (facing) {
      case 'up':    targetY--; break;
      case 'down':  targetY++; break;
      case 'left':  targetX--; break;
      case 'right': targetX++; break;
    }

    for (const npc of this.npcs) {
      const npcTX = Math.floor(npc.x / TILE_SIZE);
      const npcTY = Math.floor(npc.y / TILE_SIZE);
      if (npcTX === targetX && npcTY === targetY) {
        // NPC turns to face the player
        npc.faceDirection(NPC.getOpposite(facing));

        // Undefeated trainer → trigger battle
        if (npc instanceof Trainer && !npc.defeated) {
          this.triggerTrainerBattle(npc);
          return;
        }

        // Get spawn def for special interactions
        const spawnDef = (npc as NPC & { spawnDef?: NpcSpawn }).spawnDef;
        const gm = GameManager.getInstance();

        // Determine the right dialogue (flag-gated overrides)
        let dialogue = npc.dialogue;
        if (spawnDef?.flagDialogue) {
          for (const fd of spawnDef.flagDialogue) {
            if (gm.getFlag(fd.flag)) {
              dialogue = fd.dialogue;
              break;
            }
          }
        }

        // Set flag on interaction if configured
        if (spawnDef?.setsFlag && !gm.getFlag(spawnDef.setsFlag)) {
          gm.setFlag(spawnDef.setsFlag);
        }

        // Special: Oak parcel delivery triggers multiple flags
        if (spawnDef?.id === 'lab-oak-after' && gm.getFlag('hasParcel') && !gm.getFlag('receivedPokedex')) {
          gm.setFlag('deliveredParcel');
          gm.setFlag('receivedPokedex');
        }

        // Handle special interaction types
        if (spawnDef?.interactionType === 'heal') {
          this.scene.pause();
          this.scene.launch('DialogueScene', { dialogue });
          this.scene.get('DialogueScene').events.once('shutdown', () => {
            this.healParty();
            this.scene.resume();
          });
          return;
        }

        if (spawnDef?.interactionType === 'shop') {
          this.scene.pause();
          this.scene.launch('DialogueScene', { dialogue });
          this.scene.get('DialogueScene').events.once('shutdown', () => {
            this.scene.launch('ShopScene', { shopId: gm.getCurrentMap() });
            this.scene.get('ShopScene').events.once('shutdown', () => {
              this.scene.resume();
            });
          });
          return;
        }

        if (spawnDef?.interactionType === 'pc') {
          this.scene.pause();
          this.scene.launch('DialogueScene', { dialogue });
          this.scene.get('DialogueScene').events.once('shutdown', () => {
            this.scene.launch('PCScene');
            this.scene.get('PCScene').events.once('shutdown', () => {
              this.scene.resume();
            });
          });
          return;
        }

        if (spawnDef?.interactionType === 'starter-select' && !gm.getFlag('receivedStarter')) {
          this.scene.pause();
          this.scene.launch('DialogueScene', { dialogue });
          this.scene.get('DialogueScene').events.once('shutdown', () => {
            this.scene.resume();
            this.launchStarterSelection();
          });
          return;
        }

        // Regular dialogue
        this.scene.pause();
        this.scene.launch('DialogueScene', { dialogue });
        this.scene.get('DialogueScene').events.once('shutdown', () => {
          this.scene.resume();
        });
        return;
      }
    }
  }

  /** Heal all Pokémon in the party to full HP and PP. */
  private healParty(): void {
    const gm = GameManager.getInstance();
    for (const pokemon of gm.getParty()) {
      pokemon.currentHp = pokemon.stats.hp;
      pokemon.status = null;
      pokemon.statusTurns = undefined;
      for (const move of pokemon.moves) {
        const md = moveData[move.moveId];
        move.currentPp = md?.pp ?? move.currentPp;
      }
    }
    // Show healing flash
    this.cameras.main.flash(300, 255, 255, 255);
  }

  /** Launch the starter Pokémon selection UI. */
  private launchStarterSelection(): void {
    this.scene.pause();
    this.scene.launch('StarterSelectScene');
    // After starter selection completes, re-spawn NPCs so flag-gated ones update
    this.scene.get('StarterSelectScene').events.once('shutdown', () => {
      this.respawnNPCs();
    });
  }

  // ── Animation helper ──────────────────────────────────────
  private playAnim(key: string, flipX: boolean): void {
    if (this.lastAnimKey !== key) {
      this.player.play(key);
      this.lastAnimKey = key;
    }
    if (this.lastFlipX !== flipX) {
      this.player.setFlipX(flipX);
      this.lastFlipX = flipX;
    }
  }

  // ── Main loop ─────────────────────────────────────────────
  update(): void {
    if (this.transitioning) return;
    if (this.player.isMoving()) return;

    const input = this.inputManager.getState();

    // Menu
    if (input.menu) {
      this.scene.pause();
      this.scene.launch('MenuScene');
      return;
    }

    // Interact with NPC
    if (input.confirm) {
      this.tryInteract();
      return;
    }

    if (!input.direction) {
      const facing = this.player.getFacing();
      this.playAnim(`player-idle-${facing}`, false);
      return;
    }

    // Walk
    this.playAnim(`player-walk-${input.direction}`, false);
    this.player.move(input.direction);
  }
}
