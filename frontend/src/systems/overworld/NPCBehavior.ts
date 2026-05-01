import Phaser from 'phaser';
import { Direction } from '@utils/type-helpers';
import { TILE_SIZE, WALK_DURATION } from '@utils/constants';
import { NPC } from '@entities/NPC';

export type NPCBehaviorType = 'stationary' | 'look-around' | 'wander' | 'pace';

export interface NPCBehaviorConfig {
  type: NPCBehaviorType;
  /** For 'wander': max tiles to wander from origin */
  wanderRadius?: number;
  /** For 'pace': ordered list of directions to pace */
  paceRoute?: Direction[];
  /** Min ms between actions */
  intervalMin?: number;
  /** Max ms between actions */
  intervalMax?: number;
}

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
    this.originX = Math.floor(npc.x / TILE_SIZE);
    this.originY = Math.floor(npc.y / TILE_SIZE);
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
    const currentTX = Math.floor(this.npc.x / TILE_SIZE);
    const currentTY = Math.floor(this.npc.y / TILE_SIZE);

    let targetX = currentTX;
    let targetY = currentTY;
    switch (dir) {
      case 'up':    targetY--; break;
      case 'down':  targetY++; break;
      case 'left':  targetX--; break;
      case 'right': targetX++; break;
    }

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
    this.activeTween = this.scene.tweens.add({
      targets: this.npc,
      x: targetX * TILE_SIZE + TILE_SIZE / 2,
      y: targetY * TILE_SIZE + TILE_SIZE / 2,
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
