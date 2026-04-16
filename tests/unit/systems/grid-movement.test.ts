import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Direction } from '../../../frontend/src/utils/type-helpers';
import { TILE_SIZE } from '../../../frontend/src/utils/constants';

/**
 * Tests GridMovement logic without Phaser rendering.
 * Validates collision checks, facing, and movement state.
 */

interface MockGridState {
  tileX: number;
  tileY: number;
  facing: Direction;
  isMoving: boolean;
}

/** Pure-logic simulation of GridMovement.move() */
function tryMove(
  state: MockGridState,
  direction: Direction,
  isBlocked: (tx: number, ty: number) => boolean,
): boolean {
  if (state.isMoving) return false;

  state.facing = direction;

  let targetX = state.tileX;
  let targetY = state.tileY;

  switch (direction) {
    case 'up':    targetY--; break;
    case 'down':  targetY++; break;
    case 'left':  targetX--; break;
    case 'right': targetX++; break;
  }

  if (isBlocked(targetX, targetY)) return false;

  state.isMoving = true;
  state.tileX = targetX;
  state.tileY = targetY;
  return true;
}

describe('GridMovement — Pure Logic', () => {
  let state: MockGridState;

  beforeEach(() => {
    state = { tileX: 5, tileY: 5, facing: 'down', isMoving: false };
  });

  const noCollision = () => false;

  describe('basic movement', () => {
    it('should move up', () => {
      expect(tryMove(state, 'up', noCollision)).toBe(true);
      expect(state.tileY).toBe(4);
      expect(state.facing).toBe('up');
    });

    it('should move down', () => {
      expect(tryMove(state, 'down', noCollision)).toBe(true);
      expect(state.tileY).toBe(6);
    });

    it('should move left', () => {
      expect(tryMove(state, 'left', noCollision)).toBe(true);
      expect(state.tileX).toBe(4);
    });

    it('should move right', () => {
      expect(tryMove(state, 'right', noCollision)).toBe(true);
      expect(state.tileX).toBe(6);
    });
  });

  describe('collision blocking', () => {
    it('should not move into blocked tile', () => {
      const blocked = (tx: number, ty: number) => tx === 5 && ty === 4; // Up is blocked
      expect(tryMove(state, 'up', blocked)).toBe(false);
      expect(state.tileX).toBe(5);
      expect(state.tileY).toBe(5); // Didn't move
    });

    it('should still update facing when blocked', () => {
      const blocked = () => true;
      tryMove(state, 'left', blocked);
      expect(state.facing).toBe('left'); // Facing updated even though blocked
      expect(state.tileX).toBe(5); // Position unchanged
    });

    it('should block out-of-bounds movement', () => {
      state.tileX = 0;
      const oob = (tx: number, ty: number) => tx < 0 || ty < 0;
      expect(tryMove(state, 'left', oob)).toBe(false);
    });
  });

  describe('movement locking', () => {
    it('should not allow movement while already moving', () => {
      state.isMoving = true;
      expect(tryMove(state, 'up', noCollision)).toBe(false);
      expect(state.tileY).toBe(5); // Didn't move
    });

    it('should allow movement after tween completes (isMoving reset)', () => {
      tryMove(state, 'up', noCollision);
      expect(state.isMoving).toBe(true);

      // Simulate tween completion
      state.isMoving = false;

      expect(tryMove(state, 'left', noCollision)).toBe(true);
      expect(state.tileX).toBe(4);
    });
  });

  describe('multi-step paths', () => {
    it('should traverse a path correctly', () => {
      const path: Direction[] = ['up', 'up', 'right', 'right', 'down'];
      for (const dir of path) {
        state.isMoving = false; // Simulate tween completion
        tryMove(state, dir, noCollision);
      }
      // Start: (5,5) → up(5,4) → up(5,3) → right(6,3) → right(7,3) → down(7,4)
      expect(state.tileX).toBe(7);
      expect(state.tileY).toBe(4);
    });
  });

  describe('NPC collision', () => {
    it('should block movement into NPC tile', () => {
      const npcPositions = [{ x: 5, y: 4 }, { x: 6, y: 5 }];
      const hasNpc = (tx: number, ty: number) => npcPositions.some(n => n.x === tx && n.y === ty);

      expect(tryMove(state, 'up', hasNpc)).toBe(false); // NPC at (5,4)
      expect(tryMove(state, 'right', hasNpc)).toBe(false); // NPC at (6,5)
      state.isMoving = false;
      expect(tryMove(state, 'down', hasNpc)).toBe(true); // No NPC at (5,6)
    });
  });
});

