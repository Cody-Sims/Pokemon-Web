import { PokemonInstance } from '@data/interfaces';
import { pokemonData } from '@data/pokemon';
import { PokemonType } from '@utils/type-helpers';
import type {
  AbilityAfterDamageContext,
  AbilityEndTurnContext,
  AbilityImmunityContext,
  AbilityModifyDamageContext,
  AbilitySwitchInContext,
  AbilitySwitchInResult,
} from './effect-context';

export interface AbilityDef {
  onSwitchIn?: (context: AbilitySwitchInContext) => AbilitySwitchInResult;
  onAfterDamage?: (context: AbilityAfterDamageContext) => { messages: string[] };
  onEndTurn?: (context: AbilityEndTurnContext) => { messages: string[] };
  modifyDamage?: (context: AbilityModifyDamageContext) => number;
  checkImmunity?: (context: AbilityImmunityContext) => { immune: boolean; message?: string };
}

function hasType(pokemon: PokemonInstance, type: PokemonType): boolean {
  return pokemonData[pokemon.dataId]?.types.includes(type) ?? false;
}

function weatherSwitchIn(weather: AbilitySwitchInResult['weather'], message: string) {
  return ({ pokemon, name, getWeatherDurationBonus }: AbilitySwitchInContext): AbilitySwitchInResult => ({
    messages: [`${name}'s ${message}`],
    weather,
    weatherDuration: 5 + getWeatherDurationBonus(pokemon, weather!),
  });
}

function contactStatus(
  status: string,
  message: string,
  immuneTypes: PokemonType[],
): (context: AbilityAfterDamageContext) => { messages: string[] } {
  return ({ attacker, attackerName, damage, isContact, rng }: AbilityAfterDamageContext) => {
    const messages: string[] = [];
    if (isContact && damage > 0 && !attacker.status && rng.chance(0.3)) {
      const immune = immuneTypes.some(type => hasType(attacker, type));
      if (!immune) {
        attacker.status = status;
        messages.push(`${attackerName} was ${message}!`);
      }
    }
    return { messages };
  };
}

function contactRecoil(label: string): (context: AbilityAfterDamageContext) => { messages: string[] } {
  return ({ attacker, attackerName, damage, isContact }: AbilityAfterDamageContext) => {
    if (!isContact || damage <= 0) return { messages: [] };
    const recoil = Math.max(1, Math.floor(attacker.stats.hp / 8));
    attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
    return { messages: [`${attackerName} was hurt by ${label}!`] };
  };
}

function pinchTypeBoost(type: PokemonType): (context: AbilityModifyDamageContext) => number {
  return ({ attacker, move, holder }: AbilityModifyDamageContext) => (
    holder === 'attacker' && move.type === type && attacker.currentHp <= attacker.stats.hp / 3 ? 1.5 : 1.0
  );
}

function categoryBoost(category: 'physical' | 'special', multiplier: number): (context: AbilityModifyDamageContext) => number {
  return ({ move, holder }: AbilityModifyDamageContext) => (
    holder === 'attacker' && move.category === category ? multiplier : 1.0
  );
}

function absorbImmunity(type: PokemonType, label: string): (context: AbilityImmunityContext) => { immune: boolean; message?: string } {
  return ({ defender, move, name }: AbilityImmunityContext) => {
    if (move.type !== type) return { immune: false };
    const heal = Math.max(1, Math.floor(defender.stats.hp / 4));
    defender.currentHp = Math.min(defender.stats.hp, defender.currentHp + heal);
    return { immune: true, message: `${name}'s ${label} restored HP!` };
  };
}

