type EventCallback = (...args: unknown[]) => void;

/** Typed event bus for cross-scene communication. */
export class EventManager {
  private static instance: EventManager;
  private listeners = new Map<string, EventCallback[]>();

  private constructor() {}

  static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  on(event: string, callback: EventCallback): void {
    const list = this.listeners.get(event) ?? [];
    list.push(callback);
    this.listeners.set(event, list);
  }

  off(event: string, callback: EventCallback): void {
    const list = this.listeners.get(event);
    if (!list) return;
    this.listeners.set(event, list.filter(cb => cb !== callback));
  }

  emit(event: string, ...args: unknown[]): void {
    const list = this.listeners.get(event);
    if (!list) return;
    for (const cb of list) {
      cb(...args);
    }
  }

  clear(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
