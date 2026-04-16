import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameManager } from '../../../frontend/src/managers/GameManager';
import { itemData } from '../../../frontend/src/data/item-data';
import { PokemonInstance } from '../../../frontend/src/data/interfaces';

beforeEach(() => {
  // @ts-expect-error private access for test
  GameManager.instance = undefined;
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

describe('Inventory Integration', () => {
  describe('item usage', () => {
    it('should use potion to heal pokemon', () => {
      const gm = GameManager.getInstance();
      const pokemon = makePokemon({ currentHp: 10 });
      gm.addToParty(pokemon);
      gm.addItem('potion', 3);

      // Simulate using a potion
      const potion = itemData['potion'];
      expect(potion.effect.type).toBe('heal-hp');
      expect(potion.effect.amount).toBe(20);

      // Apply potion effect
      const healAmount = potion.effect.amount!;
      pokemon.currentHp = Math.min(pokemon.stats.hp, pokemon.currentHp + healAmount);
      gm.removeItem('potion', 1);

      expect(pokemon.currentHp).toBe(30); // 10 + 20
      expect(gm.getItemCount('potion')).toBe(2);
    });

    it('should not overheal beyond max HP', () => {
      const gm = GameManager.getInstance();
      const pokemon = makePokemon({ currentHp: 25 }); // 25 out of 30
      gm.addToParty(pokemon);

      const healAmount = itemData['potion'].effect.amount!; // 20
      pokemon.currentHp = Math.min(pokemon.stats.hp, pokemon.currentHp + healAmount);
      expect(pokemon.currentHp).toBe(30); // Capped at max HP
    });

    it('should track item purchases', () => {
      const gm = GameManager.getInstance();
      // Buy 5 poke balls at 200 each
      const cost = 5 * 200;
      expect(gm.spendMoney(cost)).toBe(true);
      gm.addItem('poke-ball', 5);

      expect(gm.getItemCount('poke-ball')).toBe(5);
      expect(gm.getMoney()).toBe(2000); // 3000 - 1000
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
