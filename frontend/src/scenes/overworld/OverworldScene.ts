import Phaser from 'phaser';
import { TILE_SIZE } from '@utils/constants';
import { ui } from '@utils/ui-layout';
import { layoutOn } from '@utils/layout-on';
import { startFpsMonitor } from '@utils/perf-profile';
import { Player } from '@entities/Player';
import { NPC } from '@entities/NPC';
import { Trainer } from '@entities/Trainer';
import { AnimationHelper } from '@systems/rendering/AnimationHelper';
import { InputManager } from '@systems/engine/InputManager';
import { TouchControls } from '@ui/controls/TouchControls';
import { Direction } from '@utils/type-helpers';
import { GameManager } from '@managers/GameManager';
import { EncounterSystem } from '@systems/overworld/EncounterSystem';
import { encounterTables } from '@data/encounter-tables';
import { GameClock } from '@systems/engine/GameClock';
import { WeatherRenderer } from '@systems/rendering/WeatherRenderer';
import { TransitionManager } from '@managers/TransitionManager';
import { PokemonInstance, SaveData } from '@data/interfaces';
import { trainerData } from '@data/trainer-data';
import { pokemonData } from '@data/pokemon';
import { moveData } from '@data/moves';
import {
  mapRegistry,
  MapDefinition,
  NpcSpawn,
  Tile,
  SOLID_TILES,
  OVERLAY_BASE,
  FOREGROUND_TILES,
  LEDGE_TILES,
} from '@data/maps';
import { AudioManager } from '@managers/AudioManager';
import { BGM, SFX, MAP_BGM } from '@utils/audio-keys';
import { mobileFontSize } from '@ui/theme';
import { hintText } from '@utils/hint-text';
import { MapPreloader } from '@systems/engine/MapPreloader';
import { EventManager } from '@managers/EventManager';
import { QuestManager } from '@managers/QuestManager';
import { NPCBehaviorController } from '@systems/overworld/NPCBehavior';
import { OverworldAbilities } from '@systems/overworld/OverworldAbilities';
import { LightingSystem } from '@systems/rendering/LightingSystem';
import { AmbientSFX } from '@systems/audio/AmbientSFX';
import { CutsceneEngine } from '@systems/engine/CutsceneEngine';
import { cutsceneData } from '@data/cutscene-data';
import { AchievementManager } from '@managers/AchievementManager';
import { AchievementToast } from '@ui/widgets/AchievementToast';
import {
  spawnNPCs as spawnNPCsHelper,
  spawnTrainers as spawnTrainersHelper,
} from './OverworldNPCSpawner';
import {
  redrawTile as redrawTileHelper,
  showFieldAbilityPopup as showPopup,
  pushBoulder as pushBoulderHelper,
} from './OverworldFieldAbilities';
import { getBestRod, attemptFish } from './OverworldFishing';
import { healParty as healPartyHelper } from './OverworldHealing';
import { getFootstepSFX as getFootstepSFXHelper } from './OverworldFootsteps';
import { tryInteract as tryInteractHelper, InteractionContext } from './OverworldInteraction';

