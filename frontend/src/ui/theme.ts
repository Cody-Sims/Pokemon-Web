// ─── Shared UI Theme ───
// Single source of truth for colors, fonts, spacing, and type colors.

import { getTextScale } from '@utils/accessibility';

export const COLORS = {
  black: 0x000000,
  white: 0xffffff,
  transparent: 0x000000,

  // Backgrounds
  bgDark: 0x0f0f1a,
  bgPanelDark: 0x0a0a18,
  bgBarTrack: 0x222233,
  bgPanel: 0x1a1a2e,
  bgCard: 0x252545,
  bgInput: 0x333355,
  bgOverlay: 0x000000,
  shadow: 0x000000,

  // Borders
  border: 0x4a4a6a,
  borderLight: 0x6a6aaa,
  borderHighlight: 0xffcc00,
  borderFocus: 0x9bd7ff,
  borderSubtle: 0xffffff,

  // Semantic surfaces
  surfaceRaised: 0x252545,
  surfaceSunken: 0x121224,
  surfaceModal: 0x17172c,
  surfaceMuted: 0x333355,

  // Semantic feedback
  accentGold: 0xffcc00,
  accentBlue: 0x5599ff,
  accentGreen: 0x55ff88,
  danger: 0xff5555,

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
  progressNeutral: 0x888899,

  // Stat nature colors
  statUp: '#ff7766',
  statDown: '#6699ff',

  // Button
  btnBg: 0x333355,
  btnHover: 0x444477,
  btnText: '#e8e8f0',
  btnTextHover: '#ffcc00',
} as const;

export const STROKES = {
  hairline: 1,
  panel: 2,
  focus: 2,
  focusShadow: 4,
  chunky: 3,
} as const;

export const RADII = {
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  pill: 999,
} as const;

export const ELEVATION = {
  none: { offsetX: 0, offsetY: 0, alpha: 0 },
  raised: { offsetX: 2, offsetY: 2, alpha: 0.28 },
  modal: { offsetX: 3, offsetY: 4, alpha: 0.42 },
  toast: { offsetX: 0, offsetY: 3, alpha: 0.5 },
} as const;

export interface PanelPreset {
  fillColor: number;
  fillAlpha: number;
  borderColor: number;
  borderWidth: number;
  cornerRadius: number;
  shadowColor: number;
  shadowAlpha: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  innerStrokeColor?: number;
  innerStrokeAlpha?: number;
}

export const PANEL_PRESETS = {
  menu: {
    fillColor: COLORS.bgPanel,
    fillAlpha: 0.95,
    borderColor: COLORS.border,
    borderWidth: STROKES.panel,
    cornerRadius: RADII.md,
    shadowColor: COLORS.shadow,
    shadowAlpha: ELEVATION.raised.alpha,
    shadowOffsetX: ELEVATION.raised.offsetX,
    shadowOffsetY: ELEVATION.raised.offsetY,
    innerStrokeColor: COLORS.borderSubtle,
    innerStrokeAlpha: 0.08,
  },
  dialogue: {
    fillColor: COLORS.bgPanelDark,
    fillAlpha: 0.92,
    borderColor: COLORS.borderLight,
    borderWidth: STROKES.panel,
    cornerRadius: RADII.lg,
    shadowColor: COLORS.shadow,
    shadowAlpha: ELEVATION.modal.alpha,
    shadowOffsetX: ELEVATION.modal.offsetX,
    shadowOffsetY: ELEVATION.modal.offsetY,
    innerStrokeColor: COLORS.borderSubtle,
    innerStrokeAlpha: 0.1,
  },
  choice: {
    fillColor: COLORS.bgPanelDark,
    fillAlpha: 0.95,
    borderColor: COLORS.borderLight,
    borderWidth: STROKES.panel,
    cornerRadius: RADII.md,
    shadowColor: COLORS.shadow,
    shadowAlpha: ELEVATION.raised.alpha,
    shadowOffsetX: ELEVATION.raised.offsetX,
    shadowOffsetY: ELEVATION.raised.offsetY,
    innerStrokeColor: COLORS.borderSubtle,
    innerStrokeAlpha: 0.08,
  },
  speaker: {
    fillColor: COLORS.bgCard,
    fillAlpha: 0.95,
    borderColor: COLORS.borderHighlight,
    borderWidth: STROKES.hairline,
    cornerRadius: RADII.sm,
    shadowColor: COLORS.shadow,
    shadowAlpha: 0.25,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    innerStrokeColor: COLORS.white,
    innerStrokeAlpha: 0.14,
  },
  overlay: {
    fillColor: COLORS.bgOverlay,
    fillAlpha: 0.75,
    borderColor: COLORS.border,
    borderWidth: STROKES.hairline,
    cornerRadius: RADII.md,
    shadowColor: COLORS.shadow,
    shadowAlpha: 0.25,
    shadowOffsetX: ELEVATION.raised.offsetX,
    shadowOffsetY: ELEVATION.raised.offsetY,
    innerStrokeColor: COLORS.borderSubtle,
    innerStrokeAlpha: 0.06,
  },
} as const satisfies Record<string, PanelPreset>;

