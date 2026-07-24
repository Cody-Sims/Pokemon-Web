import type { PokemonInstance } from '../models/pokemon';
import type { SaveData } from './save-types';

export const CURRENT_SAVE_VERSION = 2;

export type SaveValidationCode =
  | 'not-object'
  | 'missing-field'
  | 'wrong-type'
  | 'future-version';

export interface SaveValidationError {
  path: string;
  message: string;
  code: SaveValidationCode;
}

export type SaveValidationResult =
  | { ok: true; data: SaveData }
  | { ok: false; errors: SaveValidationError[] };

export class SaveDataDeserializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SaveDataDeserializationError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(item => typeof item === 'number' && Number.isFinite(item));
}

function isBooleanRecord(value: unknown): value is Record<string, boolean> {
  return isRecord(value) && Object.values(value).every(item => typeof item === 'boolean');
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every(item => typeof item === 'number' && Number.isFinite(item));
}

function isPrimitiveSettings(value: unknown): value is Record<string, string | number | boolean> {
  return isRecord(value) && Object.values(value).every(item => {
    const type = typeof item;
    return type === 'string' || type === 'number' || type === 'boolean';
  });
}

function isUnknownArrayRecord(value: unknown): value is Record<string, unknown[]> {
  return isRecord(value) && Object.values(value).every(item => Array.isArray(item));
}

function isBag(value: unknown): value is SaveData['bag'] {
  return Array.isArray(value) && value.every(item => (
    isRecord(item)
    && typeof item.itemId === 'string'
    && typeof item.quantity === 'number'
    && Number.isFinite(item.quantity)
  ));
}

function isPlayerPosition(value: unknown): value is SaveData['playerPosition'] {
  return isRecord(value)
    && typeof value.x === 'number'
    && Number.isFinite(value.x)
    && typeof value.y === 'number'
    && Number.isFinite(value.y)
    && typeof value.direction === 'string';
}

function isStats(value: unknown): value is PokemonInstance['stats'] {
  if (!isRecord(value)) return false;
  const keys: (keyof PokemonInstance['stats'])[] = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed'];
  return keys.every(key => typeof value[key] === 'number' && Number.isFinite(value[key]));
}

function isMoveInstance(value: unknown): value is PokemonInstance['moves'][number] {
  return isRecord(value)
    && typeof value.moveId === 'string'
    && typeof value.currentPp === 'number'
    && Number.isFinite(value.currentPp);
}

export function isPokemonInstance(value: unknown): value is PokemonInstance {
  return isRecord(value)
    && typeof value.dataId === 'number'
    && Number.isFinite(value.dataId)
    && typeof value.level === 'number'
    && Number.isFinite(value.level)
    && typeof value.currentHp === 'number'
    && Number.isFinite(value.currentHp)
    && isStats(value.stats)
    && isStats(value.ivs)
    && isStats(value.evs)
    && typeof value.nature === 'string'
    && Array.isArray(value.moves)
    && value.moves.every(isMoveInstance)
    && (typeof value.status === 'string' || value.status === null)
    && typeof value.exp === 'number'
    && Number.isFinite(value.exp)
    && typeof value.friendship === 'number'
    && Number.isFinite(value.friendship);
}

function isPokemonArray(value: unknown): value is PokemonInstance[] {
  return Array.isArray(value) && value.every(isPokemonInstance);
}

function isPokemonBoxes(value: unknown): value is PokemonInstance[][] {
  return Array.isArray(value) && value.every(isPokemonArray);
}

function addRequired(
  errors: SaveValidationError[],
  data: Record<string, unknown>,
  path: string,
  guard: (value: unknown) => boolean,
  expected: string,
): void {
  if (!(path in data)) {
    errors.push({ path, code: 'missing-field', message: `Save file is missing required field "${path}".` });
    return;
  }
  if (!guard(data[path])) {
    errors.push({ path, code: 'wrong-type', message: `Save field "${path}" must be ${expected}.` });
  }
}

function addOptional(
  errors: SaveValidationError[],
  data: Record<string, unknown>,
  path: string,
  guard: (value: unknown) => boolean,
  expected: string,
): void {
  if (data[path] === undefined) return;
  if (!guard(data[path])) {
    errors.push({ path, code: 'wrong-type', message: `Save field "${path}" must be ${expected}.` });
  }
}

