import { PokemonInstance } from '@data/interfaces';
import { StatusEffectHandler } from '../effects/StatusEffectHandler';
import { WeatherManager } from '../effects/WeatherManager';
import type { BattleRng } from './BattleRng';
import { BattleEvent, BattleOrchestrationEngine, singleBattleFormatStrategy } from './BattleEngine';
import type { BattleState, StateHandler } from './BattleStateMachine';

export type BattleType = 'wild' | 'trainer';

export interface BattleConfig {
  type: BattleType;
  playerParty: PokemonInstance[];
  enemyParty: PokemonInstance[];
  trainerId?: string;
  isDouble?: boolean; // If true, use DoubleBattleManager instead
  allyParty?: PokemonInstance[]; // Partner party for tag battles
  allyTrainerId?: string;
  rng?: BattleRng;
  rngSeed?: number;
}

/** Orchestrates the battle: turn order, win/loss conditions, party management. */
export class BattleManager {
  private engine: BattleOrchestrationEngine;
  private config: BattleConfig;
  private playerActive: PokemonInstance;
  private enemyActive: PokemonInstance;
  private playerActiveIndex = 0;
  private enemyActiveIndex = 0;

  constructor(config: BattleConfig) {
    this.config = config;
    const active = singleBattleFormatStrategy.createInitialActive(config);
    this.playerActive = active.player;
    this.enemyActive = active.enemy;
    this.engine = new BattleOrchestrationEngine({
      format: singleBattleFormatStrategy.format,
      rng: config.rng,
      rngSeed: config.rngSeed,
      stateHandlers: this.createStateHandlers(),
    });
    this.engine.initActivePokemon(singleBattleFormatStrategy.getActivePokemon(active));
  }

  private createStateHandlers(): Partial<Record<BattleState, StateHandler>> {
    return {
      INTRO: {
        enter: () => {
          // Battle intro animations would trigger here
        },
      },

      PLAYER_TURN: {
        enter: () => {
          // Wait for player input
        },
      },

      CHECK_FAINT: {
        enter: () => {
          if (this.enemyActive.currentHp <= 0) {
            // Enemy fainted — search for next alive Pokemon (AUDIT-006)
            const nextAlive = this.config.enemyParty.findIndex(
              (p, i) => i !== this.enemyActiveIndex && p.currentHp > 0,
            );
            if (nextAlive === -1) {
              this.engine.transition('VICTORY');
            } else {
              this.enemyActiveIndex = nextAlive;
              this.enemyActive = this.config.enemyParty[nextAlive];
              // Initialize status tracking and fire switch-in abilities
              this.engine.getStatusHandler().initPokemon(this.enemyActive);
              this.engine.applySwitchInAbility(this.enemyActive, this.playerActive);
              this.engine.transition('PLAYER_TURN');
            }
          } else if (this.playerActive.currentHp <= 0) {
            // Player's pokemon fainted — search entire party for alive member
            const nextAlive = this.config.playerParty.findIndex(
              (p, i) => i !== this.playerActiveIndex && p.currentHp > 0,
            );
            if (nextAlive === -1) {
              this.engine.transition('DEFEAT');
            } else {
              this.playerActiveIndex = nextAlive;
              this.playerActive = this.config.playerParty[nextAlive];
              this.engine.transition('PLAYER_TURN');
            }
          } else {
            this.engine.transition('PLAYER_TURN');
          }
        },
      },
    };
  }

  start(): void {
    this.engine.transition('INTRO');
  }

  beginPlayerTurn(): void {
    this.engine.transition('PLAYER_TURN');
  }
  beginEnemyTurn(): void {
    this.engine.transition('ENEMY_TURN');
  }
  beginMoveExecution(): void {
    this.engine.transition('EXECUTE_MOVES');
  }
  checkFaint(): void {
    this.engine.transition('CHECK_FAINT');
  }
  beginExpGain(): void {
    this.engine.transition('EXP_GAIN');
  }
  capture(): void {
    this.engine.transition('CAPTURE');
  }
  drainEvents(): BattleEvent[] {
    return this.engine.drainEvents();
  }

  getState() {
    return this.engine.getState();
  }
  getPlayerActive() {
    return this.playerActive;
  }
  getEnemyActive() {
    return this.enemyActive;
  }
  getBattleType() {
    return this.config.type;
  }
  getStatusHandler(): StatusEffectHandler {
    return this.engine.getStatusHandler();
  }
  getWeatherManager(): WeatherManager {
    return this.engine.getWeatherManager();
  }
  getRng(): BattleRng {
    return this.engine.getRng();
  }

  /** Attempt to flee from a wild battle. */
  attemptFlee(): boolean {
    if (this.config.type === 'trainer') return false;
    if (this.engine.getState() === 'FLEE') return true;
    const escapeChance = this.playerActive.stats.speed >= this.enemyActive.stats.speed ? 1 : 0.5;
    if (this.engine.getRng().chance(escapeChance)) {
      this.engine.transition('FLEE');
      return true;
    }
    return false;
  }

  /** Switch the active player Pokemon. Clears volatile statuses from old, inits new. */
  switchPokemon(index: number): boolean {
    if (index < 0 || index >= this.config.playerParty.length) return false;
    if (this.config.playerParty[index].currentHp <= 0) return false;
    this.engine.getStatusHandler().clearPokemon(this.playerActive);
    this.playerActiveIndex = index;
    this.playerActive = this.config.playerParty[index];
    this.engine.getStatusHandler().initPokemon(this.playerActive);
    return true;
  }

  /** Clean up the StatusEffectHandler and WeatherManager when the battle ends. */
  cleanup(): void {
    this.engine.cleanup();
  }
}