export interface ProgressBarPreset {
  trackColor: number;
  trackAlpha: number;
  borderColor: number;
  borderWidth: number;
  fillColor: number | ((pct: number) => number);
}

export const PROGRESS_BAR_PRESETS = {
  hp: {
    trackColor: COLORS.bgBarTrack,
    trackAlpha: 1,
    borderColor: COLORS.border,
    borderWidth: STROKES.hairline,
    fillColor: hpColor,
  },
  exp: {
    trackColor: COLORS.bgBarTrack,
    trackAlpha: 1,
    borderColor: COLORS.border,
    borderWidth: STROKES.hairline,
    fillColor: COLORS.expBlue,
  },
  neutral: {
    trackColor: COLORS.bgBarTrack,
    trackAlpha: 1,
    borderColor: COLORS.border,
    borderWidth: STROKES.hairline,
    fillColor: COLORS.progressNeutral,
  },
} as const satisfies Record<string, ProgressBarPreset>;

export const SEMANTIC_COLORS = {
  surface: {
    page: COLORS.bgDark,
    panel: COLORS.bgPanel,
    panelDark: COLORS.bgPanelDark,
    card: COLORS.bgCard,
    raised: COLORS.surfaceRaised,
    sunken: COLORS.surfaceSunken,
    modal: COLORS.surfaceModal,
  },
  text: {
    primary: COLORS.textWhite,
    secondary: COLORS.textGray,
    muted: COLORS.textDim,
    accent: COLORS.textHighlight,
    danger: COLORS.textDanger,
    success: COLORS.textSuccess,
    link: COLORS.textBlue,
  },
  border: {
    default: COLORS.border,
    strong: COLORS.borderLight,
    focus: COLORS.borderFocus,
    accent: COLORS.borderHighlight,
  },
  feedback: {
    success: COLORS.accentGreen,
    warning: COLORS.accentGold,
    danger: COLORS.danger,
    info: COLORS.accentBlue,
  },
} as const;

export const TYPOGRAPHY = {
  scale: { xs: 10, sm: 12, md: 14, lg: 16, xl: 20, title: 28 },
  lineHeight: { tight: 1.18, normal: 1.35, loose: 1.5 },
  family: 'monospace',
} as const;

export const FONTS = {
  title: {
    fontSize: '36px',
    color: COLORS.textWhite,
    fontFamily: 'monospace',
    fontStyle: 'bold',
  } as Phaser.Types.GameObjects.Text.TextStyle,
  heading: {
    fontSize: '22px',
    color: COLORS.textWhite,
    fontFamily: 'monospace',
    fontStyle: 'bold',
  } as Phaser.Types.GameObjects.Text.TextStyle,
  body: {
    fontSize: '16px',
    color: COLORS.textWhite,
    fontFamily: 'monospace',
  } as Phaser.Types.GameObjects.Text.TextStyle,
  bodySmall: {
    fontSize: '14px',
    color: COLORS.textGray,
    fontFamily: 'monospace',
  } as Phaser.Types.GameObjects.Text.TextStyle,
  caption: {
    fontSize: '12px',
    color: COLORS.textDim,
    fontFamily: 'monospace',
  } as Phaser.Types.GameObjects.Text.TextStyle,
  label: {
    fontSize: '11px',
    color: COLORS.textDim,
    fontFamily: 'monospace',
  } as Phaser.Types.GameObjects.Text.TextStyle,
  menuItem: {
    fontSize: '18px',
    color: COLORS.textWhite,
    fontFamily: 'monospace',
  } as Phaser.Types.GameObjects.Text.TextStyle,
  button: {
    fontSize: '16px',
    color: COLORS.textWhite,
    fontFamily: 'monospace',
  } as Phaser.Types.GameObjects.Text.TextStyle,
} as const;

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  panelPadding: 18,
  cardPadding: 12,
  lineHeight: 26,
  slotHeight: 72,
  touchGap: 10,
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

const STATUS_COLORS: Record<string, number> = {
  burn: 0xf08030,
  paralysis: 0xf8d030,
  poison: 0xa040a0,
  'bad-poison': 0xa040a0,
  sleep: 0x8888aa,
  freeze: 0x98d8d8,
};

