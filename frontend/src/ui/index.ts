// ── Controls ─────────────────────────────────────────────────
export { TouchControls } from './controls/TouchControls';
export { VirtualJoystick } from './controls/VirtualJoystick';
export {
  clampJoystickVector,
  computeTouchControlLayout,
  computeTouchMetrics,
  resolveJoystickDirection,
  type TouchControlLayout,
  type TouchMetrics,
} from './controls/touch-geometry';
export { MenuController, type MenuControllerConfig } from './controls/MenuController';
export {
  SelectableController,
  type SelectableControllerConfig,
  type SelectableWindowRange,
  type SelectDirection,
  type SelectableWrapConfig,
} from './controls/SelectableController';
export { MobileTapMenu } from './controls/MobileTapMenu';

// ── Widgets ──────────────────────────────────────────────────
export { HealthBar } from './widgets/HealthBar';
export { ProgressBar, type ProgressBarConfig, type ProgressBarPresetName } from './widgets/ProgressBar';
export { BattleHUD } from './widgets/BattleHUD';
export { TextBox, type TextBoxMessage, type TextBoxOptions, type TextBoxQueueOptions } from './widgets/TextBox';
export { MenuList } from './widgets/MenuList';
export { ConfirmBox } from './widgets/ConfirmBox';
export { NinePatchPanel, type NinePatchPanelOptions } from './widgets/NinePatchPanel';
export { PixelText } from './widgets/PixelText';
export { AchievementToast } from './widgets/AchievementToast';
export { InventoryPanel, type InventoryPanelConfig } from './widgets/InventoryPanel';
export { InventoryItemList, type InventoryItemListConfig, type InventoryItemListRenderState } from './widgets/InventoryItemList';
export { ItemDetailPanel } from './widgets/ItemDetailPanel';
export { TargetPickerPanel, type TargetPickerEntry, type TargetPickerPanelConfig } from './widgets/TargetPickerPanel';
export { InventoryActionMenu, type InventoryActionMenuConfig } from './widgets/InventoryActionMenu';

// ── Theme ────────────────────────────────────────────────────
export {
  COLORS,
  FONTS,
  PANEL_PRESETS,
  PROGRESS_BAR_PRESETS,
  RADII,
  SPACING,
  STROKES,
  TYPE_COLORS,
  CATEGORY_COLORS,
  hpColor,
  mobileFontSize,
  mobileFontPx,
  mobileScale,
  minTouchTarget,
  isMobile,
  isTablet,
} from './theme';
