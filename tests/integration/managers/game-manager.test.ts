import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameManager } from '../../../frontend/src/managers/GameManager';
import { PokemonInstance } from '../../../frontend/src/data/interfaces';

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

describe('GameManager', () => {
  let gm: GameManager;

  beforeEach(() => {
    // Reset singleton by accessing constructor via prototype trick
    // @ts-expect-error accessing private for test reset
    GameManager.instance = undefined;
    gm = GameManager.getInstance();
  });

  describe('singleton', () => {
    it('should return the same instance', () => {
      expect(GameManager.getInstance()).toBe(gm);
    });
  });

  describe('party management', () => {
    it('should start with empty party', () => {
      expect(gm.getParty()).toEqual([]);
    });

    it('should add pokemon to party', () => {
      const pokemon = makePokemon();
      expect(gm.addToParty(pokemon)).toBe(true);
      expect(gm.getParty()).toHaveLength(1);
    });

    it('should auto-deposit to PC box when party is full', () => {
      for (let i = 0; i < 6; i++) {
        gm.addToParty(makePokemon({ dataId: i + 1 }));
      }
      const overflow = makePokemon({ dataId: 99 });
      expect(gm.addToParty(overflow)).toBe(true);
      expect(gm.getParty()).toHaveLength(6);
      expect(gm.getBox(0)).toHaveLength(1);
      expect(gm.getBox(0)[0].dataId).toBe(99);
    });

    it('should set party directly', () => {
      const party = [makePokemon(), makePokemon({ dataId: 1 })];
      gm.setParty(party);
      expect(gm.getParty()).toHaveLength(2);
    });
  });

  describe('bag management', () => {
    it('should start with empty bag', () => {
      expect(gm.getBag()).toEqual([]);
    });

    it('should add items', () => {
      gm.addItem('potion', 5);
      expect(gm.getItemCount('potion')).toBe(5);
    });

    it('should stack same items', () => {
      gm.addItem('potion', 3);
      gm.addItem('potion', 2);
      expect(gm.getItemCount('potion')).toBe(5);
    });

    it('should remove items', () => {
      gm.addItem('potion', 5);
      expect(gm.removeItem('potion', 3)).toBe(true);
      expect(gm.getItemCount('potion')).toBe(2);
    });

    it('should fail to remove more than available', () => {
      gm.addItem('potion', 2);
      expect(gm.removeItem('potion', 5)).toBe(false);
    });

    it('should remove item entry when quantity reaches 0', () => {
      gm.addItem('potion', 2);
      gm.removeItem('potion', 2);
      expect(gm.getItemCount('potion')).toBe(0);
      expect(gm.getBag().find(e => e.itemId === 'potion')).toBeUndefined();
    });
  });

  describe('money', () => {
    it('should start with 3000', () => {
      expect(gm.getMoney()).toBe(3000);
    });

    it('should add money', () => {
      gm.addMoney(500);
      expect(gm.getMoney()).toBe(3500);
    });

    it('should spend money', () => {
      expect(gm.spendMoney(1000)).toBe(true);
      expect(gm.getMoney()).toBe(2000);
    });

    it('should fail to spend more than available', () => {
      expect(gm.spendMoney(5000)).toBe(false);
      expect(gm.getMoney()).toBe(3000);
    });
  });

  describe('badges', () => {
    it('should start with no badges', () => {
      expect(gm.getBadges()).toEqual([]);
    });

    it('should add badges', () => {
      gm.addBadge('boulder');
      expect(gm.getBadges()).toContain('boulder');
    });

    it('should not duplicate badges', () => {
      gm.addBadge('boulder');
      gm.addBadge('boulder');
      expect(gm.getBadges()).toHaveLength(1);
    });
  });

  describe('flags', () => {
    it('should return false for unset flags', () => {
      expect(gm.getFlag('some-flag')).toBe(false);
    });

    it('should set and get flags', () => {
      gm.setFlag('got-pokedex');
      expect(gm.getFlag('got-pokedex')).toBe(true);
    });
  });

  describe('trainers defeated', () => {
    it('should track defeated trainers', () => {
      gm.defeatTrainer('rival-1');
      expect(gm.isTrainerDefeated('rival-1')).toBe(true);
      expect(gm.isTrainerDefeated('gym-brock')).toBe(false);
    });

    it('should not duplicate defeated trainers', () => {
      gm.defeatTrainer('rival-1');
      gm.defeatTrainer('rival-1');
      expect(gm.getTrainersDefeated()).toHaveLength(1);
    });
  });

  describe('pokedex', () => {
    it('should track seen pokemon', () => {
      gm.markSeen(1);
      const dex = gm.getPokedex();
      expect(dex.seen).toContain(1);
    });

    it('should track caught pokemon and auto-mark as seen', () => {
      gm.markCaught(4);
      const dex = gm.getPokedex();
      expect(dex.caught).toContain(4);
      expect(dex.seen).toContain(4);
    });
  });

  describe('serialize / deserialize', () => {
    it('should round-trip all state', () => {
      gm.setPlayerName('Ash');
      gm.addToParty(makePokemon());
      gm.addItem('potion', 5);
      gm.addMoney(100);
      gm.addBadge('boulder');
      gm.setFlag('got-pokedex');
      gm.defeatTrainer('rival-1');
      gm.markCaught(4);
      gm.setCurrentMap('route-1');
      gm.setPlayerPosition({ x: 5, y: 10, direction: 'up' });
      gm.addPlaytime(3600);

      const serialized = gm.serialize();

      // Create fresh instance
      // @ts-expect-error accessing private for test reset
      GameManager.instance = undefined;
      const gm2 = GameManager.getInstance();
      gm2.deserialize(serialized);

      expect(gm2.getPlayerName()).toBe('Ash');
      expect(gm2.getParty()).toHaveLength(1);
      expect(gm2.getItemCount('potion')).toBe(5);
      expect(gm2.getMoney()).toBe(3100);
      expect(gm2.getBadges()).toContain('boulder');
      expect(gm2.getFlag('got-pokedex')).toBe(true);
      expect(gm2.isTrainerDefeated('rival-1')).toBe(true);
      expect(gm2.getPokedex().caught).toContain(4);
      expect(gm2.getCurrentMap()).toBe('route-1');
      expect(gm2.getPlayerPosition()).toEqual({ x: 5, y: 10, direction: 'up' });
      expect(gm2.getPlaytime()).toBe(3600);
    });
  });
});
