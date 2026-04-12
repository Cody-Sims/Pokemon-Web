export type BattleState = 'INTRO' | 'PLAYER_TURN' | 'ENEMY_TURN' | 'EXECUTE_MOVES' | 'CHECK_FAINT' | 'EXP_GAIN' | 'VICTORY' | 'DEFEAT' | 'FLEE' | 'CAPTURE';

interface StateHandler {
  enter?: () => void;
  update?: () => void;
  exit?: () => void;
}

/** Finite state machine for the battle flow. */
export class BattleStateMachine {
  private currentState: BattleState = 'INTRO';
  private states = new Map<BattleState, StateHandler>();

  registerState(state: BattleState, handler: StateHandler): void {
    this.states.set(state, handler);
  }

  getState(): BattleState {
    return this.currentState;
  }

  transition(newState: BattleState): void {
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
