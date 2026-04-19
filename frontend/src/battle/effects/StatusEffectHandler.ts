import { PokemonInstance, MoveData } from '@data/interfaces';
import { moveData } from '@data/moves';
import { pokemonData } from '@data/pokemon';
import { clamp, randomInt } from '@utils/math-helpers';
import { StatStages, StatusCondition, VolatileStatus, MoveEffect, PokemonType } from '@utils/type-helpers';

// ── Result types ────────────────────────────────────────────────

export interface TurnStartResult {
  canAct: boolean;
  messages: string[];
}

export interface EffectResult {
  messages: string[];
  healedHp?: number;
  recoilDamage?: number;
  selfDestruct?: boolean;
}

export interface EndOfTurnResult {
  damage: number;
  messages: string[];
  fainted: boolean;
}

// ── Per-pokemon volatile battle state ──────────────────────────

interface BattlePokemonState {
  statStages: StatStages;
  volatileStatuses: Set<VolatileStatus>;
  confusionTurns: number;
  trapTurns: number;
  protectSuccessRate: number;  // Halves each consecutive use (1.0, 0.5, 0.25...)
  twoTurnCharging: string | null;  // Move ID being charged (Fly, Dig, Solar Beam)
}

// ── Stage multipliers ──────────────────────────────────────────

const STAGE_MULTIPLIERS: Record<number, number> = {
  [-6]: 2 / 8, [-5]: 2 / 7, [-4]: 2 / 6, [-3]: 2 / 5,
  [-2]: 2 / 4, [-1]: 2 / 3,  [0]: 1,
  [1]: 3 / 2, [2]: 4 / 2, [3]: 5 / 2, [4]: 6 / 2, [5]: 7 / 2, [6]: 8 / 2,
};

const STAT_NAMES: Record<keyof StatStages, string> = {
  attack: 'Attack', defense: 'Defense',
  spAttack: 'Sp. Atk', spDefense: 'Sp. Def', speed: 'Speed',
};

// ── Helper to get a pokemon display name ───────────────────────

function pokeName(p: PokemonInstance): string {
  return p.nickname ?? `Pokémon #${p.dataId}`;
}

// ════════════════════════════════════════════════════════════════
// StatusEffectHandler — manages all in-battle status / effects
// ════════════════════════════════════════════════════════════════

export class StatusEffectHandler {
  private states = new Map<PokemonInstance, BattlePokemonState>();

  // ── Lifecycle ────────────────────────────────────────────────

  /** Call once per pokemon when entering battle. */
  initPokemon(pokemon: PokemonInstance): void {
    this.states.set(pokemon, {
      statStages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
      volatileStatuses: new Set(),
      confusionTurns: 0,
      trapTurns: 0,
      protectSuccessRate: 1.0,
      twoTurnCharging: null,
    });
  }

  /** Remove all volatile state (call when pokemon switches out or battle ends). */
  clearPokemon(pokemon: PokemonInstance): void {
    this.states.delete(pokemon);
  }

  /** Tear down everything. */
  cleanup(): void {
    this.states.clear();
  }

  // ── Stat stage helpers ───────────────────────────────────────

  getState(pokemon: PokemonInstance): BattlePokemonState {
    let s = this.states.get(pokemon);
    if (!s) {
      this.initPokemon(pokemon);
      s = this.states.get(pokemon)!;
    }
    return s;
  }

  /** Return the effective stat value (base × stage multiplier × status modifiers). */
  getEffectiveStat(pokemon: PokemonInstance, stat: keyof StatStages): number {
    const base = pokemon.stats[stat];
    const stage = this.getState(pokemon).statStages[stat];
    let value = Math.floor(base * STAGE_MULTIPLIERS[stage]);

    // Burn halves physical attack
    if (stat === 'attack' && pokemon.status === 'burn') {
      value = Math.floor(value * 0.5);
    }
    // Paralysis quarters speed
    if (stat === 'speed' && pokemon.status === 'paralysis') {
      value = Math.floor(value * 0.25);
    }

    return Math.max(1, value);
  }

  // ── Turn-start check ────────────────────────────────────────

