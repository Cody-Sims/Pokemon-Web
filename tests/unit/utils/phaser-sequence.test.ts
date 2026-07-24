import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import {
  delay,
  fadeIn,
  fadeOut,
  flash,
  PhaserSequenceAbortError,
  sequence,
  tweenTo,
} from '@utils/phaser-sequence';

const SCENE_RUNNING_STATUS = 6;
const SCENE_SHUTDOWN_EVENT = 'shutdown';
const SCENE_DESTROY_EVENT = 'destroy';

class TestEventEmitter {
  private listeners = new Map<string, Set<() => void>>();

  once(event: string, listener: () => void): this {
    const wrapped = (): void => {
      this.off(event, wrapped);
      listener();
    };
    const listeners = this.listeners.get(event) ?? new Set<() => void>();
    listeners.add(wrapped);
    this.listeners.set(event, listeners);
    return this;
  }

  off(event: string, listener: () => void): this {
    this.listeners.get(event)?.delete(listener);
    return this;
  }

  emit(event: string): boolean {
    const listeners = [...(this.listeners.get(event) ?? [])];
    listeners.forEach(listener => listener());
    return listeners.length > 0;
  }
}

interface PhaserSceneHarness {
  scene: Phaser.Scene;
  events: TestEventEmitter;
  timerRemove: ReturnType<typeof vi.fn>;
  tweenStop: ReturnType<typeof vi.fn>;
  resetFX: ReturnType<typeof vi.fn>;
  runDelay: () => void;
  completeTween: () => void;
  stopTween: () => void;
  completeCameraEffect: () => void;
}

function createSceneHarness(): PhaserSceneHarness {
  const events = new TestEventEmitter();
  let delayCallback: (() => void) | null = null;
  let tweenConfig: Phaser.Types.Tweens.TweenBuilderConfig | null = null;
  let cameraCallback: ((camera: Phaser.Cameras.Scene2D.Camera, progress: number) => void) | null = null;

  const timerRemove = vi.fn();
  const timer = { remove: timerRemove };

  const tweenStop = vi.fn(() => {
    tweenConfig?.onStop?.(tween, []);
  });
  const tween = {
    isDestroyed: vi.fn(() => false),
    stop: tweenStop,
  } as unknown as Phaser.Tweens.Tween;

  const resetFX = vi.fn();
  const camera = {
    fadeOut: vi.fn((_duration: number, _r: number, _g: number, _b: number, callback: (camera: Phaser.Cameras.Scene2D.Camera, progress: number) => void) => {
      cameraCallback = callback;
    }),
    fadeIn: vi.fn((_duration: number, _r: number, _g: number, _b: number, callback: (camera: Phaser.Cameras.Scene2D.Camera, progress: number) => void) => {
      cameraCallback = callback;
    }),
    flash: vi.fn((_duration: number, _r: number, _g: number, _b: number, _force: boolean, callback: (camera: Phaser.Cameras.Scene2D.Camera, progress: number) => void) => {
      cameraCallback = callback;
    }),
    resetFX,
  };

  const scene = {
    sys: {
      settings: { status: SCENE_RUNNING_STATUS },
      events: events as unknown as Phaser.Events.EventEmitter,
    },
    time: {
      delayedCall: vi.fn((_milliseconds: number, callback: () => void) => {
        delayCallback = callback;
        return timer;
      }),
    },
    tweens: {
      add: vi.fn((config: Phaser.Types.Tweens.TweenBuilderConfig) => {
        tweenConfig = config;
        return tween;
      }),
    },
    cameras: {
      main: camera,
    },
  } as unknown as Phaser.Scene;

  return {
    scene,
    events,
    timerRemove,
    tweenStop,
    resetFX,
    runDelay: () => delayCallback?.(),
    completeTween: () => tweenConfig?.onComplete?.(tween, []),
    stopTween: () => tweenConfig?.onStop?.(tween, []),
    completeCameraEffect: () => cameraCallback?.({} as Phaser.Cameras.Scene2D.Camera, 1),
  };
}

