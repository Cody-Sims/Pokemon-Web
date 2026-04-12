import Phaser from 'phaser';
import { Direction } from '@utils/type-helpers';
import { TILE_SIZE } from '@utils/constants';

/** Base NPC with dialogue and position. */
export class NPC extends Phaser.GameObjects.Sprite {
  public npcId: string;
  public dialogue: string[];
  public facing: Direction;

  constructor(
    scene: Phaser.Scene,
    tileX: number,
    tileY: number,
    textureKey: string,
    npcId: string,
    dialogue: string[],
    facing: Direction = 'down'
  ) {
    super(scene, tileX * TILE_SIZE + TILE_SIZE / 2, tileY * TILE_SIZE + TILE_SIZE / 2, textureKey);
    scene.add.existing(this);

    this.npcId = npcId;
    this.dialogue = dialogue;
    this.facing = facing;
  }

  /** Turn to face a direction (e.g., face the player during dialogue). */
  faceDirection(dir: Direction): void {
    this.facing = dir;
    // TODO: Update animation frame based on direction
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
}
