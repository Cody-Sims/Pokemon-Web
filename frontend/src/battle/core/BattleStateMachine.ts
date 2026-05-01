export type BattleState = 'INTRO' | 'PLAYER_TURN' | 'ENEMY_TURN' | 'EXECUTE_MOVES' | 'EXECUTE_TURN' | 'CHECK_FAINT' | 'REPLACE' | 'EXP_GAIN' | 'VICTORY' | 'DEFEAT' | 'FLEE' | 'CAPTURE';

interface StateHandler {
  enter?: () => void;
  update?: () => void;
  exit?: () => void;
}

/** Finite state machine for the battle flow. */
export class BattleStateMachine {
  private static readonly TERMINAL_STATES = new Set<BattleState>(['VICTORY', 'DEFEAT', 'FLEE', 'CAPTURE']);

  private currentState: BattleState = 'INTRO';
  private states = new Map<BattleState, StateHandler>();

  registerState(state: BattleState, handler: StateHandler): void {
    this.states.set(state, handler);
  }

  getState(): BattleState {
    return this.currentState;
  }

  transition(newState: BattleState): void {
    if (BattleStateMachine.TERMINAL_STATES.has(this.currentState)) {
      console.warn(`BattleStateMachine: cannot leave terminal state "${this.currentState}"`);
      return;
    }

    if (!this.states.has(newState)) {
      console.error(`BattleStateMachine: attempted transition to unregistered state "${newState}"`);
      return;
    }

    const current = this.states.get(this.currentState);
    current?.exit?.();

    this.currentState = newState;

    const next = this.states.get(newState);
    next?.enter?.();
  }

  update(): void {
    const handler = this.states.get(this.currentState);
    handler?.update?.();
  }
}
