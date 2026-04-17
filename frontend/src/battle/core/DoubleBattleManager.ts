import { PokemonInstance } from '@data/interfaces';
import { moveData } from '@data/moves';
import { BattleStateMachine } from './BattleStateMachine';
import { MoveExecutor, MoveExecutionResult } from '../execution/MoveExecutor';
import { StatusEffectHandler } from '../effects/StatusEffectHandler';
import { WeatherManager } from '../effects/WeatherManager';
import { AbilityHandler } from '../effects/AbilityHandler';
import { HeldItemHandler } from '../effects/HeldItemHandler';
import { AIController } from './AIController';
import { PartnerAI } from './PartnerAI';

// ── Move targeting ──────────────────────────────────────────────

export type MoveTarget = 'single-enemy' | 'both-enemies' | 'single-ally' | 'self' | 'all-adjacent' | 'all';

/** Moves that hit all adjacent Pokemon (both enemies in doubles, may also hit ally). */
export const SPREAD_MOVES = new Set<string>([
  'earthquake', 'surf', 'rock-slide', 'blizzard', 'dazzling-gleam',
  'discharge', 'heat-wave', 'muddy-water', 'sludge-wave', 'hyper-voice',
  'icy-wind', 'razor-leaf', 'swift', 'eruption', 'water-spout',
  'bubble', 'electroweb', 'breaking-swipe', 'bulldoze',
]);

/** Self-targeting moves (recovery, stat-boost on self, etc.) */
const SELF_TARGET_MOVES = new Set<string>([
  'recover', 'softboiled', 'roost', 'synthesis', 'moonlight', 'morning-sun',
  'swords-dance', 'dragon-dance', 'calm-mind', 'nasty-plot', 'agility',
  'iron-defense', 'amnesia', 'bulk-up', 'quiver-dance', 'shell-smash',
  'curse', 'minimize', 'substitute', 'rest', 'stockpile',
]);

/** Determine the targeting type of a move based on its properties. */
export function getMoveTarget(moveId: string): MoveTarget {
  if (SELF_TARGET_MOVES.has(moveId)) return 'self';
  if (SPREAD_MOVES.has(moveId)) return 'all-adjacent';

  const move = moveData[moveId];
  if (!move) return 'single-enemy';

  // Healing moves that can target allies
  if (move.effect?.type === 'heal' && move.category === 'status') {
    return 'self';
  }

  return 'single-enemy';
}

// ── Types ───────────────────────────────────────────────────────

export type DoubleBattleType = 'tag-battle' | 'double-wild' | 'double-trainer';

export interface DoubleBattleConfig {
  type: DoubleBattleType;
  playerParty: PokemonInstance[];
  allyParty?: PokemonInstance[];      // For tag battles (NPC partner)
  enemyParty1: PokemonInstance[];     // First enemy trainer
  enemyParty2?: PokemonInstance[];    // Second enemy trainer (optional)
  trainerId?: string;
  allyTrainerId?: string;
}

export interface TurnAction {
  type: 'move' | 'switch' | 'item';
  pokemonIndex: number;  // which active slot (0 or 1)
  moveId?: string;
  targetSlot?: number;   // 0-3 (0-1 own side, 2-3 enemy side)
  switchToIndex?: number;
  itemId?: string;
}

interface SlotMapping {
  party: PokemonInstance[];
  partyIndex: number;
}

// ── DoubleBattleManager ─────────────────────────────────────────

/** Orchestrates 2v2 double battles: 4 active slots, priority-based turn order, spread moves. */
export class DoubleBattleManager {
  private fsm: BattleStateMachine;
  private config: DoubleBattleConfig;

  // Active Pokemon: [slot0, slot1] per side
  private playerActive: (PokemonInstance | null)[];  // [0] = player's pokemon, [1] = ally's (or player's 2nd)
  private enemyActive: (PokemonInstance | null)[];   // [0] = enemy trainer 1's, [1] = enemy trainer 2's (or same trainer's 2nd)

  // Track which party index each slot draws from
  private playerSlotMapping: (SlotMapping | null)[];
  private enemySlotMapping: (SlotMapping | null)[];

  private statusHandler: StatusEffectHandler;
  private weatherManager: WeatherManager;
  private turnCount = 0;

