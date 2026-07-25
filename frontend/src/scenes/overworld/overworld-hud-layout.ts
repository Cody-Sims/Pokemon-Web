export interface HudSafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface OverworldHudLayoutInput {
  width: number;
  height: number;
  safeArea: HudSafeAreaInsets;
  hasTouchControls: boolean;
  hasSpeedrunTimer: boolean;
  partyWidth: number;
  partyHeight: number;
  questWidth: number;
  questHeight: number;
  minimapSize: number;
  touchPanelWidth: number;
}

export interface OverworldHudLayout {
  mapName: { x: number; y: number };
  interactionHint: { x: number; y: number };
  clock: { x: number; y: number; originX: number };
  speedrunTimer: { x: number; y: number; originX: number };
  partyQuickView: { x: number; y: number };
  minimap: { x: number; y: number };
  questTracker: { x: number; y: number };
  banner: { x: number; y: number };
}

const EDGE_GAP = 8;
const ROW_GAP = 8;
const MAP_TEXT_HEIGHT = 18;
const HINT_TEXT_HEIGHT = 22;
const CLOCK_HEIGHT = 21;
const BANNER_CLEARANCE = 14;
const BANNER_HEIGHT = 28;
const QUEST_MIN_GAP = 8;

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

export function computeOverworldHudLayout(input: OverworldHudLayoutInput): OverworldHudLayout {
  const landscape = input.width >= input.height;
  const touchSideReserve = input.hasTouchControls && landscape ? input.touchPanelWidth : 0;
  const left = input.safeArea.left + EDGE_GAP + touchSideReserve;
  const right = input.width - input.safeArea.right - EDGE_GAP - touchSideReserve;
  const top = input.safeArea.top + EDGE_GAP;
  const centerX = clamp(input.width / 2, left + input.partyWidth / 2, right - input.partyWidth / 2);

  if (!landscape) {
    const mapY = top;
    const clockY = mapY + MAP_TEXT_HEIGHT + ROW_GAP;
    const timerY = clockY + CLOCK_HEIGHT + ROW_GAP;
    const partyY =
      (input.hasSpeedrunTimer ? timerY + CLOCK_HEIGHT : clockY + CLOCK_HEIGHT) +
      ROW_GAP +
      input.partyHeight / 2;
    const hintY = partyY + input.partyHeight / 2 + ROW_GAP;
    const stackBottom = hintY + HINT_TEXT_HEIGHT;
    const minimapY = stackBottom + ROW_GAP;
    const minimapX = input.safeArea.left + EDGE_GAP;
    let questX = input.width - input.safeArea.right - EDGE_GAP - input.questWidth;
    let questY = minimapY;

    if (questX < minimapX + input.minimapSize + QUEST_MIN_GAP) {
      questX = input.safeArea.left + EDGE_GAP;
      questY = minimapY + input.minimapSize + ROW_GAP;
    }

    const lowerHudBottom = Math.max(minimapY + input.minimapSize, questY + input.questHeight);

    return {
      mapName: { x: centerX, y: mapY },
      interactionHint: { x: centerX, y: hintY },
      clock: { x: centerX, y: clockY, originX: 0.5 },
      speedrunTimer: { x: centerX, y: timerY, originX: 0.5 },
      partyQuickView: { x: centerX, y: partyY },
      minimap: { x: minimapX, y: minimapY },
      questTracker: { x: questX, y: questY },
      banner: { x: centerX, y: lowerHudBottom + BANNER_CLEARANCE + BANNER_HEIGHT / 2 },
    };
  }

  const mapY = top;
  const hintY = mapY + MAP_TEXT_HEIGHT + ROW_GAP;
  const partyY = hintY + HINT_TEXT_HEIGHT + ROW_GAP + input.partyHeight / 2;
  const stackBottom = partyY + input.partyHeight / 2;
  const clockX = input.hasTouchControls ? left : input.safeArea.left + EDGE_GAP;
  const lowerHudY = stackBottom + ROW_GAP;
  const questX = input.hasTouchControls
    ? right - input.questWidth
    : input.width - input.safeArea.right - EDGE_GAP - input.questWidth;
  const questY = input.hasTouchControls ? lowerHudY : top;
  const minimapX = input.hasTouchControls
    ? left
    : input.width - input.safeArea.right - EDGE_GAP - input.minimapSize;
  const minimapY = input.hasTouchControls
    ? lowerHudY
    : input.height - input.safeArea.bottom - EDGE_GAP - input.minimapSize;

  return {
    mapName: { x: centerX, y: mapY },
    interactionHint: { x: centerX, y: hintY },
    clock: { x: clockX, y: top, originX: 0 },
    speedrunTimer: { x: clockX, y: top + CLOCK_HEIGHT + ROW_GAP, originX: 0 },
    partyQuickView: { x: centerX, y: partyY },
    minimap: { x: minimapX, y: minimapY },
    questTracker: { x: questX, y: questY },
    banner: { x: centerX, y: stackBottom + BANNER_CLEARANCE + BANNER_HEIGHT / 2 },
  };
}
