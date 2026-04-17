import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SaveManager } from '../../../frontend/src/managers/SaveManager';
import { GameManager } from '../../../frontend/src/managers/GameManager';
import { PokemonInstance } from '../../../frontend/src/data/interfaces';
import { createLocalStorageMock } from '../../mocks/local-storage-mock';

const makePokemon = (overrides?: Partial<PokemonInstance>): PokemonInstance => ({
  dataId: 4,
  level: 10,
  currentHp: 30,
  stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 },
  ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy',
  moves: [{ moveId: 'ember', currentPp: 25 }],
  status: null,
  exp: 0,
  friendship: 70,
  ...overrides,
});

describe('SaveManager', () => {
  let mockStorage: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    // Reset singletons
    // @ts-expect-error private access for test
    GameManager.instance = undefined;
    // @ts-expect-error private access for test
    SaveManager.instance = undefined;

    mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should report no save initially', () => {
    const sm = SaveManager.getInstance();
    expect(sm.hasSave()).toBe(false);
  });

  it('should save and detect save exists', () => {
    const gm = GameManager.getInstance();
    gm.addToParty(makePokemon());

    const sm = SaveManager.getInstance();
    sm.save();
    expect(sm.hasSave()).toBe(true);
  });

  it('should save and load data correctly', () => {
    const gm = GameManager.getInstance();
    gm.setPlayerName('Red');
    gm.addToParty(makePokemon());
    gm.addItem('potion', 3);
    gm.addBadge('boulder');
    gm.addMoney(500);
    gm.setFlag('got-pokedex');
    gm.defeatTrainer('rival-1');

    const sm = SaveManager.getInstance();
    sm.save();

    const loaded = sm.load();
    expect(loaded).not.toBeNull();
    expect(loaded!.playerName).toBe('Red');
    expect(loaded!.party).toHaveLength(1);
    expect(loaded!.bag).toEqual([{ itemId: 'potion', quantity: 3 }]);
    expect(loaded!.badges).toContain('boulder');
    expect(loaded!.money).toBe(3500);
    expect(loaded!.flags['got-pokedex']).toBe(true);
    expect(loaded!.trainersDefeated).toContain('rival-1');
  });

  it('should delete save', () => {
    const gm = GameManager.getInstance();
    gm.addToParty(makePokemon());

    const sm = SaveManager.getInstance();
    sm.save();
    expect(sm.hasSave()).toBe(true);

    sm.deleteSave();
    expect(sm.hasSave()).toBe(false);
    expect(sm.load()).toBeNull();
  });

  it('should handle corrupted save data gracefully', () => {
    mockStorage.setItem('pokemon-web-save', 'not-json');
    const sm = SaveManager.getInstance();
    expect(sm.load()).toBeNull();
  });

  it('should include version and timestamp', () => {
    const gm = GameManager.getInstance();
    const sm = SaveManager.getInstance();
    sm.save();

    const loaded = sm.load();
    expect(loaded!.version).toBeDefined();
    expect(loaded!.timestamp).toBeDefined();
    expect(loaded!.timestamp).toBeGreaterThan(0);
  });

  it('should perform full round-trip: save → clear → load → restore', () => {
    const gm = GameManager.getInstance();
    gm.setPlayerName('Ash');
    gm.addToParty(makePokemon({ dataId: 1 }));
    gm.addToParty(makePokemon({ dataId: 4 }));
    gm.addItem('potion', 5);
    gm.addItem('poke-ball', 10);
    gm.addMoney(1000);
    gm.addBadge('boulder');
    gm.markCaught(1);
    gm.markCaught(4);
    gm.defeatTrainer('rival-1');
    gm.setCurrentMap('route-1');

    const sm = SaveManager.getInstance();
    sm.save();

    // Reset GameManager
    // @ts-expect-error private
    GameManager.instance = undefined;
    const gm2 = GameManager.getInstance();

    // Load and restore
    const data = sm.load()!;
    gm2.deserialize(data as any);

    expect(gm2.getPlayerName()).toBe('Ash');
    expect(gm2.getParty()).toHaveLength(2);
    expect(gm2.getItemCount('potion')).toBe(5);
    expect(gm2.getItemCount('poke-ball')).toBe(10);
    expect(gm2.getMoney()).toBe(4000);
    expect(gm2.getBadges()).toContain('boulder');
    expect(gm2.getPokedex().caught).toContain(1);
    expect(gm2.getPokedex().caught).toContain(4);
    expect(gm2.isTrainerDefeated('rival-1')).toBe(true);
    expect(gm2.getCurrentMap()).toBe('route-1');
  });
});
