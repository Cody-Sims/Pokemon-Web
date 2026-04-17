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

/** How many battle animation frames to skip (0 = show all). */
export function battleAnimFrameSkip(): number {
  switch (quality) {
    case 'high': return 0;
    case 'medium': return 1;
    case 'low': return 2;
  }
}

/** Whether weather overlay effects should render. */
export function shouldShowWeather(): boolean {
  return quality !== 'low';
}

/** Whether shadow effects should render. */
export function shouldShowShadows(): boolean {
  return quality === 'high';
}

/** Whether text shimmer/glow effects should render. */
export function shouldShowTextEffects(): boolean {
  return quality !== 'low';
}

/** Whether tile transitions should use cross-fade (true) or instant cut (false). */
export function shouldCrossFadeTiles(): boolean {
  return quality === 'high';
}

/** Maximum active tweens allowed at once. */
export function maxActiveTweens(): number {
  switch (quality) {
    case 'high': return 20;
    case 'medium': return 12;
    case 'low': return 6;
  }
}

// ─── FPS Auto-Downgrade ───

let fpsWindowSamples: number[] = [];
let lowFpsWindowCount = 0;
const FPS_SAMPLE_INTERVAL = 2000;
const LOW_FPS_THRESHOLD = 24;
const DOWNGRADE_AFTER_WINDOWS = 3;
let fpsMonitorTimer: ReturnType<typeof setInterval> | null = null;
let onQualityChange: ((q: RenderQuality) => void) | null = null;

export function startFpsMonitor(onDowngrade?: (q: RenderQuality) => void): void {
  if (fpsMonitorTimer) return;
  onQualityChange = onDowngrade ?? null;
  fpsWindowSamples = [];
  lowFpsWindowCount = 0;

  let lastTime = performance.now();
  let frameCount = 0;

  const tick = () => {
    frameCount++;
    const now = performance.now();
    if (now - lastTime >= FPS_SAMPLE_INTERVAL) {
      const avgFps = (frameCount / (now - lastTime)) * 1000;
      fpsWindowSamples.push(avgFps);
      frameCount = 0;
      lastTime = now;

      if (avgFps < LOW_FPS_THRESHOLD) {
        lowFpsWindowCount++;
      } else {
        lowFpsWindowCount = Math.max(0, lowFpsWindowCount - 1);
      }

      if (lowFpsWindowCount >= DOWNGRADE_AFTER_WINDOWS && quality !== 'low') {
        const newQuality: RenderQuality = quality === 'high' ? 'medium' : 'low';
        setRenderQuality(newQuality);
        lowFpsWindowCount = 0;
        onQualityChange?.(newQuality);
      }
    }
    if (fpsMonitorTimer) requestAnimationFrame(tick);
  };

  fpsMonitorTimer = setInterval(() => {}, 60000) as unknown as ReturnType<typeof setInterval>;
  requestAnimationFrame(tick);
}

export function stopFpsMonitor(): void {
  if (fpsMonitorTimer) {
    clearInterval(fpsMonitorTimer);
    fpsMonitorTimer = null;
  }
}