export class OverworldScene extends Phaser.Scene {
  private player!: Player;
  private inputManager!: InputManager;
  private encounterSystem!: EncounterSystem;
  private gameClock!: GameClock;
  private weatherRenderer!: WeatherRenderer;
  private npcs: NPC[] = [];
  private trainers: Trainer[] = [];
  private npcBehaviors: NPCBehaviorController[] = [];
  private mapDef!: MapDefinition;
  private mapKey = 'pallet-town';
  private spawnId = 'default';
  private lastAnimKey = '';
  private lastFlipX = false;
  private transitioning = false;
  private lightingSystem!: LightingSystem;
  private cutsceneEngine!: CutsceneEngine;
  /** Frames to skip confirm input after resuming (prevents re-trigger). */
  private resumeCooldown = 0;
  private isCycling = false;
  private surfing = false;
  private waterTileSprites: Phaser.GameObjects.Image[] = [];
  private tallGrassTileSprites: Phaser.GameObjects.Image[] = [];
  private lavaTileSprites: Phaser.GameObjects.Image[] = [];
  private tileAnimFrame = 0;
  private ambientSFX!: AmbientSFX;
  /** O(1) lookup set for NPC-occupied tile positions. */
  private npcOccupiedTiles = new Set<string>();
  private hudText?: Phaser.GameObjects.Text;
  private clockText?: Phaser.GameObjects.Text;
  private interactPrompt?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'OverworldScene' });
  }

  init(data?: { mapKey?: string; spawnId?: string; saveData?: SaveData; flyTo?: string }): void {
    // Restore from save data if provided
    if (data?.saveData) {
      const gm = GameManager.getInstance();
      gm.loadFromSave(data.saveData);
      this.mapKey = gm.getCurrentMap();
      this.spawnId = '__resume';
    } else if (data?.flyTo) {
      this.mapKey = data.flyTo;
      this.spawnId = data.spawnId ?? 'default';
    } else {
      this.mapKey = data?.mapKey ?? GameManager.getInstance().getCurrentMap();
      this.spawnId = data?.spawnId ?? 'default';
    }
    this.transitioning = false;
    this.surfing = false;
    this.isCycling = false;
    this.npcs = [];
    this.trainers = [];
    this.npcBehaviors = [];
    this.lastAnimKey = '';
    this.lastFlipX = false;
    this.interactPrompt?.destroy();
    this.interactPrompt = undefined;
    this.waterTileSprites = [];
    this.tallGrassTileSprites = [];
    this.lavaTileSprites = [];
    this.tileAnimFrame = 0;
  }

  create(): void {
    const gm = GameManager.getInstance();

    QuestManager.getInstance().initAutomation();

    // Launch quest tracker HUD overlay
    if (!this.scene.isActive('QuestTrackerScene') && !this.scene.isSleeping('QuestTrackerScene')) {
      this.scene.launch('QuestTrackerScene');
    }

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
    gm.markMapVisited(this.mapKey);
    EventManager.getInstance().emit('map-entered', this.mapKey);

    const mapW = this.mapDef.width;
    const mapH = this.mapDef.height;

    // Draw tile map
    this.drawMap(mapW, mapH);

    // Preload Pokémon sprites for this map + player party, then adjacent maps
    MapPreloader.ensureMapReady(this, this.mapKey).then(() => {
      MapPreloader.preloadAdjacentMaps(this, this.mapKey);
    });

    // Init encounter system
    this.encounterSystem = new EncounterSystem();
    this.gameClock = new GameClock(GameManager.getInstance().getGameClockMinutes());

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

    this.player = new Player(this, spawnX, spawnY, gm.getPlayerGender() === 'girl' ? 'player-walk-female' : 'player-walk');
    this.player.setScale(2);
    this.player.setDepth(1); // Between ground (0) and foreground overlays like tall grass (2)
    const animDir = spawnDir === 'right' ? 'left' : spawnDir;
    this.player.play(`${this.animPrefix()}idle-${animDir}`);
    if (spawnDir === 'right') this.player.setFlipX(true);

    gm.setPlayerPosition({ x: spawnX, y: spawnY, direction: spawnDir });

    // Spawn Trainers first so NPC behaviors can see trainer positions for collision
    this.spawnTrainers();
    this.spawnNPCs();

    // Build O(1) NPC position lookup
    this.rebuildNpcOccupiedTiles();

    // Set up collision: solid tiles + NPC positions
    this.player.gridMovement.setMapBounds(mapW, mapH);
    this.player.gridMovement.setCollisionCheck((tx, ty) => {
      if (tx < 0 || ty < 0 || ty >= mapH || tx >= mapW) return true;
      const groundTile = this.mapDef.ground[ty][tx];
      // One-way ledge: only passable when moving in the matching direction
      const ledgeDir = LEDGE_TILES[groundTile];
      if (ledgeDir) {
        return this.player.gridMovement.getFacing() !== ledgeDir;
      }
      // Allow water tiles when surfing
      if (groundTile === Tile.WATER && this.surfing) {
        // water is passable while surfing — skip solid check
      } else if (SOLID_TILES.has(groundTile)) {
        return true;
      }
      // Block NPC/Trainer tiles (O(1) lookup)
      if (this.npcOccupiedTiles.has(`${tx},${ty}`)) return true;
      return false;
    });

    // Ledge check for hop animation
    this.player.gridMovement.setLedgeCheck((tx, ty) => {
      if (tx < 0 || ty < 0 || ty >= mapH || tx >= mapW) return false;
      return LEDGE_TILES[this.mapDef.ground[ty][tx]] !== undefined;
    });

    // On each step complete: check warps, encounters, trainer LoS
    this.player.gridMovement.setMoveCompleteCallback(() => this.onPlayerStep());

    // Camera
    const mapPixelW = mapW * TILE_SIZE;
    const mapPixelH = mapH * TILE_SIZE;
    const layout = ui(this);

    // Black background for any void area outside the map bounds
    this.cameras.main.setBackgroundColor(0x000000);

    if (this.mapDef.isInterior && mapPixelW <= layout.w && mapPixelH <= layout.h) {
      // Small interior — center the map in the viewport, don't follow player
      this.cameras.main.stopFollow();
      this.cameras.main.scrollX = (mapPixelW - layout.w) / 2;
      this.cameras.main.scrollY = (mapPixelH - layout.h) / 2;
    } else {
      // Center the map when it's smaller than the viewport on either axis.
      // Expand bounds with padding so Phaser's built-in centering kicks in.
      const boundsW = Math.max(mapPixelW, layout.w);
      const boundsH = Math.max(mapPixelH, layout.h);
      const boundsX = (mapPixelW - boundsW) / 2;
      const boundsY = (mapPixelH - boundsH) / 2;
      this.cameras.main.setBounds(boundsX, boundsY, boundsW, boundsH);
      this.cameras.main.startFollow(this.player, true);
      // Dead zone keeps the player centered but allows margin for HUD
      this.cameras.main.setFollowOffset(0, 0);
      this.cameras.main.setDeadzone(layout.w * 0.2, layout.h * 0.2);
    }

    // Weather
    this.weatherRenderer = new WeatherRenderer(this);
    this.weatherRenderer.setWeather(this.mapDef.weather ?? 'none');

    // Input
    this.inputManager = new InputManager(this);

    // Drain pending touch input when resuming to prevent re-triggering interactions
    this.events.on('resume', () => {
      this.inputManager.getTouchControls()?.drain();
      this.resumeCooldown = 2;
    });

    // ── Audio: play map BGM ──
    const audio = AudioManager.getInstance();
    audio.setScene(this);
    const bgmKey = MAP_BGM[this.mapKey] ?? BGM.PALLET_TOWN;
    audio.playBGM(bgmKey);

    // Lighting system (cave darkness)
    this.lightingSystem = new LightingSystem(this);

    // Cutscene engine
    this.cutsceneEngine = new CutsceneEngine(this);
    this.cutsceneEngine.setSceneAccess({ npcs: this.npcs, player: this.player });

    if (this.mapDef.isDark) {
      this.lightingSystem.enableDarkness();
      if (this.mapDef.lightSources) {
        for (const ls of this.mapDef.lightSources) {
          this.lightingSystem.addLightSource({
            x: ls.tileX * TILE_SIZE + TILE_SIZE / 2,
            y: ls.tileY * TILE_SIZE + TILE_SIZE / 2,
            radius: ls.radius ?? 64,
            color: ls.color,
          });
        }
      }
      // Flash HM: expand visibility in dark caves
      if (OverworldAbilities.canUse('flash')) {
        this.lightingSystem.setPlayerLightRadius(192);
        this.showFieldAbilityPopup('Used FLASH!');
      }
    }

    // Ambient SFX
    this.ambientSFX = new AmbientSFX(this);
    this.ambientSFX.setAmbient(this.mapDef.ambientSfx ?? 'none');

    // HUD label
    const mapLabel = this.mapDef.displayName
      ?? this.mapKey.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const hudHint = TouchControls.isTouchDevice()
      ? `${mapLabel}  |  ${hintText('interact')}`
      : `${mapLabel}  |  ${hintText('interact')}  |  ESC = Menu`;
    this.hudText = this.add.text(this.cameras.main.width / 2, 20, hudHint, {
      fontSize: mobileFontSize(14),
      color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    // Clock widget (top-left)
    const periodEmoji: Record<string, string> = { morning: '🌅', day: '☀️', evening: '🌆', night: '🌙' };
    const period = this.gameClock.getTimePeriod();
    const clockStr = `${periodEmoji[period] ?? '☀️'} ${this.gameClock.getClockString()}`;
    this.clockText = this.add.text(8, 8, clockStr, {
      fontSize: mobileFontSize(11),
      color: '#ffcc00',
      fontFamily: 'monospace',
      backgroundColor: '#0f0f1abb',
      padding: { x: 6, y: 3 },
    }).setScrollFactor(0).setDepth(100);

    // Re-layout HUD elements on resize / orientation change
    layoutOn(this, () => {
      const w = this.cameras.main.width;
      this.hudText?.setX(w / 2);
      this.clockText?.setPosition(8, 8);
    });

    // Slide-in area name banner
    if (this.mapDef.displayName) {
      const bannerW = 200;
      const bannerH = 28;
      const bannerX = this.cameras.main.width / 2;
      const bannerY = -bannerH;

      const bannerBg = this.add.graphics().setScrollFactor(0).setDepth(100);
      bannerBg.fillStyle(0x0f0f1a, 0.88);
      bannerBg.fillRoundedRect(bannerX - bannerW / 2, 0, bannerW, bannerH, 4);
      bannerBg.lineStyle(1, 0xffcc00, 0.6);
      bannerBg.strokeRoundedRect(bannerX - bannerW / 2, 0, bannerW, bannerH, 4);
      bannerBg.setY(bannerY);

      const bannerText = this.add.text(bannerX, bannerY + bannerH / 2, this.mapDef.displayName, {
        fontSize: mobileFontSize(13),
        color: '#ffcc00',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

      // Slide in from top
      this.tweens.add({
        targets: [bannerBg, bannerText],
        y: '+=38',
        duration: 350,
        ease: 'Back.easeOut',
        onComplete: () => {
          // Hold, then slide out
          this.time.delayedCall(1800, () => {
            this.tweens.add({
              targets: [bannerBg, bannerText],
              y: '-=38',
              alpha: 0,
              duration: 250,
              ease: 'Cubic.easeIn',
              onComplete: () => { bannerBg.destroy(); bannerText.destroy(); },
            });
          });
        },
      });
    }

    // ── Map-entry cutscene ──
    if (this.mapDef.onEnterCutscene && cutsceneData[this.mapDef.onEnterCutscene]) {
      const gm = GameManager.getInstance();
      let flagOk = true;
      if (this.mapDef.onEnterCutsceneRequireFlag) {
        const negate = this.mapDef.onEnterCutsceneRequireFlag.startsWith('!');
        const flagName = negate ? this.mapDef.onEnterCutsceneRequireFlag.slice(1) : this.mapDef.onEnterCutsceneRequireFlag;
        const flagVal = gm.getFlag(flagName);
        flagOk = negate ? !flagVal : !!flagVal;
      }
      if (flagOk) {
        const cutscene = cutsceneData[this.mapDef.onEnterCutscene];
        const setFlagActions = cutscene.actions.filter(
          (a): a is Extract<typeof a, { type: 'setFlag' }> => a.type === 'setFlag'
        );
        const alreadyPlayed = setFlagActions.length > 0 &&
          setFlagActions.every(a => gm.getFlag(a.flag));
        if (!alreadyPlayed) {
          this.cutsceneEngine.play(cutscene);
        }
      }
    }

    // Start FPS monitoring for auto-quality downgrade on low-end devices
    startFpsMonitor();
  }

  // ── Map rendering (tileset-based) ──────────────────────────
  private drawMap(mapW: number, mapH: number): void {
    // Scale factor: tileset is 16px, game tiles are TILE_SIZE (32px)
    const scale = TILE_SIZE / 16;

    // Set of tile IDs that need individual sprites (animated or overlays)
    const animatedTiles = new Set([
      Tile.WATER, Tile.TIDE_POOL, Tile.TALL_GRASS,
      Tile.MAGMA_CRACK, Tile.EMBER_VENT, Tile.LAVA_ROCK,
    ]);

    // Build a Phaser Tilemap for the static ground layer (batch rendering)
    const tileData: number[][] = [];
    for (let y = 0; y < mapH; y++) {
      const row: number[] = [];
      for (let x = 0; x < mapW; x++) {
        const tile = this.mapDef.ground[y][x];
        const isOverlay = OVERLAY_BASE[tile] !== undefined;
        const isAnimated = animatedTiles.has(tile);
        // Static ground tiles go into the tilemap; overlays and animated tiles use sprites
        row.push((!isOverlay && !isAnimated) ? tile : -1);
      }
      tileData.push(row);
    }

    const tilemapData = new Phaser.Tilemaps.MapData({
      width: mapW,
      height: mapH,
      tileWidth: 16,
      tileHeight: 16,
    });
    const tilemap = new Phaser.Tilemaps.Tilemap(this, tilemapData);
    const tileset = tilemap.addTilesetImage('tileset', 'tileset', 16, 16) as Phaser.Tilemaps.Tileset;

    // Create a layer from the static tile data
    const staticLayer = tilemap.createBlankLayer('ground', tileset, 0, 0, mapW, mapH, 16, 16);
    if (staticLayer) {
      for (let y = 0; y < mapH; y++) {
        for (let x = 0; x < mapW; x++) {
          const id = tileData[y][x];
          if (id >= 0) {
            staticLayer.putTileAt(id, x, y);
          }
        }
      }
      staticLayer.setScale(scale);
      staticLayer.setDepth(0);
    }

    // Now handle overlay tiles and animated tiles as individual sprites
    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        const tile = this.mapDef.ground[y][x];
        const px = x * TILE_SIZE + TILE_SIZE / 2;
        const py = y * TILE_SIZE + TILE_SIZE / 2;
        const isOverlay = OVERLAY_BASE[tile] !== undefined;
        const isAnimated = animatedTiles.has(tile);

        if (!isOverlay && !isAnimated) continue; // Handled by tilemap layer

        // If this tile is an overlay object, draw the base ground tile first
        const baseTile = OVERLAY_BASE[tile];
        if (baseTile !== undefined) {
          const base = this.add.image(px, py, 'tileset', baseTile);
          base.setScale(scale);
          base.setDepth(0);
        }

        // Draw the tile (or overlay) itself
        const sprite = this.add.image(px, py, 'tileset', tile);
        sprite.setScale(scale);
        if (baseTile !== undefined) {
          sprite.setDepth(FOREGROUND_TILES.has(tile) ? 2 : 0.5);
          if (tile === Tile.TALL_GRASS) {
            sprite.setAlpha(0.7);
          }
        }

        // Collect references for animated tile effects
        if (tile === Tile.WATER || tile === Tile.TIDE_POOL) {
          this.waterTileSprites.push(sprite);
        } else if (tile === Tile.TALL_GRASS) {
          this.tallGrassTileSprites.push(sprite);
        } else if (tile === Tile.MAGMA_CRACK || tile === Tile.EMBER_VENT || tile === Tile.LAVA_ROCK) {
          (sprite as Phaser.GameObjects.Image & { _baseTile?: number })._baseTile = tile;
          this.lavaTileSprites.push(sprite);
        }
      }
    }
  }

  // ── NPC / Trainer spawning ────────────────────────────────
  private spawnNPCs(): void {
    const result = spawnNPCsHelper(this, this.mapDef, this.player, this.npcs);
    this.npcs.push(...result.npcs);
    this.npcBehaviors.push(...result.behaviors);
  }

  /** Destroy and re-create NPCs so flag-gated spawns update. */
  private respawnNPCs(): void {
    for (const b of this.npcBehaviors) b.destroy();
    this.npcBehaviors = [];
    for (const npc of this.npcs) npc.destroy();
    this.npcs = [];
    this.trainers = [];
    this.spawnTrainers();
    this.spawnNPCs();
  }

  private spawnTrainers(): void {
    const newTrainers = spawnTrainersHelper(this, this.mapDef);
    this.trainers.push(...newTrainers);
    this.npcs.push(...newTrainers);
  }

  // ── Per-step hooks ────────────────────────────────────────
  private onPlayerStep(): void {
    if (this.transitioning) return;

    const { x: tx, y: ty } = this.player.getTilePosition();
    const gm = GameManager.getInstance();

    // Proximity-based preloading for nearby warp targets
    MapPreloader.checkProximity(this, this.mapDef, tx, ty);

    // Persist position
    gm.setPlayerPosition({
      x: tx, y: ty, direction: this.player.getFacing(),
    });

    // Walking friendship: every 128 steps, +1 friendship to lead Pokémon
    const steps = gm.incrementStepCount();
    if (steps % 128 === 0 && gm.getParty().length > 0) {
      gm.adjustFriendship(0, 1);
    }

    // Terrain-based footstep SFX
    const currentTile = this.mapDef.ground[ty]?.[tx];
    if (currentTile !== undefined) {
      const footstepKey = this.getFootstepSFX(currentTile);
      if (footstepKey) {
        AudioManager.getInstance().playSFX(footstepKey);
      }
    }

    // Disembark surf when stepping onto a non-water tile
    if (this.surfing && this.mapDef.ground[ty]?.[tx] !== Tile.WATER) {
      this.surfing = false;
    }

    // Warps
    for (const warp of this.mapDef.warps) {
      if (warp.tileX === tx && warp.tileY === ty) {
        // Check flag gate
        if (warp.requireFlag) {
          const negated = warp.requireFlag.startsWith('!');
          const flagName = negated ? warp.requireFlag.slice(1) : warp.requireFlag;
          const flagValue = gm.getFlag(flagName);
          if (negated ? flagValue : !flagValue) {
            this.scene.pause();
            this.scene.launch('DialogueScene', {
              dialogue: ['The way ahead is blocked...'],
            });
            // AUDIT-014: Resume when dialogue ends to prevent softlock
            this.scene.get('DialogueScene').events.once('shutdown', () => {
              this.scene.resume();
            });
            return;
          }
        }
        // Block leaving town without a starter — but always allow building entry
        const targetDef = mapRegistry[warp.targetMap];
        if (gm.getParty().length === 0 && !targetDef?.isInterior) {
          this.scene.pause();
          this.scene.launch('DialogueScene', {
            dialogue: ['You should go see Prof. Willow first!'],
          });
          // AUDIT-015: Resume when dialogue ends to prevent softlock
          this.scene.get('DialogueScene').events.once('shutdown', () => {
            this.scene.resume();
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

    // Wild encounters in tall grass or dark grass
    if (
      this.mapDef.encounterTableKey &&
      (this.mapDef.ground[ty]?.[tx] === Tile.TALL_GRASS ||
       this.mapDef.ground[ty]?.[tx] === Tile.DARK_GRASS)
    ) {
      // Running increases encounter rate; cycling is normal
      const encounterMultiplier = this.player.gridMovement.isRunning() ? 1.5 : 1;
      const wild = this.encounterSystem.checkEncounter(this.mapDef.encounterTableKey, encounterMultiplier);
      if (wild) {
        this.triggerWildEncounter(wild);
      }
    }

    // Water encounters while surfing
    if (
      this.surfing &&
      this.mapDef.encounterTableKey &&
      this.mapDef.ground[ty]?.[tx] === Tile.WATER
    ) {
      const surfKey = `${this.mapDef.encounterTableKey}-surf`;
      const wild = this.encounterSystem.checkEncounter(
        surfKey in (encounterTables ?? {}) ? surfKey : this.mapDef.encounterTableKey,
        0.8,
      );
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
    } else if (this.mapDef.isInterior) {
      AudioManager.getInstance().playSFX(SFX.DOOR_CLOSE);
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
        targetData: { enemyPokemon: pokemon, battleBg: this.mapDef.battleBg },
        returnData: { mapKey: this.mapKey, spawnId: '__resume' },
        style: 'stripes',
      });
    });
  }

  // ── Trainer battle ────────────────────────────────────────
  private triggerTrainerBattle(trainer: Trainer): void {
    this.transitioning = true;

    const { x: px, y: py } = this.player.getTilePosition();

    // Exclamation mark above trainer
    const excl = this.add.text(trainer.x, trainer.y - 30, '!', {
      fontSize: mobileFontSize(24), color: '#ff0000', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);

    // After a brief pause, trainer walks toward the player
    this.time.delayedCall(600, () => {
      // NEW-012: Guard against scene/sprite destruction during delay
      if (!this.scene.isActive() || !trainer.active) {
        excl.destroy();
        return;
      }
      excl.destroy();

      // Trainer walks toward the player (stops 1 tile away)
      trainer.walkToward(px, py).then(() => {
        // Trainer faces the player after walking
        const trainerTX = Math.floor(trainer.x / TILE_SIZE);
        const trainerTY = Math.floor(trainer.y / TILE_SIZE);
        let faceDir: Direction = 'down';
        if (px < trainerTX) faceDir = 'left';
        else if (px > trainerTX) faceDir = 'right';
        else if (py < trainerTY) faceDir = 'up';
        trainer.faceDirection(faceDir);

        const tData = trainerData[trainer.trainerId];

        // Show pre-battle dialogue
        this.scene.pause();
        this.scene.launch('DialogueScene', {
          dialogue: tData?.dialogue?.before ?? ['...'],
          portraitKey: tData?.spriteKey,
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
              trainerSpriteKey: tData.spriteKey,
              trainerName: tData.name,
              battleBg: this.mapDef.battleBg,
              isDouble: tData.isDouble ?? false,
              enemyParty,
            },
            returnData: { mapKey: this.mapKey, spawnId: '__resume' },
            style: 'stripes',
          });
        });
      });
    });
  }

  // ── NPC interaction ───────────────────────────────────────
  private tryInteract(): void {
    const ctx: InteractionContext = {
      scene: this,
      mapDef: this.mapDef,
      player: this.player,
      npcs: this.npcs,
      surfing: this.surfing,
      cutsceneEngine: this.cutsceneEngine,
      triggerTrainerBattle: (t) => this.triggerTrainerBattle(t),
      triggerWildEncounter: (p) => this.triggerWildEncounter(p),
      healParty: () => this.healParty(),
      launchStarterSelection: () => this.launchStarterSelection(),
      launchNicknameInput: (p, n, cb) => this.launchNicknameInput(p, n, cb),
      redrawTile: (tx, ty) => this.redrawTile(tx, ty),
      showFieldAbilityPopup: (t) => this.showFieldAbilityPopup(t),
      pushBoulder: (bx, by, d) => this.pushBoulder(bx, by, d),
      tryFishing: () => this.tryFishing(),
    };
    tryInteractHelper(ctx);
  }

  /** Redraw a single tile after a field ability changes it. */
  private redrawTile(tx: number, ty: number): void {
    redrawTileHelper(this, this.mapDef, tx, ty);
  }

  /** Show a brief text popup for a field ability use. */
  private showFieldAbilityPopup(text: string): void {
    showPopup(this, text);
  }

  /** Push a Strength boulder one tile in the player's facing direction. */
  private pushBoulder(bx: number, by: number, dir: Direction): void {
    pushBoulderHelper(this, this.mapDef, bx, by, dir);
    this.showFieldAbilityPopup('Used STRENGTH!');
  }

  /** Get the appropriate footstep SFX key for a given tile type. */
  private getFootstepSFX(tile: number): string | null {
    return getFootstepSFXHelper(tile);
  }

  /** Attempt to fish at the water tile the player is facing. */
  private tryFishing(): void {
    const rod = getBestRod();
    if (!rod) {
      this.scene.pause();
      this.scene.launch('DialogueScene', { dialogue: ['The water is calm...'] });
      this.scene.get('DialogueScene').events.once('shutdown', () => this.scene.resume());
      return;
    }

    this.scene.pause();
    this.scene.launch('DialogueScene', { dialogue: ['...', '...!'], callingScene: 'OverworldScene' });
    this.scene.get('DialogueScene').events.once('shutdown', () => {
      const pokemon = attemptFish(this.mapKey, rod);
      if (pokemon) {
        this.scene.resume();
        this.triggerWildEncounter(pokemon);
      } else {
        this.scene.launch('DialogueScene', { dialogue: ['Not even a nibble...'], callingScene: 'OverworldScene' });
        // NEW-008: Don't add extra resume — DialogueScene handles it via callingScene
      }
    });
  }

  /** Heal all Pokémon in the party to full HP and PP. */
  private healParty(): void {
    healPartyHelper();
    this.cameras.main.flash(300, 255, 255, 255);
    AudioManager.getInstance().playJingle(SFX.HEAL_JINGLE, true);
  }

  /** Launch the starter Pokémon selection UI. */
  private launchStarterSelection(): void {
    this.scene.pause();
    this.scene.launch('StarterSelectScene');
    // After starter selection completes, re-spawn NPCs so flag-gated ones update
    this.scene.get('StarterSelectScene').events.once('shutdown', () => {
      this.respawnNPCs();
      this.scene.resume();
    });
  }

  /** Launch a nickname input overlay for a Pokémon. Calls callback when done. */
  private launchNicknameInput(pokemon: PokemonInstance, speciesName: string, callback: () => void): void {
    this.scene.launch('NicknameScene', { pokemon, speciesName });
    this.scene.get('NicknameScene').events.once('shutdown', () => {
      callback();
    });
  }

  // ── Animation helper ──────────────────────────────────────
  /** Get animation key prefix based on player gender ('player-' or 'player-girl-'). */
  private animPrefix(): string {
    return GameManager.getInstance().getPlayerGender() === 'girl' ? 'player-girl-' : 'player-';
  }

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
    if (this.cutsceneEngine.isRunning()) return;

    // Update NPC idle behaviors every frame (even while player moves)
    const delta = this.game.loop.delta;
    for (const controller of this.npcBehaviors) {
      controller.update(delta);
    }

    // Refresh NPC occupied tile positions after behavior updates
    this.rebuildNpcOccupiedTiles();

    // Update clock display
    if (this.clockText) {
      const periodEmoji: Record<string, string> = { morning: '🌅', day: '☀️', evening: '🌆', night: '🌙' };
      const period = this.gameClock.getTimePeriod();
      this.clockText.setText(`${periodEmoji[period] ?? '☀️'} ${this.gameClock.getClockString()}`);
      GameManager.getInstance().setGameClockMinutes(this.gameClock.getTotalElapsed());
    }

    // Animated tile effects (throttled: water/lava every 30 frames, grass every 60)
    this.tileAnimFrame++;
    if (this.tileAnimFrame % 30 === 0) {
      const waterTints = [0x3090e0, 0x40a0f0, 0x2080d0];
      const lavaTints = [0xe06020, 0xf07030, 0xd05010];
      const idx = Math.floor(this.tileAnimFrame / 30) % 3;
      const waterFrames = [Tile.WATER, Tile.WATER_FRAME_1, Tile.WATER_FRAME_2];
      const lavaFrames = [Tile.LAVA_ROCK, Tile.LAVA_FRAME_1, Tile.LAVA_FRAME_2];
      for (const s of this.waterTileSprites) {
        s.setTint(waterTints[idx]);
        s.setFrame(waterFrames[idx]);
      }
      const emberFrames = [Tile.EMBER_VENT, Tile.EMBER_FRAME_1, Tile.EMBER_FRAME_2];
      for (const s of this.lavaTileSprites) {
        const baseTile = (s as Phaser.GameObjects.Image & { _baseTile?: number })._baseTile;
        if (baseTile === Tile.EMBER_VENT) {
          s.setTint(lavaTints[idx]);
          s.setFrame(emberFrames[idx]);
        } else {
          s.setTint(lavaTints[idx]);
          s.setFrame(lavaFrames[idx]);
        }
      }
    }
    if (this.tileAnimFrame % 60 === 0) {
      for (const s of this.tallGrassTileSprites) {
        s.setAlpha(0.85 + Math.random() * 0.15);
      }
    }

    // Update ambient SFX
    if (this.ambientSFX) this.ambientSFX.update();

    if (this.player.isMoving()) {
      if (this.interactPrompt) this.interactPrompt.setVisible(false);
      return;
    }

    // Update interaction prompt while standing
    this.updateInteractPrompt();

    // Update lighting overlay
    this.lightingSystem.update(this.player.x, this.player.y);

    // Update day/night tint
    const tint = this.gameClock.getCurrentTint();
    this.cameras.main.setBackgroundColor(tint);

    // Update weather effects
    this.weatherRenderer.update();

    const input = this.inputManager.getState();

    // Cooldown after scene resume to prevent re-triggering interactions
    if (this.resumeCooldown > 0) {
      this.resumeCooldown--;
      return;
    }

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
      this.playAnim(`${this.animPrefix()}idle-${facing}`, false);
      this.player.gridMovement.setRunning(false);
      this.player.gridMovement.setCycling(false);
      return;
    }

    // Bicycle toggle: B key toggles cycling on/off (requires bicycle item, not indoors)
    const hasBicycle = GameManager.getInstance().getItemCount('bicycle') > 0;
    if (input.bicycle && hasBicycle) {
      this.isCycling = !this.isCycling;
    }
    // Auto-dismount indoors
    if (this.isCycling && this.mapDef.isInterior) {
      this.isCycling = false;
    }

    // Running shoes: hold SHIFT, B button, or double-tap joystick to run
    const shiftDown = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT, false, false).isDown;
    const hasRunningShoes = GameManager.getInstance().getFlag('runningShoes');
    const touchRun = TouchControls.getInstance()?.isRunToggled() ?? false;
    // Cycling takes priority over running; they are mutually exclusive
    const shouldRun = !this.isCycling && hasRunningShoes && (shiftDown || touchRun);
    this.player.gridMovement.setRunning(shouldRun);
    this.player.gridMovement.setCycling(this.isCycling);

    // Walk / Run
    this.playAnim(`${this.animPrefix()}walk-${input.direction}`, false);
    this.player.move(input.direction);
  }

  private updateInteractPrompt(): void {
    const facing = this.player.getFacing();
    const px = this.player.gridMovement.getTileX();
    const py = this.player.gridMovement.getTileY();
    const dx = facing === 'left' ? -1 : facing === 'right' ? 1 : 0;
    const dy = facing === 'up' ? -1 : facing === 'down' ? 1 : 0;
    const targetX = px + dx;
    const targetY = py + dy;

    let showPrompt = false;
    let promptWorldX = 0;
    let promptWorldY = 0;

    for (const npc of this.npcs) {
      const ntx = Math.floor(npc.x / TILE_SIZE);
      const nty = Math.floor(npc.y / TILE_SIZE);
      if (ntx === targetX && nty === targetY) {
        showPrompt = true;
        promptWorldX = ntx * TILE_SIZE + TILE_SIZE / 2;
        promptWorldY = nty * TILE_SIZE - 8;
        break;
      }
    }
    if (!showPrompt) {
      for (const trainer of this.trainers) {
        const ttx = Math.floor(trainer.x / TILE_SIZE);
        const tty = Math.floor(trainer.y / TILE_SIZE);
        if (ttx === targetX && tty === targetY) {
          showPrompt = true;
          promptWorldX = ttx * TILE_SIZE + TILE_SIZE / 2;
          promptWorldY = tty * TILE_SIZE - 8;
          break;
        }
      }
    }

    if (showPrompt && !this.player.isMoving()) {
      if (!this.interactPrompt) {
        const label = TouchControls.isTouchDevice() ? 'Tap' : 'Z';
        this.interactPrompt = this.add.text(0, 0, label, {
          fontSize: mobileFontSize(11),
          color: '#ffcc00',
          fontFamily: 'monospace',
          fontStyle: 'bold',
          backgroundColor: '#0f0f1a',
          padding: { x: 4, y: 2 },
        }).setOrigin(0.5, 1).setDepth(10);
      }
      this.interactPrompt.setPosition(promptWorldX, promptWorldY).setVisible(true);
    } else if (this.interactPrompt) {
      this.interactPrompt.setVisible(false);
    }
  }

  /** Rebuild the O(1) NPC occupied tile set from current NPC positions. */
  private rebuildNpcOccupiedTiles(): void {
    this.npcOccupiedTiles.clear();
    for (const npc of this.npcs) {
      const tx = Math.floor(npc.x / TILE_SIZE);
      const ty = Math.floor(npc.y / TILE_SIZE);
      this.npcOccupiedTiles.add(`${tx},${ty}`);
    }
  }

  shutdown(): void {
    this.input.keyboard?.removeAllListeners();
    this.lightingSystem?.destroy();
    this.ambientSFX?.destroy();
    this.weatherRenderer?.destroy();
    this.npcBehaviors = [];
    this.npcOccupiedTiles.clear();
    this.interactPrompt?.destroy();
    this.interactPrompt = undefined;
  }

}
