import { MoveData, PokemonInstance } from '@data/interfaces';
import { pokemonData } from '@data/pokemon';
import { WeatherCondition } from '@utils/type-helpers';
import type {
  HeldItemAfterDamageContext,
  HeldItemAttackLandedContext,
  HeldItemContext,
  HeldItemModifyDamageContext,
  HeldItemVolatileContext,
} from './effect-context';

export interface HeldItemDef {
  onEndOfTurn?: (context: HeldItemContext) => { messages: string[] };
  onAfterDamage?: (context: HeldItemAfterDamageContext) => { messages: string[]; damagePrevented: number; rockyHelmetRecoil: number };
  onAttackLanded?: (context: HeldItemAttackLandedContext) => { messages: string[]; recoilDamage: number };
  onStatusApplied?: (context: HeldItemContext) => { messages: string[]; cured: boolean };
  checkHPThreshold?: (context: HeldItemContext) => { messages: string[] };
  onVolatileApplied?: (context: HeldItemVolatileContext) => { messages: string[]; cured: boolean };
  weatherDurationBonus?: Partial<Record<WeatherCondition, number>>;
  modifyDamage?: (context: HeldItemModifyDamageContext) => number;
}

function heal(pokemon: PokemonInstance, amount: number): void {
  pokemon.currentHp = Math.min(pokemon.stats.hp, pokemon.currentHp + amount);
}

function berryName(item: string): string {
  return item.split('-')[0].replace(/^./, c => c.toUpperCase());
}

function statusCure(statuses: string[], message: (name: string) => string): HeldItemDef['onStatusApplied'] {
  return ({ pokemon, name, consumeItem }) => {
    if (!pokemon.status || !statuses.includes(pokemon.status)) return { messages: [], cured: false };
    pokemon.status = null;
    if (statuses.includes('sleep') || statuses.includes('poison') || statuses.includes('bad-poison')) {
      pokemon.statusTurns = undefined;
    }
    consumeItem(pokemon);
    return { messages: [message(name)], cured: true };
  };
}

function hpBerryHeal(divisor: number): HeldItemDef['checkHPThreshold'] {
  return ({ pokemon, item, name, consumeItem }) => {
    if (pokemon.currentHp / pokemon.stats.hp > 0.5) return { messages: [] };
    const healAmount = Math.max(1, Math.floor(pokemon.stats.hp / divisor));
    heal(pokemon, healAmount);
    consumeItem(pokemon);
    return { messages: [`${name} restored HP with its ${berryName(item)} Berry!`] };
  };
}

function categoryMultiplier(category: MoveData['category'], multiplier: number): HeldItemDef['modifyDamage'] {
  return ({ move }) => move.category === category ? multiplier : 1.0;
}

