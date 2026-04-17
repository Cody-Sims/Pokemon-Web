// ─── Input-mode-aware hint text ───
// Returns the correct action label depending on whether the player is
// using touch controls or a keyboard.

import { isMobile } from '@ui/theme';

const MOBILE_HINTS: Record<string, string> = {
  confirm: 'Tap A',
  back: 'Tap B',
  menu: 'Tap ☰',
};

const DESKTOP_HINTS: Record<string, string> = {
  confirm: 'Press Z',
  back: 'Press X',
  menu: 'Press Enter',
};

/** Return a human-readable hint for the given action based on the current input mode. */
export function hintText(action: 'confirm' | 'back' | 'menu'): string {
  return isMobile() ? MOBILE_HINTS[action] : DESKTOP_HINTS[action];
}
