import { GameManager } from '@managers/GameManager';

export interface HiddenItem {
  mapId: string;
  tileX: number;
  tileY: number;
  itemId: string;
  quantity: number;
  flag: string; // collected flag
}

export const hiddenItemData: HiddenItem[] = [
  { mapId: 'route-1', tileX: 8, tileY: 5, itemId: 'potion', quantity: 1, flag: 'hidden-r1-potion' },
  { mapId: 'route-2', tileX: 15, tileY: 10, itemId: 'super-potion', quantity: 1, flag: 'hidden-r2-spotion' },
  { mapId: 'route-3', tileX: 12, tileY: 8, itemId: 'rare-candy', quantity: 1, flag: 'hidden-r3-candy' },
  { mapId: 'viridian-forest', tileX: 6, tileY: 14, itemId: 'antidote', quantity: 2, flag: 'hidden-vf-antidote' },
  { mapId: 'crystal-cavern', tileX: 10, tileY: 10, itemId: 'revive', quantity: 1, flag: 'hidden-cc-revive' },
  { mapId: 'coral-harbor', tileX: 5, tileY: 3, itemId: 'pearl', quantity: 1, flag: 'hidden-ch-pearl' },
  { mapId: 'ember-mines', tileX: 14, tileY: 7, itemId: 'fire-stone', quantity: 1, flag: 'hidden-em-fstone' },
  { mapId: 'ironvale-city', tileX: 9, tileY: 12, itemId: 'iron', quantity: 1, flag: 'hidden-iv-iron' },
  { mapId: 'verdantia-village', tileX: 3, tileY: 8, itemId: 'leaf-stone', quantity: 1, flag: 'hidden-vv-lstone' },
  { mapId: 'voltara-city', tileX: 11, tileY: 4, itemId: 'thunder-stone', quantity: 1, flag: 'hidden-vc-tstone' },
  { mapId: 'wraithmoor-town', tileX: 7, tileY: 15, itemId: 'dusk-stone', quantity: 1, flag: 'hidden-wt-dstone' },
  { mapId: 'route-4', tileX: 16, tileY: 6, itemId: 'full-heal', quantity: 1, flag: 'hidden-r4-fheal' },
  { mapId: 'route-5', tileX: 4, tileY: 11, itemId: 'max-potion', quantity: 1, flag: 'hidden-r5-mpotion' },
  { mapId: 'route-6', tileX: 13, tileY: 9, itemId: 'nugget', quantity: 1, flag: 'hidden-r6-nugget' },
  { mapId: 'route-7', tileX: 8, tileY: 13, itemId: 'pp-up', quantity: 1, flag: 'hidden-r7-ppup' },
  { mapId: 'victory-road', tileX: 10, tileY: 5, itemId: 'max-elixir', quantity: 1, flag: 'hidden-vr-melixir' },
];

/** Find a hidden item at a specific tile. */
export function getHiddenItemAt(mapId: string, tileX: number, tileY: number): HiddenItem | undefined {
  return hiddenItemData.find(h => h.mapId === mapId && h.tileX === tileX && h.tileY === tileY);
}

/** Get all uncollected hidden items on a map within a radius of a point. */
export function scanHiddenItems(mapId: string, centerX: number, centerY: number, radius: number): HiddenItem[] {
  const gm = GameManager.getInstance();
  return hiddenItemData.filter(h => {
    if (h.mapId !== mapId) return false;
    if (gm.getFlag(h.flag)) return false;
    const dx = h.tileX - centerX;
    const dy = h.tileY - centerY;
    return Math.abs(dx) <= radius && Math.abs(dy) <= radius;
  });
}
