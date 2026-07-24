import { describe, expect, it } from 'vitest';
import { abilities } from '../../../frontend/src/battle/effects/registry/abilities';
import { heldItems } from '../../../frontend/src/battle/effects/registry/held-items';
import { moveEffects } from '../../../frontend/src/battle/effects/registry/move-effects';
import { StatusEffectHandler } from '../../../frontend/src/battle/effects/StatusEffectHandler';
import type { BattleRng } from '../../../frontend/src/battle/core/BattleRng';
import type { MoveData, PokemonInstance } from '../../../frontend/src/data/interfaces';
import type { WeatherCondition } from '../../../frontend/src/utils/type-helpers';

class FixedRng implements BattleRng {
  private index = 0;

  constructor(private readonly values: number[]) {}

  next(): number {
    const value = this.values[this.index] ?? this.values[this.values.length - 1] ?? 0;
    this.index += 1;
    return value;
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length - 1)];
  }
}

const physicalMove: MoveData = {
  id: 'tackle', name: 'Tackle', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35,
};

const makePokemon = (overrides?: Partial<PokemonInstance>): PokemonInstance => ({
  dataId: 19,
  level: 30,
  currentHp: 80,
  stats: { hp: 100, attack: 50, defense: 45, spAttack: 55, spDefense: 50, speed: 60 },
  ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy',
  moves: [{ moveId: 'tackle', currentPp: 35 }],
  status: null,
  exp: 0,
  friendship: 70,
  ...overrides,
});

