import Phaser from 'phaser';
import { Direction } from '@utils/type-helpers';
import { WALK_DURATION } from '@utils/constants';
import { directionToDelta, tileCenter, worldToTile } from '@utils/grid-math';
import { NPC } from '@entities/NPC';
import type { NPCBehaviorConfig } from '@data/maps';

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

export class NPCBehaviorController {
  private npc: NPC;
  private config: NPCBehaviorConfig;
  private scene: Phaser.Scene;
  private collisionCheck: (tx: number, ty: number) => boolean;

  private timer = 0;
  private nextActionAt: number;
  private isMoving = false;
  private activeTween?: Phaser.Tweens.Tween;

  // Origin tile for wander radius
  private originX: number;
  private originY: number;

  // Pace index
  private paceIndex = 0;

  constructor(
    scene: Phaser.Scene,
    npc: NPC,
    config: NPCBehaviorConfig,
    collisionCheck: (tx: number, ty: number) => boolean,
  ) {
    this.scene = scene;
    this.npc = npc;
    this.config = config;
    this.collisionCheck = collisionCheck;
    const originTile = worldToTile(npc.x, npc.y);
    this.originX = originTile.tileX;
    this.originY = originTile.tileY;
    this.nextActionAt = this.randomInterval();
  }

  update(delta: number): void {
    if (this.config.type === 'stationary') return;
    if (this.isMoving) return;

    this.timer += delta;
    if (this.timer < this.nextActionAt) return;

    this.timer = 0;
    this.nextActionAt = this.randomInterval();

    switch (this.config.type) {
      case 'look-around':
        this.doLookAround();
        break;
      case 'wander':
        this.doWander();
        break;
      case 'pace':
        this.doPace();
        break;
    }
  }

  private randomInterval(): number {
    const min = this.config.intervalMin ?? this.defaultMin();
    const max = this.config.intervalMax ?? this.defaultMax();
    return min + Math.random() * (max - min);
  }

  private defaultMin(): number {
    switch (this.config.type) {
      case 'look-around': return 2000;
      case 'wander': return 3000;
      case 'pace': return 2000;
      default: return 2000;
    }
  }

  private defaultMax(): number {
    switch (this.config.type) {
      case 'look-around': return 5000;
      case 'wander': return 8000;
      case 'pace': return 2000;
      default: return 5000;
    }
  }

  private doLookAround(): void {
    const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    this.npc.faceDirection(dir);
  }

  private doWander(): void {
    const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    this.tryMove(dir);
  }

  private doPace(): void {
    const route = this.config.paceRoute;
    if (!route || route.length === 0) return;
    const dir = route[this.paceIndex % route.length];
    this.paceIndex++;
    this.tryMove(dir);
  }

  private tryMove(dir: Direction): void {
    const currentTile = worldToTile(this.npc.x, this.npc.y);
    const delta = directionToDelta(dir);
    const targetX = currentTile.tileX + delta.tileX;
    const targetY = currentTile.tileY + delta.tileY;

    // Face direction regardless of whether we can move
    this.npc.faceDirection(dir);

    // Check wander radius
    if (this.config.type === 'wander' && this.config.wanderRadius !== undefined) {
      const dx = Math.abs(targetX - this.originX);
      const dy = Math.abs(targetY - this.originY);
      if (dx > this.config.wanderRadius || dy > this.config.wanderRadius) return;
    }

    // Check collision
    if (this.collisionCheck(targetX, targetY)) return;

    // Tween the NPC one tile
    this.isMoving = true;
    this.npc.playWalkAnim(WALK_DURATION);
    const targetPosition = tileCenter(targetX, targetY);
    this.activeTween = this.scene.tweens.add({
      targets: this.npc,
      x: targetPosition.x,
      y: targetPosition.y,
      duration: WALK_DURATION,
      onComplete: () => {
        this.npc.stopWalkAnim();
        this.isMoving = false;
        this.activeTween = undefined;
      },
    });
  }

  destroy(): void {
    if (this.activeTween) {
      this.activeTween.destroy();
      this.activeTween = undefined;
    }
    this.isMoving = false;
  }
}