  /** Check whether a pokemon can act this turn. Handles sleep, freeze, paralysis, confusion. */
  checkTurnStart(pokemon: PokemonInstance): TurnStartResult {
    const name = pokeName(pokemon);
    const messages: string[] = [];
    const state = this.getState(pokemon);

    // Clear flinch (it's always a one-turn thing set by the opponent's attack)
    state.volatileStatuses.delete('flinch');

    // ── Flinch (set during the opponent's attack phase) ──
    // Handled below after the move that triggers it — the flag is consumed at
    // the TOP of the flinching pokemon's move execution in `runTurnStep`.

    // ── Sleep ──
    if (pokemon.status === 'sleep') {
      if (pokemon.statusTurns !== undefined && pokemon.statusTurns > 0) {
        pokemon.statusTurns--;
        if (pokemon.statusTurns <= 0) {
          pokemon.status = null;
          pokemon.statusTurns = undefined;
          messages.push(`${name} woke up!`);
          return { canAct: true, messages };
        }
      }
      messages.push(`${name} is fast asleep.`);
      return { canAct: false, messages };
    }

    // ── Freeze ──
    if (pokemon.status === 'freeze') {
      // 20% chance to thaw each turn
      if (Math.random() < 0.2) {
        pokemon.status = null;
        messages.push(`${name} thawed out!`);
      } else {
        messages.push(`${name} is frozen solid!`);
        return { canAct: false, messages };
      }
    }

    // ── Paralysis ──
    if (pokemon.status === 'paralysis') {
      if (Math.random() < 0.25) {
        messages.push(`${name} is paralyzed! It can't move!`);
        return { canAct: false, messages };
      }
    }

    // ── Confusion ──
    if (state.volatileStatuses.has('confusion')) {
      state.confusionTurns--;
      if (state.confusionTurns <= 0) {
        state.volatileStatuses.delete('confusion');
        messages.push(`${name} snapped out of confusion!`);
      } else {
        messages.push(`${name} is confused!`);
        // 50% chance to hit self
        if (Math.random() < 0.5) {
          const selfDamage = Math.max(1, Math.floor(pokemon.stats.attack * 0.1));
          pokemon.currentHp = Math.max(0, pokemon.currentHp - selfDamage);
          messages.push(`It hurt itself in its confusion! ${selfDamage} dmg.`);
          return { canAct: false, messages };
        }
      }
    }

    return { canAct: true, messages };
  }

  // ── Flinch (checked separately) ─────────────────────────────

  /** Returns true if the pokemon flinches this turn (and should skip its move). */
  checkFlinch(pokemon: PokemonInstance): string | null {
    const state = this.getState(pokemon);
    if (state.volatileStatuses.has('flinch')) {
      state.volatileStatuses.delete('flinch');
      return `${pokeName(pokemon)} flinched and couldn't move!`;
    }
    return null;
  }

  /** BUG-033: Clear flinch volatiles for all active Pokemon at turn start. */
  clearFlinchAll(): void {
    for (const state of this.states.values()) {
      state.volatileStatuses.delete('flinch');
    }
  }

  // ── Fire-type thawing ───────────────────────────────────────

  /** Check if a fire-type move thaws a frozen defender. Call before damage. */
  checkThaw(defender: PokemonInstance, move: MoveData): string | null {
    if (move.type === 'fire' && defender.status === 'freeze') {
      defender.status = null;
      return `${pokeName(defender)} was thawed out by the attack!`;
    }
    return null;
  }

  // ── Type-based status immunity check ────────────────────────

  /** Returns true if the target is immune to the given status based on its type. */
  private isImmuneToStatus(target: PokemonInstance, status: string): boolean {
    const data = pokemonData[target.dataId];
    if (!data) return false;
    const types = data.types as PokemonType[];

    switch (status) {
      case 'burn':        return types.includes('fire');
      case 'paralysis':   return types.includes('electric');
      case 'poison':
      case 'bad-poison':  return types.includes('poison') || types.includes('steel');
      case 'freeze':      return types.includes('ice');
      default:            return false;
    }
  }

  // ── Apply a move's secondary effect ─────────────────────────

