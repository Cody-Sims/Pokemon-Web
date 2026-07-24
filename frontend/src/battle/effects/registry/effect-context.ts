import type { PokemonInstance, MoveData } from '@data/interfaces';
import type { MoveEffect, VolatileStatus, WeatherCondition } from '@utils/type-helpers';
import type { BattleRng } from '../../core/BattleRng';
import type { StatusEffectHandler } from '../StatusEffectHandler';

export interface EffectContext {
  rng?: BattleRng;
  statusHandler?: StatusEffectHandler;
}

export interface AbilitySwitchInContext extends EffectContext {
  pokemon: PokemonInstance;
  opponent: PokemonInstance;
  statusHandler: StatusEffectHandler;
  name: string;
  getAbility: (pokemon: PokemonInstance) => string;
  getWeatherDurationBonus: (pokemon: PokemonInstance, weather: WeatherCondition) => number;
}

export interface AbilitySwitchInResult {
  messages: string[];
  weather?: WeatherCondition;
  weatherDuration?: number;
}

export interface AbilityAfterDamageContext extends EffectContext {
  attacker: PokemonInstance;
  defender: PokemonInstance;
  move: MoveData;
  damage: number;
  isContact: boolean;
  attackerName: string;
  rng: BattleRng;
}

export interface AbilityEndTurnContext extends EffectContext {
  pokemon: PokemonInstance;
  name: string;
}

export interface AbilityModifyDamageContext {
  attacker: PokemonInstance;
  defender: PokemonInstance;
  move: MoveData;
  holder: 'attacker' | 'defender';
}

export interface AbilityImmunityContext {
  defender: PokemonInstance;
  move: MoveData;
  name: string;
}

export interface HeldItemContext {
  pokemon: PokemonInstance;
  item: string;
  name: string;
  consumeItem: (pokemon: PokemonInstance) => void;
}

export interface HeldItemAfterDamageContext extends HeldItemContext {
  attacker: PokemonInstance;
  damage: number;
  hpBeforeHit: number;
}

export interface HeldItemAttackLandedContext extends HeldItemContext {
  damage: number;
}

export interface HeldItemVolatileContext extends HeldItemContext {
  volatile: VolatileStatus;
}

export interface HeldItemModifyDamageContext {
  attacker: PokemonInstance;
  defender: PokemonInstance;
  move: MoveData;
}

export interface MoveEffectContext extends EffectContext {
  attacker: PokemonInstance;
  defender: PokemonInstance;
  move: MoveData;
  effect: MoveEffect;
  damageDealt: number;
  target: PokemonInstance;
  targetName: string;
  statusHandler: StatusEffectHandler;
  rng: BattleRng;
}

export interface MoveEffectResult {
  messages: string[];
  healedHp?: number;
  recoilDamage?: number;
  selfDestruct?: boolean;
}

export const noMoveEffect = (): MoveEffectResult => ({ messages: [] });
