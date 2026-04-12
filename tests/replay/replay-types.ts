export interface InputFrame {
  frame: number;
  keys: string[];
  action?: string;
}

export interface ReplayAssertion {
  atFrame: number;
  type: 'state-check' | 'scene-active' | 'party-size' | 'pokemon-hp' | 'no-errors';
  expected: unknown;
}

export interface ReplayData {
  version: number;
  seed: number;
  startState?: string;
  frames: InputFrame[];
  assertions: ReplayAssertion[];
}
