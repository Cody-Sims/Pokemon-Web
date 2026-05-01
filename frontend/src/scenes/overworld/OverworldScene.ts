import Phaser from 'phaser';
import { TILE_SIZE } from '@utils/constants';
import { ui } from '@utils/ui-layout';
import { layoutOn } from '@utils/layout-on';
import { startFpsMonitor } from '@utils/perf-profile';
import { Player } from '@entities/Player';
import { FollowerPokemon } from '@entities/FollowerPokemon';
import { NPC } from '@entities/NPC';
import { Trainer } from '@entities/Trainer';
import { InteractableObject } from '@entities/InteractableObject';
import { AnimationHelper } from '@systems/rendering/AnimationHelper';
import { InputManager } from '@systems/engine/InputManager';
import { TouchControls } from '@ui/controls/TouchControls';
import { Direction } from '@utils/type-helpers';
import { GameManager } from '@managers/GameManager';
import { EncounterSystem } from '@systems/overworld/EncounterSystem';
import { encounterTables } from '@data/encounter-tables';
import { GameClock, TimePeriod } from '@systems/engine/GameClock';
import { WeatherRenderer } from '@systems/rendering/WeatherRenderer';
import { TransitionManager } from '@managers/TransitionManager';
import { PokemonInstance } from '@data/interfaces';
import { trainerData } from '@data/trainer-data';
import { pokemonData } from '@data/pokemon';
import { moveData } from '@data/moves';
import {
  mapRegistry,
  MapDefinition,
  NpcSpawn,
  Tile,
  SOLID_TILES,
  LEDGE_TILES,
} from '@data/maps';
import { AudioManager } from '@managers/AudioManager';
import { BGM, SFX, MAP_BGM } from '@utils/audio-keys';
import { mobileFontSize, mobileFontPx } from '@ui/theme';
import { EmoteBubble } from '@systems/rendering/EmoteBubble';
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
  spawnObjects as spawnObjectsHelper,
  applyNpcSchedules,
} from './OverworldNPCSpawner';
import {
  redrawTile as redrawTileHelper,
  showFieldAbilityPopup as showPopup,
  pushBoulder as pushBoulderHelper,
} from './OverworldFieldAbilities';
import { getBestRod, attemptFish } from './OverworldFishing';
import { healParty as healPartyHelper } from './OverworldHealing';
import { getFootstepSFX as getFootstepSFXHelper } from './OverworldFootsteps';
import { tryInteract as tryInteractHelper, InteractionContext, OverworldState } from './OverworldInteraction';
import { buildTilemap, redrawTilemapTile, TilemapResult } from '@systems/rendering/TilemapBuilder';
import { GlowEmitterSystem } from '@systems/rendering/GlowEmitterSystem';

export class OverworldScene extends Phaser.Scene {
  private player!: Player;
  private inputManager!: InputManager;
  private encounterSystem!: EncounterSystem;
  private gameClock!: GameClock;
  private weatherRenderer!: WeatherRenderer;
  private npcs: NPC[] = [];
  private trainers: Trainer[] = [];
  private mapObjects: InteractableObject[] = [];
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
  /** Shared mutable reference so interaction handlers can write through. */
  private readonly overworldState: OverworldState = { surfing: false, isCycling: false };

  private get isCycling(): boolean { return this.overworldState.isCycling; }
  private set isCycling(v: boolean) { this.overworldState.isCycling = v; }
  private get surfing(): boolean { return this.overworldState.surfing; }
  private set surfing(v: boolean) { this.overworldState.surfing = v; }
  /** Tilemap layers + animated sprite references created by TilemapBuilder. */
  private tilemapResult: TilemapResult | null = null;
  private tileAnimFrame = 0;
  /** Pulse-glow overlays for crystal/conduit/window tiles. */
  private glowEmitters?: GlowEmitterSystem;
  private mapPixelH = 0;
  private ambientSFX!: AmbientSFX;
  /** O(1) lookup set for NPC-occupied tile positions. */
  private npcOccupiedTiles = new Set<string>();
  /** BUG-046: Last known tile positions per NPC — used to skip the
   *  per-frame Set rebuild when nothing has moved. */
  private npcTileSnapshot: string[] = [];
  /** Tracks the last time period to detect transitions and update NPC schedules. */
  private lastTimePeriod: TimePeriod | null = null;
  private hudText?: Phaser.GameObjects.Text | Phaser.GameObjects.BitmapText;
  private clockText?: Phaser.GameObjects.Text;
  /** Optional speed-run timer overlay; only created when the setting is on. */
  private speedrunTimerText?: Phaser.GameObjects.Text;
  private interactPrompt?: Phaser.GameObjects.Text;
  private follower?: FollowerPokemon;
  private followerPrevPos = { x: 0, y: 0 };

