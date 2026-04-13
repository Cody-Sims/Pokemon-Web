import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Direction } from '../../frontend/src/utils/type-helpers';

/**
 * Tests the InputManager polling logic.
 * Validates priority, key mapping, and JustDown behavior.
 */

interface MockKeyState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
  enter: boolean;
  escape: boolean;
  enterJustDown: boolean;
  escapeJustDown: boolean;
}

interface InputState {
  direction: Direction | null;
  confirm: boolean;
  cancel: boolean;
  menu: boolean;
}

/** Pure-logic simulation of InputManager.getState() */
function getInputState(keys: MockKeyState): InputState {
  let direction: Direction | null = null;

  // Arrow/WASD priority: up > down > left > right
  if (keys.up || keys.w) direction = 'up';
  else if (keys.down || keys.s) direction = 'down';
  else if (keys.left || keys.a) direction = 'left';
  else if (keys.right || keys.d) direction = 'right';

  return {
    direction,
    confirm: keys.enterJustDown,
    cancel: keys.escapeJustDown,
    menu: keys.escapeJustDown,  // Same key as cancel in current impl
  };
}

const noKeys: MockKeyState = {
  up: false, down: false, left: false, right: false,
  w: false, a: false, s: false, d: false,
  enter: false, escape: false,
  enterJustDown: false, escapeJustDown: false,
};

describe('InputManager — Polling Logic', () => {
  describe('direction priority', () => {
    it('no keys → null direction', () => {
      expect(getInputState(noKeys).direction).toBeNull();
    });

    it('single direction keys', () => {
      expect(getInputState({ ...noKeys, up: true }).direction).toBe('up');
      expect(getInputState({ ...noKeys, down: true }).direction).toBe('down');
      expect(getInputState({ ...noKeys, left: true }).direction).toBe('left');
      expect(getInputState({ ...noKeys, right: true }).direction).toBe('right');
    });

    it('WASD alternatives work', () => {
      expect(getInputState({ ...noKeys, w: true }).direction).toBe('up');
      expect(getInputState({ ...noKeys, s: true }).direction).toBe('down');
      expect(getInputState({ ...noKeys, a: true }).direction).toBe('left');
      expect(getInputState({ ...noKeys, d: true }).direction).toBe('right');
    });

    it('up has priority over down when both held', () => {
      expect(getInputState({ ...noKeys, up: true, down: true }).direction).toBe('up');
    });

    it('up has priority over left when both held', () => {
      expect(getInputState({ ...noKeys, up: true, left: true }).direction).toBe('up');
    });

    it('down has priority over left when both held', () => {
      expect(getInputState({ ...noKeys, down: true, left: true }).direction).toBe('down');
    });

    it('arrow + WASD same direction still works', () => {
      expect(getInputState({ ...noKeys, up: true, w: true }).direction).toBe('up');
    });
  });

  describe('confirm / cancel / menu', () => {
    it('enter JustDown → confirm true', () => {
      expect(getInputState({ ...noKeys, enterJustDown: true }).confirm).toBe(true);
    });

    it('escape JustDown → cancel and menu true', () => {
      const state = getInputState({ ...noKeys, escapeJustDown: true });
      expect(state.cancel).toBe(true);
      expect(state.menu).toBe(true);
    });

    it('BUG: cancel and menu use the same key (ESC)', () => {
      // This means pressing ESC triggers both cancel AND menu simultaneously.
      // In OverworldScene.update(), `input.menu` is checked first, so ESC always
      // opens the menu. But in BattleUIScene, ESC triggers cancel().
      // This is by design for now but documented as a potential issue.
      const state = getInputState({ ...noKeys, escapeJustDown: true });
      expect(state.cancel).toBe(state.menu); // Always equal
    });

    it('confirm/cancel should use JustDown (not isDown)', () => {
      // Holding Enter should NOT continuously fire confirm
      const state = getInputState({ ...noKeys, enter: true, enterJustDown: false });
      expect(state.confirm).toBe(false);
    });
  });

  describe('all keys released', () => {
    it('should return null direction and false for all actions', () => {
      const state = getInputState(noKeys);
      expect(state.direction).toBeNull();
      expect(state.confirm).toBe(false);
      expect(state.cancel).toBe(false);
      expect(state.menu).toBe(false);
    });
  });
});
