import Phaser from 'phaser';
import { TILE_SIZE, GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';
import { Player } from '@entities/Player';
import { NPC } from '@entities/NPC';
import { Trainer } from '@entities/Trainer';
import { AnimationHelper } from '@systems/AnimationHelper';
import { InputManager } from '@systems/InputManager';
import { TouchControls } from '@ui/TouchControls';
import { Direction } from '@utils/type-helpers';
import { GameManager } from '@managers/GameManager';
import { EncounterSystem } from '@systems/EncounterSystem';
import { GameClock } from '@systems/GameClock';
import { WeatherRenderer } from '@systems/WeatherRenderer';
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
import { MapPreloader } from '@systems/MapPreloader';
import { EventManager } from '@managers/EventManager';
import { QuestManager } from '@managers/QuestManager';
import { NPCBehaviorController } from '@systems/NPCBehavior';
import { OverworldAbilities } from '@systems/OverworldAbilities';
import { LightingSystem } from '@systems/LightingSystem';
import { AmbientSFX } from '@systems/AmbientSFX';
import { CutsceneEngine } from '@systems/CutsceneEngine';
import { cutsceneData } from '@data/cutscene-data';
import { AchievementManager } from '@managers/AchievementManager';
import { AchievementToast } from '@ui/AchievementToast';
import {
  spawnNPCs as spawnNPCsHelper,
  spawnTrainers as spawnTrainersHelper,
} from './overworld/OverworldNPCSpawner';
import {
  redrawTile as redrawTileHelper,
  showFieldAbilityPopup as showPopup,
  pushBoulder as pushBoulderHelper,
} from './overworld/OverworldFieldAbilities';
import { getBestRod, attemptFish } from './overworld/OverworldFishing';
import { healParty as healPartyHelper } from './overworld/OverworldHealing';
import { getFootstepSFX as getFootstepSFXHelper } from './overworld/OverworldFootsteps';

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
    this.surfing = false;
    this.npcs = [];
    this.trainers = [];
    this.npcBehaviors = [];
    this.lastAnimKey = '';
    this.lastFlipX = false;
    this.waterTileSprites = [];
    this.tallGrassTileSprites = [];
    this.lavaTileSprites = [];
    this.tileAnimFrame = 0;
  }

  create(): void {
    const gm = GameManager.getInstance();

    QuestManager.getInstance().initAutomation();

    // Launch quest tracker HUD overlay
    if (!this.scene.isActive('QuestTrackerScene')) {
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
    this.gameClock = new GameClock();

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

    // Spawn NPCs and Trainers from map data
    this.spawnNPCs();
    this.spawnTrainers();

    // Set up collision: solid tiles + NPC positions
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
      // Block NPC/Trainer tiles
      for (const npc of this.npcs) {
        const npcTX = Math.floor(npc.x / TILE_SIZE);
        const npcTY = Math.floor(npc.y / TILE_SIZE);
        if (npcTX === tx && npcTY === ty) return true;
      }
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

    if (this.mapDef.isInterior && mapPixelW <= GAME_WIDTH && mapPixelH <= GAME_HEIGHT) {
      // Small interior — center the map in the viewport, don't follow player
      this.cameras.main.stopFollow();
      this.cameras.main.setBackgroundColor(0x202020);
      // Position camera so map is centered in the game window
      this.cameras.main.scrollX = (mapPixelW - GAME_WIDTH) / 2;
      this.cameras.main.scrollY = (mapPixelH - GAME_HEIGHT) / 2;
    } else {
      this.cameras.main.startFollow(this.player, true);
      this.cameras.main.setBounds(0, 0, mapPixelW, mapPixelH);
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
    const { width } = this.cameras.main;
    const mapLabel = this.mapDef.displayName
      ?? this.mapKey.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const hudHint = TouchControls.isTouchDevice()
      ? `${mapLabel}  |  Tap = Talk`
      : `${mapLabel}  |  SPACE = Talk  |  ESC = Menu`;
    this.add.text(width / 2, 20, hudHint, {
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

  // ── Map rendering (tileset-based) ──────────────────────────
  private drawMap(mapW: number, mapH: number): void {
    // Scale factor: tileset is 16px, game tiles are TILE_SIZE (32px)
    const scale = TILE_SIZE / 16;

    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        const tile = this.mapDef.ground[y][x];
        const px = x * TILE_SIZE + TILE_SIZE / 2;
        const py = y * TILE_SIZE + TILE_SIZE / 2;

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
          // Foreground overlays render ABOVE the player (tall grass, trees)
          // Ground overlays render BELOW the player (doors, flowers, mats, etc.)
          sprite.setDepth(FOREGROUND_TILES.has(tile) ? 2 : 0.5);
          // Tall grass should be semi-transparent so entities are partially visible
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
    this.spawnNPCs();
    this.spawnTrainers();
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
            return;
          }
        }
        // Block leaving town without a starter — but always allow building entry
        const targetDef = mapRegistry[warp.targetMap];
        if (gm.getParty().length === 0 && !targetDef?.isInterior) {
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
      // Running increases encounter rate; cycling is normal
      const encounterMultiplier = this.player.gridMovement.isRunning() ? 1.5 : 1;
      const wild = this.encounterSystem.checkEncounter(this.mapDef.encounterTableKey, encounterMultiplier);
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
      fontSize: '24px', color: '#ff0000', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);

    // After a brief pause, trainer walks toward the player
    this.time.delayedCall(600, () => {
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

    // Check the tile directly in front; if it's a counter, also check one tile further
    const tilesToCheck: { tx: number; ty: number }[] = [{ tx: targetX, ty: targetY }];
    if (
      targetY >= 0 && targetY < this.mapDef.height &&
      targetX >= 0 && targetX < this.mapDef.width
    ) {
      const frontTile = this.mapDef.ground[targetY][targetX];
      if (frontTile === Tile.COUNTER || frontTile === Tile.PINK_COUNTER) {
        let behindX = targetX;
        let behindY = targetY;
        switch (facing) {
          case 'up':    behindY--; break;
          case 'down':  behindY++; break;
          case 'left':  behindX--; break;
          case 'right': behindX++; break;
        }
        tilesToCheck.push({ tx: behindX, ty: behindY });
      }
    }

    for (const npc of this.npcs) {
      const npcTX = Math.floor(npc.x / TILE_SIZE);
      const npcTY = Math.floor(npc.y / TILE_SIZE);
      if (tilesToCheck.some(t => t.tx === npcTX && t.ty === npcTY)) {
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

        // Set flag on interaction if configured (from matched flagDialogue or setsFlag)
        if (spawnDef?.flagDialogue) {
          for (const fd of spawnDef.flagDialogue) {
            if (gm.getFlag(fd.flag) && fd.setFlag && !gm.getFlag(fd.setFlag)) {
              gm.setFlag(fd.setFlag);
              EventManager.getInstance().emit('flag-set', fd.setFlag);
              break;
            }
          }
        }
        if (spawnDef?.setsFlag && !gm.getFlag(spawnDef.setsFlag)) {
          gm.setFlag(spawnDef.setsFlag);
          EventManager.getInstance().emit('flag-set', spawnDef.setsFlag);

          // Give item if configured (only once, gated by the flag)
          if (spawnDef.givesItem) {
            gm.addItem(spawnDef.givesItem);
          }
        }

        // Special: Oak parcel delivery triggers multiple flags
        if (spawnDef?.id === 'lab-oak-after' && gm.getFlag('hasParcel') && !gm.getFlag('receivedPokedex')) {
          gm.setFlag('deliveredParcel');
          gm.setFlag('receivedPokedex');
          EventManager.getInstance().emit('flag-set', 'deliveredParcel');
          EventManager.getInstance().emit('flag-set', 'receivedPokedex');
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

        if (spawnDef?.interactionType === 'move-tutor') {
          const tutorId = spawnDef.interactionData ?? spawnDef.id;
          this.scene.pause();
          this.scene.launch('DialogueScene', { dialogue });
          this.scene.get('DialogueScene').events.once('shutdown', () => {
            this.scene.launch('MoveTutorScene', { tutorId });
            this.scene.get('MoveTutorScene').events.once('shutdown', () => {
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

        if (spawnDef?.interactionType === 'name-rater') {
          this.scene.pause();
          this.scene.launch('DialogueScene', { dialogue });
          this.scene.get('DialogueScene').events.once('shutdown', () => {
            // Launch party selection, then naming input for the chosen Pokémon
            this.scene.launch('PartyScene', { selectMode: true });
            this.scene.get('PartyScene').events.once('pokemon-selected', (index: number) => {
              this.scene.stop('PartyScene');
              const party = gm.getParty();
              const selected = party[index];
              if (!selected) { this.scene.resume(); return; }
              const speciesName = pokemonData[selected.dataId]?.name ?? '???';
              this.launchNicknameInput(selected, speciesName, () => {
                this.scene.resume();
              });
            });
            this.scene.get('PartyScene').events.once('shutdown', () => {
              // If PartyScene shut down without selection, just resume
              this.scene.resume();
            });
          });
          return;
        }

        // ── Tag-battle handler ──
        if (spawnDef?.interactionType === 'tag-battle' && spawnDef.interactionData) {
          const [allyId, enemy1Id, enemy2Id, wonFlag] = spawnDef.interactionData.split('|');
          if (wonFlag && gm.getFlag(wonFlag)) {
            // Already completed – show regular dialogue
          } else {
            const allyData = trainerData[allyId];
            const e1Data = trainerData[enemy1Id];
            const e2Data = trainerData[enemy2Id];
            if (allyData && e1Data && e2Data) {
              const allyParty = allyData.party.map(p => EncounterSystem.createWildPokemon(p.pokemonId, p.level));
              const enemyParty1 = e1Data.party.map(p => EncounterSystem.createWildPokemon(p.pokemonId, p.level));
              const enemyParty2 = e2Data.party.map(p => EncounterSystem.createWildPokemon(p.pokemonId, p.level));
              this.scene.pause();
              this.scene.launch('DialogueScene', { dialogue });
              this.scene.get('DialogueScene').events.once('shutdown', () => {
                this.scene.start('TransitionScene', {
                  target: 'BattleScene',
                  data: {
                    isDouble: true,
                    allyParty,
                    enemyParty: [...enemyParty1, ...enemyParty2],
                    trainerId: enemy1Id,
                    victoryFlag: wonFlag ?? '',
                  },
                });
              });
              return;
            }
          }
        }

        // ── Show-pokemon handler (Collector's Challenge) ──
        if (spawnDef?.interactionType === 'show-pokemon' && spawnDef.interactionData) {
          const requirements = spawnDef.interactionData.split('|').map(r => {
            const [type, flag] = r.split(':');
            return { type, flag };
          });
          const nextReq = requirements.find(r => !gm.getFlag(r.flag));
          if (nextReq) {
            this.scene.pause();
            this.scene.launch('DialogueScene', { dialogue });
            this.scene.get('DialogueScene').events.once('shutdown', () => {
              this.scene.launch('PartyScene', { selectMode: true });
              this.scene.get('PartyScene').events.once('pokemon-selected', (index: number) => {
                this.scene.stop('PartyScene');
                const party = gm.getParty();
                const selected = party[index];
                if (!selected) { this.scene.resume(); return; }
                const pData = pokemonData[selected.dataId];
                if (pData && pData.types.some((t: string) => t === nextReq.type)) {
                  gm.setFlag(nextReq.flag);
                  EventManager.getInstance().emit('flag-set', nextReq.flag);
                  this.scene.launch('DialogueScene', { dialogue: [`Magnificent! A fine ${nextReq.type}-type indeed!`] });
                  this.scene.get('DialogueScene').events.once('shutdown', () => this.scene.resume());
                } else {
                  this.scene.launch('DialogueScene', { dialogue: [`Hmm, that's not the ${nextReq.type}-type I'm looking for.`] });
                  this.scene.get('DialogueScene').events.once('shutdown', () => this.scene.resume());
                }
              });
              this.scene.get('PartyScene').events.once('shutdown', () => this.scene.resume());
            });
            return;
          }
        }

        // ── Wild-encounter handler (Lost Pokémon trigger) ──
        if (spawnDef?.interactionType === 'wild-encounter' && spawnDef.interactionData) {
          const [speciesId, lvl] = spawnDef.interactionData.split('-').map(Number);
          if (speciesId && lvl) {
            this.scene.pause();
            this.scene.launch('DialogueScene', { dialogue });
            this.scene.get('DialogueScene').events.once('shutdown', () => {
              const wild = EncounterSystem.createWildPokemon(speciesId, lvl);
              this.triggerWildEncounter(wild);
            });
            return;
          }
        }

        // Cutscene trigger (overrides regular dialogue unless already completed)
        if (spawnDef?.triggerCutscene && cutsceneData[spawnDef.triggerCutscene]) {
          const cutscene = cutsceneData[spawnDef.triggerCutscene];
          const setFlagActions = cutscene.actions.filter(
            (a): a is Extract<typeof a, { type: 'setFlag' }> => a.type === 'setFlag'
          );
          const alreadyPlayed = setFlagActions.length > 0 &&
            setFlagActions.every(a => gm.getFlag(a.flag));
          if (!alreadyPlayed) {
            this.cutsceneEngine.play(cutscene);
            return;
          }
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

    // ── Tile interactions: check the tile the player is facing ──
    if (targetY >= 0 && targetY < this.mapDef.height && targetX >= 0 && targetX < this.mapDef.width) {
      const tile = this.mapDef.ground[targetY][targetX];

      // Cut tree
      if (tile === Tile.CUT_TREE && OverworldAbilities.canUse('cut')) {
        this.mapDef.ground[targetY][targetX] = Tile.GRASS;
        this.redrawTile(targetX, targetY);
        this.showFieldAbilityPopup('CUT!');
        return;
      }

      // Rock Smash
      if (tile === Tile.CRACKED_ROCK && OverworldAbilities.canUse('rock-smash')) {
        this.mapDef.ground[targetY][targetX] = Tile.GRASS;
        this.redrawTile(targetX, targetY);
        this.showFieldAbilityPopup('SMASH!');
        return;
      }

      // Strength: push boulder
      if (tile === Tile.STRENGTH_BOULDER && OverworldAbilities.canUse('strength')) {
        this.pushBoulder(targetX, targetY, facing);
        return;
      }

      // Starter Poké Ball on table
      if (tile === Tile.POKEBALL_ITEM) {
        const gm = GameManager.getInstance();
        if (!gm.getFlag('receivedStarter')) {
          if (gm.getFlag('oakOfferedStarter')) {
            this.launchStarterSelection();
          } else {
            this.scene.pause();
            this.scene.launch('DialogueScene', { dialogue: ['There are three Poké Balls on the table.'] });
            this.scene.get('DialogueScene').events.once('shutdown', () => this.scene.resume());
          }
          return;
        }
      }

      // Surf: start surfing on water
      if (tile === Tile.WATER && !this.surfing && OverworldAbilities.canUse('surf')) {
        this.surfing = true;
        this.showFieldAbilityPopup('SURF!');
        return;
      }

      // Fishing: check if facing a water tile with a rod
      if (tile === Tile.WATER) {
        this.tryFishing();
        return;
      }
    }
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
    this.scene.launch('DialogueScene', { dialogue: ['...', '...!'] });
    this.scene.get('DialogueScene').events.once('shutdown', () => {
      const pokemon = attemptFish(this.mapKey, rod);
      if (pokemon) {
        this.scene.resume();
        this.triggerWildEncounter(pokemon);
      } else {
        this.scene.launch('DialogueScene', { dialogue: ['Not even a nibble...'] });
        this.scene.get('DialogueScene').events.once('shutdown', () => this.scene.resume());
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

    // Animated tile effects (run every frame, even while player moves)
    this.tileAnimFrame++;
    if (this.tileAnimFrame % 30 === 0) {
      const waterTints = [0x3090e0, 0x40a0f0, 0x2080d0];
      const lavaTints = [0xe06020, 0xf07030, 0xd05010];
      const idx = Math.floor(this.tileAnimFrame / 30) % 3;
      for (const s of this.waterTileSprites) s.setTint(waterTints[idx]);
      for (const s of this.lavaTileSprites) s.setTint(lavaTints[idx]);
    }
    if (this.tileAnimFrame % 15 === 0) {
      for (const s of this.tallGrassTileSprites) {
        s.setAlpha(0.85 + Math.random() * 0.15);
      }
    }

    // Update ambient SFX
    if (this.ambientSFX) this.ambientSFX.update();

    if (this.player.isMoving()) return;

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

    // Running shoes: hold SHIFT or B button to run (requires flag or always available)
    const shiftDown = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT, false, false).isDown;
    const hasRunningShoes = GameManager.getInstance().getFlag('runningShoes');
    // Cycling takes priority over running; they are mutually exclusive
    const shouldRun = !this.isCycling && hasRunningShoes && shiftDown;
    this.player.gridMovement.setRunning(shouldRun);
    this.player.gridMovement.setCycling(this.isCycling);

    // Walk / Run
    this.playAnim(`${this.animPrefix()}walk-${input.direction}`, false);
    this.player.move(input.direction);
  }

  /**
   * Crop the bottom portion of entities standing on tall grass tiles
   * so they appear partially hidden in the grass (classic Pokémon effect).
   */
  private updateGrassCrop(): void {
    const entities: Phaser.GameObjects.Sprite[] = [this.player, ...this.npcs];
    for (const entity of entities) {
      if (!entity.active) continue;
      const tx = Math.floor(entity.x / TILE_SIZE);
      const ty = Math.floor(entity.y / TILE_SIZE);
      const tile = this.mapDef.ground[ty]?.[tx];
      if (tile === Tile.TALL_GRASS) {
        // Hide bottom ~35% of sprite to simulate wading through grass
        const frame = entity.frame;
        const cropH = Math.floor(frame.height * 0.65);
        entity.setCrop(0, 0, frame.width, cropH);
      } else {
        entity.setCrop();
      }
    }
  }
}
