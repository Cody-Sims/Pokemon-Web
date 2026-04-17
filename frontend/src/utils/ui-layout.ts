import Phaser from 'phaser';

export interface UILayout {
  /** Full viewport width. */
  w: number;
  /** Full viewport height. */
  h: number;
  /** Center X. */
  cx: number;
  /** Center Y. */
  cy: number;
  /** Left edge (always 0). */
  left: number;
  /** Right edge (= w). */
  right: number;
  /** Top edge (always 0). */
  top: number;
  /** Bottom edge (= h). */
  bottom: number;
  /** Proportional X (0–1). */
  px(pct: number): number;
  /** Proportional Y (0–1). */
  py(pct: number): number;
}

/**
 * Camera-relative layout helper.
 * Use instead of GAME_WIDTH/GAME_HEIGHT constants so UI anchors
 * to the actual viewport edges regardless of dynamic resolution.
 */
export function ui(scene: Phaser.Scene): UILayout {
  const cam = scene.cameras.main;
  const w = cam.width;
  const h = cam.height;
  return {
    w,
    h,
    cx: w / 2,
    cy: h / 2,
    left: 0,
    right: w,
    top: 0,
    bottom: h,
    px: (pct: number) => w * pct,
    py: (pct: number) => h * pct,
  };
}
