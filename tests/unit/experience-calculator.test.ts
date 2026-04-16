import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExperienceCalculator, getNatureMultiplier, getNatureDescription } from '../../frontend/src/battle/calculation/ExperienceCalculator';
import { PokemonInstance } from '../../frontend/src/data/interfaces';

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

const makePokemon = (overrides?: Partial<PokemonInstance>): PokemonInstance => ({
  dataId: 4, // Charmander
  level: 10,
  currentHp: 30,
  stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 },
  ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy',
  moves: [{ moveId: 'scratch', currentPp: 35 }, { moveId: 'growl', currentPp: 40 }],
  status: null,
  exp: 1000, // Level 10 = 10^3 = 1000
  friendship: 70,
  ...overrides,
});

describe('ExperienceCalculator', () => {
  describe('calculateExp', () => {
    it('should return > 0 for valid defeated pokemon', () => {
      const defeated = makePokemon({ level: 5 });
      const exp = ExperienceCalculator.calculateExp(defeated, false);
      expect(exp).toBeGreaterThan(0);
    });

    it('should give more EXP for trainer battles', () => {
      const defeated = makePokemon({ level: 5 });
      const wildExp = ExperienceCalculator.calculateExp(defeated, false);
      const trainerExp = ExperienceCalculator.calculateExp(defeated, true);
      expect(trainerExp).toBeGreaterThan(wildExp);
    });

    it('should return 0 for invalid pokemon data', () => {
      const invalid = makePokemon({ dataId: 99999 });
      const exp = ExperienceCalculator.calculateExp(invalid, false);
      expect(exp).toBe(0);
    });

    it('should scale with defeated pokemon level', () => {
      const lowLevel = makePokemon({ level: 5 });
      const highLevel = makePokemon({ level: 50 });
      expect(ExperienceCalculator.calculateExp(highLevel, false)).toBeGreaterThan(
        ExperienceCalculator.calculateExp(lowLevel, false)
      );
    });
  });

  describe('expForLevel', () => {
    it('should return 0 for level 0', () => {
      expect(ExperienceCalculator.expForLevel(0)).toBe(0);
    });

    it('should use cubic formula', () => {
      expect(ExperienceCalculator.expForLevel(10)).toBe(1000);
      expect(ExperienceCalculator.expForLevel(5)).toBe(125);
      expect(ExperienceCalculator.expForLevel(100)).toBe(1000000);
    });

    it('should increase with level', () => {
      for (let level = 1; level < 100; level++) {
        expect(ExperienceCalculator.expForLevel(level + 1)).toBeGreaterThan(
          ExperienceCalculator.expForLevel(level)
        );
      }
    });
  });

  describe('awardExp', () => {
    it('should increase pokemon EXP', () => {
      const pokemon = makePokemon({ level: 5, exp: 125 }); // Exactly level 5
      const before = pokemon.exp;
      ExperienceCalculator.awardExp(pokemon, 50);
      expect(pokemon.exp).toBe(before + 50);
    });

    it('should trigger level up when EXP threshold reached', () => {
      const pokemon = makePokemon({ level: 5, exp: 125 }); // Level 5 = 125 EXP
      // Level 6 = 216 EXP, need 91 more
      const result = ExperienceCalculator.awardExp(pokemon, 100);
      expect(result.levelsGained).toBeGreaterThanOrEqual(1);
      expect(pokemon.level).toBeGreaterThanOrEqual(6);
    });

    it('should trigger multiple level ups with large EXP award', () => {
      const pokemon = makePokemon({ level: 5, exp: 125 });
      // Level 6 = 216, level 7 = 343, level 8 = 512... give enough for multiple
      const result = ExperienceCalculator.awardExp(pokemon, 500);
      expect(result.levelsGained).toBeGreaterThan(1);
    });

    it('should report new moves learned at level up', () => {
      // Charmander learns Ember at level 7
      const pokemon = makePokemon({ dataId: 4, level: 6, exp: 216 });
      // Level 7 = 343, need 127 more
      const result = ExperienceCalculator.awardExp(pokemon, 130);
      expect(result.newMoves).toContain('ember');
    });

    it('should return correct newLevel', () => {
      const pokemon = makePokemon({ level: 5, exp: 125 });
      const result = ExperienceCalculator.awardExp(pokemon, 100);
      expect(result.newLevel).toBe(pokemon.level);
    });
  });

  describe('recalculateStats', () => {
    it('should update stats based on base stats, IVs, EVs, and nature', () => {
      const pokemon = makePokemon();
      const oldHp = pokemon.stats.hp;
      pokemon.level = 20;
      ExperienceCalculator.recalculateStats(pokemon);
      expect(pokemon.stats.hp).toBeGreaterThan(oldHp);
    });

    it('should cap currentHp to new max HP', () => {
      const pokemon = makePokemon({ level: 5 });
      pokemon.currentHp = 999;
      ExperienceCalculator.recalculateStats(pokemon);
      expect(pokemon.currentHp).toBeLessThanOrEqual(pokemon.stats.hp);
    });

    it('should apply nature modifiers', () => {
      const adamant = makePokemon({ nature: 'adamant' }); // +attack, -spAttack
      const modest = makePokemon({ nature: 'modest' });   // +spAttack, -attack
      ExperienceCalculator.recalculateStats(adamant);
      ExperienceCalculator.recalculateStats(modest);
      expect(adamant.stats.attack).toBeGreaterThan(modest.stats.attack);
      expect(modest.stats.spAttack).toBeGreaterThan(adamant.stats.spAttack);
    });
  });
});

describe('getNatureMultiplier', () => {
  it('should return 1.0 for neutral natures', () => {
    expect(getNatureMultiplier('hardy', 'attack')).toBe(1.0);
    expect(getNatureMultiplier('docile', 'defense')).toBe(1.0);
  });

  it('should return 1.1 for boosted stat', () => {
    expect(getNatureMultiplier('adamant', 'attack')).toBe(1.1);
    expect(getNatureMultiplier('modest', 'spAttack')).toBe(1.1);
    expect(getNatureMultiplier('timid', 'speed')).toBe(1.1);
  });

  it('should return 0.9 for reduced stat', () => {
    expect(getNatureMultiplier('adamant', 'spAttack')).toBe(0.9);
    expect(getNatureMultiplier('modest', 'attack')).toBe(0.9);
    expect(getNatureMultiplier('timid', 'attack')).toBe(0.9);
  });

  it('should return 1.0 for unaffected stats', () => {
    expect(getNatureMultiplier('adamant', 'defense')).toBe(1.0);
    expect(getNatureMultiplier('adamant', 'speed')).toBe(1.0);
  });
});

describe('getNatureDescription', () => {
  it('should return Neutral for neutral natures', () => {
    expect(getNatureDescription('hardy')).toBe('Neutral');
  });

  it('should describe boosted/lowered stats', () => {
    const desc = getNatureDescription('adamant');
    expect(desc).toContain('+');
    expect(desc).toContain('-');
  });
});
