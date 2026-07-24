import { describe, expect, it } from 'vitest';
import type { ItemData } from '@data/interfaces';
import {
  buildInventoryViewModel,
  filterInventoryItems,
  inventoryWindow,
  normalizeCategoryIndex,
  type InventoryBagEntry,
} from '@systems/inventory';

const items: Record<string, ItemData> = {
  potion: {
    id: 'potion',
    name: 'Potion',
    category: 'medicine',
    description: 'Restores HP.',
    effect: { type: 'heal-hp', amount: 20 },
  },
  ball: {
    id: 'ball',
    name: 'Ball',
    category: 'pokeball',
    description: 'Catches Pokémon.',
    effect: { type: 'capture', catchRateMultiplier: 1 },
  },
  tm: {
    id: 'tm',
    name: 'TM',
    category: 'tm',
    description: 'Teaches a move.',
    effect: { type: 'teach-move', moveId: 'tackle' },
  },
};

const getItem = (id: string): ItemData | undefined => items[id];

describe('InventoryModel', () => {
  it('filters visible bag entries by category and positive quantity', () => {
    const bag: InventoryBagEntry[] = [
      { itemId: 'potion', quantity: 2 },
      { itemId: 'ball', quantity: 3 },
      { itemId: 'tm', quantity: 0 },
      { itemId: 'missing', quantity: 1 },
    ];

    expect(filterInventoryItems(bag, 'medicine', getItem)).toEqual([{ item: items.potion, qty: 2 }]);
    expect(filterInventoryItems(bag, 'pokeball', getItem)).toEqual([{ item: items.ball, qty: 3 }]);
    expect(filterInventoryItems(bag, 'tm', getItem)).toEqual([]);
  });

  it('builds an empty bag view with clamped cursor and scroll offset', () => {
    const view = buildInventoryViewModel({
      bag: [],
      category: 'medicine',
      cursor: 10,
      scrollOffset: 10,
      maxVisible: 6,
      getItem,
    });

    expect(view.isEmpty).toBe(true);
    expect(view.cursor).toBe(0);
    expect(view.scrollOffset).toBe(0);
    expect(view.visibleItems).toEqual([]);
  });

  it('keeps a single item selected and visible at bounds', () => {
    const view = buildInventoryViewModel({
      bag: [{ itemId: 'potion', quantity: 1 }],
      category: 'medicine',
      cursor: -2,
      scrollOffset: 5,
      maxVisible: 6,
      getItem,
    });

    expect(view.cursor).toBe(0);
    expect(view.scrollOffset).toBe(0);
    expect(view.endIndex).toBe(1);
    expect(view.visibleItems).toEqual([{ item: items.potion, qty: 1 }]);
  });

  it('windows lists so a cursor past the visible range scrolls into view', () => {
    const window = inventoryWindow(10, 8, 0, 6);

    expect(window.cursor).toBe(8);
    expect(window.scrollOffset).toBe(3);
    expect(window.endIndex).toBe(9);
  });

  it('clamps cursor and scroll at the upper bounds', () => {
    const window = inventoryWindow(4, 99, 99, 6);

    expect(window.cursor).toBe(3);
    expect(window.scrollOffset).toBe(0);
    expect(window.endIndex).toBe(4);
  });

  it('wraps category indexes without leaving valid bounds', () => {
    expect(normalizeCategoryIndex(-1)).toBe(4);
    expect(normalizeCategoryIndex(5)).toBe(0);
  });
});
