import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIController } from '../../../frontend/src/battle/core/AIController';
import { createPokemonFactory } from '../../helpers/pokemon-factory';

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});


const makePokemon = createPokemonFactory('ai-basic');

describe('AIController', () => {
  describe('wild pokemon', () => {
    it('should select a random move from available moves', () => {
      const wild = makePokemon();
      const opponent = makePokemon({ dataId: 1 });
      const move = AIController.selectMove(wild, opponent, false);
      expect(['ember', 'tackle', 'growl']).toContain(move);
    });

    it('should return struggle as fallback when no PP left', () => {
      const wild = makePokemon({
        moves: [
          { moveId: 'ember', currentPp: 0 },
          { moveId: 'tackle', currentPp: 0 },
        ],
      });
      const opponent = makePokemon({ dataId: 1 });
      expect(AIController.selectMove(wild, opponent, false)).toBe('struggle');
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
