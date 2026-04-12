import { PokemonInstance, MoveData } from '@data/interfaces';
import { moveData } from '@data/move-data';
import { clamp, randomInt } from '@utils/math-helpers';
import { StatStages, StatusCondition, VolatileStatus, MoveEffect } from '@utils/type-helpers';

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
        const status = effect.status;
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

        // Non-volatile — only one at a time
        if (target.status) break; // already has a status
        target.status = status;
        if (status === 'sleep') {
          target.statusTurns = randomInt(1, 3);
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
        const stat = effect.stat;
        const stages = effect.stages ?? 0;
        if (!stat || stages === 0) break;

        const state = this.getState(target);
        const statKey = stat as keyof StatStages;
        if (!(statKey in state.statStages)) break;

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
    }

    return { messages, healedHp, recoilDamage, selfDestruct };
  }

  // ── End-of-turn residual damage ─────────────────────────────

  applyEndOfTurn(pokemon: PokemonInstance): EndOfTurnResult {
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

    return { damage: totalDamage, messages, fainted: pokemon.currentHp <= 0 };
  }

  // ── Reset stat stages (for Haze) ────────────────────────────

  resetAllStages(): void {
    for (const [, state] of this.states) {
      state.statStages = { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
    }
  }
}
