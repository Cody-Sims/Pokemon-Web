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
