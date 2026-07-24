import type { ChallengeMode } from '@data/challenge-modes';
import type { DifficultyMode } from '@data/difficulty';
import { NICKNAME_CHAR_REGEX, NICKNAME_MAX_LENGTH, NICKNAME_STRIP_REGEX } from '@utils/nickname-validation';

export type IntroPhase = 'intro' | 'naming' | 'appearance' | 'confirm' | 'done';
export type IntroAppearance = 'boy' | 'girl';
export type IntroAdvanceResult = 'slide' | 'naming' | 'done' | 'ignored';

export interface IntroFlowOptions {
  difficulty?: DifficultyMode;
  challengeModes?: readonly ChallengeMode[];
}

export interface IntroFlowState {
  phase: IntroPhase;
  slideIndex: number;
  nameInput: string;
  playerName: string;
  appearance: IntroAppearance;
  difficulty: DifficultyMode;
  challengeModes: readonly ChallengeMode[];
}

const DEFAULT_PLAYER_NAME = 'Red';

export function sanitizeNameInput(value: string): string {
  return value.replace(NICKNAME_STRIP_REGEX, '').slice(0, NICKNAME_MAX_LENGTH);
}

export function canAppendNameCharacter(current: string, key: string): boolean {
  return current.length < NICKNAME_MAX_LENGTH && NICKNAME_CHAR_REGEX.test(key);
}

export function normalizePlayerName(value: string, fallback = DEFAULT_PLAYER_NAME): string {
  return value.trim() || fallback;
}

export class IntroFlowController {
  private state: IntroFlowState;

  constructor(options: IntroFlowOptions = {}) {
    this.state = {
      phase: 'intro',
      slideIndex: 0,
      nameInput: '',
      playerName: DEFAULT_PLAYER_NAME,
      appearance: 'boy',
      difficulty: options.difficulty ?? 'classic',
      challengeModes: [...(options.challengeModes ?? [])],
    };
  }

  getState(): IntroFlowState {
    return {
      ...this.state,
      challengeModes: [...this.state.challengeModes],
    };
  }

  advance(totalSlides: number): IntroAdvanceResult {
    if (this.state.phase === 'intro') {
      const nextSlide = this.state.slideIndex + 1;
      if (nextSlide >= totalSlides) {
        this.state = { ...this.state, phase: 'naming' };
        return 'naming';
      }
      this.state = { ...this.state, slideIndex: nextSlide };
      return 'slide';
    }

    if (this.state.phase === 'confirm') {
      this.state = { ...this.state, phase: 'done' };
      return 'done';
    }

    return 'ignored';
  }

  setNameInput(value: string): string {
    const nameInput = sanitizeNameInput(value);
    this.state = { ...this.state, nameInput };
    return nameInput;
  }

  appendNameCharacter(key: string): string {
    if (!canAppendNameCharacter(this.state.nameInput, key)) return this.state.nameInput;
    return this.setNameInput(`${this.state.nameInput}${key}`);
  }

  backspaceName(): string {
    return this.setNameInput(this.state.nameInput.slice(0, -1));
  }

  confirmName(): string {
    const playerName = normalizePlayerName(this.state.nameInput);
    this.state = {
      ...this.state,
      phase: 'appearance',
      nameInput: playerName,
      playerName,
    };
    return playerName;
  }

  selectAppearance(appearance: IntroAppearance): void {
    this.state = { ...this.state, appearance };
  }

  confirmAppearance(): IntroAppearance {
    this.state = { ...this.state, phase: 'confirm' };
    return this.state.appearance;
  }
}