describe('effect registry — abilities', () => {
  it('registers every migrated ability', () => {
    expect(Object.keys(abilities).sort()).toEqual([
      'blaze', 'drizzle', 'drought', 'flame-body', 'flash-fire', 'guts', 'huge-power',
      'intimidate', 'iron-barbs', 'levitate', 'marvel-scale', 'overgrow', 'poison-heal',
      'poison-point', 'pure-power', 'rain-dish', 'rough-skin', 'sand-stream', 'snow-warning',
      'soundproof', 'speed-boost', 'static', 'swarm', 'thick-fat', 'torrent', 'trace', 'volt-absorb', 'water-absorb',
    ].sort());
  });

  it('runs switch-in hooks for stat, weather, and trace abilities', () => {
    const statusHandler = new StatusEffectHandler(new FixedRng([0]));
    const user = makePokemon({ dataId: 4, ability: 'intimidate', nickname: 'Lead' });
    const opponent = makePokemon({ ability: 'static', nickname: 'Target' });
    statusHandler.initPokemon(user);
    statusHandler.initPokemon(opponent);

    const intimidate = abilities.intimidate.onSwitchIn!({
      pokemon: user,
      opponent,
      statusHandler,
      name: 'Lead',
      getAbility: pokemon => pokemon.ability ?? '',
      getWeatherDurationBonus: () => 0,
    });
    expect(intimidate.messages).toEqual(["Lead's Intimidate cut Target's Attack!"]);
    expect(statusHandler.getState(opponent).statStages.attack).toBe(-1);

    const weatherCases: [keyof typeof abilities, WeatherCondition, string][] = [
      ['drizzle', 'rain', "Lead's Drizzle made it rain!"],
      ['drought', 'sun', "Lead's Drought intensified the sun!"],
      ['sand-stream', 'sandstorm', "Lead's Sand Stream whipped up a sandstorm!"],
      ['snow-warning', 'hail', "Lead's Snow Warning summoned a hailstorm!"],
    ];
    for (const [ability, weather, message] of weatherCases) {
      const result = abilities[ability].onSwitchIn!({
        pokemon: user,
        opponent,
        statusHandler,
        name: 'Lead',
        getAbility: pokemon => pokemon.ability ?? '',
        getWeatherDurationBonus: () => 3,
      });
      expect(result).toEqual({ messages: [message], weather, weatherDuration: 8 });
    }

    const tracer = makePokemon({ ability: 'trace', nickname: 'Copycat' });
    statusHandler.initPokemon(tracer);
    const trace = abilities.trace.onSwitchIn!({
      pokemon: tracer,
      opponent,
      statusHandler,
      name: 'Copycat',
      getAbility: pokemon => pokemon.ability ?? '',
      getWeatherDurationBonus: () => 0,
    });
    expect(trace.messages).toEqual(["Copycat traced Target's static!"]);
    expect(tracer.ability).toBe('static');
    expect(statusHandler.getState(tracer).originalAbility).toBe('trace');
  });

  it('runs contact after-damage hooks without changing RNG ordering', () => {
    const contactCases = [
      ['static', 'paralysis', 'Rattata was paralyzed by Static!'],
      ['flame-body', 'burn', 'Rattata was burned by Flame Body!'],
      ['poison-point', 'poison', 'Rattata was poisoned by Poison Point!'],
    ] as const;

    for (const [ability, expectedStatus, message] of contactCases) {
      const attacker = makePokemon();
      const defender = makePokemon({ ability });
      const result = abilities[ability].onAfterDamage!({
        attacker,
        defender,
        move: physicalMove,
        damage: 12,
        isContact: true,
        attackerName: 'Rattata',
        rng: new FixedRng([0.29]),
      });
      expect(attacker.status).toBe(expectedStatus);
      expect(result.messages).toEqual([message]);
    }

    const attacker = makePokemon({ currentHp: 100 });
    const defender = makePokemon({ ability: 'rough-skin' });
    expect(abilities['rough-skin'].onAfterDamage!({
      attacker, defender, move: physicalMove, damage: 10, isContact: true, attackerName: 'Rattata', rng: new FixedRng([0]),
    }).messages).toEqual(['Rattata was hurt by Rough Skin!']);
    expect(attacker.currentHp).toBe(88);

    const barbsAttacker = makePokemon({ currentHp: 100 });
    expect(abilities['iron-barbs'].onAfterDamage!({
      attacker: barbsAttacker, defender, move: physicalMove, damage: 10, isContact: true, attackerName: 'Rattata', rng: new FixedRng([0]),
    }).messages).toEqual(['Rattata was hurt by Iron Barbs!']);
    expect(barbsAttacker.currentHp).toBe(88);
  });

  it('runs end-turn, modifier, and immunity hooks', () => {
    const statusHandler = new StatusEffectHandler(new FixedRng([0]));
    const speedBoost = makePokemon({ ability: 'speed-boost', nickname: 'Ninjask' });
    statusHandler.initPokemon(speedBoost);
    expect(abilities['speed-boost'].onEndTurn!({ pokemon: speedBoost, statusHandler, name: 'Ninjask' }).messages)
      .toEqual(["Ninjask's Speed Boost raised its Speed!"]);
    expect(statusHandler.getState(speedBoost).statStages.speed).toBe(1);

    const poisonHeal = makePokemon({ ability: 'poison-heal', status: 'poison', currentHp: 50, nickname: 'Breloom' });
    expect(abilities['poison-heal'].onEndTurn!({ pokemon: poisonHeal, name: 'Breloom' }).messages)
      .toEqual(['Breloom restored HP with Poison Heal!']);
    expect(poisonHeal.currentHp).toBe(62);
    expect(abilities['rain-dish'].onEndTurn!({ pokemon: makePokemon(), name: 'Lotad' }).messages).toEqual([]);

    const lowHpFire = makePokemon({ currentHp: 30, stats: { ...makePokemon().stats, hp: 100 } });
    const fireMove = { ...physicalMove, type: 'fire' as const };
    expect(abilities.blaze.modifyDamage!({ attacker: lowHpFire, defender: makePokemon(), move: fireMove, holder: 'attacker' })).toBe(1.5);
    expect(abilities.torrent.modifyDamage!({ attacker: lowHpFire, defender: makePokemon(), move: { ...fireMove, type: 'water' }, holder: 'attacker' })).toBe(1.5);
    expect(abilities.overgrow.modifyDamage!({ attacker: lowHpFire, defender: makePokemon(), move: { ...fireMove, type: 'grass' }, holder: 'attacker' })).toBe(1.5);
    expect(abilities.swarm.modifyDamage!({ attacker: lowHpFire, defender: makePokemon(), move: { ...fireMove, type: 'bug' }, holder: 'attacker' })).toBe(1.5);
    expect(abilities.guts.modifyDamage!({ attacker: makePokemon({ status: 'burn' }), defender: makePokemon(), move: physicalMove, holder: 'attacker' })).toBe(1.5);
    expect(abilities['huge-power'].modifyDamage!({ attacker: makePokemon(), defender: makePokemon(), move: physicalMove, holder: 'attacker' })).toBe(2);
    expect(abilities['pure-power'].modifyDamage!({ attacker: makePokemon(), defender: makePokemon(), move: physicalMove, holder: 'attacker' })).toBe(2);
    expect(abilities['thick-fat'].modifyDamage!({ attacker: makePokemon(), defender: makePokemon(), move: fireMove, holder: 'defender' })).toBe(0.5);
    expect(abilities['marvel-scale'].modifyDamage!({ attacker: makePokemon(), defender: makePokemon({ status: 'burn' }), move: physicalMove, holder: 'defender' })).toBe(0.5);

    const defender = makePokemon({ currentHp: 50, nickname: 'Wall' });
    expect(abilities.levitate.checkImmunity!({ defender, move: { ...physicalMove, type: 'ground' }, name: 'Wall' }))
      .toEqual({ immune: true, message: "Wall's Levitate made it immune!" });
    expect(abilities['volt-absorb'].checkImmunity!({ defender, move: { ...physicalMove, type: 'electric' }, name: 'Wall' }).immune).toBe(true);
    expect(defender.currentHp).toBe(75);
    expect(abilities['water-absorb'].checkImmunity!({ defender, move: { ...physicalMove, type: 'water' }, name: 'Wall' }).immune).toBe(true);
    expect(defender.currentHp).toBe(100);
    expect(abilities['flash-fire'].checkImmunity!({ defender, move: fireMove, name: 'Wall' }))
      .toEqual({ immune: true, message: "Wall's Flash Fire activated!" });
    expect(abilities.soundproof.checkImmunity!({ defender, move: physicalMove, name: 'Wall' })).toEqual({ immune: false });
  });
});

