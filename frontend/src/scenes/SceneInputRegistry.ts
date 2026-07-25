import type Phaser from 'phaser';

type EventName = string | symbol;
type Listener<Args extends unknown[] = unknown[]> = (...args: Args) => void;

interface ListenerTarget {
  on(event: EventName, listener: Listener, context?: unknown): unknown;
  off(event: EventName, listener?: Listener, context?: unknown): unknown;
  once?(event: EventName, listener: Listener, context?: unknown): unknown;
}

type Disposer = () => void;
const SCENE_SHUTDOWN_EVENT = 'shutdown';
const SCENE_DESTROY_EVENT = 'destroy';

/**
 * Owns scene-scoped input and lifecycle listeners, removing everything it
 * registered when Phaser emits shutdown or destroy for the scene.
 */
export class SceneInputRegistry {
  private readonly disposers: Disposer[] = [];
  private armed = false;

  constructor(private readonly scene: Phaser.Scene) {}

  bindKey<Args extends unknown[]>(
    event: string,
    listener: Listener<Args>,
    context?: unknown,
  ): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;
    this.bind(keyboard, event, listener as Listener, context);
  }

  bindKeyOnce<Args extends unknown[]>(
    event: string,
    listener: Listener<Args>,
    context?: unknown,
  ): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;
    this.bindOnce(keyboard, event, listener as Listener, context);
  }

  bindPointer<Args extends unknown[]>(
    target: ListenerTarget,
    event: string,
    listener: Listener<Args>,
    context?: unknown,
  ): void {
    this.bind(target, event, listener as Listener, context);
  }

  bindPointerOnce<Args extends unknown[]>(
    target: ListenerTarget,
    event: string,
    listener: Listener<Args>,
    context?: unknown,
  ): void {
    this.bindOnce(target, event, listener as Listener, context);
  }

  bindSceneEvent<Args extends unknown[]>(
    event: string,
    listener: Listener<Args>,
    context?: unknown,
  ): void {
    this.bind(this.scene.events, event, listener as Listener, context);
  }

  clear(): void {
    const pending = [...this.disposers].reverse();
    this.disposers.length = 0;
    this.armed = false;
    pending.forEach(dispose => dispose());
  }

  private bind(
    target: ListenerTarget,
    event: EventName,
    listener: Listener,
    context?: unknown,
  ): void {
    this.ensureLifecycleHooks();
    target.on(event, listener, context);
    this.disposers.push(() => target.off(event, listener, context));
  }

  private bindOnce(
    target: ListenerTarget,
    event: EventName,
    listener: Listener,
    context?: unknown,
  ): void {
    this.ensureLifecycleHooks();
    const wrapped: Listener = (...args) => {
      target.off(event, wrapped, context);
      this.removeDisposer(dispose);
      listener(...args);
    };
    const dispose = () => target.off(event, wrapped, context);
    target.on(event, wrapped, context);
    this.disposers.push(dispose);
  }

  private ensureLifecycleHooks(): void {
    if (this.armed) return;
    this.armed = true;
    const cleanup = () => this.clear();
    this.scene.events.once(SCENE_SHUTDOWN_EVENT, cleanup);
    this.scene.events.once(SCENE_DESTROY_EVENT, cleanup);
    this.disposers.push(() => {
      this.scene.events.off(SCENE_SHUTDOWN_EVENT, cleanup);
      this.scene.events.off(SCENE_DESTROY_EVENT, cleanup);
    });
  }

  private removeDisposer(disposer: Disposer): void {
    const index = this.disposers.indexOf(disposer);
    if (index >= 0) {
      this.disposers.splice(index, 1);
    }
  }
}