  constructor() {
    super({ key: 'OverworldScene' });
  }

  init(data?: { mapKey?: string; spawnId?: string; flyTo?: string; resume?: boolean }): void {
    // NOTE: Continue from save is handled by SaveManager.loadAndApply()
    // before this scene starts (see TitleScene). The previous saveData
    // branch routed through GameManager.loadFromSave which expected a
    // legacy nested shape that has not been written since v1→v2 — it
    // crashed every Continue. Resume now reads the already-applied
    // current map from the GameManager singleton below.
    if (data?.resume) {
      this.mapKey = GameManager.getInstance().getCurrentMap();
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
    this.mapObjects = [];
    this.npcBehaviors = [];
    this.lastAnimKey = '';
    this.lastFlipX = false;
    this.lastTimePeriod = null;
    this.interactPrompt?.destroy();
    this.interactPrompt = undefined;
    this.tilemapResult = null;
    this.tileAnimFrame = 0;
  }

  create(): void {
    const gm = GameManager.getInstance();

    QuestManager.getInstance().initAutomation();

    // Launch quest tracker HUD overlay
    if (!this.scene.isActive('QuestTrackerScene') && !this.scene.isSleeping('QuestTrackerScene')) {
      this.scene.launch('QuestTrackerScene');
    }

    // Launch party quick-view HUD overlay
    if (!this.scene.isActive('PartyQuickViewScene') && !this.scene.isSleeping('PartyQuickViewScene')) {
      this.scene.launch('PartyQuickViewScene');
    }

    // Launch minimap HUD overlay
    if (!this.scene.isActive('MinimapScene') && !this.scene.isSleeping('MinimapScene')) {
      this.scene.launch('MinimapScene');
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

    // Wire AchievementToast to show on any achievement unlock
    AchievementManager.getInstance().setOnUnlock((ach) => {
      AchievementToast.show(this, ach);
    });

    // Exploration achievements: first-town / all-towns / first-cave
    const am = AchievementManager.getInstance();
    if (!this.mapDef?.isInterior) {
      am.unlock('first-town');
    }
    const TOWN_KEYS = [
      'pallet-town', 'viridian-city', 'pewter-city', 'coral-harbor',
      'ironvale-city', 'verdantia-village', 'voltara-city',
      'wraithmoor-town', 'scalecrest-citadel', 'cinderfall-town',
    ];
    if (TOWN_KEYS.every(k => gm.hasVisitedMap(k))) {
      am.unlock('all-towns');
    }
    if (this.mapKey.includes('cave') || this.mapKey.includes('cavern') || this.mapKey.includes('tunnel')) {
      am.unlock('first-cave');
    }

    const mapW = this.mapDef.width;
    const mapH = this.mapDef.height;
    this.mapPixelH = mapH * TILE_SIZE;

    // Draw tile map via TilemapBuilder (three tilemap layers + animated sprites)
    this.tilemapResult = buildTilemap(this, this.mapDef.ground, mapW, mapH);

    // Pulse glow overlays for aether crystals, voltara conduits, and window light shafts.
    this.glowEmitters = new GlowEmitterSystem(this);
    this.glowEmitters.scanMap(this.mapDef.ground, mapW, mapH);

    // Preload Pokémon sprites for this map + player party, then adjacent maps
    MapPreloader.ensureMapReady(this, this.mapKey).then(() => {
      MapPreloader.preloadAdjacentMaps(this, this.mapKey);
    });

    // Init encounter system — restore repel steps from persistent state
    this.encounterSystem = new EncounterSystem(GameManager.getInstance().getRepelSteps());
    this.gameClock = new GameClock(GameManager.getInstance().getGameClockMinutes());
    this.lastTimePeriod = this.gameClock.getTimePeriod();

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

    // Auto-enable surf if spawning on a water tile (fixes stuck-on-water after warp/battle)
    if (this.mapDef.ground[spawnY]?.[spawnX] === Tile.WATER) {
      this.surfing = true;
    }

    this.player = new Player(this, spawnX, spawnY, gm.getPlayerGender() === 'girl' ? 'player-walk-female' : 'player-walk');
    this.player.setScale(2);
    // Depth is set dynamically per-frame by y-based sorting in update()
    const animDir = spawnDir === 'right' ? 'left' : spawnDir;
    this.player.play(`${this.animPrefix()}${this.animAction('idle')}-${animDir}`);
    if (spawnDir === 'right') this.player.setFlipX(true);

    gm.setPlayerPosition({ x: spawnX, y: spawnY, direction: spawnDir });

    // Spawn Trainers first so NPC behaviors can see trainer positions for collision
    this.spawnTrainers();
    this.spawnNPCs();
    this.spawnMapObjects();

    // Build O(1) NPC position lookup
    this.rebuildNpcOccupiedTiles();

    // HIGH-19: If the player spawned on an NPC-occupied tile, nudge to nearest free tile
    const playerTileKey = `${this.player.gridMovement.getTileX()},${this.player.gridMovement.getTileY()}`;
    if (this.npcOccupiedTiles.has(playerTileKey)) {
      const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]] as const;
      for (const [dx, dy] of dirs) {
        const nx = this.player.gridMovement.getTileX() + dx;
        const ny = this.player.gridMovement.getTileY() + dy;
        if (!this.npcOccupiedTiles.has(`${nx},${ny}`)) {
          this.player.gridMovement.setTilePosition(nx, ny);
          break;
        }
      }
    }

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

    // Create Pokemon follower (lead party Pokemon trails 1 tile behind)
    this.createFollower(spawnX, spawnY);

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
      // Touch controls (A/B buttons + virtual joystick) overlay the bottom
      // edge of the canvas via fixed-position DOM nodes, so reserve a
      // bottom-pad in the camera bounds. This lets the camera scroll past
      // the map's southern edge so the player can stand on the actual
      // pier/edge tiles without being hidden behind the on-screen buttons.
      const isTouch = TouchControls.isTouchDevice();
      const isPortrait = layout.h > layout.w;
      // Mobile portrait reserves ~180px for stacked controls + bottom-pad
      // headroom; landscape reserves 0 because the controls sit on the
      // sides, not below.
      const touchPadBottom = isTouch && isPortrait ? 180 : 0;

      // Horizontal bounds: centered if the map is narrower than the
      // viewport, otherwise tight to the map.
      const boundsW = Math.max(mapPixelW, layout.w);
      const boundsX = mapPixelW < layout.w ? (mapPixelW - boundsW) / 2 : 0;

      // Vertical bounds: stretch DOWN by touchPadBottom (don't center the
      // pad symmetrically) so the camera can scroll past the map's
      // southern edge. The previous symmetric split sent half the pad
      // above the map (where it didn't help) and only half below.
      const boundsTop = mapPixelH < layout.h ? (mapPixelH - layout.h) / 2 : 0;
      const boundsBottom = Math.max(mapPixelH, layout.h) + touchPadBottom;
      const boundsH = boundsBottom - boundsTop;
      this.cameras.main.setBounds(boundsX, boundsTop, boundsW, boundsH);
      this.cameras.main.startFollow(this.player, true);
      // Push the camera down a bit so the player sits in the upper-middle
      // of the viewport in mobile portrait — leaves more room for the
      // pier/water tiles below the player to render above the touch UI.
      // Use roughly 25% of the viewport height so the bottom 60% of the
      // canvas remains for showing what's below the player.
      const followOffsetY = isTouch && isPortrait
        ? -Math.round(layout.h * 0.18)
        : 0;
      this.cameras.main.setFollowOffset(0, followOffsetY);
      // Use a very small deadzone (1 tile each axis) so the camera follows
      // the player aggressively. The previous 20%-of-viewport deadzone
      // (often 160-200px on mobile portrait) was larger than the available
      // scroll range on tall maps like Pallet Town, which made the camera
      // appear to "stop following" before the player reached the southern
      // edge — the pier was rendered behind the touch controls overlay.
      this.cameras.main.setDeadzone(TILE_SIZE, TILE_SIZE);
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
      // Show the touch controls again — they were hidden when this scene
      // paused to launch the menu (or when an overlay scene took control).
      this.inputManager.getTouchControls()?.setVisible(true);
    });
    // Hide the touch controls (joystick + A/B + hamburger) while the scene
    // is paused so they don't sit on top of the pause menu / dialogue /
    // sub-menu UI.
    this.events.on('pause', () => {
      this.inputManager.getTouchControls()?.setVisible(false);
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

    // HUD label — uses the Aurum Pixel BMFont when loaded, falls back to
    // the system font otherwise (test harnesses skip BootScene asset loads).
    const mapLabel = this.mapDef.displayName
      ?? this.mapKey.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    // On portrait/mobile screens we only have ~400px of horizontal HUD room,
    // which used to clip both the map name and the input hints. Show the
    // location name on its own there and reserve the longer hint string for
    // landscape/desktop layouts where there is space for it.
    const isPortraitHud = this.cameras.main.height > this.cameras.main.width;
    const hudHint = isPortraitHud
      ? mapLabel
      : TouchControls.isTouchDevice()
        ? `${mapLabel}  |  ${hintText('interact')}`
        : `${mapLabel}  |  ${hintText('interact')}  |  ESC = Menu`;
    if (this.cache.bitmapFont.exists('aurum-pixel')) {
      // BitmapText takes a number; mobileFontPx gives the same scaled
      // value as mobileFontSize without the parseInt round-trip (NIT-003).
      const sizePx = mobileFontPx(14);
      this.hudText = this.add.bitmapText(
        this.cameras.main.width / 2, 14, 'aurum-pixel', hudHint, sizePx,
      ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100).setTint(0xffffff);
    } else {
      this.hudText = this.add.text(this.cameras.main.width / 2, 20, hudHint, {
        fontSize: mobileFontSize(14),
        color: '#ffffff',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    }

    // Clock widget — below location text in portrait, top-left in landscape
    const periodEmoji: Record<string, string> = { morning: '🌅', day: '☀️', evening: '🌆', night: '🌙' };
    const period = this.gameClock.getTimePeriod();
    const clockStr = `${periodEmoji[period] ?? '☀️'} ${this.gameClock.getClockString()}`;
    const isPortrait = this.cameras.main.height > this.cameras.main.width;
    this.clockText = this.add.text(
      isPortrait ? this.cameras.main.width / 2 : 8,
      isPortrait ? 38 : 8,
      clockStr, {
        fontSize: mobileFontSize(11),
        color: '#ffcc00',
        fontFamily: 'monospace',
        backgroundColor: '#0f0f1abb',
        padding: { x: 6, y: 3 },
      },
    ).setOrigin(isPortrait ? 0.5 : 0, 0).setScrollFactor(0).setDepth(100);

    // Optional speed-run timer (sits just below the clock, same alignment).
    const showTimer = GameManager.getInstance().getSetting('speedrunTimer') === true
      || GameManager.getInstance().getSetting('speedrunTimer') === 'true';
    if (showTimer) {
      this.speedrunTimerText = this.add.text(
        isPortrait ? this.cameras.main.width / 2 : 8,
        isPortrait ? 60 : 28,
        this.formatPlaytime(GameManager.getInstance().getPlaytime()), {
          fontSize: mobileFontSize(11),
          color: '#7fffd4',
          fontFamily: 'monospace',
          backgroundColor: '#0f0f1abb',
          padding: { x: 6, y: 3 },
        },
      ).setOrigin(isPortrait ? 0.5 : 0, 0).setScrollFactor(0).setDepth(100);
    }

    // Re-layout HUD elements on resize / orientation change
    layoutOn(this, () => {
      const w = this.cameras.main.width;
      const h = this.cameras.main.height;
      const portrait = h > w;
      // Refresh the HUD text so the input hint follows the orientation
      // (portrait = location only; landscape = location + key hints).
      const portraitHint = mapLabel;
      const landscapeHint = TouchControls.isTouchDevice()
        ? `${mapLabel}  |  ${hintText('interact')}`
        : `${mapLabel}  |  ${hintText('interact')}  |  ESC = Menu`;
      this.hudText?.setText(portrait ? portraitHint : landscapeHint);
      this.hudText?.setX(w / 2);
      if (this.clockText) {
        this.clockText.setPosition(portrait ? w / 2 : 8, portrait ? 38 : 8);
        this.clockText.setOrigin(portrait ? 0.5 : 0, 0);
      }
      if (this.speedrunTimerText) {
        this.speedrunTimerText.setPosition(portrait ? w / 2 : 8, portrait ? 60 : 28);
        this.speedrunTimerText.setOrigin(portrait ? 0.5 : 0, 0);
      }
    });

    // Slide-in area name banner.
    // BUG-066: Always pick a label — maps without `displayName` previously
    // never showed the banner, leaving the player without visual
    // confirmation of where they entered. Fall back to the same titlecased
    // map-key derivation the HUD strip uses.
    {
      const bannerLabel = this.mapDef.displayName
        ?? this.mapKey.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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

      const bannerText = this.add.text(bannerX, bannerY + bannerH / 2, bannerLabel, {
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

  // ── NPC / Trainer spawning ────────────────────────────────
  private spawnNPCs(): void {
    const timePeriod = this.gameClock?.getTimePeriod();
    const result = spawnNPCsHelper(this, this.mapDef, this.player, this.npcs, timePeriod);
    this.npcs.push(...result.npcs);
    this.npcBehaviors.push(...result.behaviors);
  }

  private spawnMapObjects(): void {
    const newObjects = spawnObjectsHelper(this, this.mapDef);
    this.mapObjects.push(...newObjects);
  }

  /** Destroy and re-create NPCs so flag-gated spawns update. */
  private respawnNPCs(): void {
    for (const b of this.npcBehaviors) b.destroy();
    this.npcBehaviors = [];
    for (const npc of this.npcs) npc.destroy();
    this.npcs = [];
    this.trainers = [];
    for (const obj of this.mapObjects) obj.destroy();
    this.mapObjects = [];
    this.spawnTrainers();
    this.spawnNPCs();
    this.spawnMapObjects();
  }

  private spawnTrainers(): void {
    const newTrainers = spawnTrainersHelper(this, this.mapDef);
    for (const trainer of newTrainers) {
      trainer.npcOccupiedTiles = this.npcOccupiedTiles;
      trainer.collisionCheck = (x: number, y: number) => {
        const tile = this.mapDef.ground[y]?.[x];
        if (tile !== undefined && SOLID_TILES.has(tile)) return true;
        if (this.npcOccupiedTiles.has(`${x},${y}`)) return true;
        return false;
      };
    }
    this.trainers.push(...newTrainers);
    this.npcs.push(...newTrainers);
  }

  /** Create a follower Pokemon sprite trailing 1 tile behind the player. */
  private createFollower(playerX: number, playerY: number): void {
    // Clean up previous follower if re-entering a map
    this.follower?.destroy();
    this.follower = undefined;

    const party = GameManager.getInstance().getParty();
    if (!party.length) return;

    const lead = party[0];
    const data = pokemonData[lead.dataId];
    if (!data?.spriteKeys?.icon) return;

    // Place follower 1 tile behind the player's spawn position
    const followerX = playerX;
    const followerY = Math.min(playerY + 1, (this.mapDef?.height ?? 25) - 1);

    this.follower = new FollowerPokemon(this, followerX, followerY, data.spriteKeys.icon);
    this.followerPrevPos = { x: playerX, y: playerY };

    // Hide follower in interior maps (too cramped) or while surfing
    if (this.mapDef?.isInterior || this.surfing) {
      this.follower.hideFollower();
    }
  }

  // ── Per-step hooks ────────────────────────────────────────
  private onPlayerStep(): void {
    if (this.transitioning) return;
    // Don't trigger warps/encounters/trainers during cutscene movement
    if (this.cutsceneEngine?.isRunning()) return;

    // Move follower to the player's previous position (1-tile trail)
    if (this.follower?.visible) {
      this.follower.moveTo(this.followerPrevPos.x, this.followerPrevPos.y);
    }

    const { x: tx, y: ty } = this.player.getTilePosition();

    // Record current position as the "previous" for next step
    this.followerPrevPos = { x: tx, y: ty };

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

    // Step achievements
    const am = AchievementManager.getInstance();
    if (steps >= 1000) am.unlock('steps-1000');
    if (steps >= 10000) am.unlock('steps-10000');
    if (steps >= 100000) am.unlock('steps-100000');

    // Terrain-based footstep SFX
    const currentTile = this.mapDef.ground[ty]?.[tx];
    if (currentTile !== undefined) {
      const footstepKey = this.getFootstepSFX(currentTile);
      if (footstepKey) {
        AudioManager.getInstance().playSFX(footstepKey);
      }
    }

    // Grass rustle effect when stepping into tall grass
    if (currentTile === Tile.TALL_GRASS || currentTile === Tile.DARK_GRASS) {
      const grassSprite = this.tilemapResult?.grassByTile.get(`${tx},${ty}`);
      if (grassSprite) {
        this.tweens.add({
          targets: grassSprite,
          scaleX: { from: 2.3, to: 2 },
          scaleY: { from: 1.7, to: 2 },
          duration: 250,
          ease: 'Back.easeOut',
        });
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
        // Allow movement when either side of the warp is an interior. The
        // intent of the no-starter gate is "do not let the player wander to a
        // route" — interior↔town transitions (entering or leaving the rival's
        // house, the lab, the player's home, etc.) must always work (B4).
        const isInteriorTransition = this.mapDef.isInterior || targetDef?.isInterior;
        if (gm.getParty().length === 0 && !isInteriorTransition) {
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

    // Exclamation emote above trainer
    EmoteBubble.show(this, trainer, 'exclamation', 600);

    // After a brief pause, trainer walks toward the player
    this.time.delayedCall(600, () => {
      // NEW-012: Guard against scene/sprite destruction during delay
      if (!this.scene.isActive() || !trainer.active) {
        return;
      }

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
          speaker: tData?.name,
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
      mapObjects: this.mapObjects,
      overworldState: this.overworldState,
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
      getGameMinutes: () => this.gameClock.getTotalElapsed(),
      mapKey: this.mapKey,
    };
    tryInteractHelper(ctx);
  }

  /** Redraw a single tile after a field ability changes it. */
  private redrawTile(tx: number, ty: number): void {
    if (this.tilemapResult) {
      redrawTilemapTile(this.tilemapResult, this.mapDef.ground, tx, ty);
    } else {
      redrawTileHelper(this, this.mapDef, tx, ty);
    }
  }

  /** Show a brief text popup for a field ability use. */
  private showFieldAbilityPopup(text: string): void {
    showPopup(this, text);
  }

  /** Push a Strength boulder one tile in the player's facing direction. */
  private pushBoulder(bx: number, by: number, dir: Direction): void {
    if (this.tilemapResult) {
      // Tilemap-aware push: pass tilemap result so the helper can
      // extract a temporary sprite from the decoration layer for animation.
      pushBoulderHelper(this, this.mapDef, bx, by, dir, this.tilemapResult);
    } else {
      pushBoulderHelper(this, this.mapDef, bx, by, dir);
    }
    this.showFieldAbilityPopup('Used STRENGTH!');
  }

  /** Get the appropriate footstep SFX key for a given tile type. */
  private getFootstepSFX(tile: number): string | null {
    return getFootstepSFXHelper(tile);
  }

  /** Attempt to fish at the water tile the player is facing. */
  private tryFishing(): void {
    if (this.scene.isActive('DialogueScene')) return;
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

  /** Return the action token for the current movement mode. */
  private animAction(action: 'walk' | 'idle'): string {
    if (this.isCycling) return action === 'walk' ? 'cycle' : 'cycle-idle';
    return action;
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

    // Y-based depth sorting: characters lower on screen render in front.
    // BUG-031: Add a small per-class delta so the player wins ties against
    // NPCs/trainers/objects on the same row (player +0.003, follower +0.002,
    // trainers/NPCs +0.001, objects +0). Without this, NPCs added later in
    // the loop ended up on top of the player whenever they shared a Y row.
    // BUG-032: include the follower in the y-sort so it doesn't stick at a
    // stale depth between movement tweens.
    const maxH = this.mapPixelH || 1;
    this.player.setDepth(1 + (this.player.y / maxH) * 0.9 + 0.003);
    if (this.follower) {
      this.follower.setDepth(1 + (this.follower.y / maxH) * 0.9 + 0.002);
    }
    for (const npc of this.npcs) {
      npc.setDepth(1 + (npc.y / maxH) * 0.9 + 0.001);
    }
    for (const trainer of this.trainers) {
      trainer.setDepth(1 + (trainer.y / maxH) * 0.9 + 0.001);
    }
    for (const obj of this.mapObjects) {
      obj.setDepth(1 + (obj.y / maxH) * 0.9);
    }

    // Refresh NPC occupied tile positions after behavior updates
    this.rebuildNpcOccupiedTiles();

    // Update clock display
    if (this.clockText) {
      const periodEmoji: Record<string, string> = { morning: '🌅', day: '☀️', evening: '🌆', night: '🌙' };
      const period = this.gameClock.getTimePeriod();
      this.clockText.setText(`${periodEmoji[period] ?? '☀️'} ${this.gameClock.getClockString()}`);
      GameManager.getInstance().setGameClockMinutes(this.gameClock.getTotalElapsed());

      // Detect time period change and update NPC schedules
      if (this.lastTimePeriod !== null && this.lastTimePeriod !== period) {
        const needsRespawn = applyNpcSchedules(this.npcs, this.mapDef, period);
        if (needsRespawn) {
          this.respawnNPCs();
        }
      }
      this.lastTimePeriod = period;
    }

    if (this.speedrunTimerText) {
      this.speedrunTimerText.setText(this.formatPlaytime(GameManager.getInstance().getPlaytime()));
    }

    // Animated tile effects (throttled: water/lava every 30 frames, grass every 60)
    this.tileAnimFrame++;
    const tm = this.tilemapResult;
    if (tm && this.tileAnimFrame % 30 === 0) {
      const waterTints = [0x3090e0, 0x40a0f0, 0x2080d0];
      const lavaTints = [0xe06020, 0xf07030, 0xd05010];
      const idx = Math.floor(this.tileAnimFrame / 30) % 3;
      const waterFrames = [Tile.WATER, Tile.WATER_FRAME_1, Tile.WATER_FRAME_2];
      const lavaFrames = [Tile.LAVA_ROCK, Tile.LAVA_FRAME_1, Tile.LAVA_FRAME_2];
      for (const s of tm.waterSprites) {
        s.setTint(waterTints[idx]);
        s.setFrame(waterFrames[idx]);
      }
      const emberFrames = [Tile.EMBER_VENT, Tile.EMBER_FRAME_1, Tile.EMBER_FRAME_2];
      for (const s of tm.lavaSprites) {
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
    if (tm && this.tileAnimFrame % 60 === 0) {
      for (const s of tm.grassSprites) {
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

    // Update glow emitters (aether crystals, voltara conduits, window light shafts)
    this.glowEmitters?.update(delta, this.gameClock);

    // Update day/night tint (skip for interiors — keep void area black)
    if (!this.mapDef.isInterior) {
      const tint = this.gameClock.getCurrentTint();
      this.cameras.main.setBackgroundColor(tint);
    }

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

    // Bicycle toggle: B key toggles cycling on/off (requires bicycle item, not indoors, not surfing)
    // Placed before the direction check so the player can mount/dismount while standing still.
    const hasBicycle = GameManager.getInstance().getItemCount('bicycle') > 0;
    if (input.bicycle && hasBicycle && !this.surfing) {
      this.isCycling = !this.isCycling;
      if (this.isCycling) {
        AchievementManager.getInstance().unlock('use-bicycle');
      }
    }
    // Auto-dismount indoors or on water
    if (this.isCycling && (this.mapDef.isInterior || this.surfing)) {
      this.isCycling = false;
    }

    if (!input.direction) {
      const facing = this.player.getFacing();
      this.playAnim(`${this.animPrefix()}${this.animAction('idle')}-${facing}`, false);
      this.player.gridMovement.setRunning(false);
      this.player.gridMovement.setCycling(false);
      return;
    }

    // Running shoes: hold SHIFT, B button, or double-tap joystick to run
    const shiftDown = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT, false, false).isDown;
    const hasRunningShoes = GameManager.getInstance().getFlag('runningShoes');
    const touchRun = TouchControls.getInstance()?.isRunToggled() ?? false;
    // Cycling takes priority over running; they are mutually exclusive
    const shouldRun = !this.isCycling && hasRunningShoes && (shiftDown || touchRun);
    this.player.gridMovement.setRunning(shouldRun);
    this.player.gridMovement.setCycling(this.isCycling);

    // Walk / Run / Cycle
    this.playAnim(`${this.animPrefix()}${this.animAction('walk')}-${input.direction}`, false);
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
        // Match the actual confirm/talk binding: SPACE (or ENTER) on desktop,
        // tap-to-talk on touch devices. Previously hard-coded 'Z' which is not
        // bound to anything in InputManager.
        const label = TouchControls.isTouchDevice() ? 'Tap' : 'SPACE';
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
    // BUG-046: Skip the rebuild when nothing has moved — the previous
    // implementation cleared + re-inserted every frame, which produced
    // measurable GC churn on busy maps. Compute a quick "position
    // signature" for the live NPC + object positions and bail when it
    // matches the snapshot from the last rebuild.
    const next: string[] = [];
    for (const npc of this.npcs) {
      const tx = Math.floor(npc.x / TILE_SIZE);
      const ty = Math.floor(npc.y / TILE_SIZE);
      next.push(`${tx},${ty}`);
    }
    // Item-balls are walkable (player steps on them to collect); only
    // blocking object types (signs, PCs, doors) occupy tiles.
    for (const obj of this.mapObjects) {
      if (obj.objectType === 'item-ball') continue;
      const tx = Math.floor(obj.x / TILE_SIZE);
      const ty = Math.floor(obj.y / TILE_SIZE);
      next.push(`${tx},${ty}`);
    }
    if (next.length === this.npcTileSnapshot.length) {
      let changed = false;
      for (let i = 0; i < next.length; i++) {
        if (next[i] !== this.npcTileSnapshot[i]) { changed = true; break; }
      }
      if (!changed) return;
    }
    this.npcOccupiedTiles.clear();
    for (const key of next) this.npcOccupiedTiles.add(key);
    this.npcTileSnapshot = next;
  }

  /** Format a playtime in seconds as `H:MM:SS` (or `M:SS` if < 1 hour). */
  private formatPlaytime(totalSeconds: number): string {
    const s = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
  }

  shutdown(): void {
    // Persist repel steps so they survive map transitions and battle returns
    if (this.encounterSystem) {
      GameManager.getInstance().setRepelSteps(this.encounterSystem.getRepelSteps());
    }
    this.input.keyboard?.removeAllListeners();
    this.inputManager?.destroy();
    this.lightingSystem?.destroy();
    this.ambientSFX?.destroy();
    this.weatherRenderer?.destroy();
    this.glowEmitters?.destroy();
    this.glowEmitters = undefined;
    this.npcBehaviors = [];
    this.npcOccupiedTiles.clear();
    this.interactPrompt?.destroy();
    this.interactPrompt = undefined;
    // Destroy tilemap layers + animated sprites
    if (this.tilemapResult) {
      this.tilemapResult.tilemap.destroy();
      this.tilemapResult = null;
    }
  }

}
