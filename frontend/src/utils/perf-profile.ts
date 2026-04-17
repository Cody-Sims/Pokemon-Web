/**
 * Mobile performance profile.
 * Detects mobile devices and provides reduced particle counts,
 * animation frame rates, and render quality settings.
 */
import { isMobile } from '@ui/theme';

export type RenderQuality = 'high' | 'medium' | 'low';

let quality: RenderQuality = isMobile() ? 'medium' : 'high';

export function getRenderQuality(): RenderQuality {
  return quality;
}

export function setRenderQuality(q: RenderQuality): void {
  quality = q;
}

/** Multiplier for particle emission quantities. */
export function particleMultiplier(): number {
  switch (quality) {
    case 'high': return 1.0;
    case 'medium': return 0.5;
    case 'low': return 0.25;
  }
}

/** Max alive particles multiplier. */
export function maxParticleMultiplier(): number {
  switch (quality) {
    case 'high': return 1.0;
    case 'medium': return 0.6;
    case 'low': return 0.3;
  }
}
