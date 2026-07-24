import { PokemonInstance } from '@data/interfaces';
import { AbilityHandler } from '../effects/AbilityHandler';
import { StatusEffectHandler } from '../effects/StatusEffectHandler';
import { WeatherManager } from '../effects/WeatherManager';
import type { BattleRng } from './BattleRng';
import { createBattleRng } from './BattleRng';
import { BATTLE_STATES, BattleState, BattleStateMachine, StateHandler } from './BattleStateMachine';

export type BattleFormat = 'single' | 'double';

export interface BattleEvent {
  type: 'state' | 'message' | 'switch-in';
  format: BattleFormat;
  state?: BattleState;
  message?: string;
  messages?: string[];
  pokemon?: PokemonInstance;
}

export type BattleCommand =
  | { type: 'transition'; state: BattleState }
  | { type: 'switch'; slot: number; partyIndex: number }
  | { type: 'move'; slot: number; moveId: string; targetSlot?: number };

export interface BattleFormatStrategy<TConfig, TActive> {
  readonly format: BattleFormat;
  createInitialActive(config: TConfig): TActive;
  getActivePokemon(active: TActive): (PokemonInstance | null)[];
}

export interface TargetingPolicy<TTarget = unknown> {
  getMoveTarget(moveId: string): TTarget;
}

interface BattleEngineOptions {
  format: BattleFormat;
  rng?: BattleRng;
  rngSeed?: number;
  stateHandlers?: Partial<Record<BattleState, StateHandler>>;
}

export interface SingleBattleActive {
  player: PokemonInstance;
  enemy: PokemonInstance;
}

export interface SingleBattleConfigLike {
  playerParty: PokemonInstance[];
  enemyParty: PokemonInstance[];
}

export const singleBattleFormatStrategy: BattleFormatStrategy<
  SingleBattleConfigLike,
  SingleBattleActive
> = {
  format: 'single',
  createInitialActive: (config) => ({
    player: config.playerParty[0],
    enemy: config.enemyParty[0],
  }),
  getActivePokemon: (active) => [active.player, active.enemy],
};

export interface SlotMapping {
  party: PokemonInstance[];
  partyIndex: number;
}

export interface DoubleBattleActive {
  playerActive: (PokemonInstance | null)[];
  enemyActive: (PokemonInstance | null)[];
  playerSlotMapping: (SlotMapping | null)[];
  enemySlotMapping: (SlotMapping | null)[];
}

export interface DoubleBattleConfigLike {
  type: 'tag-battle' | 'double-wild' | 'double-trainer';
  playerParty: PokemonInstance[];
  allyParty?: PokemonInstance[];
  enemyParty1: PokemonInstance[];
  enemyParty2?: PokemonInstance[];
}

export const doubleBattleFormatStrategy: BattleFormatStrategy<
  DoubleBattleConfigLike,
  DoubleBattleActive
> = {
  format: 'double',
  createInitialActive: (config) => {
    const playerPrimary = config.playerParty[0] ?? null;
    const playerSecondary =
      config.type === 'tag-battle' && config.allyParty && config.allyParty.length > 0
        ? config.allyParty[0]
        : (config.playerParty[1] ?? null);
    const enemyPrimary = config.enemyParty1[0] ?? null;
    const enemySecondary =
      config.enemyParty2 && config.enemyParty2.length > 0
        ? config.enemyParty2[0]
        : (config.enemyParty1[1] ?? null);

    return {
      playerActive: [playerPrimary, playerSecondary],
      enemyActive: [enemyPrimary, enemySecondary],
      playerSlotMapping: [
        playerPrimary ? { party: config.playerParty, partyIndex: 0 } : null,
        playerSecondary
          ? config.type === 'tag-battle' && config.allyParty
            ? { party: config.allyParty, partyIndex: 0 }
            : { party: config.playerParty, partyIndex: 1 }
          : null,
      ],
      enemySlotMapping: [
        enemyPrimary ? { party: config.enemyParty1, partyIndex: 0 } : null,
        enemySecondary
          ? config.enemyParty2
            ? { party: config.enemyParty2, partyIndex: 0 }
            : { party: config.enemyParty1, partyIndex: 1 }
          : null,
      ],
    };
  },
  getActivePokemon: (active) => [
    active.playerActive[0],
    active.playerActive[1],
    active.enemyActive[0],
    active.enemyActive[1],
  ],
};

export class BattleOrchestrationEngine {
  private readonly fsm = new BattleStateMachine();
  private readonly statusHandler: StatusEffectHandler;
  private readonly weatherManager = new WeatherManager();
  private readonly rng: BattleRng;
  private readonly events: BattleEvent[] = [];
  private readonly format: BattleFormat;

  constructor(options: BattleEngineOptions) {
    this.format = options.format;
    this.rng = createBattleRng(options.rngSeed, options.rng);
    this.statusHandler = new StatusEffectHandler(this.rng);
    this.registerStates(options.stateHandlers ?? {});
  }

  getState(): BattleState {
    return this.fsm.getState();
  }

  transition(state: BattleState): void {
    this.fsm.transition(state);
  }

  getStatusHandler(): StatusEffectHandler {
    return this.statusHandler;
  }

  getWeatherManager(): WeatherManager {
    return this.weatherManager;
  }

  getRng(): BattleRng {
    return this.rng;
  }

  initActivePokemon(pokemon: Iterable<PokemonInstance | null | undefined>): void {
    for (const active of pokemon) {
      if (active) this.statusHandler.initPokemon(active);
    }
  }

  applySwitchInAbility(
    incoming: PokemonInstance,
    opponent: PokemonInstance | null | undefined,
  ): string[] {
    if (!opponent || opponent.currentHp <= 0) return [];

    const switchResult = AbilityHandler.onSwitchIn(incoming, opponent, this.statusHandler);
    if (switchResult.weather) {
      this.weatherManager.setWeather(switchResult.weather, switchResult.weatherDuration);
    }
    if (switchResult.messages.length > 0) {
      this.events.push({
        type: 'switch-in',
        format: this.format,
        pokemon: incoming,
        messages: switchResult.messages,
      });
    }
    return switchResult.messages;
  }

  drainEvents(): BattleEvent[] {
    const drained = [...this.events];
    this.events.length = 0;
    return drained;
  }

  cleanup(): void {
    this.statusHandler.cleanup();
    this.weatherManager.cleanup();
  }

  private registerStates(stateHandlers: Partial<Record<BattleState, StateHandler>>): void {
    for (const state of BATTLE_STATES) {
      const handler = stateHandlers[state] ?? {};
      this.fsm.registerState(state, {
        enter: () => {
          this.events.push({ type: 'state', format: this.format, state });
          handler.enter?.();
        },
        update: handler.update,
        exit: handler.exit,
      });
    }
  }
}
