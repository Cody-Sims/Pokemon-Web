import { PokemonInstance } from '@data/interfaces';
import { moveData } from '@data/moves';
import { BattleStateMachine } from './BattleStateMachine';
import { MoveExecutor } from '../execution/MoveExecutor';
import { StatusEffectHandler } from '../effects/StatusEffectHandler';
import { WeatherManager } from '../effects/WeatherManager';
import { AbilityHandler } from '../effects/AbilityHandler';
import { HeldItemHandler } from '../effects/HeldItemHandler';

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
          // Enemy fainted
          this.enemyActiveIndex++;
          if (this.enemyActiveIndex >= this.config.enemyParty.length) {
            this.fsm.transition('VICTORY');
          } else {
            this.enemyActive = this.config.enemyParty[this.enemyActiveIndex];
            this.fsm.transition('PLAYER_TURN');
          }
        } else if (this.playerActive.currentHp <= 0) {
          // Player's pokemon fainted
          const nextAlive = this.config.playerParty.findIndex(
            (p, i) => i > this.playerActiveIndex && p.currentHp > 0
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

  /** Player selects a move. Uses StatusEffectHandler for stat stages, status checks, and effects. */
  selectMove(moveId: string): {
    playerResult: ReturnType<typeof MoveExecutor.execute>;
    enemyResult: ReturnType<typeof MoveExecutor.execute>;
    turnMessages: string[];
    endOfTurnMessages: string[];
  } {
    const turnMessages: string[] = [];

    // Use effective speed (accounts for stat stages and paralysis)
    const playerSpeed = this.statusHandler.getEffectiveStat(this.playerActive, 'speed');
    const enemySpeed = this.statusHandler.getEffectiveStat(this.enemyActive, 'speed');

    // Check move priority
    const playerMove = moveData[moveId];
    const enemyMoveId = this.getEnemyMove();
    const enemyMove = moveData[enemyMoveId];
    const playerPriority = playerMove?.priority ?? 0;
    const enemyPriority = enemyMove?.priority ?? 0;

    const playerFirst = playerPriority > enemyPriority
      || (playerPriority === enemyPriority && playerSpeed >= enemySpeed);

    const first = playerFirst ? this.playerActive : this.enemyActive;
    const second = playerFirst ? this.enemyActive : this.playerActive;
    const firstMove = playerFirst ? moveId : enemyMoveId;
    const secondMove = playerFirst ? enemyMoveId : moveId;

    // Turn-start check for first mover
    const firstFlinch = this.statusHandler.checkFlinch(first);
    let firstResult: ReturnType<typeof MoveExecutor.execute>;
    if (firstFlinch) {
      turnMessages.push(firstFlinch);
      firstResult = { damage: { damage: 0, effectiveness: 1, isCritical: false, isSTAB: false }, moveHit: false, moveName: '', attackerName: '', defenderName: '', effectMessages: [] };
    } else {
      const firstTurnStart = this.statusHandler.checkTurnStart(first);
      turnMessages.push(...firstTurnStart.messages);
      if (firstTurnStart.canAct) {
        firstResult = MoveExecutor.execute(first, second, firstMove, this.statusHandler);
        turnMessages.push(...firstResult.effectMessages);
      } else {
        firstResult = { damage: { damage: 0, effectiveness: 1, isCritical: false, isSTAB: false }, moveHit: false, moveName: '', attackerName: '', defenderName: '', effectMessages: [] };
      }
    }

    // Second mover only acts if alive
    let secondResult: ReturnType<typeof MoveExecutor.execute>;
    if (second.currentHp > 0) {
      const secondFlinch = this.statusHandler.checkFlinch(second);
      if (secondFlinch) {
        turnMessages.push(secondFlinch);
        secondResult = { damage: { damage: 0, effectiveness: 1, isCritical: false, isSTAB: false }, moveHit: false, moveName: '', attackerName: '', defenderName: '', effectMessages: [] };
      } else {
        const secondTurnStart = this.statusHandler.checkTurnStart(second);
        turnMessages.push(...secondTurnStart.messages);
        if (secondTurnStart.canAct) {
          secondResult = MoveExecutor.execute(second, first, secondMove, this.statusHandler);
          turnMessages.push(...secondResult.effectMessages);
        } else {
          secondResult = { damage: { damage: 0, effectiveness: 1, isCritical: false, isSTAB: false }, moveHit: false, moveName: '', attackerName: '', defenderName: '', effectMessages: [] };
        }
      }
    } else {
      secondResult = { damage: { damage: 0, effectiveness: 1, isCritical: false, isSTAB: false }, moveHit: false, moveName: '', attackerName: '', defenderName: '', effectMessages: [] };
    }

    // End-of-turn effects
    const endOfTurnMessages: string[] = [];
    if (this.playerActive.currentHp > 0) {
      const eot = this.statusHandler.applyEndOfTurn(this.playerActive, this.enemyActive);
      endOfTurnMessages.push(...eot.messages);
    }
    if (this.enemyActive.currentHp > 0) {
      const eot = this.statusHandler.applyEndOfTurn(this.enemyActive, this.playerActive);
      endOfTurnMessages.push(...eot.messages);
    }

    this.fsm.transition('CHECK_FAINT');

    return {
      playerResult: playerFirst ? firstResult : secondResult,
      enemyResult: playerFirst ? secondResult : firstResult,
      turnMessages,
      endOfTurnMessages,
    };
  }

  /** Attempt to flee from a wild battle. */
  attemptFlee(): boolean {
    if (this.config.type === 'trainer') return false;
    const escapeChance = this.playerActive.stats.speed >= this.enemyActive.stats.speed ? 1 : 0.5;
    if (Math.random() < escapeChance) {
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
    // Simple: pick a random move from enemy's available moves
    const moves = this.enemyActive.moves.filter(m => m.currentPp > 0);
    if (moves.length === 0) return 'tackle'; // Struggle fallback
    const idx = Math.floor(Math.random() * moves.length);
    return moves[idx].moveId;
  }
}
