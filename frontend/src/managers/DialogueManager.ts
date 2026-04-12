/** Queued dialogue display with typewriter effect support. */
export class DialogueManager {
  private static instance: DialogueManager;
  private queue: string[] = [];

  private constructor() {}

  static getInstance(): DialogueManager {
    if (!DialogueManager.instance) {
      DialogueManager.instance = new DialogueManager();
    }
    return DialogueManager.instance;
  }

  /** Set the dialogue queue. */
  setDialogue(lines: string[]): void {
    this.queue = [...lines];
  }

  /** Get the current queue. */
  getQueue(): string[] {
    return this.queue;
  }

  /** Clear the queue. */
  clear(): void {
    this.queue = [];
  }
}
