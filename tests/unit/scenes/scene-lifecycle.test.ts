import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { SceneInputRegistry } from '../../../frontend/src/scenes/SceneInputRegistry';

type EventName = string | symbol;
type Listener = (...args: unknown[]) => void;

class TestEmitter {
  private readonly listeners = new Map<EventName, Set<Listener>>();
  private readonly onceWrappers = new Map<Listener, Set<Listener>>();

  on(event: EventName, listener: Listener, _context?: unknown): this {
    this.add(event, listener);
    return this;
  }

  once(event: EventName, listener: Listener, context?: unknown): this {
    const wrapped: Listener = (...args) => {
      this.off(event, wrapped, context);
      this.onceWrappers.delete(listener);
      listener(...args);
    };
    const wrappers = this.onceWrappers.get(listener) ?? new Set<Listener>();
    wrappers.add(wrapped);
    this.onceWrappers.set(listener, wrappers);
    this.add(event, wrapped);
    return this;
  }

  off(event: EventName, listener?: Listener, _context?: unknown): this {
    if (!listener) {
      this.listeners.delete(event);
      return this;
    }
    const wrappers = this.onceWrappers.get(listener);
    this.listeners.get(event)?.delete(listener);
    if (wrappers) {
      wrappers.forEach(wrapped => this.listeners.forEach(eventListeners => eventListeners.delete(wrapped)));
      this.onceWrappers.delete(listener);
    }
    return this;
  }

  emit(event: EventName, ...args: unknown[]): void {
    [...(this.listeners.get(event) ?? [])].forEach(listener => listener(...args));
  }

  listenerCount(event: EventName): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  private add(event: EventName, listener: Listener): void {
    const eventListeners = this.listeners.get(event) ?? new Set<Listener>();
    eventListeners.add(listener);
    this.listeners.set(event, eventListeners);
  }
}

function createScene(keyboard: TestEmitter | null = new TestEmitter()) {
  const events = new TestEmitter();
  const scene = {
    input: { keyboard },
    events,
  } as unknown as Phaser.Scene;

  return { scene, events, keyboard };
}

describe('Scene lifecycle listener cleanup', () => {
  it('removes keyboard listeners when the scene shuts down', () => {
    const { scene, events, keyboard } = createScene();
    const registry = new SceneInputRegistry(scene);

    registry.bindKey('keydown-ESC', () => undefined);
    registry.bindKey('keydown-ENTER', () => undefined);

    expect(keyboard?.listenerCount('keydown-ESC')).toBe(1);
    expect(keyboard?.listenerCount('keydown-ENTER')).toBe(1);

    events.emit('shutdown');

    expect(keyboard?.listenerCount('keydown-ESC')).toBe(0);
    expect(keyboard?.listenerCount('keydown-ENTER')).toBe(0);
  });

  it('removes pointer and scene-event listeners when the scene is destroyed', () => {
    const { scene, events } = createScene();
    const pointer = new TestEmitter();
    const registry = new SceneInputRegistry(scene);

    registry.bindPointer(pointer, 'pointerdown', () => undefined);
    registry.bindSceneEvent('resume', () => undefined);

    expect(pointer.listenerCount('pointerdown')).toBe(1);
    expect(events.listenerCount('resume')).toBe(1);

    events.emit('destroy');

    expect(pointer.listenerCount('pointerdown')).toBe(0);
    expect(events.listenerCount('resume')).toBe(0);
  });

  it('unregisters once listeners after their first invocation', () => {
    const { scene, keyboard } = createScene();
    const pointer = new TestEmitter();
    const registry = new SceneInputRegistry(scene);
    const onKey = vi.fn();
    const onPointer = vi.fn();

    registry.bindKeyOnce('keydown-SPACE', onKey);
    registry.bindPointerOnce(pointer, 'pointerup', onPointer);
    keyboard?.emit('keydown-SPACE', 'first');
    keyboard?.emit('keydown-SPACE', 'second');
    pointer.emit('pointerup');
    pointer.emit('pointerup');

    expect(onKey).toHaveBeenCalledOnce();
    expect(onPointer).toHaveBeenCalledOnce();
    expect(keyboard?.listenerCount('keydown-SPACE')).toBe(0);
    expect(pointer.listenerCount('pointerup')).toBe(0);
  });

  it('is safe for Phaser scenes without a keyboard plugin', () => {
    const { scene, events } = createScene(null);
    const registry = new SceneInputRegistry(scene);

    expect(() => registry.bindKey('keydown-ESC', () => undefined)).not.toThrow();
    events.emit('shutdown');
  });

  it('can be cleared repeatedly without leaking lifecycle hooks', () => {
    const { scene, events, keyboard } = createScene();
    const registry = new SceneInputRegistry(scene);

    registry.bindKey('keydown-X', () => undefined);
    registry.clear();
    registry.clear();

    expect(keyboard?.listenerCount('keydown-X')).toBe(0);
    expect(events.listenerCount('shutdown')).toBe(0);
    expect(events.listenerCount('destroy')).toBe(0);
  });
});