describe('effect registry — held items', () => {
  it('registers each migrated held item', () => {
    expect(Object.keys(heldItems).sort()).toEqual([
      'aguav-berry', 'aspear-berry', 'black-sludge', 'cheri-berry', 'chesto-berry',
      'choice-band', 'choice-scarf', 'choice-specs', 'damp-rock', 'figy-berry', 'focus-sash',
      'heat-rock', 'iapapa-berry', 'icy-rock', 'life-orb', 'lum-berry', 'mago-berry',
      'muscle-band', 'oran-berry', 'pecha-berry', 'persim-berry', 'rawst-berry', 'rocky-helmet',
      'sitrus-berry', 'smooth-rock', 'wiki-berry', 'wise-glasses', 'leftovers',
    ].sort());
  });

  it('runs passive, after-damage, and attack-landed item hooks', () => {
    const consumed: PokemonInstance[] = [];
    const consumeItem = (pokemon: PokemonInstance) => { consumed.push(pokemon); pokemon.heldItem = null; };
    const holder = makePokemon({ currentHp: 50, heldItem: 'leftovers', nickname: 'Holder' });
    expect(heldItems.leftovers.onEndOfTurn!({ pokemon: holder, item: 'leftovers', name: 'Holder', consumeItem }).messages)
      .toEqual(['Holder restored a little HP with Leftovers!']);
    expect(holder.currentHp).toBe(56);

    const sludgePoison = makePokemon({ dataId: 1, currentHp: 50, heldItem: 'black-sludge', nickname: 'Poison' });
    expect(heldItems['black-sludge'].onEndOfTurn!({ pokemon: sludgePoison, item: 'black-sludge', name: 'Poison', consumeItem }).messages)
      .toEqual(['Poison restored a little HP with Black Sludge!']);
    const sludgeNormal = makePokemon({ currentHp: 80, heldItem: 'black-sludge', nickname: 'Normal' });
    expect(heldItems['black-sludge'].onEndOfTurn!({ pokemon: sludgeNormal, item: 'black-sludge', name: 'Normal', consumeItem }).messages)
      .toEqual(['Normal was hurt by Black Sludge!']);
    expect(sludgeNormal.currentHp).toBe(68);

    const sash = makePokemon({ currentHp: 0, heldItem: 'focus-sash', nickname: 'Sash' });
    expect(heldItems['focus-sash'].onAfterDamage!({ pokemon: sash, item: 'focus-sash', name: 'Sash', consumeItem, attacker: makePokemon(), damage: 100, hpBeforeHit: 100 }))
      .toEqual({ messages: ['Sash hung on using its Focus Sash!'], damagePrevented: 1, rockyHelmetRecoil: 0 });
    expect(sash.currentHp).toBe(1);

    const attacker = makePokemon({ currentHp: 100, nickname: 'Attacker' });
    expect(heldItems['rocky-helmet'].onAfterDamage!({ pokemon: holder, item: 'rocky-helmet', name: 'Holder', consumeItem, attacker, damage: 20, hpBeforeHit: 80 }).rockyHelmetRecoil)
      .toBe(16);
    expect(attacker.currentHp).toBe(84);

    const lifeOrb = makePokemon({ currentHp: 100, heldItem: 'life-orb', nickname: 'Orb' });
    expect(heldItems['life-orb'].onAttackLanded!({ pokemon: lifeOrb, item: 'life-orb', name: 'Orb', consumeItem, damage: 30 }))
      .toEqual({ messages: ['Orb lost some HP due to Life Orb!'], recoilDamage: 10 });
    expect(lifeOrb.currentHp).toBe(90);
    expect(consumed).toContain(sash);
  });

  it('runs status, volatile, threshold, weather, and damage item hooks', () => {
    const consumeItem = (pokemon: PokemonInstance) => { pokemon.heldItem = null; };
    const statusCases = [
      ['lum-berry', 'burn', "Berry's Lum Berry cured its status!"],
      ['cheri-berry', 'paralysis', "Berry's Cheri Berry cured its paralysis!"],
      ['rawst-berry', 'burn', "Berry's Rawst Berry cured its burn!"],
      ['aspear-berry', 'freeze', "Berry's Aspear Berry cured its freeze!"],
      ['chesto-berry', 'sleep', "Berry's Chesto Berry woke it up!"],
      ['pecha-berry', 'bad-poison', "Berry's Pecha Berry cured its poison!"],
    ] as const;
    for (const [item, status, message] of statusCases) {
      const pokemon = makePokemon({ heldItem: item, status, nickname: 'Berry', statusTurns: 2 });
      expect(heldItems[item].onStatusApplied!({ pokemon, item, name: 'Berry', consumeItem }))
        .toEqual({ messages: [message], cured: true });
      expect(pokemon.status).toBeNull();
    }

    for (const [item, message] of [
      ['persim-berry', "Berry's Persim Berry snapped it out of confusion!"],
      ['lum-berry', "Berry's Lum Berry cured its confusion!"],
    ] as const) {
      const pokemon = makePokemon({ heldItem: item, nickname: 'Berry' });
      expect(heldItems[item].onVolatileApplied!({ pokemon, item, name: 'Berry', consumeItem, volatile: 'confusion' }))
        .toEqual({ messages: [message], cured: true });
      expect(pokemon.heldItem).toBeNull();
    }

    const thresholdCases = [
      ['sitrus-berry', 25, 'Sitrus'], ['oran-berry', 10, 'Oran'], ['figy-berry', 33, 'Figy'],
      ['wiki-berry', 33, 'Wiki'], ['mago-berry', 33, 'Mago'], ['aguav-berry', 33, 'Aguav'], ['iapapa-berry', 33, 'Iapapa'],
    ] as const;
    for (const [item, healAmount, label] of thresholdCases) {
      const pokemon = makePokemon({ heldItem: item, currentHp: 50, nickname: 'Berry' });
      expect(heldItems[item].checkHPThreshold!({ pokemon, item, name: 'Berry', consumeItem }).messages)
        .toEqual([`Berry restored HP with its ${label} Berry!`]);
      expect(pokemon.currentHp).toBe(50 + healAmount);
      expect(pokemon.heldItem).toBeNull();
    }

    expect(heldItems['heat-rock'].weatherDurationBonus).toEqual({ sun: 3 });
    expect(heldItems['damp-rock'].weatherDurationBonus).toEqual({ rain: 3 });
    expect(heldItems['smooth-rock'].weatherDurationBonus).toEqual({ sandstorm: 3 });
    expect(heldItems['icy-rock'].weatherDurationBonus).toEqual({ hail: 3 });
    expect(heldItems['choice-band'].modifyDamage!({ attacker: makePokemon(), defender: makePokemon(), move: physicalMove })).toBe(1.5);
    expect(heldItems['choice-specs'].modifyDamage!({ attacker: makePokemon(), defender: makePokemon(), move: { ...physicalMove, category: 'special' } })).toBe(1.5);
    expect(heldItems['muscle-band'].modifyDamage!({ attacker: makePokemon(), defender: makePokemon(), move: physicalMove })).toBe(1.1);
    expect(heldItems['wise-glasses'].modifyDamage!({ attacker: makePokemon(), defender: makePokemon(), move: { ...physicalMove, category: 'special' } })).toBe(1.1);
    expect(heldItems['choice-scarf'].modifyDamage).toBeUndefined();
  });
});

