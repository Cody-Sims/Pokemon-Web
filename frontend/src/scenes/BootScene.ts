import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Load only the loading bar graphic and bitmap font
    // this.load.image('loading-bar', 'assets/ui/loading-bar.png');
    // this.load.bitmapFont('pokemon-font', 'assets/fonts/pokemon-font.png', 'assets/fonts/pokemon-font.xml');
  }

  create(): void {
    this.scene.start('PreloadScene');
  }
}