/** Frame indices for type-badges.png spritesheet. */
export const TYPE_BADGE_FRAMES: Record<string, number> = {
  normal: 0,
  fire: 1,
  water: 2,
  electric: 3,
  grass: 4,
  ice: 5,
  fighting: 6,
  poison: 7,
  ground: 8,
  flying: 9,
  psychic: 10,
  bug: 11,
  rock: 12,
  ghost: 13,
  dragon: 14,
  dark: 15,
  steel: 16,
  fairy: 17,
};

/** Frame indices for status-badges.png spritesheet. */
export const STATUS_BADGE_FRAMES: Record<string, number> = {
  burn: 0,
  paralysis: 1,
  poison: 2,
  sleep: 3,
  freeze: 4,
  'bad-poison': 5,
};

// ─── Helper functions ───

/** Whether the device is a touch/mobile phone or tablet (not a touchscreen laptop). */
export function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  const hasTouch = navigator.maxTouchPoints > 0;
  const hasCoarsePointer =
    typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)')?.matches;
  const isSmallScreen = window.innerWidth <= 1024 && window.innerHeight <= 768;
  // Coarse pointer + small screen = phone/tablet; touch alone = maybe laptop
  return hasTouch && (hasCoarsePointer || isSmallScreen);
}

/** Whether the device is a tablet (large touch screen, not a phone). */
export function isTablet(): boolean {
  return isMobile() && Math.min(window.innerWidth, window.innerHeight) > 768;
}

/** Scale factor for mobile-friendly UI elements (fonts, hit targets). Recomputed on each call so orientation/resize changes are picked up. */
export function mobileScale(): number {
  if (!isMobile()) return 1.0;
  const width = typeof window === 'undefined' ? 0 : window.innerWidth;
  const height = typeof window === 'undefined' ? 0 : window.innerHeight;
  const shortSide = Math.min(width, height);
  const isLandscapePhone = width > height && shortSide <= 430;
  if (isLandscapePhone) return 0.86;
  if (shortSide <= 430) return 1.2;
  return isTablet() ? 1.12 : 1.24;
}

/** Get a font size string scaled for mobile and user text-scale preference. Input: base px number. */
export function mobileFontSize(basePx: number): string {
  return `${mobileFontPx(basePx)}px`;
}

/**
 * Numeric variant of `mobileFontSize` for APIs that want a pixel size as a
 * `number` (e.g., `add.bitmapText`). Avoids the `parseInt(mobileFontSize(N))`
 * dance and keeps a single source of truth for the scale calculation
 * (NIT-003).
 */
export function mobileFontPx(basePx: number): number {
  let scale = 1.0;
  try {
    scale = getTextScale();
  } catch {
    /* fallback to 1.0 */
  }
  return Math.round(basePx * mobileScale() * scale);
}

export function mobileLineHeightPx(
  basePx: number,
  ratio: number = TYPOGRAPHY.lineHeight.normal,
): number {
  return Math.ceil(mobileFontPx(basePx) * ratio);
}

export function readableStroke(width: number = STROKES.hairline): number {
  return isMobile() ? Math.max(STROKES.panel, width) : width;
}

export interface TextFitOptions {
  maxWidth: number;
  baseFontPx: number;
  minFontPx?: number;
  glyphRatio?: number;
}

export function fitTextPx(text: string, options: TextFitOptions): number {
  const minFontPx = options.minFontPx ?? 10;
  const glyphRatio = options.glyphRatio ?? 0.62;
  if (text.length === 0 || options.maxWidth <= 0) return Math.max(minFontPx, options.baseFontPx);
  const estimatedWidth = text.length * options.baseFontPx * glyphRatio;
  if (estimatedWidth <= options.maxWidth) return options.baseFontPx;
  return Math.max(minFontPx, Math.floor(options.maxWidth / (text.length * glyphRatio)));
}

export function ellipsizeText(
  text: string,
  maxWidth: number,
  fontPx: number,
  glyphRatio = 0.62,
): string {
  const maxChars = Math.max(1, Math.floor(maxWidth / Math.max(1, fontPx * glyphRatio)));
  if (text.length <= maxChars) return text;
  if (maxChars <= 1) return '…';
  return `${text.slice(0, maxChars - 1).trimEnd()}…`;
}

export interface NameplateLayout {
  label: string;
  width: number;
  height: number;
  fontPx: number;
  paddingX: number;
  paddingY: number;
}