function migrateSaveData(data: Record<string, unknown>): Record<string, unknown> {
  const migrated: Record<string, unknown> = { ...data };
  if (migrated.version === 1) {
    migrated.version = CURRENT_SAVE_VERSION;
    if (!('gameStats' in migrated)) migrated.gameStats = undefined;
    if (!('hallOfFame' in migrated)) migrated.hallOfFame = [];
    if (!('visitedMaps' in migrated)) migrated.visitedMaps = [];
    if (!('boxNames' in migrated)) migrated.boxNames = undefined;
    if (!('achievements' in migrated)) migrated.achievements = [];
  }
  migrated.achievements = Array.isArray(migrated.achievements) ? migrated.achievements : [];
  return migrated;
}

export function validateSaveData(raw: unknown): SaveValidationResult {
  if (!isRecord(raw)) {
    return { ok: false, errors: [{ path: '', code: 'not-object', message: 'Save file is missing the top-level object.' }] };
  }

  if (typeof raw.version === 'number' && raw.version > CURRENT_SAVE_VERSION) {
    return {
      ok: false,
      errors: [{
        path: 'version',
        code: 'future-version',
        message: `Save version ${raw.version} is newer than this build (${CURRENT_SAVE_VERSION}).`,
      }],
    };
  }

  const data = migrateSaveData(raw);
  const errors: SaveValidationError[] = [];
  const finiteNumber = (value: unknown): boolean => typeof value === 'number' && Number.isFinite(value);
  const stringValue = (value: unknown): boolean => typeof value === 'string';

  addRequired(errors, data, 'version', finiteNumber, 'a number');
  addRequired(errors, data, 'timestamp', finiteNumber, 'a number');
  addRequired(errors, data, 'party', isPokemonArray, 'an array of Pokémon');
  addRequired(errors, data, 'badges', isStringArray, 'an array of strings');
  addRequired(errors, data, 'flags', isBooleanRecord, 'a boolean record');
  addRequired(errors, data, 'trainersDefeated', isStringArray, 'an array of strings');
  addRequired(errors, data, 'pokedex', value => (
    isRecord(value) && isNumberArray(value.seen) && isNumberArray(value.caught)
  ), 'a Pokédex object');
  addRequired(errors, data, 'playerName', stringValue, 'a string');
  addRequired(errors, data, 'currentMap', stringValue, 'a string');
  addRequired(errors, data, 'playerPosition', isPlayerPosition, 'a player position');
  addRequired(errors, data, 'bag', isBag, 'an item stack array');
  addRequired(errors, data, 'money', finiteNumber, 'a number');
  addRequired(errors, data, 'playtime', finiteNumber, 'a number');

  addOptional(errors, data, 'boxes', isPokemonBoxes, 'an array of Pokémon boxes');
  addOptional(errors, data, 'boxNames', isStringArray, 'an array of strings');
  addOptional(errors, data, 'nuzlockeEncountered', isStringArray, 'an array of strings');
  addOptional(errors, data, 'visitedMaps', isStringArray, 'an array of strings');
  addOptional(errors, data, 'hallOfFame', Array.isArray, 'an array');
  addOptional(errors, data, 'playerGender', value => value === 'boy' || value === 'girl', '"boy" or "girl"');
  addOptional(errors, data, 'trainerId', stringValue, 'a string');
  addOptional(errors, data, 'difficulty', stringValue, 'a string');
  addOptional(errors, data, 'challengeModes', isStringArray, 'an array of strings');
  addOptional(errors, data, 'monotypeLock', value => typeof value === 'string' || value === null, 'a string or null');
  addOptional(errors, data, 'settings', isPrimitiveSettings, 'a primitive settings record');
  addOptional(errors, data, 'berryPlots', isUnknownArrayRecord, 'an array record');
  addOptional(errors, data, 'berryHarvests', isNumberRecord, 'a number record');
  addOptional(errors, data, 'repelSteps', finiteNumber, 'a number');
  addOptional(errors, data, 'battlePoints', finiteNumber, 'a number');
  addOptional(errors, data, 'towerBestStreak', isNumberRecord, 'a number record');
  addOptional(errors, data, 'towerClears', isNumberRecord, 'a number record');
  addOptional(errors, data, 'gameClockMinutes', finiteNumber, 'a number');
  addOptional(errors, data, 'speedrunSplits', Array.isArray, 'an array');
  addOptional(errors, data, 'gameStats', isNumberRecord, 'a number record');
  addOptional(errors, data, 'stepCount', finiteNumber, 'a number');

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, data: data as unknown as SaveData };
}

export function formatSaveValidationErrors(errors: readonly SaveValidationError[]): string {
  return errors.map(error => error.message).join(' ');
}
