import Phaser from 'phaser';
import { Direction } from '@utils/type-helpers';
import { TILE_SIZE } from '@utils/constants';

/** Base NPC with dialogue and position. */
export class NPC extends Phaser.GameObjects.Sprite {
  public npcId: string;
  public dialogue: string[];
  public facing: Direction;
  private walkAnimEvent?: Phaser.Time.TimerEvent;

  constructor(
    scene: Phaser.Scene,
    tileX: number,
    tileY: number,
    textureKey: string,
    npcId: string,
    dialogue: string[],
    facing: Direction = 'down'
  ) {
    const frameDir = facing === 'left' ? 'right' : facing;
    super(scene, tileX * TILE_SIZE + TILE_SIZE / 2, tileY * TILE_SIZE + TILE_SIZE / 2, textureKey, `walk-${frameDir}-1`);
    scene.add.existing(this);

    this.npcId = npcId;
    this.dialogue = dialogue;
    this.facing = facing;
    if (facing === 'left') this.setFlipX(true);
  }

  /** Turn to face a direction (e.g., face the player during dialogue). */
  faceDirection(dir: Direction): void {
    this.facing = dir;
    this.setDirectionFrame(dir);
  }

  /** Set the sprite frame matching a cardinal direction. */
  private setDirectionFrame(dir: Direction): void {
    const frameDir = dir === 'left' ? 'right' : dir;
    const frame = `walk-${frameDir}-1`;
    this.setFlipX(dir === 'left');
    if (this.scene.textures.exists(this.texture.key)) {
      const tex = this.scene.textures.get(this.texture.key);
      if (tex.has(frame)) {
        this.setFrame(frame);
      }
    }
  }

  /** Start a walk animation cycle (frames 0→1→2→1) for the current facing direction. */
  playWalkAnim(duration: number): void {
    this.stopWalkAnim();
    const frameDir = this.facing === 'left' ? 'right' : this.facing;
    const tex = this.scene.textures.exists(this.texture.key)
      ? this.scene.textures.get(this.texture.key)
      : null;
    // 4-frame cycle: step-left(0), stand(1), step-right(2), stand(3)
    const cycle = [0, 1, 2, 1];
    let idx = 0;
    const interval = duration / cycle.length;
    this.walkAnimEvent = this.scene.time.addEvent({
      delay: interval,
      repeat: cycle.length - 1,
      callback: () => {
        const frame = `walk-${frameDir}-${cycle[idx]}`;
        if (tex && tex.has(frame)) {
          this.setFrame(frame);
        }
        idx++;
      },
    });
    // Show first step frame immediately
    const firstFrame = `walk-${frameDir}-${cycle[0]}`;
    if (tex && tex.has(firstFrame)) {
      this.setFrame(firstFrame);
    }
  }

  /** Stop walk animation and return to idle (standing) frame. */
  stopWalkAnim(): void {
    if (this.walkAnimEvent) {
      this.walkAnimEvent.destroy();
      this.walkAnimEvent = undefined;
    }
    this.setDirectionFrame(this.facing);
  }

  /** Get the opposite direction for face-to-face interaction. */
  static getOpposite(dir: Direction): Direction {
    switch (dir) {
      case 'up': return 'down';
      case 'down': return 'up';
      case 'left': return 'right';
      case 'right': return 'left';
    }
  }

  /** BUG-094: Clear collision references on destroy to prevent stale callbacks. */
  preDestroy(): void {
    this.stopWalkAnim();
    if (this.body && 'enable' in this.body) {
      (this.body as Phaser.Physics.Arcade.Body).enable = false;
    }
  }
}
