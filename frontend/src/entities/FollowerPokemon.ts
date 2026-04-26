import Phaser from 'phaser';
import { TILE_SIZE } from '@utils/constants';

/**
 * A Pokemon follower sprite that trails behind the player on the overworld.
 * Uses the Pokemon's icon sprite (68x56, static) scaled to fit the tile grid.
 * Follows the player with a 1-tile delay using a position history queue.
 */
export class FollowerPokemon extends Phaser.GameObjects.Image {
  private gridX: number;
  private gridY: number;
  private moving = false;

  constructor(scene: Phaser.Scene, tileX: number, tileY: number, textureKey: string) {
    const px = tileX * TILE_SIZE + TILE_SIZE / 2;
    const py = tileY * TILE_SIZE + TILE_SIZE / 2;
    super(scene, px, py, textureKey);

    this.gridX = tileX;
    this.gridY = tileY;

    // Scale the icon (68x56) to roughly match the 32px tile
    const iconScale = TILE_SIZE / 56;
    this.setScale(iconScale);
    this.setDepth(py);
    this.setAlpha(0.92);

    scene.add.existing(this);
  }

  /** Move the follower to a new grid position with a smooth tween. */
  moveTo(tileX: number, tileY: number, duration = 180): void {
    if (this.moving) return;
    if (tileX === this.gridX && tileY === this.gridY) return;

    this.moving = true;
    const targetPx = tileX * TILE_SIZE + TILE_SIZE / 2;
    const targetPy = tileY * TILE_SIZE + TILE_SIZE / 2;

    this.scene.tweens.add({
      targets: this,
      x: targetPx,
      y: targetPy,
      duration,
      ease: 'Linear',
      onUpdate: () => {
        // Update depth for y-sorting while moving
        this.setDepth(this.y);
      },
      onComplete: () => {
        this.gridX = tileX;
        this.gridY = tileY;
        this.setDepth(this.y);
        this.moving = false;
      },
    });
  }

  /** Update the follower's texture when lead Pokemon changes. */
  updateTexture(textureKey: string): void {
    this.setTexture(textureKey);
  }

  /** Hide follower (e.g., during surfing, battles, interiors). */
  hideFollower(): void {
    this.setVisible(false);
  }

  /** Show follower. */
  showFollower(): void {
    this.setVisible(true);
  }

  getGridX(): number { return this.gridX; }
  getGridY(): number { return this.gridY; }
  isMoving(): boolean { return this.moving; }
}