  constructor(config: DoubleBattleConfig) {
    this.config = config;
    this.fsm = new BattleStateMachine();
    this.statusHandler = new StatusEffectHandler();
    this.weatherManager = new WeatherManager();

    // Initialize player side
    const p0 = config.playerParty[0] ?? null;
    let p1: PokemonInstance | null = null;
    if (config.type === 'tag-battle' && config.allyParty && config.allyParty.length > 0) {
      p1 = config.allyParty[0];
    } else if (config.playerParty.length > 1) {
      p1 = config.playerParty[1];
    }
    this.playerActive = [p0, p1];

    this.playerSlotMapping = [
      p0 ? { party: config.playerParty, partyIndex: 0 } : null,
      p1
        ? (config.type === 'tag-battle' && config.allyParty
          ? { party: config.allyParty, partyIndex: 0 }
          : { party: config.playerParty, partyIndex: 1 })
        : null,
    ];

    // Initialize enemy side
    const e0 = config.enemyParty1[0] ?? null;
    let e1: PokemonInstance | null = null;
    if (config.enemyParty2 && config.enemyParty2.length > 0) {
      e1 = config.enemyParty2[0];
    } else if (config.enemyParty1.length > 1) {
      e1 = config.enemyParty1[1];
    }
    this.enemyActive = [e0, e1];

    this.enemySlotMapping = [
      e0 ? { party: config.enemyParty1, partyIndex: 0 } : null,
      e1
        ? (config.enemyParty2
          ? { party: config.enemyParty2, partyIndex: 0 }
          : { party: config.enemyParty1, partyIndex: 1 })
        : null,
    ];

    // Init status for all active
    for (const p of [...this.playerActive, ...this.enemyActive]) {
      if (p) this.statusHandler.initPokemon(p);
    }

    this.setupStates();
  }

  private setupStates(): void {
    this.fsm.registerState('INTRO', {
      enter: () => { /* Battle intro animations trigger here */ },
    });
    this.fsm.registerState('PLAYER_TURN', {
      enter: () => { /* Wait for player/ally input */ },
    });
    this.fsm.registerState('EXECUTE_TURN', {
      enter: () => { /* Turn execution in progress */ },
    });
    this.fsm.registerState('CHECK_FAINT', {
      enter: () => { /* Check for faints and replacements */ },
    });
    this.fsm.registerState('REPLACE', {
      enter: () => { /* Prompt replacement for fainted slots */ },
    });
    this.fsm.registerState('VICTORY', {});
    this.fsm.registerState('DEFEAT', {});
  }

  start(): void {
    this.fsm.transition('INTRO');
  }

  /** Get all 4 active battlers in order [playerSlot0, playerSlot1, enemySlot0, enemySlot1]. */
  getActiveBattlers(): (PokemonInstance | null)[] {
    return [
      this.playerActive[0],
      this.playerActive[1],
      this.enemyActive[0],
      this.enemyActive[1],
    ];
  }

