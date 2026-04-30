import { PokemonInstance } from '@data/interfaces';
import { moveData } from '@data/moves';
import { seededRandom } from '@utils/math-helpers';
import { BattleStateMachine } from './BattleStateMachine';
import { StatusEffectHandler } from '../effects/StatusEffectHandler';
import { WeatherManager } from '../effects/WeatherManager';
import { AbilityHandler } from '../effects/AbilityHandler';
import { HeldItemHandler } from '../effects/HeldItemHandler';
import { AIController } from './AIController';

export type BattleType = 'wild' | 'trainer';

export interface BattleConfig {
  type: BattleType;
  playerParty: PokemonInstance[];
  enemyParty: PokemonInstance[];
  trainerId?: string;
  isDouble?: boolean;  // If true, use DoubleBattleManager instead
  allyParty?: PokemonInstance[];  // Partner party for tag battles
  allyTrainerId?: string;
}

/** Orchestrates the battle: turn order, win/loss conditions, party management. */
export class BattleManager {
  private fsm: BattleStateMachine;
  private config: BattleConfig;
  private playerActive: PokemonInstance;
  private enemyActive: PokemonInstance;
  private playerActiveIndex = 0;
  private enemyActiveIndex = 0;
  private statusHandler: StatusEffectHandler;
  private weatherManager: WeatherManager;

  constructor(config: BattleConfig) {
    this.config = config;
    this.playerActive = config.playerParty[0];
    this.enemyActive = config.enemyParty[0];
    this.fsm = new BattleStateMachine();
    this.statusHandler = new StatusEffectHandler();
    this.weatherManager = new WeatherManager();
    this.statusHandler.initPokemon(this.playerActive);
    this.statusHandler.initPokemon(this.enemyActive);
    this.setupStates();
  }

  private setupStates(): void {
    this.fsm.registerState('INTRO', {
      enter: () => {
        // Battle intro animations would trigger here
      },
    });

    this.fsm.registerState('PLAYER_TURN', {
      enter: () => {
        // Wait for player input
      },
    });

    this.fsm.registerState('CHECK_FAINT', {
      enter: () => {
        if (this.enemyActive.currentHp <= 0) {
          // Enemy fainted — search for next alive Pokemon (AUDIT-006)
          const nextAlive = this.config.enemyParty.findIndex(
            (p, i) => i !== this.enemyActiveIndex && p.currentHp > 0
          );
          if (nextAlive === -1) {
            this.fsm.transition('VICTORY');
          } else {
            this.enemyActiveIndex = nextAlive;
            this.enemyActive = this.config.enemyParty[nextAlive];
            // Initialize status tracking and fire switch-in abilities
            this.statusHandler.initPokemon(this.enemyActive);
            const switchResult = AbilityHandler.onSwitchIn(this.enemyActive, this.playerActive, this.statusHandler);
            if (switchResult.weather) {
              this.weatherManager.setWeather(switchResult.weather, switchResult.weatherDuration);
            }
            this.fsm.transition('PLAYER_TURN');
          }
        } else if (this.playerActive.currentHp <= 0) {
          // Player's pokemon fainted — search entire party for alive member
          const nextAlive = this.config.playerParty.findIndex(
            (p, i) => i !== this.playerActiveIndex && p.currentHp > 0
          );
          if (nextAlive === -1) {
            this.fsm.transition('DEFEAT');
          } else {
            this.playerActiveIndex = nextAlive;
            this.playerActive = this.config.playerParty[nextAlive];
            this.fsm.transition('PLAYER_TURN');
          }
        } else {
          this.fsm.transition('PLAYER_TURN');
        }
      },
    });

    this.fsm.registerState('VICTORY', {});
    this.fsm.registerState('DEFEAT', {});
    this.fsm.registerState('FLEE', {});
    this.fsm.registerState('CAPTURE', {});
  }

  start(): void {
    this.fsm.transition('INTRO');
  }

  getState() { return this.fsm.getState(); }
  getPlayerActive() { return this.playerActive; }
  getEnemyActive() { return this.enemyActive; }
  getBattleType() { return this.config.type; }
  getStatusHandler() { return this.statusHandler; }
  getWeatherManager() { return this.weatherManager; }

  /** Attempt to flee from a wild battle. */
  attemptFlee(): boolean {
    if (this.config.type === 'trainer') return false;
    const escapeChance = this.playerActive.stats.speed >= this.enemyActive.stats.speed ? 1 : 0.5;
    if (seededRandom() < escapeChance) {
      this.fsm.transition('FLEE');
      return true;
    }
    return false;
  }

  /** Switch the active player Pokemon. Clears volatile statuses from old, inits new. */
  switchPokemon(index: number): boolean {
    if (index < 0 || index >= this.config.playerParty.length) return false;
    if (this.config.playerParty[index].currentHp <= 0) return false;
    this.statusHandler.clearPokemon(this.playerActive);
    this.playerActiveIndex = index;
    this.playerActive = this.config.playerParty[index];
    this.statusHandler.initPokemon(this.playerActive);
    return true;
  }

  /** Clean up the StatusEffectHandler and WeatherManager when the battle ends. */
  cleanup(): void {
    this.statusHandler.cleanup();
    this.weatherManager.cleanup();
  }

  private getEnemyMove(): string {
    const isTrainer = this.config.type === 'trainer';
    return AIController.selectMove(this.enemyActive, this.playerActive, isTrainer);
  }
}
