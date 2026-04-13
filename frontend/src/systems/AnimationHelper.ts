import Phaser from 'phaser';
import { WALK_DURATION } from '@utils/constants';

/** Helper to register shared sprite animations. */
export class AnimationHelper {
  /** Register player walk animations from a texture atlas. */
  static registerPlayerAnimations(scene: Phaser.Scene): void {
    // Only create animations for down/up/left — right is handled by flipping left
    const directions = ['down', 'up', 'left'];
    for (const dir of directions) {
      scene.anims.create({
        key: `player-walk-${dir}`,
        frames: scene.anims.generateFrameNames('player-walk', {
          prefix: `walk-${dir}-`,
          start: 0,
          end: 3,
        }),
        duration: WALK_DURATION,
        repeat: 0,
      });

      scene.anims.create({
        key: `player-idle-${dir}`,
        frames: [{ key: 'player-walk', frame: `walk-${dir}-0` }],
        frameRate: 1,
      });
    }
  }
}
