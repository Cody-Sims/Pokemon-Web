import type { SaveData } from './save-types';
import { GameManager } from './GameManager';
import { AchievementManager } from './AchievementManager';
import { mapRegistry } from '@data/maps';
import {
  CURRENT_SAVE_VERSION,
  SaveDataDeserializationError,
  type SaveValidationError,
  formatSaveValidationErrors,
  validateSaveData,
} from './SaveCodec';

const SAVE_KEY = 'pokemon-web-save';
const SAVE_VERSION = CURRENT_SAVE_VERSION;
const CORRUPT_SAVE_KEY = `${SAVE_KEY}-corrupt`;
const LOCAL_STORAGE_SAVE_BUDGET_BYTES = 5 * 1024 * 1024;
type SerializedGameState = ReturnType<GameManager['serialize']>;

export type SaveManagerError =
  | { type: 'json'; message: string }
  | { type: 'validation'; message: string; errors: SaveValidationError[] }
  | { type: 'write'; message: string }
  | { type: 'apply'; message: string };

/** Serialize/deserialize game state to localStorage. */
export class SaveManager {
  private static instance: SaveManager | undefined;
  /** CRIT-2 / MED-21 / MED-22: Block saves during transitions, battles, and cutscenes. */
  private static blocked = false;
  private lastError: SaveManagerError | null = null;

  private constructor() {}

  static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  static resetInstance(): void {
    SaveManager.instance = undefined;
    SaveManager.blocked = false;
  }

  static blockSaves(): void { SaveManager.blocked = true; }
  static unblockSaves(): void { SaveManager.blocked = false; }
  static canSave(): boolean { return !SaveManager.blocked; }
  getLastError(): SaveManagerError | null { return this.lastError; }

  private static measureStorageUsageBytes(serialized: string): number {
    return serialized.length * 2;
  }

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
      const serializedSave = JSON.stringify(data);
      const storageUsageBytes = SaveManager.measureStorageUsageBytes(serializedSave);
      if (storageUsageBytes > LOCAL_STORAGE_SAVE_BUDGET_BYTES) {
        this.lastError = {
          type: 'write',
          message: `Save data exceeds local storage budget (${storageUsageBytes}/${LOCAL_STORAGE_SAVE_BUDGET_BYTES} bytes).`,
        };
        return false;
      }
      localStorage.setItem(SAVE_KEY, serializedSave);
      this.lastError = null;
      return true;
    } catch (error) {
      // MED-25: Surface save failure to callers
      const message = error instanceof Error ? error.message : 'Save data could not be written.';
      this.lastError = { type: 'write', message };
      console.error('SaveManager: save failed', error);
      return false;
    }
  }

  load(): SaveData | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      const validated = validateSaveData(parsed);
      if (!validated.ok) {
        const message = formatSaveValidationErrors(validated.errors);
        this.lastError = { type: 'validation', message, errors: validated.errors };
        this.backupCorruptSave(raw);
        return null;
      }
      this.lastError = null;
      return validated.data;
    } catch {
      this.lastError = { type: 'json', message: 'Save file is not valid JSON.' };
      this.backupCorruptSave(raw);
      return null;
    }
  }

  /** Load save and apply to GameManager + AchievementManager. */
  loadAndApply(): boolean {
    const data = this.load();
    if (!data) return false;
    try {
      const gm = GameManager.getInstance();
      gm.reset(); // Clear stale state before loading
      const normalizedData = this.normalizeLoadedSave(data, gm.serialize());
      gm.deserialize(normalizedData);
      const achievements = AchievementManager.getInstance();
      achievements.reset();
      if (Array.isArray(normalizedData.achievements)) {
        achievements.deserialize(normalizedData.achievements.filter(item => typeof item === 'string'));
      }
      this.lastError = null;
      return true;
    } catch (error) {
      const message = error instanceof SaveDataDeserializationError
        ? error.message
        : 'Save data could not be applied.';
      this.lastError = { type: 'apply', message };
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) this.backupCorruptSave(raw);
      return false;
    }
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
      this.lastError = { type: 'json', message: 'Save file is not valid JSON.' };
      return 'Save file is not valid JSON.';
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      this.lastError = { type: 'json', message: 'Save file is missing the top-level object.' };
      return 'Save file is missing the top-level object.';
    }
    const validated = validateSaveData(parsed);
    if (!validated.ok) {
      const message = formatSaveValidationErrors(validated.errors);
      this.lastError = { type: 'validation', message, errors: validated.errors };
      return message;
    }
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(validated.data));
    } catch {
      return 'Failed to write save to local storage (quota?).';
    }
    return this.loadAndApply() ? null : 'Imported save could not be applied.';
  }

  private normalizeLoadedSave(data: SaveData, defaults: SerializedGameState): SerializedGameState & SaveData {
    const fallbackMap = 'pallet-town';
    const hasRegisteredMap = Object.prototype.hasOwnProperty.call(mapRegistry, data.currentMap);
    const fallbackSpawn = mapRegistry[fallbackMap].spawnPoints.default;
    const currentMap = hasRegisteredMap ? data.currentMap : fallbackMap;
    const playerPosition = hasRegisteredMap
      ? data.playerPosition
      : { x: fallbackSpawn.x, y: fallbackSpawn.y, direction: fallbackSpawn.direction };

    if (!hasRegisteredMap) {
      console.warn(`SaveManager: save referenced unavailable map "${data.currentMap}", falling back to ${fallbackMap}.`);
    }

    return {
      ...defaults,
      ...data,
      currentMap,
      playerPosition,
      gameStats: { ...defaults.gameStats, ...(data.gameStats ?? {}) },
      stepCount: data.stepCount ?? defaults.stepCount,
      boxes: data.boxes ?? defaults.boxes,
      boxNames: data.boxNames ?? defaults.boxNames,
      visitedMaps: data.visitedMaps ?? defaults.visitedMaps,
      hallOfFame: data.hallOfFame ?? defaults.hallOfFame,
    } as SerializedGameState & SaveData;
  }

  private backupCorruptSave(raw: string): void {
    try {
      localStorage.setItem(CORRUPT_SAVE_KEY, raw);
    } catch {
      // Keep the original save untouched even if backup storage is unavailable.
    }
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
