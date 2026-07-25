import { PokemonInstance } from '@data/interfaces';
import { moveData } from '@data/moves';
import { MoveExecutor, MoveExecutionResult } from '../execution/MoveExecutor';
import { StatusEffectHandler } from '../effects/StatusEffectHandler';
import { WeatherManager } from '../effects/WeatherManager';
import { AbilityHandler } from '../effects/AbilityHandler';
import { HeldItemHandler } from '../effects/HeldItemHandler';
import { AIController } from './AIController';
import { PartnerAI } from './PartnerAI';
import type { BattleRng } from './BattleRng';
import { BattleOrchestrationEngine, doubleBattleFormatStrategy } from './BattleEngine';
import type { BattleEvent, SlotMapping } from './BattleEngine';
import type { BattleState, StateHandler } from './BattleStateMachine';
import type { MoveTarget } from './targeting-data';
import { SPREAD_MOVES } from './targeting-data';
import {
  defaultDoubleBattleTargetingPolicy,
  DoubleBattleTargetingPolicy,
} from './DoubleBattleTargetingPolicy';

// ── Move targeting ──────────────────────────────────────────────
export type { MoveTarget };
export { SPREAD_MOVES };

/** Determine the targeting type of a move based on its properties. */
export function getMoveTarget(moveId: string): MoveTarget {
  return defaultDoubleBattleTargetingPolicy.getMoveTarget(moveId);
}

// ── Types ───────────────────────────────────────────────────────

export type DoubleBattleType = 'tag-battle' | 'double-wild' | 'double-trainer';

export interface DoubleBattleConfig {
  type: DoubleBattleType;
  playerParty: PokemonInstance[];
  allyParty?: PokemonInstance[]; // For tag battles (NPC partner)
  enemyParty1: PokemonInstance[]; // First enemy trainer
  enemyParty2?: PokemonInstance[]; // Second enemy trainer (optional)
  trainerId?: string;
  allyTrainerId?: string;
  rng?: BattleRng;
  rngSeed?: number;
}

export interface TurnAction {
  type: 'move' | 'switch' | 'item';
  pokemonIndex: number; // which active slot (0 or 1)
  moveId?: string;
  targetSlot?: number; // 0-3 (0-1 own side, 2-3 enemy side)
  switchToIndex?: number;
  itemId?: string;
}

// ── DoubleBattleManager ─────────────────────────────────────────

/** Orchestrates 2v2 double battles: 4 active slots, priority-based turn order, spread moves. */
export class DoubleBattleManager {
  private engine: BattleOrchestrationEngine;
  private config: DoubleBattleConfig;
  private targetingPolicy: DoubleBattleTargetingPolicy;

  // Active Pokemon: [slot0, slot1] per side
  private playerActive: (PokemonInstance | null)[]; // [0] = player's pokemon, [1] = ally's (or player's 2nd)
  private enemyActive: (PokemonInstance | null)[]; // [0] = enemy trainer 1's, [1] = enemy trainer 2's (or same trainer's 2nd)

  // Track which party index each slot draws from
  private playerSlotMapping: (SlotMapping | null)[];
  private enemySlotMapping: (SlotMapping | null)[];

  private turnCount = 0;

  constructor(config: DoubleBattleConfig) {
    this.config = config;
    this.targetingPolicy = defaultDoubleBattleTargetingPolicy;
    const active = doubleBattleFormatStrategy.createInitialActive(config);
    this.playerActive = active.playerActive;
    this.enemyActive = active.enemyActive;
    this.playerSlotMapping = active.playerSlotMapping;
    this.enemySlotMapping = active.enemySlotMapping;
    this.engine = new BattleOrchestrationEngine({
      format: doubleBattleFormatStrategy.format,
      rng: config.rng,
      rngSeed: config.rngSeed,
      stateHandlers: this.createStateHandlers(),
    });
    this.engine.initActivePokemon(doubleBattleFormatStrategy.getActivePokemon(active));
  }

  private get statusHandler(): StatusEffectHandler {
    return this.engine.getStatusHandler();
  }

  private get weatherManager(): WeatherManager {
    return this.engine.getWeatherManager();
  }

