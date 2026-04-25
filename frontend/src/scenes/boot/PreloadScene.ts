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

    // Load NPC sprites
    this.load.atlas('rival', 'assets/sprites/npcs/rival.png', 'assets/sprites/npcs/rival.json');
    this.load.atlas('generic-trainer', 'assets/sprites/npcs/generic-trainer.png', 'assets/sprites/npcs/generic-trainer.json');

    // Distinct NPC character sprites
    const npcSprites = [
      'npc-mom', 'npc-nurse', 'npc-female-1', 'npc-female-2', 'npc-female-3',
      'npc-female-4', 'npc-lass', 'npc-female-5', 'npc-female-6', 'npc-female-7',
      'npc-female-8', 'npc-female-9',
      'npc-male-1', 'npc-oldman', 'npc-male-2', 'npc-hiker', 'npc-male-3',
      'npc-professor', 'npc-scientist', 'npc-male-4', 'npc-swimmer', 'npc-male-5',
      'npc-sailor', 'npc-male-6',
      'npc-bug-catcher', 'npc-ace-trainer', 'npc-ace-trainer-f',
      'npc-grunt', 'npc-marina', 'npc-psychic',
      'npc-gym-brock', 'npc-gym-blitz', 'npc-gym-ferris', 'npc-admin-vex',
      'npc-gym-coral', 'npc-gym-ivy', 'npc-gym-morwen', 'npc-gym-drake',
      'npc-gym-solara', 'npc-gym-giovanni',
      'npc-oak',
    ];
    for (const key of npcSprites) {
      this.load.atlas(key, `assets/sprites/npcs/${key}.png`, `assets/sprites/npcs/${key}.json`);
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