  /**
   * Execute a full turn with actions for all battlers.
   * Sorts by priority then speed, executes sequentially.
   * Returns ordered results.
   */
  executeTurn(actions: TurnAction[]): {
    results: MoveExecutionResult[];
    turnMessages: string[];
    endOfTurnMessages: string[];
    faintedSlots: number[];
  } {
    this.turnCount++;
    this.fsm.transition('EXECUTE_TURN');

    const turnMessages: string[] = [];
    const results: MoveExecutionResult[] = [];
    const allActive = this.getActiveBattlers();

    // Build sorted action list: priority desc, then speed desc
    const sortedActions = [...actions]
      .filter(a => {
        const pokemon = allActive[a.pokemonIndex];
        return pokemon && pokemon.currentHp > 0;
      })
      .sort((a, b) => {
        // Switches always go first
        if (a.type === 'switch' && b.type !== 'switch') return -1;
        if (b.type === 'switch' && a.type !== 'switch') return 1;

        const moveA = a.moveId ? moveData[a.moveId] : null;
        const moveB = b.moveId ? moveData[b.moveId] : null;
        const prioA = moveA?.priority ?? 0;
        const prioB = moveB?.priority ?? 0;

        if (prioA !== prioB) return prioB - prioA;

        const pokemonA = allActive[a.pokemonIndex];
        const pokemonB = allActive[b.pokemonIndex];
        const speedA = pokemonA ? this.statusHandler.getEffectiveStat(pokemonA, 'speed') : 0;
        const speedB = pokemonB ? this.statusHandler.getEffectiveStat(pokemonB, 'speed') : 0;
        return speedB - speedA;
      });

    // Execute each action in order
    for (const action of sortedActions) {
      const attacker = allActive[action.pokemonIndex];
      if (!attacker || attacker.currentHp <= 0) continue; // Fainted mid-turn

      if (action.type === 'switch' && action.switchToIndex !== undefined) {
        const switched = this.switchPokemon(action.pokemonIndex, action.switchToIndex);
        if (switched) {
          turnMessages.push(`Switched in slot ${action.pokemonIndex}!`);
        }
        continue;
      }

      if (action.type === 'move' && action.moveId) {
        const moveTarget = getMoveTarget(action.moveId);
        const targets = this.resolveTargets(action.pokemonIndex, action.moveId, action.targetSlot, moveTarget);

        // Check turn-start status (paralysis, sleep, confusion, etc.)
        const flinch = this.statusHandler.checkFlinch(attacker);
        if (flinch) {
          turnMessages.push(flinch);
          continue;
        }
        const turnStart = this.statusHandler.checkTurnStart(attacker);
        turnMessages.push(...turnStart.messages);
        if (!turnStart.canAct) continue;

        // Execute against each target; spread moves deal 75% to each
        for (const targetIdx of targets) {
          const refreshedActive = this.getActiveBattlers();
          const defender = refreshedActive[targetIdx];
          if (!defender || defender.currentHp <= 0) continue;

          const result = MoveExecutor.execute(
            attacker,
            defender,
            action.moveId,
            this.statusHandler,
            this.weatherManager,
          );

          // BUG-048: Apply spread move reduction BEFORE damage is final
          // MoveExecutor already applied full damage, so we add back the difference
          if (targets.length > 1 && result.damage.damage > 0) {
            const reduced = Math.floor(result.damage.damage * 0.75);
            const diff = result.damage.damage - reduced;
            // Restore the over-dealt damage
            defender.currentHp = Math.min(defender.currentHp + diff, defender.stats.hp);
            result.damage = { ...result.damage, damage: reduced };
          }

          results.push(result);
          turnMessages.push(...result.effectMessages);
        }
      }
    }

    // End-of-turn effects for all active
    const endOfTurnMessages: string[] = [];
    const refreshedActive = this.getActiveBattlers();
    for (let i = 0; i < 4; i++) {
      const pokemon = refreshedActive[i];
      if (!pokemon || pokemon.currentHp <= 0) continue;

      // Find an opposing pokemon for end-of-turn context
      const opponentIdx = i < 2 ? (refreshedActive[2]?.currentHp ?? 0) > 0 ? 2 : 3 : (refreshedActive[0]?.currentHp ?? 0) > 0 ? 0 : 1;
      const opponent = refreshedActive[opponentIdx];
      if (opponent && opponent.currentHp > 0) {
        const eot = this.statusHandler.applyEndOfTurn(pokemon, opponent);
        endOfTurnMessages.push(...eot.messages);
      }
    }

    // Identify fainted slots
    const finalActive = this.getActiveBattlers();
    const faintedSlots: number[] = [];
    for (let i = 0; i < 4; i++) {
      const p = finalActive[i];
      if (p && p.currentHp <= 0) {
        faintedSlots.push(i);
      }
    }

    this.fsm.transition('CHECK_FAINT');

    return { results, turnMessages, endOfTurnMessages, faintedSlots };
  }

  /** Resolve actual target slot indices for a move action. */
  private resolveTargets(
    attackerSlot: number,
    moveId: string,
    targetSlot: number | undefined,
    moveTarget: MoveTarget,
  ): number[] {
    const isPlayerSide = attackerSlot < 2;

    switch (moveTarget) {
      case 'self':
        return [attackerSlot];

      case 'single-ally': {
        const allySlot = isPlayerSide ? (attackerSlot === 0 ? 1 : 0) : (attackerSlot === 2 ? 3 : 2);
        return [allySlot];
      }

      case 'both-enemies':
        return isPlayerSide ? [2, 3] : [0, 1];

      case 'all-adjacent': {
        // Hits both enemies (spread moves in doubles)
        const enemies = isPlayerSide ? [2, 3] : [0, 1];
        return enemies;
      }

      case 'all':
        return [0, 1, 2, 3].filter(i => i !== attackerSlot);

      case 'single-enemy':
      default:
        if (targetSlot !== undefined) return [targetSlot];
        // Default: target first alive enemy
        if (isPlayerSide) {
          const active = this.getActiveBattlers();
          if (active[2] && active[2].currentHp > 0) return [2];
          if (active[3] && active[3].currentHp > 0) return [3];
        } else {
          const active = this.getActiveBattlers();
          if (active[0] && active[0].currentHp > 0) return [0];
          if (active[1] && active[1].currentHp > 0) return [1];
        }
        return [];
    }
  }

