import Phaser from 'phaser';
import { GridMovement } from '@systems/overworld/GridMovement';
import { Direction } from '@utils/type-helpers';
import { TILE_SIZE } from '@utils/constants';

/** Grid-locked player sprite + movement logic. */
export class Player extends Phaser.GameObjects.Sprite {
  public gridMovement: GridMovement;

  constructor(scene: Phaser.Scene, tileX: number, tileY: number, textureKey = 'player-walk') {
    super(scene, tileX * TILE_SIZE + TILE_SIZE / 2, tileY * TILE_SIZE + TILE_SIZE / 2, textureKey);
    scene.add.existing(this);

    this.gridMovement = new GridMovement(scene, this, tileX, tileY);
  }

  move(direction: Direction): boolean {
    return this.gridMovement.move(direction);
  }

  getFacing(): Direction {
    return this.gridMovement.getFacing();
  }

  isMoving(): boolean {
    return this.gridMovement.getIsMoving();
  }

  getTilePosition(): { x: number; y: number } {
    return { x: this.gridMovement.getTileX(), y: this.gridMovement.getTileY() };
  }
}
