import { describe, it, expect, beforeEach } from 'vitest';
import { GameManager } from '../../../frontend/src/managers/GameManager';
import { PokemonInstance } from '../../../frontend/src/data/interfaces';
import { itemData } from '../../../frontend/src/data/item-data';
import { shopInventories } from '../../../frontend/src/data/shop-data';
import { trainerData } from '../../../frontend/src/data/trainer-data';

const makePokemon = (overrides?: Partial<PokemonInstance>): PokemonInstance => ({
  dataId: 4,
  level: 10,
  currentHp: 30,
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

describe('PC Box Storage', () => {
  let gm: GameManager;

  beforeEach(() => {
    // @ts-expect-error accessing private for test reset
    GameManager.instance = undefined;
    gm = GameManager.getInstance();
  });

  describe('box initialization', () => {
    it('should have 12 empty boxes', () => {
      const boxes = gm.getBoxes();
      expect(boxes).toHaveLength(12);
      boxes.forEach(box => expect(box).toHaveLength(0));
    });

    it('should have default box names', () => {
      const names = gm.getBoxNames();
      expect(names).toHaveLength(12);
      expect(names[0]).toBe('Box 1');
      expect(names[11]).toBe('Box 12');
    });
  });

  describe('deposit and withdraw', () => {
    it('should deposit a pokemon into a box', () => {
      const pokemon = makePokemon({ dataId: 25 });
      expect(gm.depositPokemon(0, pokemon)).toBe(true);
      expect(gm.getBox(0)).toHaveLength(1);
      expect(gm.getBox(0)[0].dataId).toBe(25);
    });

    it('should withdraw a pokemon from a box', () => {
      gm.depositPokemon(0, makePokemon({ dataId: 25 }));
      const withdrawn = gm.withdrawPokemon(0, 0);
      expect(withdrawn).not.toBeNull();
      expect(withdrawn!.dataId).toBe(25);
      expect(gm.getBox(0)).toHaveLength(0);
    });

    it('should return null when withdrawing from empty slot', () => {
      expect(gm.withdrawPokemon(0, 0)).toBeNull();
    });

    it('should reject deposit when box is full (30)', () => {
      for (let i = 0; i < 30; i++) {
        gm.depositPokemon(0, makePokemon({ dataId: i + 1 }));
      }
      expect(gm.getBox(0)).toHaveLength(30);
      expect(gm.depositPokemon(0, makePokemon())).toBe(false);
    });

    it('should deposit into different boxes', () => {
      gm.depositPokemon(0, makePokemon({ dataId: 1 }));
      gm.depositPokemon(5, makePokemon({ dataId: 2 }));
      expect(gm.getBox(0)).toHaveLength(1);
      expect(gm.getBox(5)).toHaveLength(1);
      expect(gm.getBox(5)[0].dataId).toBe(2);
    });
  });

  describe('auto-deposit', () => {
    it('should auto-deposit to first box with space', () => {
      const pokemon = makePokemon({ dataId: 42 });
      expect(gm.autoDeposit(pokemon)).toBe(true);
      expect(gm.getBox(0)).toHaveLength(1);
      expect(gm.getBox(0)[0].dataId).toBe(42);
    });

    it('should skip full boxes and find next available', () => {
      // Fill box 0
      for (let i = 0; i < 30; i++) {
        gm.depositPokemon(0, makePokemon({ dataId: i }));
      }
      const pokemon = makePokemon({ dataId: 99 });
      expect(gm.autoDeposit(pokemon)).toBe(true);
      expect(gm.getBox(0)).toHaveLength(30);
      expect(gm.getBox(1)).toHaveLength(1);
      expect(gm.getBox(1)[0].dataId).toBe(99);
    });

    it('should return false when all boxes are full', () => {
      // Fill all 12 boxes × 30 = 360
      for (let b = 0; b < 12; b++) {
        for (let i = 0; i < 30; i++) {
          gm.depositPokemon(b, makePokemon({ dataId: b * 30 + i }));
        }
      }
      expect(gm.autoDeposit(makePokemon())).toBe(false);
    });
  });

  describe('party-full addToParty auto-deposits', () => {
    it('should add to party when not full', () => {
      expect(gm.addToParty(makePokemon())).toBe(true);
      expect(gm.getParty()).toHaveLength(1);
      expect(gm.getBox(0)).toHaveLength(0);
    });

    it('should auto-deposit to PC when party is full', () => {
      for (let i = 0; i < 6; i++) gm.addToParty(makePokemon({ dataId: i }));
      const seventh = makePokemon({ dataId: 100 });
      expect(gm.addToParty(seventh)).toBe(true);
      expect(gm.getParty()).toHaveLength(6);
      expect(gm.getBox(0)).toHaveLength(1);
      expect(gm.getBox(0)[0].dataId).toBe(100);
    });
  });

  describe('removeFromParty', () => {
    it('should remove pokemon from party', () => {
      gm.addToParty(makePokemon({ dataId: 1 }));
      gm.addToParty(makePokemon({ dataId: 2 }));
      const removed = gm.removeFromParty(0);
      expect(removed).not.toBeNull();
      expect(removed!.dataId).toBe(1);
      expect(gm.getParty()).toHaveLength(1);
    });

    it('should not remove last party member', () => {
      gm.addToParty(makePokemon({ dataId: 1 }));
      expect(gm.removeFromParty(0)).toBeNull();
      expect(gm.getParty()).toHaveLength(1);
    });

    it('should return null for invalid index', () => {
      gm.addToParty(makePokemon({ dataId: 1 }));
      expect(gm.removeFromParty(-1)).toBeNull();
      expect(gm.removeFromParty(5)).toBeNull();
    });
  });

  describe('box names', () => {
    it('should allow renaming boxes', () => {
      gm.setBoxName(0, 'Favorites');
      expect(gm.getBoxNames()[0]).toBe('Favorites');
    });

    it('should ignore invalid box index', () => {
      gm.setBoxName(-1, 'Bad');
      gm.setBoxName(20, 'Bad');
      expect(gm.getBoxNames()[0]).toBe('Box 1');
    });
  });

  describe('serialization with boxes', () => {
    it('should persist box data through serialize/deserialize', () => {
      gm.depositPokemon(0, makePokemon({ dataId: 25 }));
      gm.depositPokemon(3, makePokemon({ dataId: 150 }));
      gm.setBoxName(0, 'Starters');

      const saved = gm.serialize();

      // Reset and restore
      // @ts-expect-error accessing private for test reset
      GameManager.instance = undefined;
      const gm2 = GameManager.getInstance();
      gm2.deserialize(saved);

      expect(gm2.getBox(0)).toHaveLength(1);
      expect(gm2.getBox(0)[0].dataId).toBe(25);
      expect(gm2.getBox(3)).toHaveLength(1);
      expect(gm2.getBox(3)[0].dataId).toBe(150);
      expect(gm2.getBoxNames()[0]).toBe('Starters');
    });
  });
});

describe('Shop & Economy', () => {
  let gm: GameManager;

  beforeEach(() => {
    // @ts-expect-error accessing private for test reset
    GameManager.instance = undefined;
    gm = GameManager.getInstance();
  });

  describe('item prices', () => {
    it('all shop items should have buyPrice defined', () => {
      for (const [, items] of Object.entries(shopInventories)) {
        for (const itemId of items) {
          const item = itemData[itemId];
          expect(item, `Item ${itemId} should exist`).toBeDefined();
          expect(item.buyPrice, `Item ${itemId} should have buyPrice`).toBeGreaterThan(0);
        }
      }
    });

    it('key items should not have buyPrice', () => {
      const keyItems = Object.values(itemData).filter(i => i.category === 'key');
      for (const item of keyItems) {
        expect(item.buyPrice, `Key item ${item.id} should not be purchasable`).toBeUndefined();
      }
    });

    it('sell price should be half buy price', () => {
      const potion = itemData['potion'];
      expect(potion.buyPrice).toBe(300);
      expect(Math.floor(potion.buyPrice! / 2)).toBe(150);
    });
  });

  describe('shop inventories', () => {
    it('viridian shop should have basic items', () => {
      expect(shopInventories['viridian-city']).toContain('poke-ball');
      expect(shopInventories['viridian-city']).toContain('potion');
    });

    it('pewter shop should have more items than viridian', () => {
      expect(shopInventories['pewter-city'].length).toBeGreaterThan(
        shopInventories['viridian-city'].length
      );
    });

    it('pewter shop should include great balls', () => {
      expect(shopInventories['pewter-city']).toContain('great-ball');
    });
  });

  describe('buy flow', () => {
    it('should deduct money and add item on purchase', () => {
      const price = itemData['potion'].buyPrice!;
      const startMoney = gm.getMoney();
      expect(gm.spendMoney(price)).toBe(true);
      gm.addItem('potion', 1);
      expect(gm.getMoney()).toBe(startMoney - price);
      expect(gm.getItemCount('potion')).toBe(1);
    });

    it('should fail to buy when insufficient funds', () => {
      // Spend all money first
      gm.spendMoney(gm.getMoney());
      expect(gm.spendMoney(100)).toBe(false);
    });

    it('should buy multiple items at once', () => {
      const qty = 5;
      const price = itemData['poke-ball'].buyPrice!;
      const total = price * qty;
      const startMoney = gm.getMoney();
      expect(gm.spendMoney(total)).toBe(true);
      gm.addItem('poke-ball', qty);
      expect(gm.getMoney()).toBe(startMoney - total);
      expect(gm.getItemCount('poke-ball')).toBe(5);
    });
  });

  describe('sell flow', () => {
    it('should add money and remove item on sell', () => {
      gm.addItem('potion', 3);
      const sellPrice = Math.floor(itemData['potion'].buyPrice! / 2);
      gm.removeItem('potion', 1);
      gm.addMoney(sellPrice);
      expect(gm.getItemCount('potion')).toBe(2);
      expect(gm.getMoney()).toBe(3000 + sellPrice);
    });
  });

  describe('trainer rewards', () => {
    it('trainer data should have rewardMoney', () => {
      for (const [id, trainer] of Object.entries(trainerData)) {
        expect(trainer.rewardMoney, `Trainer ${id} missing rewardMoney`).toBeGreaterThan(0);
      }
    });
  });
});