describe('phaser-sequence', () => {
  it('resolves delay only when the Phaser timer completes', async () => {
    const harness = createSceneHarness();
    const promise = delay(harness.scene, 25);

    harness.runDelay();

    await expect(promise).resolves.toBeUndefined();
    expect(harness.timerRemove).not.toHaveBeenCalled();
  });

  it('rejects and removes pending timers when an abort signal fires', async () => {
    const harness = createSceneHarness();
    const controller = new AbortController();
    const promise = delay(harness.scene, 100, { signal: controller.signal });

    controller.abort();

    await expect(promise).rejects.toBeInstanceOf(PhaserSequenceAbortError);
    expect(harness.timerRemove).toHaveBeenCalledWith(false);
  });

  it('rejects pending work when the scene shuts down', async () => {
    const harness = createSceneHarness();
    const promise = delay(harness.scene, 100);

    harness.events.emit(SCENE_SHUTDOWN_EVENT);

    await expect(promise).rejects.toBeInstanceOf(PhaserSequenceAbortError);
    expect(harness.timerRemove).toHaveBeenCalledWith(false);
  });

  it('wraps tween completion and stop callbacks', async () => {
    const harness = createSceneHarness();
    const onComplete = vi.fn();
    const promise = tweenTo(harness.scene, { targets: {}, duration: 10, onComplete });

    harness.completeTween();

    await expect(promise).resolves.toBeDefined();
    expect(onComplete).toHaveBeenCalledOnce();

    const stoppedHarness = createSceneHarness();
    const stopped = tweenTo(stoppedHarness.scene, { targets: {}, duration: 10 });
    stoppedHarness.stopTween();

    await expect(stopped).rejects.toBeInstanceOf(PhaserSequenceAbortError);
  });

  it('stops active tweens instead of resolving after scene shutdown', async () => {
    const harness = createSceneHarness();
    const promise = tweenTo(harness.scene, { targets: {}, duration: 10 });

    harness.events.emit(SCENE_DESTROY_EVENT);

    await expect(promise).rejects.toBeInstanceOf(PhaserSequenceAbortError);
    expect(harness.tweenStop).toHaveBeenCalledOnce();
  });

  it('resolves camera fade and flash helpers on progress completion', async () => {
    const fadeOutHarness = createSceneHarness();
    const fadeOutPromise = fadeOut(fadeOutHarness.scene, 50, 0x112233);
    fadeOutHarness.completeCameraEffect();
    await expect(fadeOutPromise).resolves.toBeUndefined();

    const fadeInHarness = createSceneHarness();
    const fadeInPromise = fadeIn(fadeInHarness.scene, 50, 0x112233);
    fadeInHarness.completeCameraEffect();
    await expect(fadeInPromise).resolves.toBeUndefined();

    const flashHarness = createSceneHarness();
    const flashPromise = flash(flashHarness.scene, 50, 0xffffff, true);
    flashHarness.completeCameraEffect();
    await expect(flashPromise).resolves.toBeUndefined();
  });

  it('resets camera effects when a fade is cancelled', async () => {
    const harness = createSceneHarness();
    const promise = fadeOut(harness.scene, 50);

    harness.events.emit(SCENE_SHUTDOWN_EVENT);

    await expect(promise).rejects.toBeInstanceOf(PhaserSequenceAbortError);
    expect(harness.resetFX).toHaveBeenCalledOnce();
  });

  it('runs sequence steps in order and stops when aborted between steps', async () => {
    const controller = new AbortController();
    const second = vi.fn(() => 2);
    const promise = sequence([
      () => {
        controller.abort();
        return 1;
      },
      second,
    ], { signal: controller.signal });

    await expect(promise).rejects.toBeInstanceOf(PhaserSequenceAbortError);
    expect(second).not.toHaveBeenCalled();
  });
});
