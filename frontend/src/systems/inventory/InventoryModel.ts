import type { ItemData } from '@data/interfaces';
import { getItemData } from '@data/selectors';

export type InventoryCategory = 'medicine' | 'pokeball' | 'battle' | 'key' | 'tm';

export interface InventoryCategoryLabel {
  key: InventoryCategory;
  label: string;
}

export interface InventoryBagEntry {
  itemId: string;
  quantity: number;
}

export interface InventoryEntry {
  item: ItemData;
  qty: number;
}

export interface InventoryWindow {
  cursor: number;
  scrollOffset: number;
  maxVisible: number;
  endIndex: number;
  visibleItems: InventoryEntry[];
}

export interface InventoryViewModel extends InventoryWindow {
  category: InventoryCategory;
  items: InventoryEntry[];
  isEmpty: boolean;
}

export const INVENTORY_CATEGORIES: readonly InventoryCategoryLabel[] = [
  { key: 'medicine', label: 'Medicine' },
  { key: 'pokeball', label: 'Poké Balls' },
  { key: 'battle', label: 'Battle' },
  { key: 'key', label: 'Key Items' },
  { key: 'tm', label: 'TMs' },
] as const;

export function categoryAt(index: number): InventoryCategory {
  const safeIndex = normalizeCategoryIndex(index);
  return INVENTORY_CATEGORIES[safeIndex].key;
}

export function normalizeCategoryIndex(index: number): number {
  if (!Number.isFinite(index)) return 0;
  const length = INVENTORY_CATEGORIES.length;
  return ((Math.trunc(index) % length) + length) % length;
}

export function filterInventoryItems(
  bag: readonly InventoryBagEntry[],
  category: InventoryCategory,
  getItem: (id: string) => ItemData | undefined = getItemData,
): InventoryEntry[] {
  return bag.flatMap(entry => {
    if (entry.quantity <= 0) return [];
    const item = getItem(entry.itemId);
    return item?.category === category ? [{ item, qty: entry.quantity }] : [];
  });
}

export function inventoryWindow(
  itemCount: number,
  cursor: number,
  scrollOffset: number,
  maxVisible: number,
): InventoryWindow {
  const safeCount = Math.max(0, Math.trunc(itemCount));
  const safeMaxVisible = Math.max(1, Math.trunc(maxVisible));
  const maxCursor = Math.max(0, safeCount - 1);
  const safeCursor = safeCount === 0 ? 0 : clamp(Math.trunc(cursor), 0, maxCursor);
  const maxScroll = Math.max(0, safeCount - safeMaxVisible);
  let safeScroll = clamp(Math.trunc(scrollOffset), 0, maxScroll);

  if (safeCount > 0 && safeCursor < safeScroll) {
    safeScroll = safeCursor;
  } else if (safeCount > 0 && safeCursor >= safeScroll + safeMaxVisible) {
    safeScroll = clamp(safeCursor - safeMaxVisible + 1, 0, maxScroll);
  }

  const endIndex = Math.min(safeCount, safeScroll + safeMaxVisible);
  return {
    cursor: safeCursor,
    scrollOffset: safeScroll,
    maxVisible: safeMaxVisible,
    endIndex,
    visibleItems: [],
  };
}

export function buildInventoryViewModel(args: {
  bag: readonly InventoryBagEntry[];
  category: InventoryCategory;
  cursor: number;
  scrollOffset: number;
  maxVisible: number;
  getItem?: (id: string) => ItemData | undefined;
}): InventoryViewModel {
  const items = filterInventoryItems(args.bag, args.category, args.getItem);
  const window = inventoryWindow(items.length, args.cursor, args.scrollOffset, args.maxVisible);
  return {
    ...window,
    category: args.category,
    items,
    visibleItems: items.slice(window.scrollOffset, window.endIndex),
    isEmpty: items.length === 0,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
