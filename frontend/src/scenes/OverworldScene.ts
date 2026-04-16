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
  /** Frames to skip confirm input after resuming (prevents re-trigger). */
  private resumeCooldown = 0;
  private isCycling = false;
  private surfing = false;

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

    this.player = new Player(this, spawnX, spawnY);
    this.player.setScale(2);
    this.player.setDepth(1); // Between ground (0) and foreground overlays like tall grass (2)
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
    }

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

      // Set up idle behavior if configured
      if (def.behavior && def.behavior.type !== 'stationary') {
        const mapW = this.mapDef.width;
        const mapH = this.mapDef.height;
        const controller = new NPCBehaviorController(this, npc, def.behavior, (tx, ty) => {
          if (tx < 0 || ty < 0 || ty >= mapH || tx >= mapW) return true;
          if (SOLID_TILES.has(this.mapDef.ground[ty][tx])) return true;
          // Block player tile
          const pTX = Math.floor(this.player.x / TILE_SIZE);
          const pTY = Math.floor(this.player.y / TILE_SIZE);
          if (pTX === tx && pTY === ty) return true;
          // Block other NPC tiles
          for (const other of this.npcs) {
            if (other === npc) continue;
            const oTX = Math.floor(other.x / TILE_SIZE);
            const oTY = Math.floor(other.y / TILE_SIZE);
            if (oTX === tx && oTY === ty) return true;
          }
          return false;
        });
        this.npcBehaviors.push(controller);
      }
    }
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
      trainer.mapGround = this.mapDef.ground; // enable wall-blocked LoS
      this.trainers.push(trainer);
      this.npcs.push(trainer); // also in NPC list for collision
    }
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

    // Disembark surf when stepping onto a non-water tile
    if (this.surfing && this.mapDef.ground[ty]?.[tx] !== Tile.WATER) {
      this.surfing = false;
    }

    // Warps
    for (const warp of this.mapDef.warps) {
      if (warp.tileX === tx && warp.tileY === ty) {
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
    const px = tx * TILE_SIZE + TILE_SIZE / 2;
    const py = ty * TILE_SIZE + TILE_SIZE / 2;
    const scale = TILE_SIZE / 16;
    const newTile = this.mapDef.ground[ty][tx];

    // Remove existing sprites at this position (ground layer only)
    this.children.list
      .filter(obj => {
        if (!(obj instanceof Phaser.GameObjects.Image)) return false;
        return Math.abs(obj.x - px) < 1 && Math.abs(obj.y - py) < 1 && obj.depth <= 2;
      })
      .forEach(obj => obj.destroy());

    // Draw the replacement tile
    const baseTile = OVERLAY_BASE[newTile];
    if (baseTile !== undefined) {
      const base = this.add.image(px, py, 'tileset', baseTile);
      base.setScale(scale);
      base.setDepth(0);
    }
    const sprite = this.add.image(px, py, 'tileset', newTile);
    sprite.setScale(scale);
    sprite.setDepth(baseTile !== undefined ? 0.5 : 0);
  }

  /** Show a brief text popup for a field ability use. */
  private showFieldAbilityPopup(text: string): void {
    const { width } = this.cameras.main;
    const popup = this.add.text(width / 2, 80, text, {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);

    this.tweens.add({
      targets: popup,
      alpha: { from: 0, to: 1 },
      duration: 200,
      yoyo: true,
      hold: 800,
      onComplete: () => popup.destroy(),
    });
  }

  /** Attempt to fish at the water tile the player is facing. */
  private tryFishing(): void {
    const gm = GameManager.getInstance();
    // Determine best rod the player has
    let rod: 'old' | 'good' | 'super' | null = null;
    if (gm.getItemCount('super-rod') > 0) rod = 'super';
    else if (gm.getItemCount('good-rod') > 0) rod = 'good';
    else if (gm.getItemCount('old-rod') > 0) rod = 'old';

    if (!rod) {
      this.scene.pause();
      this.scene.launch('DialogueScene', { dialogue: ['The water is calm...'] });
      this.scene.get('DialogueScene').events.once('shutdown', () => this.scene.resume());
      return;
    }

    this.scene.pause();
    this.scene.launch('DialogueScene', { dialogue: ['...', '...!'] });
    this.scene.get('DialogueScene').events.once('shutdown', () => {
      const pokemon = EncounterSystem.fishEncounter(this.mapKey, rod!);
      if (pokemon) {
        gm.markSeen(pokemon.dataId);
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
    // Show healing flash and play heal jingle
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

    // Update NPC idle behaviors every frame (even while player moves)
    const delta = this.game.loop.delta;
    for (const controller of this.npcBehaviors) {
      controller.update(delta);
    }

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
      this.playAnim(`player-idle-${facing}`, false);
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
    this.playAnim(`player-walk-${input.direction}`, false);
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
