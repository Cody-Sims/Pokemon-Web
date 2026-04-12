import { PokemonInstance } from '@data/interfaces';
import { BattleStateMachine } from './BattleStateMachine';
import { MoveExecutor } from './MoveExecutor';

export type BattleType = 'wild' | 'trainer';

export interface BattleConfig {
  type: BattleType;
  playerParty: PokemonInstance[];
  enemyParty: PokemonInstance[];
  trainerId?: string;
}

/** Orchestrates the battle: turn order, win/loss conditions, party management. */
export class BattleManager {
  private fsm: BattleStateMachine;
  private config: BattleConfig;
  private playerActive: PokemonInstance;
  private enemyActive: PokemonInstance;
  private playerActiveIndex = 0;
  private enemyActiveIndex = 0;

  constructor(config: BattleConfig) {
    this.config = config;
    this.playerActive = config.playerParty[0];
    this.enemyActive = config.enemyParty[0];
    this.fsm = new BattleStateMachine();
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

  /** Player selects a move. */
  selectMove(moveId: string): { playerResult: ReturnType<typeof MoveExecutor.execute>; enemyResult: ReturnType<typeof MoveExecutor.execute> } {
    // Determine turn order by speed
    const playerSpeed = this.playerActive.stats.speed;
    const enemySpeed = this.enemyActive.stats.speed;
    const playerFirst = playerSpeed >= enemySpeed;

    const first = playerFirst ? this.playerActive : this.enemyActive;
    const second = playerFirst ? this.enemyActive : this.playerActive;
    const firstMove = playerFirst ? moveId : this.getEnemyMove();
    const secondMove = playerFirst ? this.getEnemyMove() : moveId;

    const firstResult = MoveExecutor.execute(first, second, firstMove);
    let secondResult;

    if (second.currentHp > 0) {
      secondResult = MoveExecutor.execute(second, first, secondMove);
    } else {
      secondResult = {
        damage: { damage: 0, effectiveness: 1, isCritical: false, isSTAB: false },
        moveHit: false,
        moveName: '',
        attackerName: '',
        defenderName: '',
        effectMessages: [] as string[],
      };
    }

    this.fsm.transition('CHECK_FAINT');

    return {
      playerResult: playerFirst ? firstResult : secondResult,
      enemyResult: playerFirst ? secondResult : firstResult,
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

  /** Switch the active player Pokemon. */
  switchPokemon(index: number): boolean {
    if (index < 0 || index >= this.config.playerParty.length) return false;
    if (this.config.playerParty[index].currentHp <= 0) return false;
    this.playerActiveIndex = index;
    this.playerActive = this.config.playerParty[index];
    return true;
  }

  private getEnemyMove(): string {
    // Simple: pick a random move from enemy's available moves
    const moves = this.enemyActive.moves.filter(m => m.currentPp > 0);
    if (moves.length === 0) return 'tackle'; // Struggle fallback
    const idx = Math.floor(Math.random() * moves.length);
    return moves[idx].moveId;
  }
}
