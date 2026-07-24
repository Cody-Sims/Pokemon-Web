import { describe, it, expect, vi } from 'vitest';
import {
  BATTLE_STATES,
  BattleStateMachine,
} from '../../../frontend/src/battle/core/BattleStateMachine';

const registerAllStates = (fsm: BattleStateMachine): void => {
  for (const state of BATTLE_STATES) {
    fsm.registerState(state, {});
  }
};

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
    registerAllStates(fsm);

    fsm.transition('PLAYER_TURN');
    expect(fsm.getState()).toBe('PLAYER_TURN');
    fsm.transition('ENEMY_TURN');
    expect(fsm.getState()).toBe('ENEMY_TURN');
    fsm.transition('EXECUTE_MOVES');
    expect(fsm.getState()).toBe('EXECUTE_MOVES');
    fsm.transition('CHECK_FAINT');
    expect(fsm.getState()).toBe('CHECK_FAINT');
    fsm.transition('EXP_GAIN');
    expect(fsm.getState()).toBe('EXP_GAIN');
    fsm.transition('PLAYER_TURN');
    expect(fsm.getState()).toBe('PLAYER_TURN');
    fsm.transition('ENEMY_TURN');
    expect(fsm.getState()).toBe('ENEMY_TURN');
    fsm.transition('EXECUTE_TURN');
    expect(fsm.getState()).toBe('EXECUTE_TURN');
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

  it('should throw when transitioning to an unregistered state', () => {
    const fsm = new BattleStateMachine();
    fsm.registerState('INTRO', {});
    expect(() => fsm.transition('VICTORY')).toThrow(
      'BattleStateMachine: attempted transition to unregistered state "VICTORY"',
    );
    expect(fsm.getState()).toBe('INTRO');
  });

  it('should reject illegal registered transitions', () => {
    const fsm = new BattleStateMachine();
    registerAllStates(fsm);

    expect(() => fsm.transition('VICTORY')).toThrow(
      'BattleStateMachine: illegal transition from "INTRO" to "VICTORY"',
    );
    expect(fsm.getState()).toBe('INTRO');
  });

  it('should reject transitions out of terminal states', () => {
    const fsm = new BattleStateMachine();
    registerAllStates(fsm);

    fsm.transition('FLEE');
    expect(() => fsm.transition('PLAYER_TURN')).toThrow(
      'BattleStateMachine: cannot leave terminal state "FLEE"',
    );
  });

  it('should expose legal transition checks without mutating state', () => {
    const fsm = new BattleStateMachine();
    registerAllStates(fsm);

    expect(fsm.canTransition('PLAYER_TURN')).toBe(true);
    expect(fsm.canTransition('VICTORY')).toBe(false);
    expect(fsm.getState()).toBe('INTRO');
  });
});