describe('effect registry — move effects', () => {
  it('registers every move effect type', () => {
    expect(Object.keys(moveEffects).sort()).toEqual([
      'fixed-damage', 'flinch', 'heal', 'level-damage', 'leech-seed', 'multi-hit', 'multi-turn-lock',
      'ohko', 'protect', 'recoil', 'self-destruct', 'stat-change', 'status', 'drain', 'trap', 'two-turn', 'weather',
    ].sort());
  });

  it('runs status, stat, drain, recoil, flinch, heal, and self-destruct move effects', () => {
    const statusHandler = new StatusEffectHandler(new FixedRng([0.1, 0.2, 0.1]));
    const attacker = makePokemon({ currentHp: 50, nickname: 'Attacker' });
    const defender = makePokemon({ nickname: 'Defender' });
    statusHandler.initPokemon(attacker);
    statusHandler.initPokemon(defender);

    const baseContext = {
      attacker, defender, move: physicalMove, damageDealt: 40, target: defender, targetName: 'Defender', statusHandler,
      rng: new FixedRng([0.1, 0.2, 0.1]),
    };

    expect(moveEffects.status.apply({ ...baseContext, effect: { type: 'status', target: 'enemy', randomStatus: ['burn', 'paralysis'], chance: 100 } }).messages)
      .toEqual(['Defender was burned!']);
    expect(defender.status).toBe('burn');

    expect(moveEffects['stat-change'].apply({ ...baseContext, effect: { type: 'stat-change', target: 'enemy', stat: 'attack', stages: -2, chance: 100 } }).messages)
      .toEqual(["Defender's Attack fell harshly!"]);
    expect(statusHandler.getState(defender).statStages.attack).toBe(-2);

    expect(moveEffects.drain.apply({ ...baseContext, effect: { type: 'drain', target: 'enemy', chance: 100 } }))
      .toEqual({ messages: ['Attacker had its energy drained!'], healedHp: 20 });
    expect(attacker.currentHp).toBe(70);

    expect(moveEffects.recoil.apply({ ...baseContext, effect: { type: 'recoil', target: 'enemy', amount: 25, chance: 100 } }))
      .toEqual({ messages: ['Attacker is damaged by recoil! 10 dmg.'], recoilDamage: 10 });
    expect(attacker.currentHp).toBe(60);

    expect(moveEffects.flinch.apply({ ...baseContext, effect: { type: 'flinch', target: 'enemy', chance: 100 } }).messages).toEqual([]);
    expect(statusHandler.getState(defender).volatileStatuses.has('flinch')).toBe(true);

    expect(moveEffects.heal.apply({ ...baseContext, effect: { type: 'heal', target: 'self', amount: 50, chance: 100 }, target: attacker, targetName: 'Attacker' }).messages)
      .toEqual(['Attacker regained health!']);
    expect(attacker.currentHp).toBe(100);

    expect(moveEffects['self-destruct'].apply({ ...baseContext, effect: { type: 'self-destruct', target: 'self', chance: 100 }, target: attacker, targetName: 'Attacker' }))
      .toEqual({ messages: ['Attacker fainted!'], selfDestruct: true });
    expect(attacker.currentHp).toBe(0);
  });

  it('runs leech seed, trap, protect, and no-op move effects', () => {
    const statusHandler = new StatusEffectHandler(new FixedRng([0.1]));
    const attacker = makePokemon({ nickname: 'Attacker' });
    const defender = makePokemon({ nickname: 'Defender' });
    statusHandler.initPokemon(attacker);
    statusHandler.initPokemon(defender);
    const baseContext = {
      attacker, defender, move: physicalMove, damageDealt: 0, target: defender, targetName: 'Defender', statusHandler,
      rng: new FixedRng([0.1]),
    };

    expect(moveEffects['leech-seed'].apply({ ...baseContext, effect: { type: 'leech-seed', target: 'enemy', chance: 100 } }).messages)
      .toEqual(['Defender was seeded!']);
    expect(statusHandler.getState(defender).volatileStatuses.has('leech-seed')).toBe(true);

    expect(moveEffects.trap.apply({ ...baseContext, effect: { type: 'trap', target: 'enemy', chance: 100 }, rng: new FixedRng([0.1]) }).messages)
      .toEqual(['Defender was trapped!']);
    expect(statusHandler.getState(defender).trapTurns).toBe(4);

    expect(moveEffects.protect.apply({ ...baseContext, effect: { type: 'protect', target: 'self', chance: 100 }, target: attacker, targetName: 'Attacker', rng: new FixedRng([0.1]) }).messages)
      .toEqual(['Attacker protected itself!']);
    expect(statusHandler.getState(attacker).volatileStatuses.has('protect')).toBe(true);

    for (const effectType of ['multi-hit', 'fixed-damage', 'level-damage', 'ohko', 'weather', 'two-turn', 'multi-turn-lock'] as const) {
      expect(moveEffects[effectType].apply({ ...baseContext, effect: { type: effectType, target: 'enemy', chance: 100 } }).messages).toEqual([]);
    }
  });
});
