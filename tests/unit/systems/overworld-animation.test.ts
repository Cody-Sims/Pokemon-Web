import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Direction } from '../../../frontend/src/utils/type-helpers';

/**
 * Tests the OverworldScene animation logic extracted from the update() loop.
 * Verifies that animation keys don't thrash (causing rotation bugs) and
 * that input gating works correctly.
 */

// ── Extracted animation state machine from OverworldScene.update() ──

interface AnimState {
  lastAnimKey: string;
  lastFlipX: boolean;
  transitioning: boolean;
  isMoving: boolean;
}

/** Determines which animation to play given the input state. Returns null if no change needed. */
function resolveAnimation(
  state: AnimState,
  direction: Direction | null,
  facing: Direction,
): { key: string; flipX: boolean } | null {
  if (state.transitioning) return null;
  if (state.isMoving) return null;

  if (!direction) {
    // Idle — should play idle animation for current facing
    const animDir = facing === 'right' ? 'left' : facing;
    const key = `player-idle-${animDir}`;
    const flipX = facing === 'right';
    if (key === state.lastAnimKey && flipX === state.lastFlipX) return null;
    return { key, flipX };
  }

  // Walking
  const animDir = direction === 'right' ? 'left' : direction;
  const flipX = direction === 'right';
  const key = `player-walk-${animDir}`;
  if (key === state.lastAnimKey && flipX === state.lastFlipX) return null;
  return { key, flipX };
}

describe('OverworldScene — Animation State Machine', () => {
  describe('idle animation stability', () => {
    it('should not change animation when already idle in same direction', () => {
      const state: AnimState = { lastAnimKey: 'player-idle-down', lastFlipX: false, transitioning: false, isMoving: false };
      const result = resolveAnimation(state, null, 'down');
      expect(result).toBeNull(); // No change needed — prevents thrashing
    });

    it('should not change animation when idle facing right (flipX already set)', () => {
      const state: AnimState = { lastAnimKey: 'player-idle-left', lastFlipX: true, transitioning: false, isMoving: false };
      const result = resolveAnimation(state, null, 'right');
      expect(result).toBeNull();
    });

    it('should change animation when facing direction changes while idle', () => {
      const state: AnimState = { lastAnimKey: 'player-idle-down', lastFlipX: false, transitioning: false, isMoving: false };
      const result = resolveAnimation(state, null, 'left');
      expect(result).not.toBeNull();
      expect(result!.key).toBe('player-idle-left');
      expect(result!.flipX).toBe(false);
    });

    it('should transition from walk to idle when direction is released', () => {
      const state: AnimState = { lastAnimKey: 'player-walk-down', lastFlipX: false, transitioning: false, isMoving: false };
      const result = resolveAnimation(state, null, 'down');
      expect(result).not.toBeNull();
      expect(result!.key).toBe('player-idle-down');
    });
  });

  describe('walk animation stability', () => {
    it('should not re-trigger walk animation when already walking in same direction', () => {
      const state: AnimState = { lastAnimKey: 'player-walk-down', lastFlipX: false, transitioning: false, isMoving: false };
      const result = resolveAnimation(state, 'down', 'down');
      expect(result).toBeNull();
    });

    it('should change animation when walk direction changes', () => {
      const state: AnimState = { lastAnimKey: 'player-walk-down', lastFlipX: false, transitioning: false, isMoving: false };
      const result = resolveAnimation(state, 'left', 'down');
      expect(result).not.toBeNull();
      expect(result!.key).toBe('player-walk-left');
    });

    it('walking right should use walk-left with flipX', () => {
      const state: AnimState = { lastAnimKey: '', lastFlipX: false, transitioning: false, isMoving: false };
      const result = resolveAnimation(state, 'right', 'right');
      expect(result).not.toBeNull();
      expect(result!.key).toBe('player-walk-left');
      expect(result!.flipX).toBe(true);
    });
  });

  describe('input gating', () => {
    it('should return null when transitioning (no animation changes)', () => {
      const state: AnimState = { lastAnimKey: 'player-idle-down', lastFlipX: false, transitioning: true, isMoving: false };
      expect(resolveAnimation(state, 'up', 'down')).toBeNull();
      expect(resolveAnimation(state, null, 'down')).toBeNull();
    });

    it('should return null when already moving (mid-tween)', () => {
      const state: AnimState = { lastAnimKey: 'player-walk-down', lastFlipX: false, transitioning: false, isMoving: true };
      expect(resolveAnimation(state, 'left', 'down')).toBeNull();
    });
  });

  describe('facing-right mirror behavior', () => {
    it('idle right = idle-left + flipX', () => {
      const state: AnimState = { lastAnimKey: '', lastFlipX: false, transitioning: false, isMoving: false };
      const result = resolveAnimation(state, null, 'right');
      expect(result!.key).toBe('player-idle-left');
      expect(result!.flipX).toBe(true);
    });

    it('walk right = walk-left + flipX', () => {
      const state: AnimState = { lastAnimKey: '', lastFlipX: false, transitioning: false, isMoving: false };
      const result = resolveAnimation(state, 'right', 'right');
      expect(result!.key).toBe('player-walk-left');
      expect(result!.flipX).toBe(true);
    });
  });

  describe('all 4 directions produce valid animation keys', () => {
    const directions: Direction[] = ['up', 'down', 'left', 'right'];

    it.each(directions)('idle %s produces valid key', (dir) => {
      const state: AnimState = { lastAnimKey: '', lastFlipX: false, transitioning: false, isMoving: false };
      const result = resolveAnimation(state, null, dir);
      expect(result).not.toBeNull();
      expect(result!.key).toMatch(/^player-idle-(up|down|left)$/);
    });

    it.each(directions)('walk %s produces valid key', (dir) => {
      const state: AnimState = { lastAnimKey: '', lastFlipX: false, transitioning: false, isMoving: false };
      const result = resolveAnimation(state, dir, dir);
      expect(result).not.toBeNull();
      expect(result!.key).toMatch(/^player-walk-(up|down|left)$/);
    });
  });

  describe('rapid direction changes (rotation bug prevention)', () => {
    it('should not re-trigger animation when repeating same direction consecutively', () => {
      const state: AnimState = { lastAnimKey: '', lastFlipX: false, transitioning: false, isMoving: false };
      const directions: Direction[] = ['down', 'down', 'down', 'left', 'left', 'up', 'up', 'right', 'right'];
      let changes = 0;

      for (const dir of directions) {
        const result = resolveAnimation(state, dir, dir);
        if (result) {
          changes++;
          state.lastAnimKey = result.key;
          state.lastFlipX = result.flipX;
        }
      }

      // Should only change on direction transitions: down, left, up, right = 4
      expect(changes).toBe(4);
    });

    it('holding the same direction should not keep re-triggering animation', () => {
      const state: AnimState = { lastAnimKey: '', lastFlipX: false, transitioning: false, isMoving: false };
      const result1 = resolveAnimation(state, 'down', 'down');
      expect(result1).not.toBeNull();
      state.lastAnimKey = result1!.key;
      state.lastFlipX = result1!.flipX;

      // Subsequent frames with same direction
      for (let i = 0; i < 60; i++) {
        const result = resolveAnimation(state, 'down', 'down');
        expect(result).toBeNull(); // Should not re-trigger
      }
    });
  });
});
