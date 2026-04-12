import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';

export class InventoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InventoryScene' });
  }

  create(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 80, GAME_HEIGHT - 80, 0x222244, 0.95)
      .setStrokeStyle(2, 0xffffff);

    this.add.text(GAME_WIDTH / 2, 60, 'BAG', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);

    // Category tabs
    const categories = ['Medicine', 'Poke Balls', 'Key Items', 'TMs'];
    categories.forEach((cat, i) => {
      this.add.text(80 + i * 170, 100, cat, { fontSize: '16px', color: '#aaaaaa' });
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'No items yet', {
      fontSize: '18px',
      color: '#888888',
    }).setOrigin(0.5);

    const closeBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'Close (ESC)', {
      fontSize: '16px',
      color: '#888888',
      backgroundColor: '#333333',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setColor('#ffcc00'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#888888'));
    closeBtn.on('pointerdown', () => this.scene.stop());

    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.stop();
    });
  }
}
