import Phaser from 'phaser';
import { TILE_SIZE } from '@utils/constants';
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
import { moveData } from '@data/move-data';
import {
  mapRegistry,
  MapDefinition,
  NpcSpawn,
  Tile,
  TILE_COLORS,
  SOLID_TILES,
} from '@data/map-data';
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
    this.cameras.main.startFollow(this.player, true);
    this.cameras.main.setBounds(0, 0, mapW * TILE_SIZE, mapH * TILE_SIZE);

    // Input
    this.inputManager = new InputManager(this);

    // ── Audio: play map BGM ──
    const audio = AudioManager.getInstance();
    audio.setScene(this);
    const bgmKey = MAP_BGM[this.mapKey] ?? BGM.PALLET_TOWN;
    audio.playBGM(bgmKey);

    // HUD label
    const { width } = this.cameras.main;
    const mapLabel = this.mapKey.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    this.add.text(width / 2, 20, `${mapLabel}  |  ENTER = Talk  |  ESC = Menu`, {
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
  }

  // ── Map rendering ────────────────────────────────────────
  private drawMap(mapW: number, mapH: number): void {
    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        const tile = this.mapDef.ground[y][x];
        const color = TILE_COLORS[tile] ?? 0x5a9e3e;
        const px = x * TILE_SIZE + TILE_SIZE / 2;
        const py = y * TILE_SIZE + TILE_SIZE / 2;

        this.add.rectangle(px, py, TILE_SIZE, TILE_SIZE, color);

        if (tile === Tile.GRASS && (x + y) % 5 === 0) {
          this.add.rectangle(px - 4, py - 2, 3, 3, 0x6db04e);
        }
        if (tile === Tile.TALL_GRASS) {
          this.add.rectangle(px - 4, py - 3, 2, 8, 0x4a8b32);
          this.add.rectangle(px + 4, py - 2, 2, 8, 0x4a8b32);
          this.add.rectangle(px, py - 4, 2, 8, 0x4a8b32);
        }
        if (tile === Tile.WATER) {
          this.add.rectangle(px - 3, py - 2, 6, 2, 0x5a9edf).setAlpha(0.5);
        }
        if (tile === Tile.FLOWER) {
          this.add.circle(px, py - 2, 4, 0xf06060);
          this.add.circle(px, py - 2, 2, 0xf0e040);
        }
        // PokéCenter cross marker
        if (tile === Tile.CENTER_ROOF) {
          this.add.rectangle(px, py, 6, 2, 0xffffff);
          this.add.rectangle(px, py, 2, 6, 0xffffff);
        }
        // Mart "M" marker
        if (tile === Tile.MART_ROOF) {
          this.add.text(px, py, 'M', { fontSize: '10px', color: '#ffffff' }).setOrigin(0.5);
        }
        // Gym star marker
        if (tile === Tile.GYM_ROOF) {
          this.add.text(px, py, '★', { fontSize: '10px', color: '#ffcc00' }).setOrigin(0.5);
        }
        // Dense tree extra detail
        if (tile === Tile.DENSE_TREE) {
          this.add.circle(px, py - 2, 5, 0x0d300a);
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
        if (spawnDef?.id === 'pallet-oak-after' && gm.getFlag('hasParcel') && !gm.getFlag('receivedPokedex')) {
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

        if (spawnDef?.interactionType === 'starter-select') {
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
      const animDir = facing === 'right' ? 'left' : facing;
      this.playAnim(`player-idle-${animDir}`, facing === 'right');
      return;
    }

    // Walk
    const animDir = input.direction === 'right' ? 'left' : input.direction;
    const flipX = input.direction === 'right';
    this.playAnim(`player-walk-${animDir}`, flipX);
    this.player.move(input.direction);
  }
}
