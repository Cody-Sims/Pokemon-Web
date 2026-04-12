import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';

export class TransitionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TransitionScene' });
  }

  init(data: {
    targetScene: string;
    returnScene?: string;
    duration?: number;
    targetData?: Record<string, unknown>;
    returnData?: Record<string, unknown>;
  }): void {
    const duration = data.duration ?? 500;
    const cover = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000);
    cover.setAlpha(0);

    // Fade to black
    this.tweens.add({
      targets: cover,
      alpha: 1,
      duration: duration / 2,
      onComplete: () => {
        // Start target scene, passing through targetData and return info
        this.scene.start(data.targetScene, {
          ...data.targetData,
          _returnScene: data.returnScene,
          _returnData: data.returnData,
        });
      },
    });
  }
}
