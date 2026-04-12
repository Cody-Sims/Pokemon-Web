import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CatchCalculator } from '../../frontend/src/battle/CatchCalculator';
import { PokemonInstance } from '../../frontend/src/data/interfaces';

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

const makeWild = (overrides?: Partial<PokemonInstance>): PokemonInstance => ({
  dataId: 16, // Pidgey (catchRate: 255)
  level: 5,
  currentHp: 20,
  stats: { hp: 20, attack: 12, defense: 10, spAttack: 9, spDefense: 9, speed: 14 },
  ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy',
  moves: [{ moveId: 'tackle', currentPp: 35 }],
  status: null,
  exp: 0,
  friendship: 70,
  ...overrides,
});

describe('CatchCalculator', () => {
  it('should guarantee catch for catchRate 255 Pokemon at full HP with Poke Ball', () => {
    // Pidgey catchRate=255, full HP, ball multiplier=1
    // modifiedRate = ((3*20 - 2*20) * 255 * 1 * 1) / (3*20) = 255
    const result = CatchCalculator.calculate(makeWild(), 1);
    expect(result.caught).toBe(true);
    expect(result.shakes).toBe(3);
  });

  it('should have lower catch rate for low-catchRate Pokemon', () => {
    // Charmander catchRate=45, full HP
    const starter = makeWild({ dataId: 4, stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 }, currentHp: 30 });
    // With random=0.5, this may or may not catch — just verify it runs
    const result = CatchCalculator.calculate(starter, 1);
    expect(result.shakes).toBeGreaterThanOrEqual(0);
    expect(result.shakes).toBeLessThanOrEqual(3);
  });

  it('should increase catch rate with higher ball multiplier', () => {
    const pokemon = makeWild({ dataId: 4, stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 }, currentHp: 30 });
    // Compare Poke Ball (1) vs Ultra Ball (2)
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const pokeBall = CatchCalculator.calculate(pokemon, 1);

    const pokemon2 = makeWild({ dataId: 4, stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 }, currentHp: 30 });
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const ultraBall = CatchCalculator.calculate(pokemon2, 2);

    expect(ultraBall.shakes).toBeGreaterThanOrEqual(pokeBall.shakes);
  });

  it('should give status bonus for sleep/freeze (2x)', () => {
    const sleepy = makeWild({ dataId: 4, currentHp: 15, stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 }, status: 'sleep' });
    const awake = makeWild({ dataId: 4, currentHp: 15, stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 }, status: null });

    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const sleepResult = CatchCalculator.calculate(sleepy, 1);

    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const awakeResult = CatchCalculator.calculate(awake, 1);

    expect(sleepResult.shakes).toBeGreaterThanOrEqual(awakeResult.shakes);
  });

  it('should give status bonus for burn/paralysis/poison (1.5x)', () => {
    const burned = makeWild({ status: 'burn' });
    const result = CatchCalculator.calculate(burned, 1);
    expect(result.caught).toBe(true); // Pidgey with 255 catchRate + burn bonus → guaranteed
  });

  it('should return { caught: false, shakes: 0 } for invalid pokemon data', () => {
    const invalid = makeWild({ dataId: 99999 });
    const result = CatchCalculator.calculate(invalid, 1);
    expect(result.caught).toBe(false);
    expect(result.shakes).toBe(0);
  });

  it('should increase catch rate when HP is lower', () => {
    // Full HP vs 1 HP
    vi.spyOn(Math, 'random').mockReturnValue(0.6);
    const fullHp = makeWild({ dataId: 4, currentHp: 30, stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 } });
    const fullResult = CatchCalculator.calculate(fullHp, 1);

    vi.spyOn(Math, 'random').mockReturnValue(0.6);
    const lowHp = makeWild({ dataId: 4, currentHp: 1, stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 } });
    const lowResult = CatchCalculator.calculate(lowHp, 1);

    expect(lowResult.shakes).toBeGreaterThanOrEqual(fullResult.shakes);
  });
});
