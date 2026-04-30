import Phaser from 'phaser';
import { NPC } from './NPC';
import { Direction } from '@utils/type-helpers';
import { TILE_SIZE } from '@utils/constants';
import { SOLID_TILES } from '@data/maps';

/** NPC subclass that triggers battle when player enters line of sight. */
export class Trainer extends NPC {
  public trainerId: string;
  public lineOfSight: number; // tiles
  public defeated = false;
  /** Reference to the map ground grid, set by OverworldScene after spawning. */
  public mapGround: number[][] | null = null;
  /** NPC-occupied tile keys (\"x,y\" format), set by OverworldScene after spawning. */
  public npcOccupiedTiles: Set<string> | null = null;

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

  /** Check if a tile position is within this trainer's line of sight.
   *  Respects solid tiles — a wall between trainer and player blocks vision.
   */
  isInLineOfSight(tileX: number, tileY: number): boolean {
    if (this.defeated) return false;

    const myTileX = Math.floor(this.x / TILE_SIZE);
    const myTileY = Math.floor(this.y / TILE_SIZE);

    let inRange = false;
    switch (this.facing) {
      case 'up':
        inRange = tileX === myTileX && tileY < myTileY && tileY >= myTileY - this.lineOfSight;
        break;
      case 'down':
        inRange = tileX === myTileX && tileY > myTileY && tileY <= myTileY + this.lineOfSight;
        break;
      case 'left':
        inRange = tileY === myTileY && tileX < myTileX && tileX >= myTileX - this.lineOfSight;
        break;
      case 'right':
        inRange = tileY === myTileY && tileX > myTileX && tileX <= myTileX + this.lineOfSight;
        break;
    }
    if (!inRange) return false;

    // Check for solid tiles and NPC-occupied tiles between trainer and player
    if (this.mapGround || this.npcOccupiedTiles) {
      const dx = Math.sign(tileX - myTileX);
      const dy = Math.sign(tileY - myTileY);
      let cx = myTileX + dx;
      let cy = myTileY + dy;
      while (cx !== tileX || cy !== tileY) {
        if (this.mapGround) {
          const tile = this.mapGround[cy]?.[cx];
          if (tile !== undefined && SOLID_TILES.has(tile)) return false;
        }
        if (this.npcOccupiedTiles?.has(`${cx},${cy}`)) return false;
        cx += dx;
        cy += dy;
      }
    }

    return true;
  }

  /** Walk toward a target tile position using tweens. Returns a promise that resolves when done. */
  walkToward(targetTileX: number, targetTileY: number): Promise<void> {
    return new Promise<void>((resolve) => {
      const myTileX = Math.floor(this.x / TILE_SIZE);
      const myTileY = Math.floor(this.y / TILE_SIZE);

      // Calculate how many steps to walk (stop 1 tile away from target)
      const dx = targetTileX - myTileX;
      const dy = targetTileY - myTileY;
      const stepsX = Math.abs(dx) > 0 ? Math.abs(dx) - 1 : 0;
      const stepsY = Math.abs(dy) > 0 ? Math.abs(dy) - 1 : 0;
      const totalSteps = stepsX + stepsY;

      if (totalSteps <= 0) {
        resolve();
        return;
      }

      // Walk step by step using chained tweens
      const stepDirX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
      const stepDirY = dy > 0 ? 1 : dy < 0 ? -1 : 0;

      // Walk along the facing direction only (trainer faces one direction)
      const pixelStepX = stepDirX * TILE_SIZE;
      const pixelStepY = stepDirY * TILE_SIZE;
      const steps = this.facing === 'left' || this.facing === 'right' ? stepsX : stepsY;

      if (steps <= 0) {
        resolve();
        return;
      }

      let completed = 0;
      const stepDuration = 200;
      const doStep = () => {
        this.playWalkAnim(stepDuration);
        this.scene.tweens.add({
          targets: this,
          x: this.x + (this.facing === 'left' || this.facing === 'right' ? pixelStepX : 0),
          y: this.y + (this.facing === 'up' || this.facing === 'down' ? pixelStepY : 0),
          duration: stepDuration,
          onComplete: () => {
            completed++;
            if (completed < steps) {
              doStep();
            } else {
              this.stopWalkAnim();
              resolve();
            }
          },
        });
      };
      doStep();
    });
  }
}