export const abilities: Record<string, AbilityDef> = {
  intimidate: {
    onSwitchIn: ({ opponent, statusHandler, name }) => {
      const state = statusHandler.getState(opponent);
      const old = state.statStages.attack;
      state.statStages.attack = Math.max(-6, old - 1);
      if (state.statStages.attack < old) {
        const oppName = opponent.nickname ?? pokemonData[opponent.dataId]?.name ?? '???';
        return { messages: [`${name}'s Intimidate cut ${oppName}'s Attack!`] };
      }
      return { messages: [] };
    },
  },
  drizzle: { onSwitchIn: weatherSwitchIn('rain', 'Drizzle made it rain!') },
  drought: { onSwitchIn: weatherSwitchIn('sun', 'Drought intensified the sun!') },
  'sand-stream': { onSwitchIn: weatherSwitchIn('sandstorm', 'Sand Stream whipped up a sandstorm!') },
  'snow-warning': { onSwitchIn: weatherSwitchIn('hail', 'Snow Warning summoned a hailstorm!') },
  trace: {
    onSwitchIn: ({ pokemon, opponent, statusHandler, name, getAbility }) => {
      const oppAbility = getAbility(opponent);
      if (!oppAbility) return { messages: [] };
      const state = statusHandler.getState(pokemon);
      state.tracedAbility = oppAbility;
      state.originalAbility = pokemon.ability;
      pokemon.ability = oppAbility;
      const opponentName = opponent.nickname ?? pokemonData[opponent.dataId]?.name;
      return { messages: [`${name} traced ${opponentName}'s ${oppAbility}!`] };
    },
  },

  static: { onAfterDamage: contactStatus('paralysis', 'paralyzed by Static', ['electric']) },
  'flame-body': { onAfterDamage: contactStatus('burn', 'burned by Flame Body', ['fire']) },
  'poison-point': { onAfterDamage: contactStatus('poison', 'poisoned by Poison Point', ['poison', 'steel']) },
  'rough-skin': { onAfterDamage: contactRecoil('Rough Skin') },
  'iron-barbs': { onAfterDamage: contactRecoil('Iron Barbs') },

  'speed-boost': {
    onEndTurn: ({ pokemon, statusHandler, name }) => {
      if (statusHandler) {
        const state = statusHandler.getState(pokemon);
        if (state.statStages.speed < 6) {
          state.statStages.speed = Math.min(6, state.statStages.speed + 1);
          return { messages: [`${name}'s Speed Boost raised its Speed!`] };
        }
        return { messages: [] };
      }
      return { messages: [`${name}'s Speed Boost raised its Speed!`] };
    },
  },
  'poison-heal': {
    onEndTurn: ({ pokemon, name }) => {
      if (pokemon.status !== 'poison' && pokemon.status !== 'bad-poison') return { messages: [] };
      const heal = Math.max(1, Math.floor(pokemon.stats.hp / 8));
      pokemon.currentHp = Math.min(pokemon.stats.hp, pokemon.currentHp + heal);
      return { messages: [`${name} restored HP with Poison Heal!`] };
    },
  },
  'rain-dish': { onEndTurn: () => ({ messages: [] }) },

  blaze: { modifyDamage: pinchTypeBoost('fire') },
  torrent: { modifyDamage: pinchTypeBoost('water') },
  overgrow: { modifyDamage: pinchTypeBoost('grass') },
  swarm: { modifyDamage: pinchTypeBoost('bug') },
  guts: {
    modifyDamage: ({ attacker, move, holder }) => (
      holder === 'attacker' && attacker.status && move.category === 'physical' ? 1.5 : 1.0
    ),
  },
  'huge-power': { modifyDamage: categoryBoost('physical', 2.0) },
  'pure-power': { modifyDamage: categoryBoost('physical', 2.0) },
  'thick-fat': {
    modifyDamage: ({ move, holder }) => (
      holder === 'defender' && (move.type === 'fire' || move.type === 'ice') ? 0.5 : 1.0
    ),
  },
  'marvel-scale': {
    modifyDamage: ({ defender, move, holder }) => (
      holder === 'defender' && defender.status && move.category === 'physical' ? 0.5 : 1.0
    ),
  },

  levitate: {
    checkImmunity: ({ move, name }) => (
      move.type === 'ground' ? { immune: true, message: `${name}'s Levitate made it immune!` } : { immune: false }
    ),
  },
  'volt-absorb': { checkImmunity: absorbImmunity('electric', 'Volt Absorb') },
  'water-absorb': { checkImmunity: absorbImmunity('water', 'Water Absorb') },
  'flash-fire': {
    checkImmunity: ({ move, name }) => (
      move.type === 'fire' ? { immune: true, message: `${name}'s Flash Fire activated!` } : { immune: false }
    ),
  },
  soundproof: { checkImmunity: () => ({ immune: false }) },
};
