import { describe, it, expect, beforeEach } from 'vitest';
import { GameManager } from '../../../frontend/src/managers/GameManager';
import { itemData } from '../../../frontend/src/data/item-data';
import type { PokemonInstance } from '../../../frontend/src/data/interfaces';
import { applyItemUseResult, planItemUse } from '../../../frontend/src/systems/inventory';

beforeEach(() => {
  GameManager.resetInstance();
});

const makePokemon = (overrides?: Partial<PokemonInstance>): PokemonInstance => ({
  dataId: 4,
  level: 10,
  currentHp: 20,
  stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 },
  ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy',
  moves: [{ moveId: 'ember', currentPp: 25 }],
  status: null,
  exp: 0,
  friendship: 70,
  ...overrides,
});

function usePlannedItem(itemId: string, pokemon: PokemonInstance, targetName = 'Charmander'): boolean {
  const result = planItemUse(itemData[itemId], pokemon, { targetName });
  applyItemUseResult(pokemon, result);
  if (result.used) GameManager.getInstance().removeItem(itemId, 1);
  return result.used;
}

describe('Inventory Integration', () => {
  describe('item usage', () => {
    it('uses the production item service to heal pokemon', () => {
      const gm = GameManager.getInstance();
      const pokemon = makePokemon({ currentHp: 10 });
      gm.addToParty(pokemon);
      gm.addItem('potion', 3);

      expect(usePlannedItem('potion', pokemon)).toBe(true);

      expect(pokemon.currentHp).toBe(30);
      expect(gm.getItemCount('potion')).toBe(2);
    });

    it('uses the production item service without overhealing beyond max HP', () => {
      const pokemon = makePokemon({ currentHp: 25 });

      const result = planItemUse(itemData['potion'], pokemon, { targetName: 'Charmander' });
      applyItemUseResult(pokemon, result);

      expect(result.used).toBe(true);
      expect(pokemon.currentHp).toBe(30);
    });

    it('does not consume items when the production service reports no effect', () => {
      const gm = GameManager.getInstance();
      const pokemon = makePokemon({ currentHp: 30 });
      gm.addItem('potion', 1);

      expect(usePlannedItem('potion', pokemon)).toBe(false);

      expect(pokemon.currentHp).toBe(30);
      expect(gm.getItemCount('potion')).toBe(1);
    });

    it('should track item purchases', () => {
      const gm = GameManager.getInstance();
      const cost = 5 * 200;
      expect(gm.spendMoney(cost)).toBe(true);
      gm.addItem('poke-ball', 5);

      expect(gm.getItemCount('poke-ball')).toBe(5);
      expect(gm.getMoney()).toBe(2000);
    });
  });

  describe('pokeball data', () => {
    it('Poke Ball should have 1x catch rate', () => {
      expect(itemData['poke-ball'].effect.catchRateMultiplier).toBe(1);
    });

    it('Great Ball should have 1.5x catch rate', () => {
      expect(itemData['great-ball'].effect.catchRateMultiplier).toBe(1.5);
    });

    it('Ultra Ball should have 2x catch rate', () => {
      expect(itemData['ultra-ball'].effect.catchRateMultiplier).toBe(2);
    });
  });

  describe('medicine items', () => {
    it('should cure specific statuses', () => {
      expect(itemData['antidote'].effect.status).toBe('poison');
      expect(itemData['paralyze-heal'].effect.status).toBe('paralysis');
      expect(itemData['burn-heal'].effect.status).toBe('burn');
      expect(itemData['ice-heal'].effect.status).toBe('freeze');
      expect(itemData['awakening'].effect.status).toBe('sleep');
      expect(itemData['full-heal'].effect.status).toBe('all');
    });
  });
});
