import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventManager } from '../../../frontend/src/managers/EventManager';

describe('EventManager', () => {
  let em: EventManager;

  beforeEach(() => {
    EventManager.resetInstance();
    em = EventManager.getInstance();
  });

  it('should be singleton', () => {
    expect(EventManager.getInstance()).toBe(em);
  });

  it('should register and emit events', () => {
    const handler = vi.fn();
    em.on('flag-set', handler);
    em.emit('flag-set', 'receivedStarter');
    expect(handler).toHaveBeenCalledWith('receivedStarter');
  });

  it('should support multiple listeners', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    em.on('party-changed', h1);
    em.on('party-changed', h2);
    em.emit('party-changed');
    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });

  it('should remove specific listener', () => {
    const handler = vi.fn();
    em.on('party-changed', handler);
    em.off('party-changed', handler);
    em.emit('party-changed');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should clear specific event', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    em.on('party-changed', h1);
    em.on('inventory-closed', h2);
    em.clear('party-changed');
    em.emit('party-changed');
    em.emit('inventory-closed');
    expect(h1).not.toHaveBeenCalled();
    expect(h2).toHaveBeenCalledOnce();
  });

  it('should clear all events', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    em.on('party-changed', h1);
    em.on('inventory-closed', h2);
    em.clear();
    em.emit('party-changed');
    em.emit('inventory-closed');
    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  it('should not throw when emitting unregistered event', () => {
    expect(() => em.emit('berry-harvested', { treeId: 'route-1:tree-1', berryId: 'oran-berry' })).not.toThrow();
  });

  it('should clear tagged listeners', () => {
    const handler = vi.fn();
    em.onTagged('PartyQuickViewScene', 'party-changed', handler);
    em.clearByTag('PartyQuickViewScene');
    em.emit('party-changed');
    expect(handler).not.toHaveBeenCalled();
  });
});
