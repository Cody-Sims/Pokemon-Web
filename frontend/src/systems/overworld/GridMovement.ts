import Phaser from 'phaser';
import { Direction } from '@utils/type-helpers';
import { WALK_DURATION } from '@utils/constants';
import { directionToDelta, tileCenter, worldToTile } from '@utils/grid-math';

/** Sprite type for GridMovement — must have position and be a valid tween target. */
type GridSprite = Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject & { x: number; y: number };

/** Grid-locked tween movement engine for sprites. */
export class GridMovement {
  private sprite: GridSprite;
  private scene: Phaser.Scene;
  private isMoving = false;
  private tileX: number;
  private tileY: number;
  private facing: Direction = 'down';
  private running = false;
  private cycling = false;

  private collisionCallback?: (tileX: number, tileY: number) => boolean;
  private moveCompleteCallback?: () => void;
  private ledgeCallback?: (tileX: number, tileY: number) => boolean;

  constructor(
    scene: Phaser.Scene,
    sprite: GridSprite,
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

  /** Teleport to a tile and snap the sprite immediately. */
  setTilePosition(x: number, y: number): void {
    this.tileX = x;
    this.tileY = y;
    this.snapToTile();
  }

  getFacing(): Direction { return this.facing; }
  isRunning(): boolean { return this.running; }
  setRunning(running: boolean): void { this.running = running; }
  isCycling(): boolean { return this.cycling; }
  setCycling(cycling: boolean): void { this.cycling = cycling; }

  /** Set a callback that returns true when a tile is a ledge (for hop animation). */
  setLedgeCheck(callback: (tileX: number, tileY: number) => boolean): void {
    this.ledgeCallback = callback;
  }

  /** Set map bounds for boundary validation. */
  private mapWidth = Infinity;
  private mapHeight = Infinity;
  private boundsWarned = false;

  setMapBounds(width: number, height: number): void {
    this.mapWidth = width;
    this.mapHeight = height;
  }

  /** Attempt to move in a direction. Returns true if movement started. */
  move(direction: Direction): boolean {
    if (this.isMoving) return false;

    this.facing = direction;

    // MED-18: Warn once if map bounds haven't been set
    if (this.mapWidth === Infinity && !this.boundsWarned) {
      console.warn('GridMovement: mapWidth not set, call setMapBounds()');
      this.boundsWarned = true;
    }

    const delta = directionToDelta(direction);
    const targetX = this.tileX + delta.tileX;
    const targetY = this.tileY + delta.tileY;

    // AUDIT-052: Check map boundary before collision callback
    if (targetX < 0 || targetY < 0 || targetX >= this.mapWidth || targetY >= this.mapHeight) {
      return false;
    }

    // Check collision
    if (this.collisionCallback && this.collisionCallback(targetX, targetY)) {
      return false;
    }

    this.isMoving = true;
    const finalTileX = targetX;
    const finalTileY = targetY;

    const duration = this.cycling
      ? Math.round(WALK_DURATION * 0.35)
      : this.running ? Math.round(WALK_DURATION * 0.55) : WALK_DURATION;

    const isLedge = this.ledgeCallback?.(targetX, targetY) ?? false;
    const targetPosition = tileCenter(targetX, targetY);
    const targetPxX = targetPosition.x;
    const targetPxY = targetPosition.y;

    if (isLedge) {
      // Hop animation: move horizontally/vertically + arc upward
      const hopDuration = Math.round(WALK_DURATION * 1.2);
      const startY = this.sprite.y;
      this.scene.tweens.add({
        targets: this.sprite,
        x: targetPxX,
        // NEW-004: Only tween x; handle y entirely in onUpdate for parabolic arc
        duration: hopDuration,
        onUpdate: (tween) => {
          // Parabolic arc: raise sprite at midpoint
          const progress = tween.progress;
          const arcHeight = -12 * Math.sin(progress * Math.PI);
          const baseY = Phaser.Math.Linear(startY, targetPxY, progress);
          this.sprite.y = baseY + arcHeight;
        },
        onComplete: () => {
          this.sprite.y = targetPxY;
          this.tileX = finalTileX;
          this.tileY = finalTileY;
          this.isMoving = false;
          this.moveCompleteCallback?.();
        },
        onStop: () => {
          // HIGH-13: If tween is killed externally, snap to nearest tile
          const tilePosition = worldToTile(this.sprite.x, this.sprite.y);
          this.tileX = tilePosition.tileX;
          this.tileY = tilePosition.tileY;
          this.isMoving = false;
          this.snapToTile();
        },
      });
    } else {
      this.scene.tweens.add({
        targets: this.sprite,
        x: targetPxX,
        y: targetPxY,
        duration,
        onComplete: () => {
          this.tileX = finalTileX;
          this.tileY = finalTileY;
          this.isMoving = false;
          this.moveCompleteCallback?.();
        },
        onStop: () => {
          // HIGH-13: If tween is killed externally, snap to nearest tile
          const tilePosition = worldToTile(this.sprite.x, this.sprite.y);
          this.tileX = tilePosition.tileX;
          this.tileY = tilePosition.tileY;
          this.isMoving = false;
          this.snapToTile();
        },
      });
    }

    return true;
  }

  /** Snap sprite to current tile position without tween. */
  snapToTile(): void {
    const snappedPosition = tileCenter(this.tileX, this.tileY);
    this.sprite.x = snappedPosition.x;
    this.sprite.y = snappedPosition.y;
  }
}
