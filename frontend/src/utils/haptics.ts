/**
 * Haptic feedback utility for mobile.
 * Gated behind a 'haptics' setting (defaults to true).
 */
import { GameManager } from '@managers/GameManager';

export function hapticTap(): void {
  try {
    const gm = GameManager.getInstance();
    if (gm.getSetting('haptics') === 'false') return;
    navigator.vibrate?.(10);
  } catch { /* ignore */ }
}

export function hapticHeavy(): void {
  try {
    const gm = GameManager.getInstance();
    if (gm.getSetting('haptics') === 'false') return;
    navigator.vibrate?.(30);
  } catch { /* ignore */ }
}
