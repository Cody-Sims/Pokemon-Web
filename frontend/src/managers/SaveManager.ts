import { SaveData } from '@data/interfaces';
import { GameManager } from './GameManager';
import { AchievementManager } from './AchievementManager';

const SAVE_KEY = 'pokemon-web-save';
const SAVE_VERSION = 2;

/** Serialize/deserialize game state to localStorage. */
export class SaveManager {
  private static instance: SaveManager;

  private constructor() {}

  static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  save(): void {
    const gm = GameManager.getInstance();
    const am = AchievementManager.getInstance();
    const serialized = gm.serialize();
    const data = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      ...serialized,
      achievements: am.serialize(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  load(): SaveData | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      // Version migration
      if (parsed.version === 1) {
        parsed.version = SAVE_VERSION;
        // v1 -> v2: add missing fields with defaults
        if (!parsed.gameStats) parsed.gameStats = undefined;
        if (!parsed.hallOfFame) parsed.hallOfFame = [];
        if (!parsed.visitedMaps) parsed.visitedMaps = [];
        if (!parsed.boxNames) parsed.boxNames = undefined;
        if (!parsed.achievements) parsed.achievements = [];
      }
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
    gm.loadFromSave(data);
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
}
