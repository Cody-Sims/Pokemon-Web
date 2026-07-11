import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@ui/theme', () => ({
  isMobile: () => false,
}));

import {
  setRenderQuality,
  startFpsMonitor,
  stopFpsMonitor,
} from '../../../frontend/src/utils/perf-profile';

describe('FPS performance monitor', () => {
  let nextFrameId: number;
  let scheduledFrames: Map<number, FrameRequestCallback>;
  let requestFrame: ReturnType<typeof vi.fn>;
  let cancelFrame: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    stopFpsMonitor();
    setRenderQuality('high');
    nextFrameId = 0;
    scheduledFrames = new Map();
    requestFrame = vi.fn((callback: FrameRequestCallback) => {
      const id = ++nextFrameId;
      scheduledFrames.set(id, callback);
      return id;
    });
    cancelFrame = vi.fn((id: number) => {
      scheduledFrames.delete(id);
    });
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    vi.stubGlobal('cancelAnimationFrame', cancelFrame);
  });

  afterEach(() => {
    stopFpsMonitor();
    vi.unstubAllGlobals();
  });

  it('starts only one animation-frame loop', () => {
    startFpsMonitor();
    startFpsMonitor();

    expect(requestFrame).toHaveBeenCalledOnce();
    expect(scheduledFrames.size).toBe(1);
  });

  it('cancels the scheduled frame when stopped', () => {
    startFpsMonitor();
    stopFpsMonitor();

    expect(cancelFrame).toHaveBeenCalledWith(1);
    expect(scheduledFrames.size).toBe(0);
  });

  it('can restart after being stopped', () => {
    startFpsMonitor();
    stopFpsMonitor();
    startFpsMonitor();

    expect(requestFrame).toHaveBeenCalledTimes(2);
    expect(scheduledFrames.has(2)).toBe(true);
  });
});
