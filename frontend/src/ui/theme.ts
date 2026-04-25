// ─── Shared UI Theme ───
// Single source of truth for colors, fonts, spacing, and type colors.

import { getTextScale } from '@utils/accessibility';

export const COLORS = {
  // Backgrounds
  bgDark: 0x0f0f1a,
  bgPanel: 0x1a1a2e,
  bgCard: 0x252545,
  bgInput: 0x333355,
  bgOverlay: 0x000000,

  // Borders
  border: 0x4a4a6a,
  borderLight: 0x6a6aaa,
  borderHighlight: 0xffcc00,

  // Text (hex strings for Phaser text)
  textWhite: '#ffffff',
  textGray: '#b0b0c8',
  textDim: '#6a6a80',
  textHighlight: '#ffcc00',
  textDanger: '#ff5555',
  textSuccess: '#55ff88',
  textBlue: '#5599ff',

  // HP bar
  hpGreen: 0x44cc55,
  hpYellow: 0xddcc33,
  hpRed: 0xdd3333,

  // EXP bar
  expBlue: 0x4488ff,

  // Stat nature colors
  statUp: '#ff7766',
  statDown: '#6699ff',

  // Button
  btnBg: 0x333355,
  btnHover: 0x444477,
  btnText: '#e8e8f0',
  btnTextHover: '#ffcc00',
} as const;

export const FONTS = {
  title: { fontSize: '36px', color: COLORS.textWhite, fontFamily: 'monospace', fontStyle: 'bold' } as Phaser.Types.GameObjects.Text.TextStyle,
  heading: { fontSize: '22px', color: COLORS.textWhite, fontFamily: 'monospace', fontStyle: 'bold' } as Phaser.Types.GameObjects.Text.TextStyle,
  body: { fontSize: '16px', color: COLORS.textWhite, fontFamily: 'monospace' } as Phaser.Types.GameObjects.Text.TextStyle,
  bodySmall: { fontSize: '14px', color: COLORS.textGray, fontFamily: 'monospace' } as Phaser.Types.GameObjects.Text.TextStyle,
  caption: { fontSize: '12px', color: COLORS.textDim, fontFamily: 'monospace' } as Phaser.Types.GameObjects.Text.TextStyle,
  label: { fontSize: '11px', color: COLORS.textDim, fontFamily: 'monospace' } as Phaser.Types.GameObjects.Text.TextStyle,
  menuItem: { fontSize: '18px', color: COLORS.textWhite, fontFamily: 'monospace' } as Phaser.Types.GameObjects.Text.TextStyle,
  button: { fontSize: '16px', color: COLORS.textWhite, fontFamily: 'monospace' } as Phaser.Types.GameObjects.Text.TextStyle,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  panelPadding: 20,
  cardPadding: 12,
  lineHeight: 28,
  slotHeight: 72,
} as const;

// Pokemon type colors — single source of truth
export const TYPE_COLORS: Record<string, number> = {
  normal: 0xa8a878,
  fire: 0xf08030,
  water: 0x6890f0,
  electric: 0xf8d030,
  grass: 0x78c850,
  ice: 0x98d8d8,
  fighting: 0xc03028,
  poison: 0xa040a0,
  ground: 0xe0c068,
  flying: 0xa890f0,
  psychic: 0xf85888,
  bug: 0xa8b820,
  rock: 0xb8a038,
  ghost: 0x705898,
  dragon: 0x7038f8,
  dark: 0x705848,
  steel: 0xb8b8d0,
  fairy: 0xee99ac,
};

export const CATEGORY_COLORS: Record<string, number> = {
  physical: 0xcc6633,
  special: 0x3366cc,
  status: 0x888899,
};

export const STATUS_COLORS: Record<string, number> = {
  burn: 0xf08030,
  paralysis: 0xf8d030,
  poison: 0xa040a0,
  'bad-poison': 0xa040a0,
  sleep: 0x8888aa,
  freeze: 0x98d8d8,
};

/** Frame indices for type-badges.png spritesheet. */
export const TYPE_BADGE_FRAMES: Record<string, number> = {
  normal: 0, fire: 1, water: 2, electric: 3, grass: 4, ice: 5,
  fighting: 6, poison: 7, ground: 8, flying: 9, psychic: 10, bug: 11,
  rock: 12, ghost: 13, dragon: 14, dark: 15, steel: 16, fairy: 17,
};

/** Frame indices for status-badges.png spritesheet. */
export const STATUS_BADGE_FRAMES: Record<string, number> = {
  burn: 0, paralysis: 1, poison: 2, sleep: 3, freeze: 4, 'bad-poison': 5,
};

// ─── Helper functions ───