  /** Get valid targets for a move from a given slot. */
  getValidTargets(slot: number, moveId: string): number[] {
    const moveTarget = getMoveTarget(moveId);
    const isPlayerSide = slot < 2;
    const active = this.getActiveBattlers();

    switch (moveTarget) {
      case 'self':
        return [slot];

      case 'single-ally': {
        const allySlot = isPlayerSide ? (slot === 0 ? 1 : 0) : (slot === 2 ? 3 : 2);
        return active[allySlot] && active[allySlot]!.currentHp > 0 ? [allySlot] : [];
      }

      case 'both-enemies':
      case 'all-adjacent':
        // Auto-targets, no choice needed; return enemy slots that are alive
        return (isPlayerSide ? [2, 3] : [0, 1]).filter(
          i => active[i] && active[i]!.currentHp > 0,
        );

      case 'all':
        return [0, 1, 2, 3].filter(i => i !== slot && active[i] && active[i]!.currentHp > 0);

      case 'single-enemy':
      default:
        // Player can choose which enemy to target
        return (isPlayerSide ? [2, 3] : [0, 1]).filter(
          i => active[i] && active[i]!.currentHp > 0,
        );
    }
  }

  /** Check if either side has won. */
  checkBattleEnd(): 'ongoing' | 'victory' | 'defeat' {
    const playerSideAlive = this.hasAliveRemaining(true);
    const enemySideAlive = this.hasAliveRemaining(false);

    if (!enemySideAlive) {
      this.fsm.transition('VICTORY');
      return 'victory';
    }
    if (!playerSideAlive) {
      this.fsm.transition('DEFEAT');
      return 'defeat';
    }
    return 'ongoing';
  }

  /** Check if any Pokemon remain alive on a side (active + bench). */
  private hasAliveRemaining(isPlayerSide: boolean): boolean {
    if (isPlayerSide) {
      // Check player party
      if (this.config.playerParty.some(p => p.currentHp > 0)) return true;
      // Check ally party in tag battles
      if (this.config.type === 'tag-battle' && this.config.allyParty) {
        return this.config.allyParty.some(p => p.currentHp > 0);
      }
      return false;
    } else {
      if (this.config.enemyParty1.some(p => p.currentHp > 0)) return true;
      if (this.config.enemyParty2) {
        return this.config.enemyParty2.some(p => p.currentHp > 0);
      }
      return false;
    }
  }

  /** Switch a pokemon in the given slot. */
  switchPokemon(slot: number, partyIndex: number): boolean {
    const isPlayerSide = slot < 2;
    const mapping = isPlayerSide ? this.playerSlotMapping[slot] : this.enemySlotMapping[slot - 2];
    if (!mapping) return false;

    const party = mapping.party;
    if (partyIndex < 0 || partyIndex >= party.length) return false;

    const newPokemon = party[partyIndex];
    if (newPokemon.currentHp <= 0) return false;

    // Don't switch to a pokemon that's already active in another slot
    const active = this.getActiveBattlers();
    for (let i = 0; i < 4; i++) {
      if (i !== slot && active[i] === newPokemon) return false;
    }

    // Clear old, activate new
    const current = isPlayerSide ? this.playerActive[slot] : this.enemyActive[slot - 2];
    if (current) {
      this.statusHandler.clearPokemon(current);
    }

    if (isPlayerSide) {
      this.playerActive[slot] = newPokemon;
      this.playerSlotMapping[slot] = { party, partyIndex };
    } else {
      this.enemyActive[slot - 2] = newPokemon;
      this.enemySlotMapping[slot - 2] = { party, partyIndex };
    }

    this.statusHandler.initPokemon(newPokemon);
    return true;
  }

  getState(): string {
    return this.fsm.getState();
  }

  getStatusHandler(): StatusEffectHandler {
    return this.statusHandler;
  }

  getWeatherManager(): WeatherManager {
    return this.weatherManager;
  }

  getTurnCount(): number {
    return this.turnCount;
  }

  /** Clean up the StatusEffectHandler and WeatherManager when the battle ends. */
  cleanup(): void {
    this.statusHandler.cleanup();
    this.weatherManager.cleanup();
  }

  /**
   * Generate a TurnAction for the NPC partner in a tag battle (slot 1).
   * Uses PartnerAI for smarter move selection that considers ally safety.
   */
  getPartnerAction(): TurnAction | null {
    const partner = this.playerActive[1];
    if (!partner || partner.currentHp <= 0) return null;

    const ally = this.playerActive[0]; // The player's Pokémon
    const enemies = [this.enemyActive[0], this.enemyActive[1]];

    const { moveId, targetSlot } = PartnerAI.selectMove(partner, enemies, ally);

    return {
      type: 'move',
      pokemonIndex: 1, // Partner is always slot 1
      moveId,
      targetSlot: targetSlot,
    };
  }
}
