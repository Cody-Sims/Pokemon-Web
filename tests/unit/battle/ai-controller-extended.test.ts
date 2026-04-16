import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIController } from '../../../frontend/src/battle/core/AIController';
import { PokemonInstance } from '../../../frontend/src/data/interfaces';
import { pokemonData } from '../../../frontend/src/data/pokemon';
import { moveData } from '../../../frontend/src/data/moves';

beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(0.5); });

const makePokemon = (overrides?: Partial<PokemonInstance>): PokemonInstance => ({
  dataId: 4, level: 20, currentHp: 100,
  stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 55 },
  ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy', moves: [
    { moveId: 'ember', currentPp: 25 },
    { moveId: 'scratch', currentPp: 35 },
    { moveId: 'flamethrower', currentPp: 15 },
    { moveId: 'growl', currentPp: 40 },
  ],
  status: null, exp: 0, friendship: 70, ...overrides,
});

describe('AIController — Extended', () => {
  describe('trainer AI scoring', () => {
    it('should pick flamethrower over ember (higher power, same type effectiveness)', () => {
      const trainer = makePokemon();
      const opponent = makePokemon({ dataId: 1 }); // Bulbasaur (grass)
      const move = AIController.selectMove(trainer, opponent, true);
      expect(move).toBe('flamethrower'); // 90 power vs 40 power, both fire vs grass = 2x
    });

    it('should pick type-effective move over higher-power neutral move', () => {
      // Ember (40 power, fire vs grass = 2x → score 80) vs Scratch (40 power, normal vs grass = 1x → 40)
      const trainer = makePokemon({
        moves: [
          { moveId: 'ember', currentPp: 25 },
          { moveId: 'scratch', currentPp: 35 },
        ],
      });
      const opponent = makePokemon({ dataId: 1 });
      expect(AIController.selectMove(trainer, opponent, true)).toBe('ember');
    });

    it('should avoid moves with 0 PP', () => {
      const trainer = makePokemon({
        moves: [
          { moveId: 'flamethrower', currentPp: 0 },
          { moveId: 'ember', currentPp: 25 },
        ],
      });
      const opponent = makePokemon({ dataId: 1 });
      expect(AIController.selectMove(trainer, opponent, true)).toBe('ember');
    });

    it('should fallback to tackle when all PP exhausted', () => {
      const trainer = makePokemon({
        moves: [
          { moveId: 'ember', currentPp: 0 },
          { moveId: 'flamethrower', currentPp: 0 },
        ],
      });
      expect(AIController.selectMove(trainer, makePokemon({ dataId: 1 }), true)).toBe('tackle');
    });
  });

  describe('wild AI randomness', () => {
    it('should pick from available moves randomly', () => {
      const wild = makePokemon({
        moves: [{ moveId: 'ember', currentPp: 25 }, { moveId: 'scratch', currentPp: 35 }],
      });

      // Test with different random values
      vi.spyOn(Math, 'random').mockReturnValue(0.01);
      const m1 = AIController.selectMove(wild, makePokemon({ dataId: 1 }), false);

      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      const m2 = AIController.selectMove(wild, makePokemon({ dataId: 1 }), false);

      expect(['ember', 'scratch']).toContain(m1);
      expect(['ember', 'scratch']).toContain(m2);
    });
  });

  describe('edge cases', () => {
    it('should handle single move pokemon', () => {
      const pokemon = makePokemon({ moves: [{ moveId: 'tackle', currentPp: 35 }] });
      expect(AIController.selectMove(pokemon, makePokemon({ dataId: 1 }), true)).toBe('tackle');
      expect(AIController.selectMove(pokemon, makePokemon({ dataId: 1 }), false)).toBe('tackle');
    });

    it('should handle unknown opponent data for trainer', () => {
      const trainer = makePokemon();
      const unknown = makePokemon({ dataId: 99999 });
      const move = AIController.selectMove(trainer, unknown, true);
      expect(trainer.moves.map(m => m.moveId)).toContain(move);
    });
  });
});
