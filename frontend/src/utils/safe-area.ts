/**
 * Safe-area inset reader.
 * Reads CSS env() values and exposes them as pixel numbers for in-canvas use.
 */
export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

let cachedInsets: SafeAreaInsets | null = null;

export function getSafeAreaInsets(): SafeAreaInsets {
  if (cachedInsets) return cachedInsets;
  if (typeof document === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };

  const el = document.createElement('div');
  el.style.position = 'fixed';
  el.style.top = 'env(safe-area-inset-top, 0px)';
  el.style.right = 'env(safe-area-inset-right, 0px)';
  el.style.bottom = 'env(safe-area-inset-bottom, 0px)';
  el.style.left = 'env(safe-area-inset-left, 0px)';
  el.style.visibility = 'hidden';
  el.style.pointerEvents = 'none';
  document.body.appendChild(el);

  const style = getComputedStyle(el);
  cachedInsets = {
    top: parseFloat(style.top) || 0,
    right: parseFloat(style.right) || 0,
    bottom: parseFloat(style.bottom) || 0,
    left: parseFloat(style.left) || 0,
  };

  document.body.removeChild(el);
  return cachedInsets;
}

/** Invalidate cache (call on orientation change). */
export function resetSafeAreaCache(): void {
  cachedInsets = null;
}

/**
 * Convert CSS-pixel safe-area insets into Phaser game-coord insets for the
 * given camera. Use this when positioning HUD elements that anchor to the
 * canvas edges (top/bottom/left/right) so they don't sit under iOS notches
 * or the home indicator. Returns 0 for every edge on platforms without
 * safe-area support.
 */
export function getGameSafeAreaInsets(
  cam: { width: number; height: number },
): SafeAreaInsets {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  const insets = getSafeAreaInsets();
  // The Phaser canvas already lives inside the body's safe-area padding box
  // (see index.html), so its rendered area equals the safe area. Game-coord
  // insets only make sense when the canvas extends OUTSIDE the safe area —
  // e.g. when the viewport is letter-/pillar-boxed. Compute the leftover
  // bars between canvas and viewport, then convert any extra letterboxing
  // back into game-coord insets via the camera scale ratio.
  const canvas = document.querySelector('canvas');
  if (!canvas) return { top: 0, right: 0, bottom: 0, left: 0 };
  const rect = canvas.getBoundingClientRect();
  const scaleX = cam.width / rect.width;
  const scaleY = cam.height / rect.height;
  // Distance between canvas edge and the safe-area edge (in CSS px). Negative
  // means the canvas extends past the safe area and we need to add inset.
  const overflowTop = Math.max(0, insets.top - rect.top);
  const overflowBottom = Math.max(0, insets.bottom - (window.innerHeight - rect.bottom));
  const overflowLeft = Math.max(0, insets.left - rect.left);
  const overflowRight = Math.max(0, insets.right - (window.innerWidth - rect.right));
  return {
    top: Math.round(overflowTop * scaleY),
    right: Math.round(overflowRight * scaleX),
    bottom: Math.round(overflowBottom * scaleY),
    left: Math.round(overflowLeft * scaleX),
  };
}
