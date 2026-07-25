export const BATTLE_STATES = [
  'INTRO',
  'PLAYER_TURN',
  'ENEMY_TURN',
  'EXECUTE_MOVES',
  'EXECUTE_TURN',
  'CHECK_FAINT',
  'REPLACE',
  'EXP_GAIN',
  'VICTORY',
  'DEFEAT',
  'FLEE',
  'CAPTURE',
] as const;

export type BattleState = (typeof BATTLE_STATES)[number];

export interface StateHandler {
  enter?: () => void;
  update?: () => void;
  exit?: () => void;
}

// Keep all declared states: single and double managers share the FSM, while scenes
// still orchestrate some phases until the event/command migration is complete.
export const BATTLE_STATE_TRANSITIONS: Readonly<Record<BattleState, readonly BattleState[]>> = {
  INTRO: ['INTRO', 'PLAYER_TURN', 'EXECUTE_TURN', 'FLEE'],
  PLAYER_TURN: [
    'ENEMY_TURN',
    'EXECUTE_MOVES',
    'EXECUTE_TURN',
    'CHECK_FAINT',
    'REPLACE',
    'FLEE',
    'CAPTURE',
  ],
  ENEMY_TURN: ['EXECUTE_MOVES', 'EXECUTE_TURN', 'CHECK_FAINT'],
  EXECUTE_MOVES: ['CHECK_FAINT'],
  EXECUTE_TURN: ['CHECK_FAINT'],
  CHECK_FAINT: ['PLAYER_TURN', 'EXECUTE_TURN', 'REPLACE', 'EXP_GAIN', 'VICTORY', 'DEFEAT'],
  REPLACE: ['PLAYER_TURN', 'CHECK_FAINT', 'VICTORY', 'DEFEAT'],
  EXP_GAIN: ['PLAYER_TURN', 'VICTORY'],
  VICTORY: [],
  DEFEAT: [],
  FLEE: [],
  CAPTURE: [],
};

/** Finite state machine for the battle flow. */
export class BattleStateMachine {
  private static readonly TERMINAL_STATES = new Set<BattleState>([
    'VICTORY',
    'DEFEAT',
    'FLEE',
    'CAPTURE',
  ]);

  private currentState: BattleState = 'INTRO';
  private states = new Map<BattleState, StateHandler>();

  registerState(state: BattleState, handler: StateHandler): void {
    this.states.set(state, handler);
  }

  getState(): BattleState {
    return this.currentState;
  }

  getRegisteredStates(): BattleState[] {
    return [...this.states.keys()];
  }

  canTransition(newState: BattleState): boolean {
    return BATTLE_STATE_TRANSITIONS[this.currentState].includes(newState);
  }

  transition(newState: BattleState): void {
    if (BattleStateMachine.TERMINAL_STATES.has(this.currentState)) {
      throw new Error(`BattleStateMachine: cannot leave terminal state "${this.currentState}"`);
    }

    if (!this.states.has(newState)) {
      throw new Error(
        `BattleStateMachine: attempted transition to unregistered state "${newState}"`,
      );
    }

    if (!this.states.has(this.currentState)) {
      throw new Error(`BattleStateMachine: current state "${this.currentState}" is not registered`);
    }

    if (!this.canTransition(newState)) {
      throw new Error(
        `BattleStateMachine: illegal transition from "${this.currentState}" to "${newState}"`,
      );
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
