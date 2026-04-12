import Phaser from 'phaser';
import { NPC } from './NPC';
import { Direction } from '@utils/type-helpers';
import { TILE_SIZE } from '@utils/constants';

/** NPC subclass that triggers battle when player enters line of sight. */
export class Trainer extends NPC {
  public trainerId: string;
  public lineOfSight: number; // tiles
  public defeated = false;

  constructor(
    scene: Phaser.Scene,
    tileX: number,
    tileY: number,
    textureKey: string,
    npcId: string,
    trainerId: string,
    dialogue: string[],
    facing: Direction = 'down',
    lineOfSight = 4
  ) {
    super(scene, tileX, tileY, textureKey, npcId, dialogue, facing);
    this.trainerId = trainerId;
    this.lineOfSight = lineOfSight;
  }

  /** Check if a tile position is within this trainer's line of sight. */
  isInLineOfSight(tileX: number, tileY: number): boolean {
    if (this.defeated) return false;

    const myTileX = Math.floor(this.x / TILE_SIZE);
    const myTileY = Math.floor(this.y / TILE_SIZE);

    switch (this.facing) {
      case 'up':
        return tileX === myTileX && tileY < myTileY && tileY >= myTileY - this.lineOfSight;
      case 'down':
        return tileX === myTileX && tileY > myTileY && tileY <= myTileY + this.lineOfSight;
      case 'left':
        return tileY === myTileY && tileX < myTileX && tileX >= myTileX - this.lineOfSight;
      case 'right':
        return tileY === myTileY && tileX > myTileX && tileX <= myTileX + this.lineOfSight;
    }
  }
}
