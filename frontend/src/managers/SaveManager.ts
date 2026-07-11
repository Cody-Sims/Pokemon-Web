import { GameManager } from './GameManager';
import { AchievementManager } from './AchievementManager';

const SAVE_KEY = 'pokemon-web-save';
const SAVE_VERSION = 2;
type SerializedGameState = ReturnType<GameManager['serialize']>;
type PersistedSave = SerializedGameState & {
  version: number;
  timestamp: number;
  achievements: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(item => typeof item === 'number' && Number.isFinite(item));
}

function isValidMove(value: unknown): boolean {
  return isRecord(value) &&
    typeof value.moveId === 'string' &&
    typeof value.currentPp === 'number' &&
    Number.isInteger(value.currentPp) &&
    value.currentPp >= 0;
}

function isValidPokemon(value: unknown): boolean {
  return isRecord(value) &&
    typeof value.dataId === 'number' &&
    Number.isInteger(value.dataId) &&
    value.dataId > 0 &&
    Array.isArray(value.moves) &&
    value.moves.every(isValidMove);
}

function getSaveValidationError(data: Record<string, unknown>): string | null {
  const required = [
    'version', 'playerName', 'party', 'badges', 'flags', 'trainersDefeated',
    'pokedex', 'currentMap', 'playerPosition', 'bag', 'money', 'playtime',
  ];
  for (const key of required) {
    if (!(key in data)) return `Save file is missing required field "${key}".`;
  }

  const pokedex = data.pokedex;
  const position = data.playerPosition;
  const validParty = Array.isArray(data.party) && data.party.every(isValidPokemon);
  const validBag = Array.isArray(data.bag) && data.bag.every(item =>
    isRecord(item) && typeof item.itemId === 'string' &&
    typeof item.quantity === 'number' && Number.isInteger(item.quantity) && item.quantity >= 0
  );
  const validFlags = isRecord(data.flags) &&
    Object.values(data.flags).every(value => typeof value === 'boolean');
  const validPokedex = isRecord(pokedex) &&
    isNumberArray(pokedex.seen) && isNumberArray(pokedex.caught);
  const validPosition = isRecord(position) &&
    typeof position.x === 'number' && Number.isFinite(position.x) &&
    typeof position.y === 'number' && Number.isFinite(position.y) &&
    typeof position.direction === 'string';

  const checks: [string, boolean][] = [
    ['version', typeof data.version === 'number' && Number.isInteger(data.version)],
    ['playerName', typeof data.playerName === 'string'],
    ['party', validParty],
    ['badges', isStringArray(data.badges)],
    ['flags', validFlags],
    ['trainersDefeated', isStringArray(data.trainersDefeated)],
    ['pokedex', validPokedex],
    ['currentMap', typeof data.currentMap === 'string'],
    ['playerPosition', validPosition],
    ['bag', validBag],
    ['money', typeof data.money === 'number' && Number.isFinite(data.money)],
    ['playtime', typeof data.playtime === 'number' && Number.isFinite(data.playtime)],
    ['achievements', data.achievements === undefined || isStringArray(data.achievements)],
  ];
  const invalid = checks.find(([, valid]) => !valid);
  return invalid ? `Save file field "${invalid[0]}" has an invalid value.` : null;
}

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

  load(): PersistedSave | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!isRecord(parsed)) return null;
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
      if (parsed.achievements === undefined) parsed.achievements = [];
      if (getSaveValidationError(parsed)) return null;
      return parsed as PersistedSave;
    } catch {
      return null;
    }
  }

  /** Load save and apply to GameManager + AchievementManager. */
  loadAndApply(): boolean {
    const data = this.load();
    if (!data) return false;
    return this.applyTransaction(data);
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
    if (typeof data.version === 'number' && data.version > SAVE_VERSION) {
      return `Save version ${data.version} is newer than this build (${SAVE_VERSION}).`;
    }
    if (data.achievements === undefined) data.achievements = [];
    const validationError = getSaveValidationError(data);
    if (validationError) return validationError;
    const imported = data as PersistedSave;
    const previous = this.createPersistedSave();
    if (!this.applyTransaction(imported)) {
      return 'Imported save could not be applied.';
    }
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(imported));
    } catch {
      this.applyTransaction(previous);
      return 'Failed to write save to local storage (quota?).';
    }
    return null;
  }

  private createPersistedSave(): PersistedSave {
    return {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      ...GameManager.getInstance().serialize(),
      achievements: AchievementManager.getInstance().serialize(),
    };
  }

  private applyTransaction(data: PersistedSave): boolean {
    const previous = this.createPersistedSave();
    const apply = (save: PersistedSave): void => {
      const gm = GameManager.getInstance();
      gm.reset();
      gm.deserialize(save);
      AchievementManager.getInstance().deserialize(save.achievements);
    };
    try {
      apply(data);
      return true;
    } catch {
      apply(previous);
      return false;
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