  applyMoveEffect(
    attacker: PokemonInstance,
    defender: PokemonInstance,
    move: MoveData,
    damageDealt: number,
  ): EffectResult {
    const effect = move.effect;
    if (!effect) return { messages: [] };

    const messages: string[] = [];
    let healedHp = 0;
    let recoilDamage = 0;
    let selfDestruct = false;

    // Check probability
    const chance = effect.chance ?? 100;
    if (Math.random() * 100 >= chance) return { messages: [] };

    const target = effect.target === 'self' ? attacker : defender;
    const targetName = pokeName(target);

    switch (effect.type) {
      // ── Status condition ──
      case 'status': {
        let status = effect.status;
        // Support random status selection (e.g. Tri Attack)
        if (!status && effect.randomStatus && effect.randomStatus.length > 0) {
          status = effect.randomStatus[Math.floor(Math.random() * effect.randomStatus.length)];
        }
        if (!status) break;

        // Volatile statuses (can stack alongside a non-volatile)
        if (status === 'confusion') {
          const state = this.getState(target);
          if (!state.volatileStatuses.has('confusion')) {
            state.volatileStatuses.add('confusion');
            state.confusionTurns = randomInt(2, 5);
            messages.push(`${targetName} became confused!`);
          }
          break;
        }

        // Type-based immunities
        if (this.isImmuneToStatus(target, status)) {
          messages.push(`It doesn't affect ${targetName}...`);
          break;
        }

        // Non-volatile — only one at a time
        if (target.status) break; // already has a status
        target.status = status;
        if (status === 'sleep') {
          target.statusTurns = randomInt(2, 4);
        } else if (status === 'bad-poison') {
          target.statusTurns = 1; // toxic counter
        }

        const statusMessages: Record<string, string> = {
          burn: `${targetName} was burned!`,
          paralysis: `${targetName} is paralyzed! It may be unable to move!`,
          poison: `${targetName} was poisoned!`,
          'bad-poison': `${targetName} was badly poisoned!`,
          sleep: `${targetName} fell asleep!`,
          freeze: `${targetName} was frozen solid!`,
        };
        messages.push(statusMessages[status] ?? `${targetName} was inflicted with ${status}!`);
        break;
      }

      // ── Stat change ──
      case 'stat-change': {
        // Support multi-stat changes via statChanges array
        const changes = effect.statChanges ?? (effect.stat && effect.stages != null
          ? [{ stat: effect.stat, stages: effect.stages }]
          : []);

        for (const change of changes) {
          const stat = change.stat;
          const stages = change.stages ?? 0;
          if (!stat || stages === 0) continue;

          const state = this.getState(target);
          const statKey = stat as keyof StatStages;
          if (!(statKey in state.statStages)) continue;

          const old = state.statStages[statKey];
          state.statStages[statKey] = clamp(old + stages, -6, 6) as number;
          const actual = state.statStages[statKey] - old;

          if (actual === 0) {
            messages.push(`${targetName}'s ${STAT_NAMES[statKey]} won't go any ${stages > 0 ? 'higher' : 'lower'}!`);
          } else if (Math.abs(actual) === 1) {
            messages.push(`${targetName}'s ${STAT_NAMES[statKey]} ${actual > 0 ? 'rose' : 'fell'}!`);
          } else if (Math.abs(actual) >= 2) {
            messages.push(`${targetName}'s ${STAT_NAMES[statKey]} ${actual > 0 ? 'rose sharply' : 'fell harshly'}!`);
          }
        }
        break;
      }

      // ── Drain ──
      case 'drain': {
        if (damageDealt <= 0) break;
        healedHp = Math.max(1, Math.floor(damageDealt / 2));
        attacker.currentHp = Math.min(attacker.stats.hp, attacker.currentHp + healedHp);
        messages.push(`${pokeName(attacker)} had its energy drained!`);
        break;
      }

      // ── Recoil ──
      case 'recoil': {
        if (damageDealt <= 0) break;
        const pct = (effect.amount ?? 25) / 100;
        recoilDamage = Math.max(1, Math.floor(damageDealt * pct));
        attacker.currentHp = Math.max(0, attacker.currentHp - recoilDamage);
        messages.push(`${pokeName(attacker)} is damaged by recoil! ${recoilDamage} dmg.`);
        break;
      }

      // ── Flinch ──
      case 'flinch': {
        const defState = this.getState(defender);
        defState.volatileStatuses.add('flinch');
        // No message yet — shown at start of defender's turn
        break;
      }

      // ── Heal ──
      case 'heal': {
        const pct = (effect.amount ?? 50) / 100;
        healedHp = Math.floor(attacker.stats.hp * pct);
        const before = attacker.currentHp;
        attacker.currentHp = Math.min(attacker.stats.hp, attacker.currentHp + healedHp);
        healedHp = attacker.currentHp - before;
        if (healedHp > 0) {
          messages.push(`${pokeName(attacker)} regained health!`);
        }
        // Rest also puts user to sleep
        if (move.id === 'rest') {
          attacker.status = 'sleep';
          attacker.statusTurns = 2;
          messages.push(`${pokeName(attacker)} fell asleep and became healthy!`);
        }
        break;
      }

      // ── Self-destruct ──
      case 'self-destruct': {
        attacker.currentHp = 0;
        selfDestruct = true;
        messages.push(`${pokeName(attacker)} fainted!`);
        break;
      }

      // ── Multi-hit (handled in MoveExecutor) ──
      case 'multi-hit':
        break;

      // ── Fixed damage / Level damage / OHKO (handled in MoveExecutor) ──
      case 'fixed-damage':
      case 'level-damage':
      case 'ohko':
        break;

      // ── Leech Seed ──
      case 'leech-seed': {
        // Grass types are immune
        const defData = pokemonData[defender.dataId];
        if (defData && (defData.types as PokemonType[]).includes('grass')) {
          messages.push(`It doesn't affect ${pokeName(defender)}...`);
          break;
        }
        const defState = this.getState(defender);
        if (!defState.volatileStatuses.has('leech-seed')) {
          defState.volatileStatuses.add('leech-seed');
          messages.push(`${pokeName(defender)} was seeded!`);
        } else {
          messages.push(`${pokeName(defender)} is already seeded!`);
        }
        break;
      }

      // ── Trapping moves (Wrap, Bind, Fire Spin, Clamp) ──
      case 'trap': {
        const defState = this.getState(defender);
        if (!defState.volatileStatuses.has('trapped')) {
          defState.volatileStatuses.add('trapped');
          defState.trapTurns = randomInt(4, 5);
          messages.push(`${pokeName(defender)} was trapped!`);
        }
        break;
      }

      // ── Weather-setting moves ──
      case 'weather': {
        // Weather is set by the caller (BattleUIScene) using WeatherManager.
        // This case signals that the move was a weather move.
        // The actual weather setting happens in executeMove.
        break;
      }

      // ── Protect / Detect ──
      case 'protect': {
        const atkState = this.getState(attacker);
        // Success chance halves each consecutive use
        if (Math.random() < atkState.protectSuccessRate) {
          atkState.volatileStatuses.add('protect');
          atkState.protectSuccessRate *= 0.5;
          messages.push(`${pokeName(attacker)} protected itself!`);
        } else {
          // NEW-009: Don't reset rate on failure — keep halving
          atkState.protectSuccessRate *= 0.5;
          messages.push(`But it failed!`);
        }
        break;
      }

      // ── Two-turn moves (charge turn handled in MoveExecutor) ──
      case 'two-turn': {
        // Handled in MoveExecutor — this is a no-op here
        break;
      }
    }

    return { messages, healedHp, recoilDamage, selfDestruct };
  }

