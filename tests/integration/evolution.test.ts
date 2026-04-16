import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExperienceCalculator } from '../../frontend/src/battle/calculation/ExperienceCalculator';
import { EncounterSystem } from '../../frontend/src/systems/overworld/EncounterSystem';
import { PokemonInstance } from '../../frontend/src/data/interfaces';
import { evolutionData } from '../../frontend/src/data/evolution-data';
import { pokemonData } from '../../frontend/src/data/pokemon';

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

describe('Evolution Integration', () => {
  it('should detect evolution threshold on level up', () => {
    // Charmander evolves at level 16
    const charmander = EncounterSystem.createWildPokemon(4, 15);
    charmander.exp = ExperienceCalculator.expForLevel(15);

    // Give enough EXP to reach level 16
    const expNeeded = ExperienceCalculator.expForLevel(16) - charmander.exp;
    const result = ExperienceCalculator.awardExp(charmander, expNeeded + 1);

    expect(charmander.level).toBeGreaterThanOrEqual(16);
    expect(result.levelsGained).toBeGreaterThanOrEqual(1);

    // Check evolution data
    const evos = evolutionData[4];
    expect(evos).toBeDefined();
    const evo = evos.find(e => e.condition.type === 'level' && e.condition.level! <= charmander.level);
    expect(evo).toBeDefined();
    expect(evo!.evolvesTo).toBe(5); // Charmeleon
  });

  it('should have valid evolution chain for all starters', () => {
    // Bulbasaur → Ivysaur → Venusaur
    expect(evolutionData[1]).toBeDefined();
    expect(evolutionData[1][0].evolvesTo).toBe(2);
    expect(evolutionData[2]).toBeDefined();
    expect(evolutionData[2][0].evolvesTo).toBe(3);

    // Charmander → Charmeleon → Charizard
    expect(evolutionData[4]).toBeDefined();
    expect(evolutionData[4][0].evolvesTo).toBe(5);
    expect(evolutionData[5]).toBeDefined();
    expect(evolutionData[5][0].evolvesTo).toBe(6);

    // Squirtle → Wartortle → Blastoise
    expect(evolutionData[7]).toBeDefined();
    expect(evolutionData[7][0].evolvesTo).toBe(8);
    expect(evolutionData[8]).toBeDefined();
    expect(evolutionData[8][0].evolvesTo).toBe(9);
  });

  it('should recalculate stats correctly after evolution', () => {
    // Simulate evolution: create Charmander, evolve to Charmeleon
    const charmander = EncounterSystem.createWildPokemon(4, 16);
    const oldHp = charmander.stats.hp;
    const oldAttack = charmander.stats.attack;

    // "Evolve" by changing dataId and recalculating stats
    charmander.dataId = 5; // Charmeleon
    ExperienceCalculator.recalculateStats(charmander);

    // Charmeleon has higher base stats, so stats should increase
    expect(charmander.stats.hp).toBeGreaterThan(oldHp);
    expect(charmander.stats.attack).toBeGreaterThan(oldAttack);
  });

  it('item-based evolutions should not trigger on level up', () => {
    // Pikachu evolves with Thunder Stone (item), not level
    const pikachu = EncounterSystem.createWildPokemon(25, 50);
    const evos = evolutionData[25];
    expect(evos).toBeDefined();
    expect(evos[0].condition.type).toBe('item');
    expect(evos[0].condition.itemId).toBe('thunder-stone');
  });
});
