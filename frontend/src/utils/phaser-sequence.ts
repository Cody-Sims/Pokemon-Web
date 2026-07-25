import type Phaser from 'phaser';

const SCENE_SHUTDOWN_EVENT = 'shutdown';
const SCENE_DESTROY_EVENT = 'destroy';
const SCENE_SHUTDOWN_STATUS = 8;
const SCENE_DESTROYED_STATUS = 9;

export class PhaserSequenceAbortError extends Error {
  constructor(message = 'Phaser sequence was cancelled before completion.') {
    super(message);
    this.name = 'PhaserSequenceAbortError';
  }
}

export interface PhaserSequenceOptions {
  signal?: AbortSignal;
}

export type SequenceStep<T = unknown> = () => T | Promise<T>;

function isSceneAlive(scene: Phaser.Scene): boolean {
  const status = scene.sys?.settings?.status;
  return status !== SCENE_SHUTDOWN_STATUS && status !== SCENE_DESTROYED_STATUS;
}

function abortError(reason?: string): PhaserSequenceAbortError {
  return new PhaserSequenceAbortError(reason);
}

function guardedScenePromise<T>(
  scene: Phaser.Scene,
  options: PhaserSequenceOptions,
  start: (resolve: (value: T) => void, reject: (error: PhaserSequenceAbortError) => void) => () => void,
): Promise<T> {
  if (options.signal?.aborted) {
    return Promise.reject(abortError('Phaser sequence was aborted before it started.'));
  }
  if (!isSceneAlive(scene)) {
    return Promise.reject(abortError('Phaser scene is not active.'));
  }

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    let cancelPending = (): void => undefined;

    const cleanups: (() => void)[] = [];
    const cleanup = (): void => {
      cleanups.splice(0).forEach(fn => fn());
    };
    const rejectOnce = (error: PhaserSequenceAbortError): void => {
      if (settled) return;
      settled = true;
      cancelPending();
      cleanup();
      reject(error);
    };
    const resolveOnce = (value: T): void => {
      if (settled) return;
      if (options.signal?.aborted || !isSceneAlive(scene)) {
        rejectOnce(abortError('Phaser scene stopped before the sequence completed.'));
        return;
      }
      settled = true;
      cleanup();
      resolve(value);
    };

    const onAbort = (): void => rejectOnce(abortError());
    const onSceneStop = (): void => rejectOnce(abortError('Phaser scene stopped before the sequence completed.'));

    scene.sys.events.once(SCENE_SHUTDOWN_EVENT, onSceneStop);
    scene.sys.events.once(SCENE_DESTROY_EVENT, onSceneStop);
    cleanups.push(() => scene.sys.events.off(SCENE_SHUTDOWN_EVENT, onSceneStop));
    cleanups.push(() => scene.sys.events.off(SCENE_DESTROY_EVENT, onSceneStop));

    options.signal?.addEventListener('abort', onAbort, { once: true });
    if (options.signal) {
      cleanups.push(() => options.signal?.removeEventListener('abort', onAbort));
    }

    cancelPending = start(resolveOnce, rejectOnce);
  });
}

function splitColor(color: number): { r: number; g: number; b: number } {
  return {
    r: (color >> 16) & 0xff,
    g: (color >> 8) & 0xff,
    b: color & 0xff,
  };
}

export function delay(scene: Phaser.Scene, milliseconds: number, options: PhaserSequenceOptions = {}): Promise<void> {
  return guardedScenePromise(scene, options, (resolve) => {
    const timer = scene.time.delayedCall(Math.max(0, milliseconds), () => resolve());
    return () => timer.remove(false);
  });
}

export function tweenTo(
  scene: Phaser.Scene,
  config: Phaser.Types.Tweens.TweenBuilderConfig,
  options: PhaserSequenceOptions = {},
): Promise<Phaser.Tweens.Tween> {
  return guardedScenePromise(scene, options, (resolve, reject) => {
    const originalOnComplete = config.onComplete;
    const originalOnStop = config.onStop;
    const tween = scene.tweens.add({
      ...config,
      onComplete: (completedTween, targets, ...params) => {
        originalOnComplete?.(completedTween, targets, ...params);
        resolve(completedTween);
      },
      onStop: (stoppedTween, targets, ...params) => {
        originalOnStop?.(stoppedTween, targets, ...params);
        reject(abortError('Phaser tween stopped before completion.'));
      },
    });

    return () => {
      if (!tween.isDestroyed()) {
        tween.stop();
      }
    };
  });
}

export function fadeOut(
  scene: Phaser.Scene,
  duration = 500,
  color = 0x000000,
  options: PhaserSequenceOptions = {},
): Promise<void> {
  return guardedScenePromise(scene, options, (resolve) => {
    const { r, g, b } = splitColor(color);
    scene.cameras.main.fadeOut(duration, r, g, b, (_camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress >= 1) resolve();
    });
    return () => scene.cameras.main.resetFX();
  });
}

export function fadeIn(
  scene: Phaser.Scene,
  duration = 500,
  color = 0x000000,
  options: PhaserSequenceOptions = {},
): Promise<void> {
  return guardedScenePromise(scene, options, (resolve) => {
    const { r, g, b } = splitColor(color);
    scene.cameras.main.fadeIn(duration, r, g, b, (_camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress >= 1) resolve();
    });
    return () => scene.cameras.main.resetFX();
  });
}

export function flash(
  scene: Phaser.Scene,
  duration = 300,
  color = 0xffffff,
  force = false,
  options: PhaserSequenceOptions = {},
): Promise<void> {
  return guardedScenePromise(scene, options, (resolve) => {
    const { r, g, b } = splitColor(color);
    scene.cameras.main.flash(duration, r, g, b, force, (_camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress >= 1) resolve();
    });
    return () => scene.cameras.main.resetFX();
  });
}

export async function sequence<T>(steps: readonly SequenceStep<T>[], options: PhaserSequenceOptions = {}): Promise<T[]> {
  const results: T[] = [];

  for (const step of steps) {
    if (options.signal?.aborted) {
      throw abortError();
    }
    results.push(await step());
  }

  return results;
}
