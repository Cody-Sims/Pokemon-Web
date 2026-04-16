import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIController } from '../../frontend/src/battle/core/AIController';
import { PokemonInstance } from '../../frontend/src/data/interfaces';

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

const makePokemon = (overrides?: Partial<PokemonInstance>): PokemonInstance => ({
  dataId: 4,
  level: 10,
  currentHp: 30,
  stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 },
  ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy',
  moves: [
    { moveId: 'ember', currentPp: 25 },
    { moveId: 'tackle', currentPp: 35 },
    { moveId: 'growl', currentPp: 40 },
  ],
  status: null,
  exp: 0,
  friendship: 70,
  ...overrides,
});

describe('AIController', () => {
  describe('wild pokemon', () => {
    it('should select a random move from available moves', () => {
      const wild = makePokemon();
      const opponent = makePokemon({ dataId: 1 });
      const move = AIController.selectMove(wild, opponent, false);
      expect(['ember', 'tackle', 'growl']).toContain(move);
    });

    it('should return tackle as fallback when no PP left', () => {
      const wild = makePokemon({
        moves: [
          { moveId: 'ember', currentPp: 0 },
          { moveId: 'tackle', currentPp: 0 },
        ],
      });
      const opponent = makePokemon({ dataId: 1 });
      expect(AIController.selectMove(wild, opponent, false)).toBe('tackle');
    });
  });

  describe('trainer pokemon', () => {
    it('should prefer super-effective moves', () => {
      // Charmander with Ember (fire) vs Bulbasaur (grass) → should pick ember
      const trainer = makePokemon({
        moves: [
          { moveId: 'ember', currentPp: 25 },  // fire vs grass = 2x
          { moveId: 'tackle', currentPp: 35 },  // normal vs grass = 1x
        ],
      });
      const opponent = makePokemon({ dataId: 1 }); // Bulbasaur
      const move = AIController.selectMove(trainer, opponent, true);
      expect(move).toBe('ember');
    });

    it('should consider move power when selecting', () => {
      const trainer = makePokemon({
        moves: [
          { moveId: 'ember', currentPp: 25 },         // power 40, fire vs grass = 2x → score=80
          { moveId: 'flamethrower', currentPp: 15 },   // power 90, fire vs grass = 2x → score=180
        ],
      });
      const opponent = makePokemon({ dataId: 1 });
      const move = AIController.selectMove(trainer, opponent, true);
      expect(move).toBe('flamethrower');
    });

    it('should skip status moves for trainer AI scoring', () => {
      // Status move (power=null) should be skipped in scoring
      const trainer = makePokemon({
        moves: [
          { moveId: 'growl', currentPp: 40 },    // status, power=null
          { moveId: 'tackle', currentPp: 35 },    // power 40
        ],
      });
      const opponent = makePokemon({ dataId: 1 });
      const move = AIController.selectMove(trainer, opponent, true);
      expect(move).toBe('tackle');
    });

    it('should fall back to random if opponent data not found', () => {
      const trainer = makePokemon();
      const unknown = makePokemon({ dataId: 99999 });
      const move = AIController.selectMove(trainer, unknown, true);
      expect(['ember', 'tackle', 'growl']).toContain(move);
    });
  });
});