  // ── End-of-turn residual damage ─────────────────────────────

  applyEndOfTurn(pokemon: PokemonInstance, opponent?: PokemonInstance): EndOfTurnResult {
    const name = pokeName(pokemon);
    const messages: string[] = [];
    let totalDamage = 0;

    if (pokemon.currentHp <= 0) return { damage: 0, messages: [], fainted: true };

    // ── Burn: 1/16 max HP ──
    if (pokemon.status === 'burn') {
      const dmg = Math.max(1, Math.floor(pokemon.stats.hp / 16));
      pokemon.currentHp = Math.max(0, pokemon.currentHp - dmg);
      totalDamage += dmg;
      messages.push(`${name} is hurt by its burn! ${dmg} dmg.`);
    }

    // ── Poison: 1/8 max HP ──
    if (pokemon.status === 'poison') {
      const dmg = Math.max(1, Math.floor(pokemon.stats.hp / 8));
      pokemon.currentHp = Math.max(0, pokemon.currentHp - dmg);
      totalDamage += dmg;
      messages.push(`${name} is hurt by poison! ${dmg} dmg.`);
    }

    // ── Bad Poison (Toxic): 1/16 * N max HP, N increments each turn ──
    if (pokemon.status === 'bad-poison') {
      const counter = pokemon.statusTurns ?? 1;
      const dmg = Math.max(1, Math.floor((pokemon.stats.hp * counter) / 16));
      pokemon.currentHp = Math.max(0, pokemon.currentHp - dmg);
      totalDamage += dmg;
      pokemon.statusTurns = counter + 1;
      messages.push(`${name} is hurt by poison! ${dmg} dmg.`);
    }

    // ── Leech Seed: drain 1/8 max HP, heal opponent ──
    const state = this.getState(pokemon);
    if (state.volatileStatuses.has('leech-seed') && pokemon.currentHp > 0) {
      const dmg = Math.max(1, Math.floor(pokemon.stats.hp / 8));
      pokemon.currentHp = Math.max(0, pokemon.currentHp - dmg);
      totalDamage += dmg;
      messages.push(`${name}'s health is sapped by Leech Seed! ${dmg} dmg.`);
      if (opponent && opponent.currentHp > 0) {
        const healed = Math.min(dmg, opponent.stats.hp - opponent.currentHp);
        opponent.currentHp = Math.min(opponent.stats.hp, opponent.currentHp + dmg);
        if (healed > 0) {
          messages.push(`${pokeName(opponent)} restored ${healed} HP!`);
        }
      }
    }

    // ── Trap damage: 1/8 max HP per turn, expires after N turns ──
    if (state.volatileStatuses.has('trapped') && pokemon.currentHp > 0) {
      state.trapTurns--;
      if (state.trapTurns <= 0) {
        state.volatileStatuses.delete('trapped');
        messages.push(`${name} was freed from the trap!`);
      } else {
        const dmg = Math.max(1, Math.floor(pokemon.stats.hp / 8));
        pokemon.currentHp = Math.max(0, pokemon.currentHp - dmg);
        totalDamage += dmg;
        messages.push(`${name} is hurt by the trap! ${dmg} dmg.`);
      }
    }

    return { damage: totalDamage, messages, fainted: pokemon.currentHp <= 0 };
  }

