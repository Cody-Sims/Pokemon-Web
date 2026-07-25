import { describe, expect, it } from 'vitest';
import type Phaser from 'phaser';
import { SceneInputRegistry } from '../../../frontend/src/scenes/SceneInputRegistry';

type EventName = string | symbol;
type Listener = (...args: unknown[]) => void;

class TestEmitter {
  private readonly listeners = new Map<EventName, Set<Listener>>();

  on(event: EventName, listener: Listener, _context?: unknown): this {
    this.add(event, listener);
    return this;
  }

  once(event: EventName, listener: Listener, context?: unknown): this {
    const wrapped: Listener = (...args) => {
      this.off(event, wrapped, context);
      listener(...args);
    };
    this.add(event, wrapped);
    return this;
  }

  off(event: EventName, listener?: Listener, _context?: unknown): this {
    if (!listener) {
      this.listeners.delete(event);
      return this;
    }
    this.listeners.get(event)?.delete(listener);
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

function createRegistry(): {
  registry: SceneInputRegistry;
  keyboard: TestEmitter;
  pointer: TestEmitter;
  events: TestEmitter;
} {
  const keyboard = new TestEmitter();
  const pointer = new TestEmitter();
  const events = new TestEmitter();
  const scene = {
    input: { keyboard },
    events,
  } as unknown as Phaser.Scene;

  return {
    registry: new SceneInputRegistry(scene),
    keyboard,
    pointer,
    events,
  };
}

describe('SceneInputRegistry', () => {
  it('removes key, pointer, and scene-event listeners on scene shutdown', () => {
    const { registry, keyboard, pointer, events } = createRegistry();

    registry.bindKey('keydown-ENTER', () => undefined);
    registry.bindPointer(pointer, 'pointerdown', () => undefined);
    registry.bindSceneEvent('pause', () => undefined);

    expect(keyboard.listenerCount('keydown-ENTER')).toBe(1);
    expect(pointer.listenerCount('pointerdown')).toBe(1);
    expect(events.listenerCount('pause')).toBe(1);

    events.emit('shutdown');

    expect(keyboard.listenerCount('keydown-ENTER')).toBe(0);
    expect(pointer.listenerCount('pointerdown')).toBe(0);
    expect(events.listenerCount('pause')).toBe(0);
  });

  it('keeps listener counts at baseline across create-shutdown-create cycles', () => {
    const { registry, keyboard, pointer, events } = createRegistry();
    const bindCreateListeners = () => {
      registry.bindKey('keydown-ESC', () => undefined);
      registry.bindPointer(pointer, 'pointerdown', () => undefined);
    };

    bindCreateListeners();
    expect(keyboard.listenerCount('keydown-ESC')).toBe(1);
    expect(pointer.listenerCount('pointerdown')).toBe(1);

    events.emit('shutdown');
    expect(keyboard.listenerCount('keydown-ESC')).toBe(0);
    expect(pointer.listenerCount('pointerdown')).toBe(0);

    bindCreateListeners();
    expect(keyboard.listenerCount('keydown-ESC')).toBe(1);
    expect(pointer.listenerCount('pointerdown')).toBe(1);
  });
});
