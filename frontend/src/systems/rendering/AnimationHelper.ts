import Phaser from 'phaser';

/** Helper to register shared sprite animations. */
export class AnimationHelper {
  /** Register player walk animations from a texture atlas. */
  static registerPlayerAnimations(scene: Phaser.Scene): void {
    const directions = ['down', 'up', 'left', 'right'];
    for (const dir of directions) {
      scene.anims.create({
        key: `player-walk-${dir}`,
        frames: scene.anims.generateFrameNames('player-walk', {
          prefix: `walk-${dir}-`,
          start: 0,
          end: 2,
        }),
        frameRate: 6,
        repeat: -1,
      });

      scene.anims.create({
        key: `player-idle-${dir}`,
        frames: [{ key: 'player-walk', frame: `walk-${dir}-0` }],
        frameRate: 1,
      });
    }

    // Female player animations (using player-walk-female atlas)
    if (scene.textures.exists('player-walk-female')) {
      for (const dir of directions) {
        scene.anims.create({
          key: `player-girl-walk-${dir}`,
          frames: scene.anims.generateFrameNames('player-walk-female', {
            prefix: `walk-${dir}-`,
            start: 0,
            end: 2,
          }),
          frameRate: 6,
          repeat: -1,
        });

        scene.anims.create({
          key: `player-girl-idle-${dir}`,
          frames: [{ key: 'player-walk-female', frame: `walk-${dir}-0` }],
          frameRate: 1,
        });
      }
    }
  }
}
