export const INVENTORY_BATTLE_EVENTS = {
  usePokeBall: 'use-pokeball',
  useBattleItem: 'use-battle-item',
} as const;

export interface InventoryBattleEventEmitter {
  emit(event: typeof INVENTORY_BATTLE_EVENTS.usePokeBall, ballItemId: string): boolean;
  emit(event: typeof INVENTORY_BATTLE_EVENTS.useBattleItem): boolean;
}

export function emitPokeBallUse(emitter: InventoryBattleEventEmitter, ballItemId: string): void {
  emitter.emit(INVENTORY_BATTLE_EVENTS.usePokeBall, ballItemId);
}

export function emitBattleItemUse(emitter: InventoryBattleEventEmitter): void {
  emitter.emit(INVENTORY_BATTLE_EVENTS.useBattleItem);
}
