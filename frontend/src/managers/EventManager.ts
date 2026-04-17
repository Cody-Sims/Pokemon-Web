/** Known event names and their payload types. */
export interface EventMap {
  'map-entered': [mapKey: string];
  'flag-set': [flag: string];
  'trainer-defeated': [trainerId: string];
  'quest-completed': [questId: string];
}

type EventName = keyof EventMap | (string & {});
type EventCallback<K extends EventName = EventName> = K extends keyof EventMap
  ? (...args: EventMap[K]) => void
  : (...args: unknown[]) => void;

/** Typed event bus for cross-scene communication. */
export class EventManager {
  private static instance: EventManager;
  private listeners = new Map<string, ((...args: unknown[]) => void)[]>();
  private taggedListeners = new Map<string, { event: string; callback: (...args: unknown[]) => void }[]>();

  private constructor() {}

  static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  on<K extends EventName>(event: K, callback: EventCallback<K>): void {
    const list = this.listeners.get(event) ?? [];
    list.push(callback as (...args: unknown[]) => void);
    this.listeners.set(event, list);
  }

  off<K extends EventName>(event: K, callback: EventCallback<K>): void {
    const list = this.listeners.get(event);
    if (!list) return;
    this.listeners.set(event, list.filter(cb => cb !== callback));
  }

  emit<K extends EventName>(event: K, ...args: K extends keyof EventMap ? EventMap[K] : unknown[]): void {
    const list = this.listeners.get(event);
    if (!list) return;
    for (const cb of list) {
      try {
        cb(...args);
      } catch (e) {
        console.error(`[EventManager] Error in listener for '${event}':`, e);
      }
    }
  }

  /** Remove all listeners registered by a specific callback owner (for scene cleanup). */
  offAll(callback: (...args: unknown[]) => void): void {
    for (const [event, list] of this.listeners.entries()) {
      const filtered = list.filter(cb => cb !== callback);
      if (filtered.length > 0) {
        this.listeners.set(event, filtered);
      } else {
        this.listeners.delete(event);
      }
    }
  }

  /** Remove all listeners for a given owner tag (scene key). */
  clearByTag(tag: string): void {
    const tagged = this.taggedListeners.get(tag);
    if (!tagged) return;
    for (const { event, callback } of tagged) {
      this.off(event, callback);
    }
    this.taggedListeners.delete(tag);
  }

  /** Register a listener tagged with a scene key for later bulk cleanup. */
  onTagged<K extends EventName>(tag: string, event: K, callback: EventCallback<K>): void {
    this.on(event, callback);
    const list = this.taggedListeners.get(tag) ?? [];
    list.push({ event: event as string, callback: callback as (...args: unknown[]) => void });
    this.taggedListeners.set(tag, list);
  }

  clear(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
