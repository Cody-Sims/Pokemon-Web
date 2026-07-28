import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameManager } from '../../../frontend/src/managers/GameManager';
import { SaveManager } from '../../../frontend/src/managers/SaveManager';
import { SaveData } from '../../../frontend/src/managers/save-types';
import { validateSaveData } from '../../../frontend/src/managers/SaveCodec';
import { createLocalStorageMock } from '../../mocks/local-storage-mock';
import { createPokemonFactory } from '../../helpers/pokemon-factory';

const SAVE_KEY = 'pokemon-web-save';
const CORRUPT_SAVE_KEY = `${SAVE_KEY}-corrupt`;


const makePokemon = createPokemonFactory('standard');

function parseRecord(raw: string | null): Record<string, unknown> {
  if (!raw) throw new Error('Expected saved JSON');
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Expected save object');
  }
  return parsed as Record<string, unknown>;
}

function writeValidSave(): Record<string, unknown> {
  const gm = GameManager.getInstance();
  gm.setPlayerName('Cody');
  gm.addToParty(makePokemon({ nickname: 'Blaze' }));
  gm.addItem('potion', 3);
  gm.addBadge('flame');
  gm.markSeen(4);
  gm.markCaught(4);
  gm.defeatTrainer('rival-1');

  const saved = SaveManager.getInstance().save();
  expect(saved).toBe(true);
  return parseRecord(localStorage.getItem(SAVE_KEY));
}

describe('SaveManager validation and corrupt-save handling', () => {
  beforeEach(() => {
    // @ts-expect-error reset singleton for tests
    GameManager.resetInstance();
    // @ts-expect-error reset singleton for tests
    SaveManager.resetInstance();
    vi.stubGlobal('localStorage', createLocalStorageMock());
  });

  it('returns null without an error when no save is present', () => {
    const sm = SaveManager.getInstance();

    expect(sm.load()).toBeNull();
    expect(sm.getLastError()).toBeNull();
  });

  it('backs up corrupt JSON and reports a typed parse error', () => {
    localStorage.setItem(SAVE_KEY, 'not-json');
    const sm = SaveManager.getInstance();

    expect(sm.load()).toBeNull();
    expect(localStorage.getItem(CORRUPT_SAVE_KEY)).toBe('not-json');
    expect(sm.getLastError()).toMatchObject({ type: 'json' });
  });

  it('rejects truncated saves with missing fields and keeps a corrupt backup', () => {
    const raw = JSON.stringify({ version: 2, timestamp: 1, playerName: 'Cody' });
    localStorage.setItem(SAVE_KEY, raw);
    const sm = SaveManager.getInstance();

    expect(sm.load()).toBeNull();
    expect(localStorage.getItem(CORRUPT_SAVE_KEY)).toBe(raw);
    expect(sm.getLastError()).toMatchObject({ type: 'validation' });
  });

  it('reports exact SaveCodec paths for missing and wrong-typed fields', () => {
    const save = writeValidSave();
    delete save.party;
    save.money = 'many';

    const result = validateSaveData(save);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: 'party', code: 'missing-field' }),
        expect.objectContaining({ path: 'money', code: 'wrong-type' }),
      ]));
    }
  });

  it('rejects wrong field types before deserialization can throw TypeError', () => {
    const save = writeValidSave();
    save.party = [{ ...makePokemon(), moves: 'ember' }];
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    const sm = SaveManager.getInstance();

    expect(sm.loadAndApply()).toBe(false);
    expect(sm.getLastError()).toMatchObject({ type: 'validation' });
  });

  it('rejects future versions on load', () => {
    const save = writeValidSave();
    save.version = 9999;
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    const sm = SaveManager.getInstance();

    expect(sm.load()).toBeNull();
    expect(sm.getLastError()).toMatchObject({ type: 'validation' });
  });

  it('migrates a valid v1 save before validation', () => {
    const save = writeValidSave();
    save.version = 1;
    delete save.achievements;
    delete save.hallOfFame;
    delete save.visitedMaps;
    delete save.boxNames;
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));

    const loaded = SaveManager.getInstance().load();

    expect(loaded).not.toBeNull();
    expect(loaded?.version).toBe(2);
    expect(loaded?.achievements).toEqual([]);
    expect(loaded?.hallOfFame).toEqual([]);
    expect(loaded?.visitedMaps).toEqual([]);
  });

  it('rejects over-budget saves before writing to localStorage', () => {
    const sm = SaveManager.getInstance();
    const previousRaw = JSON.stringify({ keep: 'existing-save' });
    localStorage.setItem(SAVE_KEY, previousRaw);

    const gm = GameManager.getInstance();
    gm.setFlag('x'.repeat(2_700_000), true);

    const setItemSpy = vi.spyOn(localStorage, 'setItem');
    setItemSpy.mockClear();

    expect(sm.save()).toBe(false);
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem(SAVE_KEY)).toBe(previousRaw);
    expect(sm.getLastError()).toMatchObject({ type: 'write' });
  });

  it('round-trips save to load without changing valid data', () => {
    const raw = writeValidSave();
    const loaded = SaveManager.getInstance().load() as SaveData | null;

    expect(loaded).toEqual(raw);
  });
});
