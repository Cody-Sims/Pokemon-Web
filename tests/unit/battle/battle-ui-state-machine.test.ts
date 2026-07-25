import { describe, expect, it, vi } from 'vitest';
import {
  BATTLE_STATES,
  BATTLE_STATE_TRANSITIONS,
  BattleState,
  BattleStateMachine,
} from '../../../frontend/src/battle/core/BattleStateMachine';

function registeredMachine(): BattleStateMachine {
  const machine = new BattleStateMachine();
  BATTLE_STATES.forEach(state => machine.registerState(state, {}));
  return machine;
}

describe('BattleStateMachine transition table', () => {
  it('declares transitions for every battle state', () => {
    expect(Object.keys(BATTLE_STATE_TRANSITIONS).sort()).toEqual([...BATTLE_STATES].sort());
    for (const [state, targets] of Object.entries(BATTLE_STATE_TRANSITIONS) as [BattleState, readonly BattleState[]][]) {
      expect(BATTLE_STATES).toContain(state);
      targets.forEach(target => expect(BATTLE_STATES).toContain(target));
    }
  });

  it('allows registered legal transitions and calls exit/enter hooks', () => {
    const machine = new BattleStateMachine();
    const introExit = vi.fn();
    const playerEnter = vi.fn();
    BATTLE_STATES.forEach(state => {
      machine.registerState(state, {
        exit: state === 'INTRO' ? introExit : undefined,
        enter: state === 'PLAYER_TURN' ? playerEnter : undefined,
      });
    });

    machine.transition('PLAYER_TURN');

    expect(machine.getState()).toBe('PLAYER_TURN');
    expect(introExit).toHaveBeenCalledOnce();
    expect(playerEnter).toHaveBeenCalledOnce();
  });

  it('rejects illegal transitions instead of silently accepting invalid battle flow', () => {
    const machine = registeredMachine();

    expect(machine.canTransition('VICTORY')).toBe(false);
    expect(() => machine.transition('VICTORY')).toThrow(/illegal transition/i);
    expect(machine.getState()).toBe('INTRO');
  });

  it('rejects transitions to unregistered states', () => {
    const machine = new BattleStateMachine();
    machine.registerState('INTRO', {});

    expect(() => machine.transition('PLAYER_TURN')).toThrow(/unregistered state/i);
  });

  it.each(['VICTORY', 'DEFEAT', 'FLEE', 'CAPTURE'] as BattleState[])(
    'does not leave terminal state %s',
    terminalState => {
      const machine = registeredMachine();
      const path: BattleState[] = terminalState === 'VICTORY'
        ? ['PLAYER_TURN', 'CHECK_FAINT', 'VICTORY']
        : terminalState === 'DEFEAT'
          ? ['PLAYER_TURN', 'CHECK_FAINT', 'DEFEAT']
          : terminalState === 'CAPTURE'
            ? ['PLAYER_TURN', 'CAPTURE']
            : [terminalState];

      path.forEach(state => machine.transition(state));

      expect(() => machine.transition('PLAYER_TURN')).toThrow(/terminal state/i);
    },
  );
});