  private get rng(): BattleRng {
    return this.engine.getRng();
  }

  private createStateHandlers(): Partial<Record<BattleState, StateHandler>> {
    return {
      INTRO: {
        enter: () => {
          /* Battle intro animations trigger here */
        },
      },
      PLAYER_TURN: {
        enter: () => {
          /* Wait for player/ally input */
        },
      },
      EXECUTE_TURN: {
        enter: () => {
          /* Turn execution in progress */
        },
      },
      CHECK_FAINT: {
        enter: () => {
          /* Check for faints and replacements */
        },
      },
      REPLACE: {
        enter: () => {
          /* Prompt replacement for fainted slots */
        },
      },
    };
  }

  start(): void {
    this.engine.transition('INTRO');
  }

  /** Get all 4 active battlers in order [playerSlot0, playerSlot1, enemySlot0, enemySlot1]. */
  getActiveBattlers(): (PokemonInstance | null)[] {
    return [this.playerActive[0], this.playerActive[1], this.enemyActive[0], this.enemyActive[1]];
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
    this.engine.transition('EXECUTE_TURN');

    // Clear protect at the start of each turn so it doesn't persist
    this.statusHandler.clearProtectAll();

    const turnMessages: string[] = [];
    const results: MoveExecutionResult[] = [];
    const allActive = this.getActiveBattlers();

    // Build sorted action list: priority desc, then speed desc
    const sortedActions = [...actions]
      .filter((a) => {
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
          turnMessages.push(...this.getLastSwitchMessages());
        }
        continue;
      }

      if (action.type === 'move' && action.moveId) {
        const targets = this.targetingPolicy.resolveTargets({
          attackerSlot: action.pokemonIndex,
          moveId: action.moveId,
          targetSlot: action.targetSlot,
          activeBattlers: this.getActiveBattlers(),
        });

        // Check turn-start status (paralysis, sleep, confusion, etc.)
        const flinch = this.statusHandler.checkFlinch(attacker);
        if (flinch) {
          turnMessages.push(flinch);
          continue;
        }
        const turnStart = this.statusHandler.checkTurnStart(attacker);
        turnMessages.push(...turnStart.messages);
        if (!turnStart.canAct) continue;

        // Deduct PP once before iterating targets (spread moves deducted PP per target)
        const isSpread = targets.length > 1;
        let ppDeducted = false;

        for (const targetIdx of targets) {
          // Re-check attacker is still alive before each hit (MED-7: faint mid-execute)
          if (!attacker || attacker.currentHp <= 0) break;

          const refreshedActive = this.getActiveBattlers();
          const defender = refreshedActive[targetIdx];
          if (!defender || defender.currentHp <= 0) continue;

          // Compute spread damage reduction BEFORE applying to defender HP
          const skipPP = ppDeducted;
          const hpBefore = defender.currentHp;
          const result = MoveExecutor.execute(
            attacker,
            defender,
            action.moveId,
            this.statusHandler,
            this.weatherManager,
            skipPP,
            this.rng,
          );
          ppDeducted = true;

          // Apply 75% spread-move reduction: restore to pre-hit HP, apply reduced damage
          if (isSpread && result.damage.damage > 0) {
            const fullDmg = result.damage.damage;
            const reducedDmg = Math.floor(fullDmg * 0.75);
            defender.currentHp = Math.max(0, hpBefore - reducedDmg);
            result.damage = { ...result.damage, damage: reducedDmg };
          }

          results.push(result);
          turnMessages.push(...result.effectMessages);
        }
      }
    }

    // End-of-turn effects for all active
    const endOfTurnMessages: string[] = [];

    // AUDIT-008: Tick weather and apply end-of-turn weather damage in doubles
    const weatherTickMsgs = this.weatherManager.tickTurn();
    endOfTurnMessages.push(...weatherTickMsgs);