describe('Trainer Line-of-Sight', () => {
  interface TrainerState {
    tileX: number;
    tileY: number;
    facing: Direction;
    lineOfSight: number;
    defeated: boolean;
  }

  function isInLineOfSight(trainer: TrainerState, playerX: number, playerY: number): boolean {
    if (trainer.defeated) return false;
    const { tileX, tileY, facing, lineOfSight } = trainer;

    switch (facing) {
      case 'up':
        return playerX === tileX && playerY < tileY && playerY >= tileY - lineOfSight;
      case 'down':
        return playerX === tileX && playerY > tileY && playerY <= tileY + lineOfSight;
      case 'left':
        return playerY === tileY && playerX < tileX && playerX >= tileX - lineOfSight;
      case 'right':
        return playerY === tileY && playerX > tileX && playerX <= tileX + lineOfSight;
    }
  }

  it('should detect player in front within range', () => {
    const trainer: TrainerState = { tileX: 5, tileY: 5, facing: 'down', lineOfSight: 4, defeated: false };
    expect(isInLineOfSight(trainer, 5, 6)).toBe(true);
    expect(isInLineOfSight(trainer, 5, 9)).toBe(true);  // Edge of range
    expect(isInLineOfSight(trainer, 5, 10)).toBe(false); // Out of range
  });

  it('should not detect player behind', () => {
    const trainer: TrainerState = { tileX: 5, tileY: 5, facing: 'down', lineOfSight: 4, defeated: false };
    expect(isInLineOfSight(trainer, 5, 4)).toBe(false);
  });

  it('should not detect player to the side', () => {
    const trainer: TrainerState = { tileX: 5, tileY: 5, facing: 'down', lineOfSight: 4, defeated: false };
    expect(isInLineOfSight(trainer, 4, 7)).toBe(false);
  });

  it('should not detect player when defeated', () => {
    const trainer: TrainerState = { tileX: 5, tileY: 5, facing: 'down', lineOfSight: 4, defeated: true };
    expect(isInLineOfSight(trainer, 5, 6)).toBe(false);
  });

  it('all 4 facing directions should work', () => {
    expect(isInLineOfSight({ tileX: 5, tileY: 5, facing: 'up', lineOfSight: 3, defeated: false }, 5, 3)).toBe(true);
    expect(isInLineOfSight({ tileX: 5, tileY: 5, facing: 'down', lineOfSight: 3, defeated: false }, 5, 7)).toBe(true);
    expect(isInLineOfSight({ tileX: 5, tileY: 5, facing: 'left', lineOfSight: 3, defeated: false }, 3, 5)).toBe(true);
    expect(isInLineOfSight({ tileX: 5, tileY: 5, facing: 'right', lineOfSight: 3, defeated: false }, 7, 5)).toBe(true);
  });

  it('player on same tile should not be in LoS', () => {
    const trainer: TrainerState = { tileX: 5, tileY: 5, facing: 'down', lineOfSight: 4, defeated: false };
    expect(isInLineOfSight(trainer, 5, 5)).toBe(false);
  });
});

describe('NPC Facing — Opposite Direction', () => {
  function getOpposite(dir: Direction): Direction {
    switch (dir) {
      case 'up': return 'down';
      case 'down': return 'up';
      case 'left': return 'right';
      case 'right': return 'left';
    }
  }

  it.each([
    ['up', 'down'],
    ['down', 'up'],
    ['left', 'right'],
    ['right', 'left'],
  ] as [Direction, Direction][])('opposite of %s is %s', (input, expected) => {
    expect(getOpposite(input)).toBe(expected);
  });
});
