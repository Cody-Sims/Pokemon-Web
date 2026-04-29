import { describe, it, expect, beforeEach, vi } from 'vitest';
import { battlePointShopCatalog } from '../../../frontend/src/data/bp-shop-data';
import { itemData } from '../../../frontend/src/data/item-data';
import { GameManager } from '../../../frontend/src/managers/GameManager';
import { createLocalStorageMock } from '../../mocks/local-storage-mock';

/**
 * A.1 Battle Tower — BP Shop catalog & purchase semantics.
 */
describe('BP Shop (A.1)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
    GameManager.getInstance().reset();
  });

  describe('catalog integrity', () => {
    it('every catalog entry references an existing item', () => {
      for (const entry of battlePointShopCatalog) {
        expect(itemData[entry.itemId], `unknown itemId ${entry.itemId}`).toBeDefined();
      }
    });

    it('every entry has a positive cost in BP', () => {
      for (const entry of battlePointShopCatalog) {
        expect(entry.cost).toBeGreaterThan(0);
      }
    });

    it('catalog has no duplicate item ids', () => {
      const ids = battlePointShopCatalog.map(e => e.itemId);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('covers each plan-defined competitive category', () => {
      const cats = new Set(battlePointShopCatalog.map(e => e.category));
      expect(cats.has('held')).toBe(true);
      expect(cats.has('berry')).toBe(true);
      expect(cats.has('utility')).toBe(true);
      expect(cats.has('consumable')).toBe(true);
    });
  });

  describe('purchase semantics', () => {
    it('a successful purchase debits BP and adds the item', () => {
      const gm = GameManager.getInstance();
      gm.addBattlePoints(100);
      const entry = battlePointShopCatalog[0];
      const ok = gm.spendBattlePoints(entry.cost);
      expect(ok).toBe(true);
      gm.addItem(entry.itemId);
      expect(gm.getBattlePoints()).toBe(100 - entry.cost);
      expect(gm.getItemCount(entry.itemId)).toBe(1);
    });

    it('an unaffordable purchase leaves BP and bag untouched', () => {
      const gm = GameManager.getInstance();
      gm.addBattlePoints(2);
      const entry = battlePointShopCatalog.find(e => e.cost > 5)!;
      const ok = gm.spendBattlePoints(entry.cost);
      expect(ok).toBe(false);
      expect(gm.getBattlePoints()).toBe(2);
      expect(gm.getItemCount(entry.itemId)).toBe(0);
    });
  });
});
