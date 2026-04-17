/**
 * Accessibility utilities.
 * Provides runtime access to reduced-motion, text-scale, and colorblind preferences
 * without creating circular imports in the theme module.
 */

let textScaleSetting: string = 'medium';
let reducedMotionSetting = false;
let colorblindModeSetting: string = 'off';

const TEXT_SCALE_FACTORS: Record<string, number> = {
  small: 0.85,
  medium: 1.0,
  large: 1.25,
};

/** Call once at boot after GameManager is initialized, and on settings change. */
export function syncAccessibilitySettings(settings: {
  textScale?: string;
  reducedMotion?: string;
  colorblindMode?: string;
}): void {
  textScaleSetting = settings.textScale ?? 'medium';
  reducedMotionSetting = settings.reducedMotion === 'true';
  colorblindModeSetting = settings.colorblindMode ?? 'off';
}

/** Current text scale multiplier. */
export function getTextScale(): number {
  return TEXT_SCALE_FACTORS[textScaleSetting] ?? 1.0;
}

/** Whether reduced motion is enabled (by user setting OR OS preference). */
export function isReducedMotion(): boolean {
  if (reducedMotionSetting) return true;
  if (typeof matchMedia !== 'undefined') {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

/** Current colorblind mode. */
export function getColorblindMode(): string {
  return colorblindModeSetting;
}

/** CSS filter string for the given colorblind mode. */
export function colorblindFilter(mode?: string): string {
  const m = mode ?? colorblindModeSetting;
  switch (m) {
    case 'protanopia':
      return 'url(#protanopia-filter)';
    case 'deuteranopia':
      return 'url(#deuteranopia-filter)';
    default:
      return 'none';
  }
}