export const heldItems: Record<string, HeldItemDef> = {
  leftovers: {
    onEndOfTurn: ({ pokemon, name }) => {
      if (pokemon.currentHp >= pokemon.stats.hp) return { messages: [] };
      heal(pokemon, Math.max(1, Math.floor(pokemon.stats.hp / 16)));
      return { messages: [`${name} restored a little HP with Leftovers!`] };
    },
  },
  'black-sludge': {
    onEndOfTurn: ({ pokemon, name }) => {
      const data = pokemonData[pokemon.dataId];
      if (data?.types.includes('poison')) {
        if (pokemon.currentHp < pokemon.stats.hp) {
          heal(pokemon, Math.max(1, Math.floor(pokemon.stats.hp / 16)));
          return { messages: [`${name} restored a little HP with Black Sludge!`] };
        }
        return { messages: [] };
      }
      const dmg = Math.max(1, Math.floor(pokemon.stats.hp / 8));
      pokemon.currentHp = Math.max(0, pokemon.currentHp - dmg);
      return { messages: [`${name} was hurt by Black Sludge!`] };
    },
  },
  'focus-sash': {
    onAfterDamage: ({ pokemon, hpBeforeHit, name, consumeItem }) => {
      if (hpBeforeHit !== pokemon.stats.hp || pokemon.currentHp > 0) {
        return { messages: [], damagePrevented: 0, rockyHelmetRecoil: 0 };
      }
      pokemon.currentHp = 1;
      consumeItem(pokemon);
      return { messages: [`${name} hung on using its Focus Sash!`], damagePrevented: 1, rockyHelmetRecoil: 0 };
    },
  },
  'rocky-helmet': {
    onAfterDamage: ({ attacker, damage, name }) => {
      if (damage <= 0 || attacker.currentHp <= 0) {
        return { messages: [], damagePrevented: 0, rockyHelmetRecoil: 0 };
      }
      const attName = attacker.nickname ?? pokemonData[attacker.dataId]?.name ?? '???';
      const rockyHelmetRecoil = Math.max(1, Math.floor(attacker.stats.hp / 6));
      attacker.currentHp = Math.max(0, attacker.currentHp - rockyHelmetRecoil);
      return {
        messages: [`${attName} was hurt by ${name}'s Rocky Helmet!`],
        damagePrevented: 0,
        rockyHelmetRecoil,
      };
    },
  },
  'life-orb': {
    onAttackLanded: ({ pokemon, damage, name }) => {
      if (damage <= 0) return { messages: [], recoilDamage: 0 };
      const recoilDamage = Math.max(1, Math.floor(pokemon.stats.hp / 10));
      pokemon.currentHp = Math.max(0, pokemon.currentHp - recoilDamage);
      return { messages: [`${name} lost some HP due to Life Orb!`], recoilDamage };
    },
    modifyDamage: () => 1.3,
  },
  'lum-berry': {
    onStatusApplied: ({ pokemon, name, consumeItem }) => {
      if (!pokemon.status) return { messages: [], cured: false };
      pokemon.status = null;
      pokemon.statusTurns = undefined;
      consumeItem(pokemon);
      return { messages: [`${name}'s Lum Berry cured its status!`], cured: true };
    },
    onVolatileApplied: ({ pokemon, volatile, name, consumeItem }) => {
      if (volatile !== 'confusion') return { messages: [], cured: false };
      consumeItem(pokemon);
      return { messages: [`${name}'s Lum Berry cured its confusion!`], cured: true };
    },
  },
  'cheri-berry': { onStatusApplied: statusCure(['paralysis'], name => `${name}'s Cheri Berry cured its paralysis!`) },
  'rawst-berry': { onStatusApplied: statusCure(['burn'], name => `${name}'s Rawst Berry cured its burn!`) },
  'aspear-berry': { onStatusApplied: statusCure(['freeze'], name => `${name}'s Aspear Berry cured its freeze!`) },
  'chesto-berry': { onStatusApplied: statusCure(['sleep'], name => `${name}'s Chesto Berry woke it up!`) },
  'pecha-berry': { onStatusApplied: statusCure(['poison', 'bad-poison'], name => `${name}'s Pecha Berry cured its poison!`) },
  'sitrus-berry': {
    checkHPThreshold: ({ pokemon, name, consumeItem }) => {
      if (pokemon.currentHp / pokemon.stats.hp > 0.5) return { messages: [] };
      heal(pokemon, Math.max(1, Math.floor(pokemon.stats.hp / 4)));
      consumeItem(pokemon);
      return { messages: [`${name} restored HP with its Sitrus Berry!`] };
    },
  },
  'oran-berry': {
    checkHPThreshold: ({ pokemon, name, consumeItem }) => {
      if (pokemon.currentHp / pokemon.stats.hp > 0.5) return { messages: [] };
      heal(pokemon, 10);
      consumeItem(pokemon);
      return { messages: [`${name} restored HP with its Oran Berry!`] };
    },
  },
  'figy-berry': { checkHPThreshold: hpBerryHeal(3) },
  'wiki-berry': { checkHPThreshold: hpBerryHeal(3) },
  'mago-berry': { checkHPThreshold: hpBerryHeal(3) },
  'aguav-berry': { checkHPThreshold: hpBerryHeal(3) },
  'iapapa-berry': { checkHPThreshold: hpBerryHeal(3) },
  'persim-berry': {
    onVolatileApplied: ({ pokemon, volatile, name, consumeItem }) => {
      if (volatile !== 'confusion') return { messages: [], cured: false };
      consumeItem(pokemon);
      return { messages: [`${name}'s Persim Berry snapped it out of confusion!`], cured: true };
    },
  },
  'heat-rock': { weatherDurationBonus: { sun: 3 } },
  'damp-rock': { weatherDurationBonus: { rain: 3 } },
  'smooth-rock': { weatherDurationBonus: { sandstorm: 3 } },
  'icy-rock': { weatherDurationBonus: { hail: 3 } },
  'choice-band': { modifyDamage: categoryMultiplier('physical', 1.5) },
  'choice-specs': { modifyDamage: categoryMultiplier('special', 1.5) },
  'muscle-band': { modifyDamage: categoryMultiplier('physical', 1.1) },
  'wise-glasses': { modifyDamage: categoryMultiplier('special', 1.1) },
  'choice-scarf': {},
};
