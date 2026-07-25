import { Direction } from '@utils/type-helpers';

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type OneHandedMode = 'off' | 'left';

export interface JoystickVector {
  x: number;
  y: number;
  distance: number;
  angle: number;
}

export interface JoystickDirectionOptions {
  deadZone: number;
  previousDirection?: Direction | null;
  diagonalHoldRatio?: number;
}

export interface TouchMetrics {
  actionButtonSize: number;
  actionGap: number;
  menuButtonSize: number;
  panelWidth: number;
  joystickZoneWidth: number;
  edgePadding: number;
}

export interface TouchControlLayout {
  buttonContainerX: number;
  buttonContainerY: number;
  confirmOffsetY: number;
  cancelOffsetY: number;
  menuX: number;
  menuY: number;
  metrics: TouchMetrics;
}

export interface TouchControlLayoutInput {
  width: number;
  height: number;
  insets: SafeAreaInsets;
  minTouchTarget: number;
  mobileScale: number;
  oneHandedMode?: OneHandedMode;
}

const DEFAULT_INSETS: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampJoystickVector(dx: number, dy: number, radius: number): JoystickVector {
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance === 0) return { x: 0, y: 0, distance: 0, angle: 0 };

  const angle = Math.atan2(dy, dx);
  const clampedDistance = Math.min(distance, radius);
  return {
    x: Math.cos(angle) * clampedDistance,
    y: Math.sin(angle) * clampedDistance,
    distance,
    angle,
  };
}

export function resolveJoystickDirection(
  dx: number,
  dy: number,
  options: JoystickDirectionOptions,
): Direction | null {
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < options.deadZone) return null;

  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const horizontal: Direction = dx >= 0 ? 'right' : 'left';
  const vertical: Direction = dy >= 0 ? 'down' : 'up';
  const maxAxis = Math.max(absX, absY);
  const diagonalHoldRatio = options.diagonalHoldRatio ?? 0.18;

  if (Math.abs(absX - absY) <= maxAxis * diagonalHoldRatio) {
    if (options.previousDirection === horizontal || options.previousDirection === vertical) {
      return options.previousDirection;
    }
    return absY >= absX ? vertical : horizontal;
  }

  return absX > absY ? horizontal : vertical;
}

export function computeTouchMetrics(minTouchTarget: number, mobileScale: number): TouchMetrics {
  const target = Math.max(minTouchTarget, Math.round(56 * mobileScale));
  const actionButtonSize = clamp(target, minTouchTarget, Math.max(minTouchTarget, 92));
  const actionGap = clamp(Math.round(actionButtonSize * 0.24), 12, 22);
  const menuButtonSize = clamp(
    Math.max(minTouchTarget, Math.round(44 * mobileScale)),
    minTouchTarget,
    72,
  );
  const panelWidth = Math.round(actionButtonSize * 1.85);
  const joystickZoneWidth = Math.round(actionButtonSize * 1.95);
  const edgePadding = clamp(Math.round(actionButtonSize * 0.22), 12, 24);

  return {
    actionButtonSize,
    actionGap,
    menuButtonSize,
    panelWidth,
    joystickZoneWidth,
    edgePadding,
  };
}

export function computeTouchControlLayout(input: TouchControlLayoutInput): TouchControlLayout {
  const insets = input.insets ?? DEFAULT_INSETS;
  const metrics = computeTouchMetrics(input.minTouchTarget, input.mobileScale);
  const isPortrait = input.height > input.width;
  const controlsOnLeft = input.oneHandedMode === 'left';
  const clusterHeight = metrics.actionButtonSize * 2 + metrics.actionGap;
  const dialogueReserve = isPortrait ? Math.round(input.height * 0.24) : 0;
  const verticalPadding = metrics.edgePadding + insets.bottom + dialogueReserve;
  const minY = insets.top + metrics.menuButtonSize + metrics.edgePadding + clusterHeight / 2;
  const maxY = input.height - verticalPadding - clusterHeight / 2;
  const comfortableY = isPortrait ? maxY : input.height * 0.56;
  const buttonContainerY = Math.round(clamp(comfortableY, minY, Math.max(minY, maxY)));
  const edgeInset = metrics.edgePadding + (controlsOnLeft ? insets.left : insets.right);
  const buttonContainerX = controlsOnLeft
    ? edgeInset + metrics.actionButtonSize / 2
    : input.width - edgeInset - metrics.actionButtonSize / 2;
  const menuEdgeInset = metrics.edgePadding + (controlsOnLeft ? insets.left : insets.right);
  const menuX = controlsOnLeft
    ? menuEdgeInset + Math.max(metrics.menuButtonSize / 2, metrics.actionButtonSize / 2)
    : input.width -
      menuEdgeInset -
      Math.max(metrics.menuButtonSize / 2, metrics.actionButtonSize / 2) -
      metrics.edgePadding;
  const menuY = insets.top + metrics.edgePadding + metrics.menuButtonSize / 2;

  return {
    buttonContainerX: Math.round(buttonContainerX),
    buttonContainerY,
    confirmOffsetY: -Math.round((metrics.actionButtonSize + metrics.actionGap) / 2),
    cancelOffsetY: Math.round((metrics.actionButtonSize + metrics.actionGap) / 2),
    menuX: Math.round(menuX),
    menuY: Math.round(menuY),
    metrics,
  };
}

export function isPointOutsideRect(
  x: number,
  y: number,
  rect: Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'>,
  margin = 0,
): boolean {
  return (
    x < rect.left - margin ||
    x > rect.right + margin ||
    y < rect.top - margin ||
    y > rect.bottom + margin
  );
}
