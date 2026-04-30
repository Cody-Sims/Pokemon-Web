import { describe, it, expect, vi } from 'vitest';
import { BattleStateMachine, BattleState } from '../../../frontend/src/battle/core/BattleStateMachine';

describe('BattleStateMachine', () => {
  it('should start in INTRO state', () => {
    const fsm = new BattleStateMachine();
    expect(fsm.getState()).toBe('INTRO');
  });

  it('should transition to a new state', () => {
    const fsm = new BattleStateMachine();
    fsm.registerState('INTRO', {});
    fsm.registerState('PLAYER_TURN', {});
    fsm.transition('PLAYER_TURN');
    expect(fsm.getState()).toBe('PLAYER_TURN');
  });

  it('should call enter handler on transition', () => {
    const fsm = new BattleStateMachine();
    const enterFn = vi.fn();
    fsm.registerState('INTRO', {});
    fsm.registerState('PLAYER_TURN', { enter: enterFn });
    fsm.transition('PLAYER_TURN');
    expect(enterFn).toHaveBeenCalledOnce();
  });

  it('should call exit handler on leaving state', () => {
    const fsm = new BattleStateMachine();
    const exitFn = vi.fn();
    fsm.registerState('INTRO', { exit: exitFn });
    fsm.registerState('PLAYER_TURN', {});
    fsm.transition('PLAYER_TURN');
    expect(exitFn).toHaveBeenCalledOnce();
  });

  it('should call update handler on registered state', () => {
    const fsm = new BattleStateMachine();
    const updateFn = vi.fn();
    fsm.registerState('INTRO', { update: updateFn });
    fsm.update();
    expect(updateFn).toHaveBeenCalledOnce();
  });

  it('should handle multiple state transitions in sequence', () => {
    const fsm = new BattleStateMachine();
    const states: BattleState[] = ['INTRO', 'PLAYER_TURN', 'ENEMY_TURN', 'EXECUTE_MOVES', 'CHECK_FAINT', 'VICTORY'];
    for (const state of states) {
      fsm.registerState(state, {});
    }

    fsm.transition('PLAYER_TURN');
    expect(fsm.getState()).toBe('PLAYER_TURN');
    fsm.transition('ENEMY_TURN');
    expect(fsm.getState()).toBe('ENEMY_TURN');
    fsm.transition('EXECUTE_MOVES');
    expect(fsm.getState()).toBe('EXECUTE_MOVES');
    fsm.transition('CHECK_FAINT');
    expect(fsm.getState()).toBe('CHECK_FAINT');
    fsm.transition('VICTORY');
    expect(fsm.getState()).toBe('VICTORY');
  });

  it('should call exit then enter across transitions', () => {
    const order: string[] = [];
    const fsm = new BattleStateMachine();
    fsm.registerState('INTRO', { exit: () => order.push('exit-intro') });
    fsm.registerState('PLAYER_TURN', { enter: () => order.push('enter-player') });
    fsm.transition('PLAYER_TURN');
    expect(order).toEqual(['exit-intro', 'enter-player']);
  });

  it('should not throw when transitioning to unregistered state', () => {
    const fsm = new BattleStateMachine();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => fsm.transition('VICTORY')).not.toThrow();
    // Should stay in INTRO since VICTORY is not registered
    expect(fsm.getState()).toBe('INTRO');
    expect(consoleSpy).toHaveBeenCalledWith(
      'BattleStateMachine: attempted transition to unregistered state "VICTORY"',
    );
    consoleSpy.mockRestore();
  });
});
