import { PokemonInstance, MoveData } from '@data/interfaces';
import { Stats, StatStages, VolatileStatus } from '@utils/type-helpers';
import { moveEffects } from './registry/move-effects';
import type { BattleRng } from '../core/BattleRng';
import { globalBattleRng } from '../core/BattleRng';

// ── Result types ────────────────────────────────────────────────

interface TurnStartResult {
  canAct: boolean;
  messages: string[];
}

export interface EffectResult {
  messages: string[];
  healedHp?: number;
  recoilDamage?: number;
  selfDestruct?: boolean;
}

interface EndOfTurnResult {
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
  tracedAbility?: string;  // Ability copied by Trace (volatile, not persisted)
  originalAbility?: string;  // Original ability before Trace (for restoration)
  switchInTriggered?: boolean;  // Idempotent guard for onSwitchIn ability triggers
}

// ── Stage multipliers ──────────────────────────────────────────

const STAGE_MULTIPLIERS: Record<number, number> = {
  [-6]: 2 / 8, [-5]: 2 / 7, [-4]: 2 / 6, [-3]: 2 / 5,
  [-2]: 2 / 4, [-1]: 2 / 3,  [0]: 1,
  [1]: 3 / 2, [2]: 4 / 2, [3]: 5 / 2, [4]: 6 / 2, [5]: 7 / 2, [6]: 8 / 2,
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

  constructor(private readonly rng: BattleRng = globalBattleRng) {}

  getRng(): BattleRng { return this.rng; }

  // ── Lifecycle ────────────────────────────────────────────────

  /** Call once per pokemon when entering battle. */
  initPokemon(pokemon: PokemonInstance): void {
    // Reset toxic counter on switch-in so it restarts at 1/16
    if (pokemon.status === 'badly-poisoned' || pokemon.status === 'bad-poison') {
      pokemon.statusTurns = 1;
    }

    this.states.set(pokemon, {
      statStages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
      volatileStatuses: new Set(),
      confusionTurns: 0,
      trapTurns: 0,
      protectSuccessRate: 1.0,
      twoTurnCharging: null,
    });
  }

  /** Remove all volatile state (call when pokemon switches out or battle ends). */
  clearPokemon(pokemon: PokemonInstance): void {
    const state = this.states.get(pokemon);
    // Restore original ability for Trace'd pokemon on switch-out
    if (state?.originalAbility !== undefined) {
      pokemon.ability = state.originalAbility;
    }
    this.states.delete(pokemon);
  }

  /** Tear down everything. */
  cleanup(): void {
    // Restore original abilities for any Trace'd pokemon before clearing state
    for (const [pokemon, state] of this.states) {
      if (state.originalAbility !== undefined) {
        pokemon.ability = state.originalAbility;
      }
    }
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
    const base = (stat === 'accuracy' || stat === 'evasion') ? 100 : pokemon.stats[stat as keyof Stats];
    const stage = this.getState(pokemon).statStages[stat];
    let value = Math.floor(base * STAGE_MULTIPLIERS[stage]);

    // Burn halves physical attack (unless ability is Guts)
    if (stat === 'attack' && pokemon.status === 'burn') {
      const state = this.getState(pokemon);
      const ability = state.tracedAbility ?? pokemon.ability;
      if (ability !== 'guts') {
        value = Math.floor(value * 0.5);
      }
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
      if (this.rng.chance(0.2)) {
        pokemon.status = null;
        messages.push(`${name} thawed out!`);
      } else {
        messages.push(`${name} is frozen solid!`);
        return { canAct: false, messages };
      }
    }

    // ── Paralysis ──
    if (pokemon.status === 'paralysis') {
      if (this.rng.chance(0.25)) {
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
        if (this.rng.chance(0.5)) {
          // AUDIT-046: Use proper confusion damage formula (level-based like the games)
          const confusionPower = 40;
          const level = pokemon.level;
          const A = pokemon.stats.attack;
          const D = pokemon.stats.defense;
          const selfDamage = Math.max(1, Math.floor(((2 * level / 5 + 2) * confusionPower * A / Math.max(1, D)) / 50 + 2));
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

  /**
   * Check if a fire-type move thaws a frozen defender. Call before damage.
   *
   * IMPORTANT: Call checkThaw() BEFORE checkTurnStart() so that fire-move
   * thawing is resolved before the random 20% thaw roll in checkTurnStart.
   */
  checkThaw(defender: PokemonInstance, move: MoveData): string | null {
    if (move.type === 'fire' && defender.status === 'freeze') {
      defender.status = null;
      return `${pokeName(defender)} was thawed out by the attack!`;
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

    const chance = effect.chance ?? 100;
    if (this.rng.next() * 100 >= chance) return { messages: [] };

    const target = effect.target === 'self' ? attacker : defender;
    const targetName = pokeName(target);

    if (effect.target !== 'self') {
      const defState = this.states.get(defender);
      if (defState?.volatileStatuses?.has('substitute')) {
        return { messages: [], recoilDamage: 0 };
      }
    }

    return moveEffects[effect.type]?.apply({
      attacker,
      defender,
      move,
      effect,
      damageDealt,
      target,
      targetName,
      statusHandler: this,
      rng: this.rng,
    }) ?? { messages: [] };
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

    // ── Bad Poison (Toxic): 1/16 * N max HP, N increments each turn (capped at 15) ──
    if (pokemon.status === 'bad-poison') {
      const counter = Math.min(pokemon.statusTurns || 1, 15);
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

  /** Like applyEndOfTurn but skips poison/bad-poison damage and counter increment.
   *  Used when Poison Heal is active so the toxic counter doesn't grow. */
  applyEndOfTurnSkipPoison(pokemon: PokemonInstance, opponent?: PokemonInstance): EndOfTurnResult {
    const name = pokeName(pokemon);
    const messages: string[] = [];
    let totalDamage = 0;

    if (pokemon.currentHp <= 0) return { damage: 0, messages: [], fainted: true };

    // Burn still applies
    if (pokemon.status === 'burn') {
      const dmg = Math.max(1, Math.floor(pokemon.stats.hp / 16));
      pokemon.currentHp = Math.max(0, pokemon.currentHp - dmg);
      totalDamage += dmg;
      messages.push(`${name} is hurt by its burn! ${dmg} dmg.`);
    }

    // Poison / bad-poison: intentionally skipped (Poison Heal)

    // Leech Seed
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

    // Trap damage
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
      state.statStages = { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, accuracy: 0, evasion: 0 };
    }
  }

  // ── Protect ─────────────────────────────────────────────────

  /** Check if a Pokémon is protected this turn.
   *  AUDIT-029: Don't consume protect on check — it persists for the full turn.
   *  Call clearProtectAll() at end of turn instead. */
  isProtected(pokemon: PokemonInstance): boolean {
    const state = this.getState(pokemon);
    return state.volatileStatuses.has('protect');
  }

  /** Clear protect for all Pokemon at end of turn. */
  clearProtectAll(): void {
    for (const state of this.states.values()) {
      state.volatileStatuses.delete('protect');
    }
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