  // ── Reset stat stages (for Haze) ────────────────────────────

  resetAllStages(): void {
    for (const [, state] of this.states) {
      state.statStages = { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
    }
  }

  // ── Protect ─────────────────────────────────────────────────

  /** Check if a Pokémon is protected this turn. Clears protect after check. */
  isProtected(pokemon: PokemonInstance): boolean {
    const state = this.getState(pokemon);
    if (state.volatileStatuses.has('protect')) {
      state.volatileStatuses.delete('protect');
      return true;
    }
    return false;
  }

  /** Reset protect success rate (call when a non-protect move is used). */
  resetProtectRate(pokemon: PokemonInstance): void {
    const state = this.getState(pokemon);
    state.protectSuccessRate = 1.0;
  }

  // ── Two-turn moves ──────────────────────────────────────────

  /** Check if a Pokémon is charging a two-turn move. Returns the move ID or null. */
  getChargingMove(pokemon: PokemonInstance): string | null {
    return this.getState(pokemon).twoTurnCharging;
  }

  /** Start charging a two-turn move. */
  startCharging(pokemon: PokemonInstance, moveId: string): void {
    this.getState(pokemon).twoTurnCharging = moveId;
  }

  /** Clear charging state after the attack turn. */
  clearCharging(pokemon: PokemonInstance): void {
    this.getState(pokemon).twoTurnCharging = null;
  }
}