/** Whether the device is a touch/mobile phone or tablet (not a touchscreen laptop). */
export function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  const hasTouch = navigator.maxTouchPoints > 0;
  const hasCoarsePointer = typeof matchMedia !== 'undefined'
    && matchMedia('(pointer: coarse)')?.matches;
  const isSmallScreen = window.innerWidth <= 1024 && window.innerHeight <= 768;
  // Coarse pointer + small screen = phone/tablet; touch alone = maybe laptop
  return hasTouch && (hasCoarsePointer || isSmallScreen);
}

/** Whether the device is a tablet (large touch screen, not a phone). */
export function isTablet(): boolean {
  return isMobile() && Math.min(window.innerWidth, window.innerHeight) > 768;
}

/** Scale factor for mobile-friendly UI elements (fonts, hit targets). */
export const MOBILE_SCALE = isMobile() ? 1.35 : 1.0;

/** Get a font size string scaled for mobile and user text-scale preference. Input: base px number. */
export function mobileFontSize(basePx: number): string {
  let scale = 1.0;
  try {
    scale = getTextScale();
  } catch { /* fallback to 1.0 */ }
  return `${Math.round(basePx * MOBILE_SCALE * scale)}px`;
}

/** Minimum interactive hit area for touch targets (px). */
export const MIN_TOUCH_TARGET = isMobile() ? 48 : 0;

/** Get HP bar color based on percentage. */
export function hpColor(pct: number): number {
  if (pct > 0.5) return COLORS.hpGreen;
  if (pct > 0.2) return COLORS.hpYellow;
  return COLORS.hpRed;
}

/** Create a styled panel background. */
export function drawPanel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, alpha = 0.95): Phaser.GameObjects.Rectangle {
  const panel = scene.add.rectangle(x, y, w, h, COLORS.bgPanel, alpha);
  panel.setStrokeStyle(2, COLORS.border);
  return panel;
}

/** Create a type badge using the sprite sheet if loaded, rectangle fallback otherwise. */
export function drawTypeBadge(scene: Phaser.Scene, x: number, y: number, type: string): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const frame = TYPE_BADGE_FRAMES[type];
  if (frame !== undefined && scene.textures.exists('type-badges')) {
    const sprite = scene.add.image(0, 0, 'type-badges', frame).setScale(2);
    container.add(sprite);
  } else {
    const bg = scene.add.rectangle(0, 0, 64, 20, TYPE_COLORS[type] ?? 0x888888).setStrokeStyle(1, 0xffffff);
    const text = scene.add.text(0, 0, type.toUpperCase(), { fontSize: '10px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5);
    container.add([bg, text]);
  }
  return container;
}

/** Create a status condition badge using the sprite sheet. */
export function drawStatusBadge(scene: Phaser.Scene, x: number, y: number, status: string): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const frame = STATUS_BADGE_FRAMES[status];
  if (frame !== undefined && scene.textures.exists('status-badges')) {
    const sprite = scene.add.image(0, 0, 'status-badges', frame).setScale(2);
    container.add(sprite);
  } else {
    const col = STATUS_COLORS[status] ?? 0x888899;
    const bg = scene.add.rectangle(0, 0, 64, 20, col).setStrokeStyle(1, 0xffffff);
    const label = status === 'bad-poison' ? 'TOX' : status.substring(0, 3).toUpperCase();
    const text = scene.add.text(0, 0, label, { fontSize: '10px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5);
    container.add([bg, text]);
  }
  return container;
}

/** Create an interactive button. */
export function drawButton(
  scene: Phaser.Scene, x: number, y: number, label: string,
  onClick: () => void, width = 140, height = 36
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const bg = scene.add.rectangle(0, 0, width, height, COLORS.btnBg).setStrokeStyle(1, COLORS.border);
  const text = scene.add.text(0, 0, label, FONTS.button).setOrigin(0.5);
  container.add([bg, text]);
  container.setSize(width, height);
  container.setInteractive({ useHandCursor: true });
  container.on('pointerover', () => { bg.fillColor = COLORS.btnHover; text.setColor(COLORS.textHighlight); });
  container.on('pointerout', () => { bg.fillColor = COLORS.btnBg; text.setColor(COLORS.textWhite); });
  container.on('pointerdown', onClick);
  return container;
}

/** Draw an HP bar. */
export function drawHpBar(
  scene: Phaser.Scene, x: number, y: number, width: number, height: number,
  current: number, max: number
): { bg: Phaser.GameObjects.Rectangle; fill: Phaser.GameObjects.Rectangle } {
  const pct = max > 0 ? current / max : 0;
  const bg = scene.add.rectangle(x, y, width, height, 0x222233).setOrigin(0, 0.5).setStrokeStyle(1, COLORS.border);
  const fill = scene.add.rectangle(x + 1, y, (width - 2) * pct, height - 2, hpColor(pct)).setOrigin(0, 0.5);
  return { bg, fill };
}
