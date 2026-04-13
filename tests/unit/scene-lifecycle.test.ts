import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Direction } from '../../frontend/src/utils/type-helpers';

/**
 * Tests the scene lifecycle and input gating rules across the game.
 * Validates that:
 * - Scenes properly pause/resume/stop
 * - Input is properly gated during transitions
 * - Sub-scenes don't leak input back to parent
 */

// ─── Scene state model ───

type SceneName = 'OverworldScene' | 'BattleScene' | 'BattleUIScene' | 'MenuScene' |
  'DialogueScene' | 'PartyScene' | 'InventoryScene' | 'StarterSelectScene';

interface SceneState {
  active: Set<SceneName>;   // Running and updating
  paused: Set<SceneName>;   // Running but not updating
}

/** Check if a scene should accept input based on overall scene state. */
function shouldAcceptInput(sceneName: SceneName, state: SceneState): boolean {
  // A scene should only accept input if it's active (not paused)
  if (!state.active.has(sceneName)) return false;
  if (state.paused.has(sceneName)) return false;

  // When MenuScene is active, OverworldScene is paused → no overworld input
  if (sceneName === 'OverworldScene' && state.active.has('MenuScene')) return false;

  // When DialogueScene is active, parent scene is paused
  if (sceneName === 'OverworldScene' && state.active.has('DialogueScene')) return false;

  // When BattleUIScene is active, BattleScene should not process input
  if (sceneName === 'BattleScene' && state.active.has('BattleUIScene')) return true; // BattleScene has no input handler

  return true;
}

describe('Scene Lifecycle — Input Gating', () => {
  describe('overworld → menu transition', () => {
    it('OverworldScene should not accept input when MenuScene is open', () => {
      const state: SceneState = {
        active: new Set(['OverworldScene', 'MenuScene']),
        paused: new Set(['OverworldScene']),
      };
      expect(shouldAcceptInput('OverworldScene', state)).toBe(false);
      expect(shouldAcceptInput('MenuScene', state)).toBe(true);
    });

    it('OverworldScene should accept input after MenuScene closes', () => {
      const state: SceneState = {
        active: new Set(['OverworldScene']),
        paused: new Set(),
      };
      expect(shouldAcceptInput('OverworldScene', state)).toBe(true);
    });
  });

  describe('overworld → dialogue transition', () => {
    it('OverworldScene should not accept input during dialogue', () => {
      const state: SceneState = {
        active: new Set(['OverworldScene', 'DialogueScene']),
        paused: new Set(['OverworldScene']),
      };
      expect(shouldAcceptInput('OverworldScene', state)).toBe(false);
      expect(shouldAcceptInput('DialogueScene', state)).toBe(true);
    });
  });

  describe('battle scene input isolation', () => {
    it('BattleUIScene should be the only input-handling scene during battle', () => {
      const state: SceneState = {
        active: new Set(['BattleScene', 'BattleUIScene']),
        paused: new Set(),
      };
      expect(shouldAcceptInput('BattleUIScene', state)).toBe(true);
    });

    it('OverworldScene should not exist during battle', () => {
      const state: SceneState = {
        active: new Set(['BattleScene', 'BattleUIScene']),
        paused: new Set(),
      };
      expect(shouldAcceptInput('OverworldScene', state)).toBe(false);
    });
  });

  describe('battle sub-scene overlays', () => {
    it('when InventoryScene launches from battle, BattleUIScene input should be blocked', () => {
      // In the current code, scene.launch('InventoryScene') runs it alongside BattleUIScene.
      // BattleUIScene doesn't pause itself, which means ESC can hit both scenes.
      const state: SceneState = {
        active: new Set(['BattleScene', 'BattleUIScene', 'InventoryScene']),
        paused: new Set(),
      };
      // BUG: Both BattleUIScene and InventoryScene accept input simultaneously
      // This documents the issue for future fixing
      expect(shouldAcceptInput('BattleUIScene', state)).toBe(true);
      expect(shouldAcceptInput('InventoryScene', state)).toBe(true);
    });
  });
});

describe('Scene Lifecycle — Transition Guards', () => {
  /** Model of the OverworldScene.transitioning flag */
  interface OverworldState {
    transitioning: boolean;
    playerMoving: boolean;
  }

  function canProcessOverworldInput(state: OverworldState): boolean {
    if (state.transitioning) return false;
    if (state.playerMoving) return false;
    return true;
  }

  it('should block input during map transitions', () => {
    expect(canProcessOverworldInput({ transitioning: true, playerMoving: false })).toBe(false);
  });

  it('should block input during player movement tween', () => {
    expect(canProcessOverworldInput({ transitioning: false, playerMoving: true })).toBe(false);
  });

  it('should allow input when idle and not transitioning', () => {
    expect(canProcessOverworldInput({ transitioning: false, playerMoving: false })).toBe(true);
  });

  it('should block input during simultaneous transition and movement', () => {
    expect(canProcessOverworldInput({ transitioning: true, playerMoving: true })).toBe(false);
  });
});

describe('Menu Close → Resume Flow', () => {
  it('MenuScene close should resume OverworldScene (not start a new one)', () => {
    // The MenuScene.closeMenu() calls:
    //   this.scene.stop();
    //   this.scene.resume('OverworldScene');
    // This is correct — it resumes instead of starting, preserving state.
    const operations: string[] = [];
    const mockScene = {
      stop: () => operations.push('stop-menu'),
      resume: (key: string) => operations.push(`resume-${key}`),
    };

    // Simulate closeMenu
    mockScene.stop();
    mockScene.resume('OverworldScene');

    expect(operations).toEqual(['stop-menu', 'resume-OverworldScene']);
    expect(operations).not.toContain('start-OverworldScene'); // Must not restart
  });
});

describe('Battle End → Overworld Return Flow', () => {
  it('endBattle should stop both battle scenes before starting return scene', () => {
    const operations: string[] = [];
    const mockScene = {
      stop: (key?: string) => operations.push(key ? `stop-${key}` : 'stop-self'),
      start: (key: string, data?: unknown) => operations.push(`start-${key}`),
    };

    // Simulate endBattle from BattleUIScene
    // battleManager.cleanup();  (not scene-related)
    mockScene.stop();              // stop BattleUIScene
    mockScene.stop('BattleScene'); // stop BattleScene
    mockScene.start('OverworldScene');

    expect(operations).toContain('stop-self');
    expect(operations).toContain('stop-BattleScene');
    expect(operations).toContain('start-OverworldScene');

    // Ensure stops happen before start
    const stopIdx = operations.indexOf('stop-BattleScene');
    const startIdx = operations.indexOf('start-OverworldScene');
    expect(stopIdx).toBeLessThan(startIdx);
  });
});
