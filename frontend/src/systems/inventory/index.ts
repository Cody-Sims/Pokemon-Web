export {
  INVENTORY_CATEGORIES,
  buildInventoryViewModel,
  categoryAt,
  filterInventoryItems,
  inventoryWindow,
  normalizeCategoryIndex,
  type InventoryBagEntry,
  type InventoryCategory,
  type InventoryCategoryLabel,
  type InventoryEntry,
  type InventoryViewModel,
  type InventoryWindow,
} from './InventoryModel';
export {
  applyItemUseResult,
  planItemUse,
  type ItemUseContext,
  type ItemUseResult,
  type ItemUseResultKind,
} from './ItemUseService';
export {
  INVENTORY_BATTLE_EVENTS,
  emitBattleItemUse,
  emitPokeBallUse,
  type InventoryBattleEventEmitter,
} from './InventoryBattleBridge';
