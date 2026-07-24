import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => {
  class Sprite {
    public body?: unknown;
    public texture: { key: string };

    constructor(
      public scene: unknown,
      public x: number,
      public y: number,
      textureKey: string,
    ) {
      this.texture = { key: textureKey };
    }

    setFlipX(): this { return this; }
    setFrame(): this { return this; }
  }

  return {
    default: {
      GameObjects: { Sprite },
      Math: { Linear: (start: number, end: number, amount: number) => start + (end - start) * amount },
    },
  };
});

import { NPC } from '../../../frontend/src/entities/NPC';
import { Trainer } from '../../../frontend/src/entities/Trainer';
import { GridMovement } from '../../../frontend/src/systems/overworld/GridMovement';
import { TILE_SIZE, WALK_DURATION } from '../../../frontend/src/utils/constants';
import type { Direction } from '../../../frontend/src/utils/type-helpers';

interface TweenConfig {
  x?: number;
  y?: number;
  duration: number;
  onComplete?: () => void;
  onStop?: () => void;
}

function createMovement() {
  let lastTween: TweenConfig | null = null;
  const scene = {
    tweens: {
      add: vi.fn((config: TweenConfig) => {
        lastTween = config;
        return config;
      }),
    },
  };
  const sprite = { x: 5 * TILE_SIZE + TILE_SIZE / 2, y: 5 * TILE_SIZE + TILE_SIZE / 2 };
  const movement = new GridMovement(scene as never, sprite as never, 5, 5);
  movement.setMapBounds(20, 20);

  return {
    movement,
    sprite,
    scene,
    completeTween: () => {
      if (!lastTween?.onComplete) throw new Error('Expected a pending tween');
      lastTween.onComplete();
    },
    stopTween: () => {
      if (!lastTween?.onStop) throw new Error('Expected a pending tween');
      lastTween.onStop();
    },
    getLastTween: () => lastTween,
  };
}

function createTrainer(facing: Direction, defeated = false): Trainer {
  return Object.assign(Object.create(Trainer.prototype), {
    x: 5 * TILE_SIZE + TILE_SIZE / 2,
    y: 5 * TILE_SIZE + TILE_SIZE / 2,
    facing,
    lineOfSight: 4,
    defeated,
    mapGround: Array.from({ length: 12 }, () => Array(12).fill(0)),
    npcOccupiedTiles: new Set<string>(),
  }) as Trainer;
}

describe('GridMovement', () => {
  let harness: ReturnType<typeof createMovement>;

  beforeEach(() => {
    harness = createMovement();
  });

  it.each([
    ['up', 5, 4],
    ['down', 5, 6],
    ['left', 4, 5],
    ['right', 6, 5],
  ] as [Direction, number, number][])('moves %s after the tween completes', (direction, tileX, tileY) => {
    expect(harness.movement.move(direction)).toBe(true);
    expect(harness.movement.getIsMoving()).toBe(true);
    expect(harness.movement.getTileX()).toBe(5);
    expect(harness.movement.getTileY()).toBe(5);

    harness.completeTween();

    expect(harness.movement.getTileX()).toBe(tileX);
    expect(harness.movement.getTileY()).toBe(tileY);
    expect(harness.movement.getFacing()).toBe(direction);
    expect(harness.movement.getIsMoving()).toBe(false);
  });

  it('does not move into blocked tiles but still updates facing', () => {
    harness.movement.setCollisionCheck((tileX, tileY) => tileX === 5 && tileY === 4);

    expect(harness.movement.move('up')).toBe(false);

    expect(harness.movement.getFacing()).toBe('up');
    expect(harness.movement.getTileX()).toBe(5);
    expect(harness.movement.getTileY()).toBe(5);
    expect(harness.scene.tweens.add).not.toHaveBeenCalled();
  });

  it('checks map bounds before collision callbacks', () => {
    const collision = vi.fn(() => false);
    harness.movement.setTilePosition(0, 5);
    harness.movement.setCollisionCheck(collision);

    expect(harness.movement.move('left')).toBe(false);

    expect(collision).not.toHaveBeenCalled();
    expect(harness.movement.getTileX()).toBe(0);
  });

  it('locks movement until the current tween completes', () => {
    expect(harness.movement.move('up')).toBe(true);
    expect(harness.movement.move('left')).toBe(false);
    expect(harness.movement.getFacing()).toBe('up');

    harness.completeTween();

    expect(harness.movement.move('left')).toBe(true);
  });

  it('uses faster tween durations when running or cycling', () => {
    harness.movement.setRunning(true);
    harness.movement.move('right');
    expect(harness.getLastTween()?.duration).toBe(Math.round(WALK_DURATION * 0.55));
    harness.completeTween();

    harness.movement.setCycling(true);
    harness.movement.move('right');
    expect(harness.getLastTween()?.duration).toBe(Math.round(WALK_DURATION * 0.35));
  });

  it('snaps to the nearest tile if a tween is stopped externally', () => {
    harness.movement.move('right');
    harness.sprite.x = 7 * TILE_SIZE + TILE_SIZE / 2;
    harness.sprite.y = 5 * TILE_SIZE + TILE_SIZE / 2;

    harness.stopTween();

    expect(harness.movement.getIsMoving()).toBe(false);
    expect(harness.movement.getTileX()).toBe(7);
    expect(harness.movement.getTileY()).toBe(5);
    expect(harness.sprite.x).toBe(7 * TILE_SIZE + TILE_SIZE / 2);
  });
});

describe('Trainer line of sight', () => {
  it('detects players in front within range using the real Trainer method', () => {
    const trainer = createTrainer('down');

    expect(trainer.isInLineOfSight(5, 6)).toBe(true);
    expect(trainer.isInLineOfSight(5, 9)).toBe(true);
    expect(trainer.isInLineOfSight(5, 10)).toBe(false);
  });

  it('does not detect players behind, to the side, on the same tile, or after defeat', () => {
    expect(createTrainer('down').isInLineOfSight(5, 4)).toBe(false);
    expect(createTrainer('down').isInLineOfSight(4, 7)).toBe(false);
    expect(createTrainer('down').isInLineOfSight(5, 5)).toBe(false);
    expect(createTrainer('down', true).isInLineOfSight(5, 6)).toBe(false);
  });

  it.each([
    ['up', 5, 3],
    ['down', 5, 7],
    ['left', 3, 5],
    ['right', 7, 5],
  ] as [Direction, number, number][])('detects line of sight while facing %s', (facing, tileX, tileY) => {
    expect(createTrainer(facing).isInLineOfSight(tileX, tileY)).toBe(true);
  });

  it('blocks line of sight through occupied tiles', () => {
    const trainer = createTrainer('down');
    trainer.npcOccupiedTiles = new Set(['5,6']);

    expect(trainer.isInLineOfSight(5, 7)).toBe(false);
  });
});

describe('NPC.getOpposite', () => {
  it.each([
    ['up', 'down'],
    ['down', 'up'],
    ['left', 'right'],
    ['right', 'left'],
  ] as [Direction, Direction][])('opposite of %s is %s', (input, expected) => {
    expect(NPC.getOpposite(input)).toBe(expected);
  });
});
