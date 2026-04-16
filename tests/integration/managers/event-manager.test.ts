import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventManager } from '../../../frontend/src/managers/EventManager';

describe('EventManager', () => {
  let em: EventManager;

  beforeEach(() => {
    // @ts-expect-error private access for test reset
    EventManager.instance = undefined;
    em = EventManager.getInstance();
  });

  it('should be singleton', () => {
    expect(EventManager.getInstance()).toBe(em);
  });

  it('should register and emit events', () => {
    const handler = vi.fn();
    em.on('test-event', handler);
    em.emit('test-event', 'arg1', 42);
    expect(handler).toHaveBeenCalledWith('arg1', 42);
  });

  it('should support multiple listeners', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    em.on('test', h1);
    em.on('test', h2);
    em.emit('test');
    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });

  it('should remove specific listener', () => {
    const handler = vi.fn();
    em.on('test', handler);
    em.off('test', handler);
    em.emit('test');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should clear specific event', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    em.on('test1', h1);
    em.on('test2', h2);
    em.clear('test1');
    em.emit('test1');
    em.emit('test2');
    expect(h1).not.toHaveBeenCalled();
    expect(h2).toHaveBeenCalledOnce();
  });

  it('should clear all events', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    em.on('test1', h1);
    em.on('test2', h2);
    em.clear();
    em.emit('test1');
    em.emit('test2');
    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  it('should not throw when emitting unregistered event', () => {
    expect(() => em.emit('nonexistent')).not.toThrow();
  });
});
