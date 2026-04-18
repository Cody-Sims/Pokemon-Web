// ─── Input-mode-aware hint text ───
// Returns the correct action label depending on whether the player is
// using touch controls or a keyboard.

import { isMobile } from '@ui/theme';

type HintAction = 'confirm' | 'back' | 'menu' | 'advance' | 'select' | 'interact';

const MOBILE_HINTS: Record<HintAction, string> = {
  confirm: 'Tap A',
  back: 'Tap B',
  menu: 'Tap ☰',
  advance: 'Tap to continue',
  select: 'Tap to select',
  interact: 'Tap = Talk',
};

const DESKTOP_HINTS: Record<HintAction, string> = {
  confirm: 'Press Z',
  back: 'Press X',
  menu: 'Press Enter',
  advance: 'Press Enter to continue',
  select: 'Press Enter to select',
  interact: 'SPACE = Talk',
};

/** Return a human-readable hint for the given action based on the current input mode. */
export function hintText(action: HintAction): string {
  return isMobile() ? MOBILE_HINTS[action] : DESKTOP_HINTS[action];
}
