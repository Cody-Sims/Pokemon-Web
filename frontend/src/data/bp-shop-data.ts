/**
 * A.1 Battle Tower — BP shop catalog.
 *
 * Currency is **Battle Points** (`gm.spendBattlePoints`), not Pokédollars.
 * Items here are intentionally a small competitive subset; quantity is
 * unlimited (the shop never runs out). Each entry must reference an
 * existing `itemData` id — the shop renders the full ItemData description
 * and adds the item to the bag on purchase.
 */
export interface BattlePointShopEntry {
  itemId: string;
  /** Cost in Battle Points. */
  cost: number;
  /** Optional display category — used purely as a section header in the UI. */
  category: 'held' | 'berry' | 'utility' | 'consumable';
}

export const battlePointShopCatalog: BattlePointShopEntry[] = [
  // Choice / power held items
  { itemId: 'choice-specs',   cost: 48, category: 'held' },
  { itemId: 'choice-band',    cost: 48, category: 'held' },
  { itemId: 'life-orb',       cost: 48, category: 'held' },
  { itemId: 'assault-vest',   cost: 48, category: 'held' },
  { itemId: 'focus-sash',     cost: 48, category: 'held' },
  { itemId: 'rocky-helmet',   cost: 48, category: 'held' },
  { itemId: 'eviolite',       cost: 48, category: 'held' },
  { itemId: 'leftovers',      cost: 32, category: 'held' },
  { itemId: 'black-sludge',   cost: 32, category: 'held' },
  { itemId: 'weakness-policy',cost: 32, category: 'held' },

  // Field-control held items (cheaper — situational).
  { itemId: 'light-clay',     cost: 16, category: 'utility' },
  { itemId: 'heat-rock',      cost: 16, category: 'utility' },
  { itemId: 'damp-rock',      cost: 16, category: 'utility' },
  { itemId: 'smooth-rock',    cost: 16, category: 'utility' },
  { itemId: 'icy-rock',       cost: 16, category: 'utility' },

  // Berries
  { itemId: 'sitrus-berry',   cost:  8, category: 'berry' },
  { itemId: 'lum-berry',      cost:  8, category: 'berry' },
  { itemId: 'persim-berry',   cost:  8, category: 'berry' },

  // Consumables
  { itemId: 'rare-candy',     cost: 24, category: 'consumable' },
];