    const refreshedActive = this.getActiveBattlers();
    for (let i = 0; i < 4; i++) {
      const pokemon = refreshedActive[i];
      if (!pokemon || pokemon.currentHp <= 0) continue;

      // Find an opposing pokemon for end-of-turn context
      const opponentIdx =
        i < 2
          ? (refreshedActive[2]?.currentHp ?? 0) > 0
            ? 2
            : 3
          : (refreshedActive[0]?.currentHp ?? 0) > 0
            ? 0
            : 1;
      const opponent = refreshedActive[opponentIdx];
      if (opponent && opponent.currentHp > 0) {
        const eot = this.statusHandler.applyEndOfTurn(pokemon, opponent);
        endOfTurnMessages.push(...eot.messages);
      }

      // Ability end-of-turn effects (Speed Boost, Poison Heal, etc.)
      if (pokemon.currentHp > 0) {
        const abilityEot = AbilityHandler.onEndOfTurn(pokemon, this.statusHandler);
        endOfTurnMessages.push(...abilityEot.messages);
      }

      // Held item end-of-turn effects (Leftovers, Black Sludge, etc.)
      if (pokemon.currentHp > 0) {
        const itemEot = HeldItemHandler.onEndOfTurn(pokemon);
        endOfTurnMessages.push(...itemEot.messages);
      }

      // AUDIT-008: Apply weather chip damage (sandstorm/hail) to each active Pokemon
      if (pokemon.currentHp > 0) {
        const weatherDmg = this.weatherManager.applyEndOfTurn(pokemon);
        if (weatherDmg) endOfTurnMessages.push(...weatherDmg.messages);
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

    this.engine.transition('CHECK_FAINT');

    return { results, turnMessages, endOfTurnMessages, faintedSlots };
  }

  /** Get valid targets for a move from a given slot. */
  getValidTargets(slot: number, moveId: string): number[] {
    return this.targetingPolicy.getValidTargets(slot, moveId, this.getActiveBattlers());
  }

  /** Check if either side has won. */
  checkBattleEnd(): 'ongoing' | 'victory' | 'defeat' {
    const state = this.engine.getState();
    if (state === 'VICTORY') return 'victory';
    if (state === 'DEFEAT') return 'defeat';

    const playerSideAlive = this.hasAliveRemaining(true);
    const enemySideAlive = this.hasAliveRemaining(false);

    if (!enemySideAlive) {
      this.engine.transition('VICTORY');
      return 'victory';
    }
    if (!playerSideAlive) {
      this.engine.transition('DEFEAT');
      return 'defeat';
    }
    return 'ongoing';
  }

  /** Check if any Pokemon remain alive on a side (active + bench). */
  private hasAliveRemaining(isPlayerSide: boolean): boolean {
    if (isPlayerSide) {
      // Check player party
      if (this.config.playerParty.some((p) => p.currentHp > 0)) return true;
      // Check ally party in tag battles
      if (this.config.type === 'tag-battle' && this.config.allyParty) {
        return this.config.allyParty.some((p) => p.currentHp > 0);
      }
      return false;
    } else {
      if (this.config.enemyParty1.some((p) => p.currentHp > 0)) return true;
      if (this.config.enemyParty2) {
        return this.config.enemyParty2.some((p) => p.currentHp > 0);
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

    // Fire switch-in abilities (Intimidate, weather setters, etc.)
    const opponent = isPlayerSide
      ? (this.enemyActive[0]?.currentHp ?? 0) > 0
        ? this.enemyActive[0]!
        : this.enemyActive[1]
      : (this.playerActive[0]?.currentHp ?? 0) > 0
        ? this.playerActive[0]!
        : this.playerActive[1];
    if (opponent && opponent.currentHp > 0) {
      this.lastSwitchMessages = this.engine.applySwitchInAbility(newPokemon, opponent);
    }

    return true;
  }

  /** Messages produced by the most recent switchPokemon call (ability triggers, etc.). */
  private lastSwitchMessages: string[] = [];

  /** Retrieve and clear messages from the last switch-in. */
  getLastSwitchMessages(): string[] {
    const msgs = this.lastSwitchMessages;
    this.lastSwitchMessages = [];
    return msgs;
  }

  getState(): string {
    return this.engine.getState();
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

  getTurnCount(): number {
    return this.turnCount;
  }

  /** Clean up the StatusEffectHandler and WeatherManager when the battle ends. */
  cleanup(): void {
    this.engine.cleanup();
  }

  drainEvents(): BattleEvent[] {
    return this.engine.drainEvents();
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
