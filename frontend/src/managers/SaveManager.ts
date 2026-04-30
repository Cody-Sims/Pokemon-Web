import { SaveData } from '@data/interfaces';
import { GameManager } from './GameManager';
import { AchievementManager } from './AchievementManager';

const SAVE_KEY = 'pokemon-web-save';
const SAVE_VERSION = 2;

/** Serialize/deserialize game state to localStorage. */
export class SaveManager {
  private static instance: SaveManager;
  /** CRIT-2 / MED-21 / MED-22: Block saves during transitions, battles, and cutscenes. */
  private static blocked = false;

  private constructor() {}

  static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  static blockSaves(): void { SaveManager.blocked = true; }
  static unblockSaves(): void { SaveManager.blocked = false; }
  static canSave(): boolean { return !SaveManager.blocked; }

  save(): boolean {
    if (SaveManager.blocked) {
      console.warn('SaveManager: save blocked during transition');
      return false;
    }
    const gm = GameManager.getInstance();
    const am = AchievementManager.getInstance();
    const serialized = gm.serialize();
    const data = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      ...serialized,
      achievements: am.serialize(),
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      // MED-25: Surface save failure to callers
      console.error('SaveManager: save failed', e);
      return false;
    }
  }

  load(): SaveData | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      // Version migration
      // Note: migration intentionally drops unrecognized fields to prevent
      // stale data from corrupting the new schema.
      if (parsed.version === 1) {
        parsed.version = SAVE_VERSION;
        // v1 -> v2: add missing fields with defaults
        if (!parsed.gameStats) parsed.gameStats = undefined;
        if (!parsed.hallOfFame) parsed.hallOfFame = [];
        if (!parsed.visitedMaps) parsed.visitedMaps = [];
        if (!parsed.boxNames) parsed.boxNames = undefined;
        if (!parsed.achievements) parsed.achievements = [];
      }
      // MED-48: Ensure achievements is always a valid array of strings
      parsed.achievements = Array.isArray(parsed.achievements) ? parsed.achievements : [];
      return parsed as SaveData;
    } catch {
      return null;
    }
  }

  /** Load save and apply to GameManager + AchievementManager. */
  loadAndApply(): boolean {
    const data = this.load();
    if (!data) return false;
    const gm = GameManager.getInstance();
    gm.reset(); // Clear stale state before loading
    // AUDIT-001: Use deserialize() which handles the flat save format from serialize()
    gm.deserialize(data as unknown as ReturnType<typeof gm.serialize>);
    // Restore achievements
    if (data.achievements && Array.isArray(data.achievements)) {
      AchievementManager.getInstance().deserialize(data.achievements as string[]);
    }
    return true;
  }

  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  /**
   * Export the current save (or the live game state) as a pretty-printed JSON
   * string. The output is the same shape as what is persisted to localStorage,
   * suitable for re-importing via `importJson()`.
   */
  exportJson(): string {
    const gm = GameManager.getInstance();
    const am = AchievementManager.getInstance();
    const serialized = gm.serialize();
    const data = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      ...serialized,
      achievements: am.serialize(),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Validate and import a JSON save. On success, the parsed save is written
   * to localStorage and applied via `loadAndApply()`. Returns an error message
   * on failure, or null on success.
   */
  importJson(json: string): string | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      return 'Save file is not valid JSON.';
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return 'Save file is missing the top-level object.';
    }
    const data = parsed as Record<string, unknown>;
    // Minimum-viable shape check — required fields the deserializer touches.
    const required = ['playerName', 'party', 'badges', 'flags'];
    for (const key of required) {
      if (!(key in data)) {
        return `Save file is missing required field "${key}".`;
      }
    }
    if (typeof data.version === 'number' && data.version > SAVE_VERSION) {
      return `Save version ${data.version} is newer than this build (${SAVE_VERSION}).`;
    }
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(parsed));
    } catch {
      return 'Failed to write save to local storage (quota?).';
    }
    return this.loadAndApply() ? null : 'Imported save could not be applied.';
  }

  /**
   * Trigger a browser download of the exported save. No-op outside the DOM
   * (e.g. unit tests).
   */
  downloadJson(filename = `pokemon-aurum-save-${Date.now()}.json`): void {
    if (typeof document === 'undefined' || typeof URL === 'undefined') return;
    const blob = new Blob([this.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