export function measureNameplate(
  label: string,
  options: {
    maxWidth: number;
    baseFontPx?: number;
    minFontPx?: number;
    paddingX?: number;
    paddingY?: number;
    minWidth?: number;
    glyphRatio?: number;
  },
): NameplateLayout {
  const paddingX = options.paddingX ?? SPACING.md;
  const paddingY = options.paddingY ?? SPACING.xs;
  const baseFontPx = options.baseFontPx ?? 13;
  const minFontPx = options.minFontPx ?? 10;
  const maxTextWidth = Math.max(1, options.maxWidth - paddingX * 2);
  const fontPx = fitTextPx(label, {
    maxWidth: maxTextWidth,
    baseFontPx,
    minFontPx,
    glyphRatio: options.glyphRatio,
  });
  const displayLabel = ellipsizeText(label, maxTextWidth, fontPx, options.glyphRatio);
  const glyphRatio = options.glyphRatio ?? 0.62;
  const textWidth = Math.ceil(displayLabel.length * fontPx * glyphRatio);
  const width = Math.min(
    options.maxWidth,
    Math.max(options.minWidth ?? 88, textWidth + paddingX * 2),
  );
  const height = Math.max(26, Math.ceil(fontPx * TYPOGRAPHY.lineHeight.tight) + paddingY * 2);
  return { label: displayLabel, width, height, fontPx, paddingX, paddingY };
}

/** Minimum interactive hit area for touch targets (px). Recomputed on each call. */
export function minTouchTarget(): number {
  return isMobile() ? 48 : 0;
}

/** Get HP bar color based on percentage. */
export function hpColor(pct: number): number {
  if (pct > 0.5) return COLORS.hpGreen;
  if (pct > 0.2) return COLORS.hpYellow;
  return COLORS.hpRed;
}

/** Create a styled panel background. */
export function drawPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha = 0.95,
): Phaser.GameObjects.Rectangle {
  const panel = scene.add.rectangle(x, y, w, h, COLORS.bgPanel, alpha);
  panel.setStrokeStyle(readableStroke(STROKES.panel), COLORS.border);
  return panel;
}

/** Create a type badge using the sprite sheet if loaded, rectangle fallback otherwise. */
export function drawTypeBadge(
  scene: Phaser.Scene,
  x: number,
  y: number,
  type: string,
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const frame = TYPE_BADGE_FRAMES[type];
  if (frame !== undefined && scene.textures.exists('type-badges')) {
    const sprite = scene.add.image(0, 0, 'type-badges', frame).setScale(2);
    container.add(sprite);
  } else {
    const bg = scene.add
      .rectangle(0, 0, 64, 20, TYPE_COLORS[type] ?? COLORS.progressNeutral)
      .setStrokeStyle(readableStroke(), COLORS.white);
    const text = scene.add
      .text(0, 0, type.toUpperCase(), {
        fontSize: '10px',
        color: COLORS.textWhite,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    container.add([bg, text]);
  }
  return container;
}

/** Create a status condition badge using the sprite sheet. */
export function drawStatusBadge(
  scene: Phaser.Scene,
  x: number,
  y: number,
  status: string,
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const frame = STATUS_BADGE_FRAMES[status];
  if (frame !== undefined && scene.textures.exists('status-badges')) {
    const sprite = scene.add.image(0, 0, 'status-badges', frame).setScale(2);
    container.add(sprite);
  } else {
    const col = STATUS_COLORS[status] ?? COLORS.progressNeutral;
    const bg = scene.add
      .rectangle(0, 0, 64, 20, col)
      .setStrokeStyle(readableStroke(), COLORS.white);
    const label = status === 'bad-poison' ? 'TOX' : status.substring(0, 3).toUpperCase();
    const text = scene.add
      .text(0, 0, label, {
        fontSize: '10px',
        color: COLORS.textWhite,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    container.add([bg, text]);
  }
  return container;
}

/** Create an interactive button. */
export function drawButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  width = 140,
  height = 36,
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const bg = scene.add
    .rectangle(0, 0, width, height, COLORS.btnBg)
    .setStrokeStyle(readableStroke(), COLORS.border);
  const text = scene.add.text(0, 0, label, FONTS.button).setOrigin(0.5);
  container.add([bg, text]);
  container.setSize(width, height);
  container.setInteractive({ useHandCursor: true });
  container.on('pointerover', () => {
    bg.fillColor = COLORS.btnHover;
    text.setColor(COLORS.textHighlight);
  });
  container.on('pointerout', () => {
    bg.fillColor = COLORS.btnBg;
    text.setColor(COLORS.textWhite);
  });
  container.on('pointerdown', onClick);
  return container;
}

/** Draw an HP bar. */
export function drawHpBar(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  current: number,
  max: number,
): { bg: Phaser.GameObjects.Rectangle; fill: Phaser.GameObjects.Rectangle } {
  const pct = max > 0 ? current / max : 0;
  const bg = scene.add
    .rectangle(x, y, width, height, COLORS.bgBarTrack)
    .setOrigin(0, 0.5)
    .setStrokeStyle(readableStroke(), COLORS.border);
  const fill = scene.add
    .rectangle(x + 1, y, (width - 2) * pct, height - 2, hpColor(pct))
    .setOrigin(0, 0.5);
  return { bg, fill };
}
