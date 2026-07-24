import type { ItemData, PokemonInstance } from '@data/interfaces';
import { ExperienceCalculator } from '@battle/calculation/ExperienceCalculator';

export type ItemUseResultKind = 'target-update' | 'capture' | 'no-effect' | 'unsupported';

export interface ItemUseContext {
  targetName?: string;
  battleMode?: boolean;
}

export interface ItemUseResult {
  kind: ItemUseResultKind;
  used: boolean;
  message: string;
  itemId: string;
  updatedTarget?: PokemonInstance;
}

export function planItemUse(
  item: ItemData,
  target: PokemonInstance | null,
  context: ItemUseContext = {},
): ItemUseResult {
  if (item.effect.type === 'capture') {
    return context.battleMode
      ? { kind: 'capture', used: true, message: '', itemId: item.id }
      : { kind: 'no-effect', used: false, message: 'Can only be used in battle!', itemId: item.id };
  }

  if (!target) {
    return { kind: 'no-effect', used: false, message: 'No Pokémon!', itemId: item.id };
  }

  const targetName = context.targetName ?? target.nickname ?? '???';

  if (item.effect.type === 'heal-hp') {
    return planHpHeal(item, target, targetName);
  }

  if (item.effect.type === 'heal-status') {
    return planStatusHeal(item, target, targetName);
  }

  if (item.effect.type === 'full-restore') {
    return planFullRestore(item, target, targetName);
  }

  if (item.effect.type === 'level-up') {
    return planLevelUp(item, target, targetName);
  }

  return { kind: 'unsupported', used: false, message: "Can't use that here.", itemId: item.id };
}

export function applyItemUseResult(target: PokemonInstance, result: ItemUseResult): void {
  if (!result.updatedTarget) return;
  Object.assign(target, clonePokemon(result.updatedTarget));
}

function planHpHeal(item: ItemData, target: PokemonInstance, targetName: string): ItemUseResult {
  if (item.id === 'revive' || item.id === 'max-revive') {
    if (target.currentHp > 0) {
      return { kind: 'no-effect', used: false, message: `${targetName} isn't fainted!`, itemId: item.id };
    }
    const updatedTarget = clonePokemon(target);
    updatedTarget.currentHp = item.id === 'max-revive' ? target.stats.hp : Math.floor(target.stats.hp / 2);
    return { kind: 'target-update', used: true, message: `${targetName} was revived!`, itemId: item.id, updatedTarget };
  }

  if (target.currentHp <= 0) {
    return { kind: 'no-effect', used: false, message: "It won't have any effect.", itemId: item.id };
  }

  if (target.currentHp >= target.stats.hp) {
    return { kind: 'no-effect', used: false, message: `${targetName} is already at full HP!`, itemId: item.id };
  }

  const heal = resolveHealAmount(item.effect.amount ?? 20, target.stats.hp);
  const updatedTarget = clonePokemon(target);
  updatedTarget.currentHp = Math.min(target.stats.hp, target.currentHp + heal);
  return { kind: 'target-update', used: true, message: `${targetName} recovered ${heal} HP!`, itemId: item.id, updatedTarget };
}

function planStatusHeal(item: ItemData, target: PokemonInstance, targetName: string): ItemUseResult {
  const status = item.effect.status;
  if (!target.status) {
    return { kind: 'no-effect', used: false, message: `${targetName} has no status problem!`, itemId: item.id };
  }

  const curesStatus = status === 'all' || target.status === status || (target.status === 'bad-poison' && status === 'poison');
  if (!curesStatus) {
    return { kind: 'no-effect', used: false, message: "It won't have any effect.", itemId: item.id };
  }

  const updatedTarget = clonePokemon(target);
  updatedTarget.status = null;
  updatedTarget.statusTurns = undefined;
  return { kind: 'target-update', used: true, message: `${targetName} was cured!`, itemId: item.id, updatedTarget };
}

function planFullRestore(item: ItemData, target: PokemonInstance, targetName: string): ItemUseResult {
  if (target.currentHp <= 0) {
    return { kind: 'no-effect', used: false, message: "It won't have any effect.", itemId: item.id };
  }

  if (target.currentHp >= target.stats.hp && !target.status) {
    return { kind: 'no-effect', used: false, message: `${targetName} is already at full HP!`, itemId: item.id };
  }

  const updatedTarget = clonePokemon(target);
  updatedTarget.currentHp = target.stats.hp;
  updatedTarget.status = null;
  updatedTarget.statusTurns = undefined;
  return { kind: 'target-update', used: true, message: `${targetName} was fully restored!`, itemId: item.id, updatedTarget };
}

function planLevelUp(item: ItemData, target: PokemonInstance, targetName: string): ItemUseResult {
  if (target.level >= 100) {
    return { kind: 'no-effect', used: false, message: `${targetName} is already at max level!`, itemId: item.id };
  }

  const updatedTarget = clonePokemon(target);
  updatedTarget.level = Math.min(100, target.level + 1);
  ExperienceCalculator.recalculateStats(updatedTarget);
  return { kind: 'target-update', used: true, message: `${targetName} grew to Lv. ${updatedTarget.level}!`, itemId: item.id, updatedTarget };
}

function resolveHealAmount(amount: number, maxHp: number): number {
  if (amount >= 0) return amount;
  return Math.max(1, Math.floor(maxHp * Math.abs(amount) / 100));
}

function clonePokemon(pokemon: PokemonInstance): PokemonInstance {
  return {
    ...pokemon,
    stats: { ...pokemon.stats },
    ivs: { ...pokemon.ivs },
    evs: { ...pokemon.evs },
    moves: pokemon.moves.map(move => ({ ...move })),
    typeOverride: pokemon.typeOverride ? [...pokemon.typeOverride] as PokemonInstance['typeOverride'] : undefined,
  };
}
