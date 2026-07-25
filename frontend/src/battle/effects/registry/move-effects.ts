import { pokemonData } from '@data/pokemon';
import { clamp } from '@utils/math-helpers';
import { MoveEffect, PokemonType, StatStages } from '@utils/type-helpers';
import { HeldItemHandler } from '../HeldItemHandler';
import type { MoveEffectContext, MoveEffectResult } from './effect-context';
import { noMoveEffect } from './effect-context';
import { isImmuneToStatus, statusMessages } from './status-effects';

export interface MoveEffectDef {
  apply: (context: MoveEffectContext) => MoveEffectResult;
}

const STAT_NAMES: Record<keyof StatStages, string> = {
  attack: 'Attack', defense: 'Defense',
  spAttack: 'Sp. Atk', spDefense: 'Sp. Def', speed: 'Speed',
  accuracy: 'Accuracy', evasion: 'Evasion',
};

function pokeName(pokemon: MoveEffectContext['attacker']): string {
  return pokemon.nickname ?? `Pokémon #${pokemon.dataId}`;
}

const noOp: MoveEffectDef = { apply: noMoveEffect };

export const moveEffects: Record<MoveEffect['type'], MoveEffectDef> = {
  status: {
    apply: ({ effect, target, targetName, rng, statusHandler }) => {
      const messages: string[] = [];
      let status = effect.status;

      if (!status && effect.randomStatus && effect.randomStatus.length > 0) {
        status = effect.randomStatus[rng.int(0, effect.randomStatus.length - 1)];
      }
      if (!status) return { messages };

      if (status === 'confusion') {
        const state = statusHandler.getState(target);
        if (!state.volatileStatuses.has('confusion')) {
          state.volatileStatuses.add('confusion');
          state.confusionTurns = rng.int(2, 5);
          messages.push(`${targetName} became confused!`);

          const cure = HeldItemHandler.onVolatileApplied(target, 'confusion');
          if (cure.cured) {
            state.volatileStatuses.delete('confusion');
            state.confusionTurns = 0;
            messages.push(...cure.messages);
          }
        }
        return { messages };
      }

      if (isImmuneToStatus(target, status)) {
        messages.push(`It doesn't affect ${targetName}...`);
        return { messages };
      }

      if (target.status) return { messages };
      target.status = status;
      if (status === 'sleep') {
        target.statusTurns = rng.int(2, 4);
      } else if (status === 'bad-poison') {
        target.statusTurns = 1;
      }

      messages.push(statusMessages[status]?.(targetName) ?? `${targetName} was inflicted with ${status}!`);
      return { messages };
    },
  },

  'stat-change': {
    apply: ({ effect, target, targetName, statusHandler }) => {
      const messages: string[] = [];
      const changes = effect.statChanges ?? (effect.stat && effect.stages != null
        ? [{ stat: effect.stat, stages: effect.stages }]
        : []);

      for (const change of changes) {
        const stat = change.stat;
        const stages = change.stages ?? 0;
        if (!stat || stages === 0) continue;

        const state = statusHandler.getState(target);
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
      return { messages };
    },
  },

  drain: {
    apply: ({ attacker, damageDealt }) => {
      if (damageDealt <= 0) return { messages: [] };
      const healedHp = Math.max(1, Math.floor(damageDealt / 2));
      attacker.currentHp = Math.min(attacker.stats.hp, attacker.currentHp + healedHp);
      return { messages: [`${pokeName(attacker)} had its energy drained!`], healedHp };
    },
  },

  recoil: {
    apply: ({ attacker, effect, damageDealt }) => {
      if (damageDealt <= 0) return { messages: [] };
      const pct = (effect.amount ?? 25) / 100;
      const recoilDamage = Math.max(1, Math.floor(damageDealt * pct));
      attacker.currentHp = Math.max(0, attacker.currentHp - recoilDamage);
      return { messages: [`${pokeName(attacker)} is damaged by recoil! ${recoilDamage} dmg.`], recoilDamage };
    },
  },

  flinch: {
    apply: ({ defender, statusHandler }) => {
      const defState = statusHandler.getState(defender);
      defState.volatileStatuses.add('flinch');
      return { messages: [] };
    },
  },

  heal: {
    apply: ({ attacker, effect, move }) => {
      const pct = (effect.amount ?? 50) / 100;
      let healedHp = Math.floor(attacker.stats.hp * pct);
      const before = attacker.currentHp;
      attacker.currentHp = Math.min(attacker.stats.hp, attacker.currentHp + healedHp);
      healedHp = attacker.currentHp - before;
      const messages: string[] = [];
      if (healedHp > 0) {
        messages.push(`${pokeName(attacker)} regained health!`);
      }
      if (move.id === 'rest') {
        attacker.status = 'sleep';
        attacker.statusTurns = 2;
        messages.push(`${pokeName(attacker)} fell asleep and became healthy!`);
      }
      return { messages, healedHp };
    },
  },

  'self-destruct': {
    apply: ({ attacker }) => {
      attacker.currentHp = 0;
      return { messages: [`${pokeName(attacker)} fainted!`], selfDestruct: true };
    },
  },

  'leech-seed': {
    apply: ({ defender, statusHandler }) => {
      const defData = pokemonData[defender.dataId];
      if (defData && (defData.types as PokemonType[]).includes('grass')) {
        return { messages: [`It doesn't affect ${pokeName(defender)}...`] };
      }
      const defState = statusHandler.getState(defender);
      if (!defState.volatileStatuses.has('leech-seed')) {
        defState.volatileStatuses.add('leech-seed');
        return { messages: [`${pokeName(defender)} was seeded!`] };
      }
      return { messages: [`${pokeName(defender)} is already seeded!`] };
    },
  },

  trap: {
    apply: ({ defender, statusHandler, rng }) => {
      const defState = statusHandler.getState(defender);
      if (!defState.volatileStatuses.has('trapped')) {
        defState.volatileStatuses.add('trapped');
        defState.trapTurns = rng.int(4, 5);
        return { messages: [`${pokeName(defender)} was trapped!`] };
      }
      return { messages: [] };
    },
  },

  protect: {
    apply: ({ attacker, statusHandler, rng }) => {
      const atkState = statusHandler.getState(attacker);
      if (rng.chance(atkState.protectSuccessRate)) {
        atkState.volatileStatuses.add('protect');
        atkState.protectSuccessRate *= 0.5;
        return { messages: [`${pokeName(attacker)} protected itself!`] };
      }
      atkState.protectSuccessRate *= 0.5;
      return { messages: ['But it failed!'] };
    },
  },

  'multi-hit': noOp,
  'fixed-damage': noOp,
  'level-damage': noOp,
  ohko: noOp,
  weather: noOp,
  'two-turn': noOp,
  'multi-turn-lock': noOp,
};
