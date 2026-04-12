import Phaser from 'phaser';
import { Direction } from '@utils/type-helpers';
import { TILE_SIZE, WALK_DURATION } from '@utils/constants';

/** Grid-locked tween movement engine for sprites. */
export class GridMovement {
  private sprite: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject;
  private scene: Phaser.Scene;
  private isMoving = false;
  private tileX: number;
  private tileY: number;
  private facing: Direction = 'down';

  private collisionCallback?: (tileX: number, tileY: number) => boolean;
  private moveCompleteCallback?: () => void;

  constructor(
    scene: Phaser.Scene,
    sprite: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject,
    startTileX: number,
    startTileY: number
  ) {
    this.scene = scene;
    this.sprite = sprite;
    this.tileX = startTileX;
    this.tileY = startTileY;
  }

  setCollisionCheck(callback: (tileX: number, tileY: number) => boolean): void {
    this.collisionCallback = callback;
  }

  setMoveCompleteCallback(callback: () => void): void {
    this.moveCompleteCallback = callback;
  }

  getIsMoving(): boolean { return this.isMoving; }
  getTileX(): number { return this.tileX; }
  getTileY(): number { return this.tileY; }
  getFacing(): Direction { return this.facing; }

  /** Attempt to move in a direction. Returns true if movement started. */
  move(direction: Direction): boolean {
    if (this.isMoving) return false;

    this.facing = direction;

    let targetX = this.tileX;
    let targetY = this.tileY;

    switch (direction) {
      case 'up':    targetY--; break;
      case 'down':  targetY++; break;
      case 'left':  targetX--; break;
      case 'right': targetX++; break;
    }

    // Check collision
    if (this.collisionCallback && this.collisionCallback(targetX, targetY)) {
      return false;
    }

    this.isMoving = true;
    this.tileX = targetX;
    this.tileY = targetY;

    this.scene.tweens.add({
      targets: this.sprite,
      x: targetX * TILE_SIZE + TILE_SIZE / 2,
      y: targetY * TILE_SIZE + TILE_SIZE / 2,
      duration: WALK_DURATION,
      onComplete: () => {
        this.isMoving = false;
        this.moveCompleteCallback?.();
      },
    });

    return true;
  }

  /** Snap sprite to current tile position without tween. */
  snapToTile(): void {
    (this.sprite as unknown as { x: number; y: number }).x = this.tileX * TILE_SIZE + TILE_SIZE / 2;
    (this.sprite as unknown as { x: number; y: number }).y = this.tileY * TILE_SIZE + TILE_SIZE / 2;
  }
}
