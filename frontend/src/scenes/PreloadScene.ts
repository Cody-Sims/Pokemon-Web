import Phaser from 'phaser';
import { pokemonData } from '@data/pokemon-data';

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
      fontSize: '20px',
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

    // Load Pokemon sprites
    for (const data of Object.values(pokemonData)) {
      const name = data.name.toLowerCase();
      this.load.image(data.spriteKeys.front, `assets/sprites/pokemon/${name}-front.png`);
      this.load.image(data.spriteKeys.back, `assets/sprites/pokemon/${name}-back.png`);
      this.load.image(data.spriteKeys.icon, `assets/sprites/pokemon/${name}-icon.png`);
    }

    // Load tileset
    this.load.image('overworld-tiles', 'assets/tilesets/overworld.png');

    // Load player character atlas
    this.load.atlas('player-walk', 'assets/sprites/player/player-walk.png', 'assets/sprites/player/player-walk.json');

    // Load NPC sprites
    this.load.atlas('rival', 'assets/sprites/npcs/rival.png', 'assets/sprites/npcs/rival.json');
    this.load.atlas('generic-trainer', 'assets/sprites/npcs/generic-trainer.png', 'assets/sprites/npcs/generic-trainer.json');

    // TODO: Load remaining game assets
    // this.load.tilemapTiledJSON('pallet-town', 'assets/maps/pallet-town.json');
  }

  create(): void {
    this.scene.start('TitleScene');
  }
}
