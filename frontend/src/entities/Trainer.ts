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
  /** Per-step collision callback for walkToward, set by OverworldScene after spawning. */
  public collisionCheck?: (x: number, y: number) => boolean;

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
   *  Note: trainers can see through tall grass (matches mainline Pokémon behavior).
   *  Only solid tiles (walls, trees) block line of sight.
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

    // LOW-11: If collision data isn't loaded yet, can't determine LoS
    if (!this.mapGround && !this.npcOccupiedTiles) return false;

    // Check for solid tiles and NPC-occupied tiles between trainer and player
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

    return true;
  }

  /** Walk toward a target tile position using tweens. Returns a promise that resolves when done. */
  walkToward(targetTileX: number, targetTileY: number): Promise<void> {
    return new Promise<void>((resolve) => {
      const myTileX = Math.floor(this.x / TILE_SIZE);
      const myTileY = Math.floor(this.y / TILE_SIZE);

      const distanceToTarget = (tileX: number, tileY: number): number => (
        Math.abs(targetTileX - tileX) + Math.abs(targetTileY - tileY)
      );

      if (distanceToTarget(myTileX, myTileY) <= 1) {
        resolve();
        return;
      }

      const stepDuration = 200;
      const preferredHorizontal = this.facing === 'left' || this.facing === 'right';
      const doStep = () => {
        const currentTX = Math.floor(this.x / TILE_SIZE);
        const currentTY = Math.floor(this.y / TILE_SIZE);
        const currentDistance = distanceToTarget(currentTX, currentTY);
        if (currentDistance <= 1) {
          this.stopWalkAnim();
          resolve();
          return;
        }

        const stepX = Math.sign(targetTileX - currentTX);
        const stepY = Math.sign(targetTileY - currentTY);
        const candidates: { dx: number; dy: number; direction: Direction }[] = [];
        const horizontal = stepX === 0 ? undefined : {
          dx: stepX,
          dy: 0,
          direction: stepX > 0 ? 'right' as Direction : 'left' as Direction,
        };
        const vertical = stepY === 0 ? undefined : {
          dx: 0,
          dy: stepY,
          direction: stepY > 0 ? 'down' as Direction : 'up' as Direction,
        };

        if (preferredHorizontal) {
          if (horizontal) candidates.push(horizontal);
          if (vertical) candidates.push(vertical);
        } else {
          if (vertical) candidates.push(vertical);
          if (horizontal) candidates.push(horizontal);
        }

        const nextStep = candidates.find(candidate => {
          const nextTX = currentTX + candidate.dx;
          const nextTY = currentTY + candidate.dy;
          if (distanceToTarget(nextTX, nextTY) >= currentDistance) return false;
          return !this.collisionCheck?.(nextTX, nextTY);
        });

        if (!nextStep) {
          this.stopWalkAnim();
          resolve();
          return;
        }

        this.faceDirection(nextStep.direction);

        this.playWalkAnim(stepDuration);
        this.scene.tweens.add({
          targets: this,
          x: this.x + nextStep.dx * TILE_SIZE,
          y: this.y + nextStep.dy * TILE_SIZE,
          duration: stepDuration,
          onComplete: () => {
            doStep();
          },
        });
      };
      doStep();
    });
  }
}
