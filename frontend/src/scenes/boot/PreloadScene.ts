import Phaser from 'phaser';
import { pokemonData } from '@data/pokemon';
import { BGM, SFX } from '@utils/audio-keys';
import { AudioManager } from '@managers/AudioManager';
import { mobileFontSize } from '@ui/theme';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Progress bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontSize: mobileFontSize(20),
      color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Load Pokemon icon sprites (small; needed everywhere: menus, party, PC).
    // Front/back battle sprites are loaded on demand by MapPreloader as the
    // player approaches each route.
    for (const data of Object.values(pokemonData)) {
      const name = data.name.toLowerCase();
      this.load.image(data.spriteKeys.icon, `assets/sprites/pokemon/${name}-icon.png`);
    }

    // Load tilesets
    this.load.image('overworld-tiles', 'assets/tilesets/overworld.png');
    this.load.spritesheet('tileset', 'assets/tilesets/tileset.png', {
      frameWidth: 16,
      frameHeight: 16,
    });

    // Load player character atlases (male + female)
    this.load.atlas('player-walk', 'assets/sprites/player/player-walk.png', 'assets/sprites/player/player-walk.json');
    this.load.atlas('player-walk-female', 'assets/sprites/player/player-walk-female.png', 'assets/sprites/player/player-walk-female.json');

    // Load a Pokemon front sprite for the intro scene
    this.load.image('pikachu-front', 'assets/sprites/pokemon/pikachu-front.png');

    // ── NPC Sprites ──
    // Organized by subfolder under assets/sprites/npcs/
    //
    // Males/ — generic + descriptive male NPCs (source: Males.png sheet)
    //   npc-male-1  (M_01) — red-haired boy
    //   npc-male-2  (M_03) — blue-haired boy        ← same sprite as generic-trainer
    //   npc-male-3  (M_05) — brown-haired man
    //   npc-male-4  (M_08) — dark-skinned man
    //   npc-male-5  (M_10) — blond man
    //   npc-male-6  (M_12) — dark-haired man
    //   npc-oldman  (M_02) — elderly bald man
    //   npc-hiker   (M_04) — bearded hiker w/ backpack
    //   npc-scientist(M_07) — lab coat scientist
    //   npc-swimmer (M_09) — shirtless swimmer
    //   npc-sailor  (M_11) — uniformed sailor
    //
    // Females/ — generic + descriptive female NPCs (source: Females.png sheet)
    //   npc-female-1 (F_03) — red-haired girl
    //   npc-female-2 (F_04) — brown-haired girl
    //   npc-female-3 (F_05) — blonde girl
    //   npc-female-4 (F_06) — dark-haired girl
    //   npc-female-5 (F_08) — green-haired woman
    //   npc-female-6 (F_09) — purple-haired woman
    //   npc-female-7 (F_10) — silver-haired woman
    //   npc-female-8 (F_11) — red-dressed woman
    //   npc-female-9 (F_12) — blue-dressed woman
    //   npc-nurse   (F_02) — pink-haired nurse
    //   npc-lass    (F_07) — young lass trainer
    //
    // story/     — rival, npc-oak, npc-mom, npc-marina, npc-blitz
    // trainers/  — generic-trainer, npc-ace-trainer, npc-ace-trainer-f, npc-bug-catcher, npc-psychic
    // gym-leaders/ — npc-gym-{brock,blitz,ferris,coral,ivy,morwen,drake,solara,giovanni}
    // elite-four/  — npc-e4-{nerida,theron,lysandra,ashborne}, npc-champion-aldric
    // villains/    — npc-grunt, npc-admin-vex, npc-vex
    //
    // Load NPC sprites — organized by subfolder
    const npcBase = 'assets/sprites/npcs';

    // Generic male NPCs (Males/) — 6 generic + 5 descriptive
    for (let i = 1; i <= 6; i++) {
      const key = `npc-male-${i}`;
      this.load.atlas(key, `${npcBase}/Males/${key}.png`, `${npcBase}/Males/${key}.json`);
    }
    for (const key of ['npc-oldman', 'npc-hiker', 'npc-scientist', 'npc-swimmer', 'npc-sailor']) {
      this.load.atlas(key, `${npcBase}/Males/${key}.png`, `${npcBase}/Males/${key}.json`);
    }

    // Generic female NPCs (Females/) — 9 generic + 3 descriptive
    for (let i = 1; i <= 9; i++) {
      const key = `npc-female-${i}`;
      this.load.atlas(key, `${npcBase}/Females/${key}.png`, `${npcBase}/Females/${key}.json`);
    }
    for (const key of ['npc-nurse', 'npc-lass']) {
      this.load.atlas(key, `${npcBase}/Females/${key}.png`, `${npcBase}/Females/${key}.json`);
    }

    // Story characters (story/)
    for (const key of ['rival', 'npc-oak', 'npc-mom', 'npc-marina', 'npc-blitz']) {
      this.load.atlas(key, `${npcBase}/story/${key}.png`, `${npcBase}/story/${key}.json`);
    }

    // Trainer classes (trainers/)
    for (const key of ['generic-trainer', 'npc-ace-trainer', 'npc-ace-trainer-f', 'npc-bug-catcher', 'npc-psychic']) {
      this.load.atlas(key, `${npcBase}/trainers/${key}.png`, `${npcBase}/trainers/${key}.json`);
    }

    // Gym leaders (gym-leaders/)
    for (const key of ['npc-gym-brock', 'npc-gym-blitz', 'npc-gym-ferris', 'npc-gym-coral', 'npc-gym-ivy', 'npc-gym-morwen', 'npc-gym-drake', 'npc-gym-solara', 'npc-gym-giovanni']) {
      this.load.atlas(key, `${npcBase}/gym-leaders/${key}.png`, `${npcBase}/gym-leaders/${key}.json`);
    }

    // Elite Four & Champion (elite-four/)
    for (const key of ['npc-e4-nerida', 'npc-e4-theron', 'npc-e4-lysandra', 'npc-e4-ashborne', 'npc-champion-aldric']) {
      this.load.atlas(key, `${npcBase}/elite-four/${key}.png`, `${npcBase}/elite-four/${key}.json`);
    }

    // Villains (villains/)
    for (const key of ['npc-grunt', 'npc-admin-vex', 'npc-vex']) {
      this.load.atlas(key, `${npcBase}/villains/${key}.png`, `${npcBase}/villains/${key}.json`);
    }
    // UI badge spritesheets
    this.load.spritesheet('type-badges', 'assets/ui/type-badges.png', {
      frameWidth: 32,
      frameHeight: 14,
    });
    this.load.spritesheet('status-badges', 'assets/ui/status-badges.png', {
      frameWidth: 32,
      frameHeight: 14,
    });
    // ── Audio: BGM ──
    for (const key of Object.values(BGM)) {
      this.load.audio(key, `assets/audio/bgm/${key}.wav`);
    }

    // ── Audio: SFX ──
    for (const key of Object.values(SFX)) {
      this.load.audio(key, `assets/audio/sfx/${key}.wav`);
    }
  }

  create(): void {
    // Initialize cry generator with audio context
    const audio = AudioManager.getInstance();
    audio.setScene(this);
    audio.initCryGenerator();

    this.scene.start('TitleScene');
  }
}
