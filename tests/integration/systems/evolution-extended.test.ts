import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExperienceCalculator, getNatureMultiplier } from '../../../frontend/src/battle/calculation/ExperienceCalculator';
import { EncounterSystem } from '../../../frontend/src/systems/overworld/EncounterSystem';
import { evolutionData } from '../../../frontend/src/data/evolution-data';
import { pokemonData } from '../../../frontend/src/data/pokemon';
import { PokemonInstance } from '../../../frontend/src/data/interfaces';

beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(0.5); });

describe('Evolution — Extended Scenarios', () => {
  describe('all level-based evolutions', () => {
    const levelEvos = Object.entries(evolutionData).flatMap(([fromId, evos]) =>
      evos.filter(e => e.condition.type === 'level').map(e => ({
        fromId: Number(fromId),
        toId: e.evolvesTo,
        level: e.condition.level!,
        fromName: pokemonData[Number(fromId)]?.name ?? `#${fromId}`,
        toName: pokemonData[e.evolvesTo]?.name ?? `#${e.evolvesTo}`,
      }))
    );

    it.each(levelEvos)('$fromName → $toName at level $level', ({ fromId, toId, level }) => {
      const pokemon = EncounterSystem.createWildPokemon(fromId, level - 1);
      pokemon.exp = ExperienceCalculator.expForLevel(level - 1);

      const expNeeded = ExperienceCalculator.expForLevel(level) - pokemon.exp + 1;
      const result = ExperienceCalculator.awardExp(pokemon, expNeeded);

      expect(pokemon.level).toBeGreaterThanOrEqual(level);
      expect(result.levelsGained).toBeGreaterThanOrEqual(1);

      // Verify evolution target exists
      expect(pokemonData[toId]).toBeDefined();
    });
  });

  describe('evolution stat improvement', () => {
    it.each([
      [1, 2, 'Bulbasaur→Ivysaur'],
      [4, 5, 'Charmander→Charmeleon'],
      [7, 8, 'Squirtle→Wartortle'],
      [10, 11, 'Caterpie→Metapod'],
      [16, 17, 'Pidgey→Pidgeotto'],
    ])('%s (id %d→%d): evolved form has higher base stats', (fromId, toId, _name) => {
      const fromData = pokemonData[fromId];
      const toData = pokemonData[toId];
      expect(fromData).toBeDefined();
      expect(toData).toBeDefined();

      // Sum of base stats of evolved form should be >= original
      const fromTotal = Object.values(fromData.baseStats).reduce((a, b) => a + b, 0);
      const toTotal = Object.values(toData.baseStats).reduce((a, b) => a + b, 0);
      expect(toTotal).toBeGreaterThanOrEqual(fromTotal);
    });
  });

  describe('evolution stat recalculation', () => {
    it('evolved pokemon should have higher calculated stats at same level', () => {
      const level = 20;
      const charmander = EncounterSystem.createWildPokemon(4, level);
      const charmanderHp = charmander.stats.hp;
      const charmanderAtk = charmander.stats.attack;

      // Simulate evolution
      charmander.dataId = 5; // Charmeleon
      ExperienceCalculator.recalculateStats(charmander);

      expect(charmander.stats.hp).toBeGreaterThan(charmanderHp);
      expect(charmander.stats.attack).toBeGreaterThan(charmanderAtk);
    });
  });

  describe('item-based evolution', () => {
    it('Pikachu requires Thunder Stone (not level-up)', () => {
      const evos = evolutionData[25];
      expect(evos).toBeDefined();
      expect(evos[0].condition.type).toBe('item');
      expect(evos[0].condition.itemId).toBe('thunder-stone');
    });
  });

  describe('nature effects on stats', () => {
    const natures = [
      ['adamant', 'attack', 'spAttack'],
      ['modest', 'spAttack', 'attack'],
      ['jolly', 'speed', 'spAttack'],
      ['timid', 'speed', 'attack'],
      ['bold', 'defense', 'attack'],
      ['calm', 'spDefense', 'attack'],
    ];

    it.each(natures)('%s nature boosts %s, lowers %s', (nature, up, down) => {
      expect(getNatureMultiplier(nature, up)).toBe(1.1);
      expect(getNatureMultiplier(nature, down)).toBe(0.9);
    });

    it('all 25 natures should return valid multipliers for all stats', () => {
      const allNatures = ['hardy', 'lonely', 'brave', 'adamant', 'naughty',
        'bold', 'docile', 'relaxed', 'impish', 'lax',
        'timid', 'hasty', 'serious', 'jolly', 'naive',
        'modest', 'mild', 'quiet', 'bashful', 'rash',
        'calm', 'gentle', 'sassy', 'careful', 'quirky'];
      const stats = ['attack', 'defense', 'spAttack', 'spDefense', 'speed'];

      for (const nature of allNatures) {
        for (const stat of stats) {
          const mult = getNatureMultiplier(nature, stat);
          expect([0.9, 1.0, 1.1]).toContain(mult);
        }
      }
    });
  });

  describe('EXP formula edge cases', () => {
    it('level 1 requires minimal EXP', () => {
      expect(ExperienceCalculator.expForLevel(1)).toBe(1);
    });

    it('level 100 requires 1,000,000 EXP', () => {
      expect(ExperienceCalculator.expForLevel(100)).toBe(1000000);
    });

    it('awardExp with 0 EXP should not level up', () => {
      const pokemon = EncounterSystem.createWildPokemon(4, 10);
      const level = pokemon.level;
      ExperienceCalculator.awardExp(pokemon, 0);
      expect(pokemon.level).toBe(level);
    });

    it('very large EXP award should level up many times', () => {
      const pokemon = EncounterSystem.createWildPokemon(4, 5);
      const result = ExperienceCalculator.awardExp(pokemon, 100000);
      expect(result.levelsGained).toBeGreaterThan(10);
      expect(pokemon.level).toBeGreaterThan(15);
    });

    it('new moves should be reported at each level-up', () => {
      // Charmander learns Ember at 7, Smokescreen at 13, Fire Fang at 19, Slash at 25
      const pokemon = EncounterSystem.createWildPokemon(4, 5);
      pokemon.exp = ExperienceCalculator.expForLevel(5);
      const result = ExperienceCalculator.awardExp(pokemon, 50000); // Level up a lot
      expect(result.newMoves.length).toBeGreaterThan(0);
    });
  });
});
