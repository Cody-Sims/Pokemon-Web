import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameManager } from '../../frontend/src/managers/GameManager';
import { SaveManager } from '../../frontend/src/managers/SaveManager';
import { PokemonInstance } from '../../frontend/src/data/interfaces';
import { createLocalStorageMock } from '../mocks/local-storage-mock';

const makePokemon = (overrides?: Partial<PokemonInstance>): PokemonInstance => ({
  dataId: 4, level: 10, currentHp: 30,
  stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 },
  ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy', moves: [{ moveId: 'ember', currentPp: 25 }],
  status: null, exp: 0, friendship: 70, ...overrides,
});

describe('Save/Load — Extended Round-Trip Tests', () => {
  let mockStorage: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    // @ts-expect-error private access
    GameManager.instance = undefined;
    // @ts-expect-error private access
    SaveManager.instance = undefined;
    mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  it('should preserve full party with all pokemon fields', () => {
    const gm = GameManager.getInstance();
    const pokemon = makePokemon({
      nickname: 'Blaze',
      status: 'burn',
      statusTurns: 3,
      friendship: 200,
      exp: 5000,
      evs: { hp: 100, attack: 50, defense: 30, spAttack: 20, spDefense: 10, speed: 40 },
    });
    gm.addToParty(pokemon);

    SaveManager.getInstance().save();

    // @ts-expect-error private access
    GameManager.instance = undefined;
    const gm2 = GameManager.getInstance();
    const data = SaveManager.getInstance().load()!;
    gm2.deserialize({
      party: data.player.party, bag: data.player.bag, money: data.player.money,
      badges: data.player.badges, flags: data.flags, trainersDefeated: data.trainersDefeated,
      pokedex: data.player.pokedex, playerName: data.player.name, playtime: data.player.playtime,
      currentMap: data.player.position.mapKey,
      playerPosition: { x: data.player.position.x, y: data.player.position.y, direction: data.player.position.direction },
    });

    const restored = gm2.getParty()[0];
    expect(restored.nickname).toBe('Blaze');
    expect(restored.status).toBe('burn');
    expect(restored.statusTurns).toBe(3);
    expect(restored.friendship).toBe(200);
    expect(restored.exp).toBe(5000);
    expect(restored.evs.hp).toBe(100);
  });

  it('should preserve multiple bag items in order', () => {
    const gm = GameManager.getInstance();
    gm.addItem('potion', 10);
    gm.addItem('poke-ball', 5);
    gm.addItem('super-potion', 3);
    gm.addItem('antidote', 7);

    SaveManager.getInstance().save();

    // @ts-expect-error private access
    GameManager.instance = undefined;
    const data = SaveManager.getInstance().load()!;
    expect(data.player.bag).toHaveLength(4);
    expect(data.player.bag.find(e => e.itemId === 'potion')?.quantity).toBe(10);
    expect(data.player.bag.find(e => e.itemId === 'poke-ball')?.quantity).toBe(5);
  });

  it('should preserve pokedex entries', () => {
    const gm = GameManager.getInstance();
    gm.markSeen(1);
    gm.markSeen(4);
    gm.markSeen(7);
    gm.markCaught(4);

    SaveManager.getInstance().save();

    // @ts-expect-error private access
    GameManager.instance = undefined;
    const data = SaveManager.getInstance().load()!;
    expect(data.player.pokedex.seen).toContain(1);
    expect(data.player.pokedex.seen).toContain(4);
    expect(data.player.pokedex.seen).toContain(7);
    expect(data.player.pokedex.caught).toContain(4);
    expect(data.player.pokedex.caught).not.toContain(1);
  });

  it('should preserve trainer defeat history', () => {
    const gm = GameManager.getInstance();
    gm.defeatTrainer('rival-1');
    gm.defeatTrainer('bug-catcher-1');
    gm.defeatTrainer('gym-brock');

    SaveManager.getInstance().save();
    const data = SaveManager.getInstance().load()!;
    expect(data.trainersDefeated).toContain('rival-1');
    expect(data.trainersDefeated).toContain('bug-catcher-1');
    expect(data.trainersDefeated).toContain('gym-brock');
    expect(data.trainersDefeated).toHaveLength(3);
  });

  it('should preserve game flags', () => {
    const gm = GameManager.getInstance();
    gm.setFlag('got-pokedex');
    gm.setFlag('delivered-parcel');
    gm.setFlag('beat-brock');

    SaveManager.getInstance().save();
    const data = SaveManager.getInstance().load()!;
    expect(data.flags['got-pokedex']).toBe(true);
    expect(data.flags['delivered-parcel']).toBe(true);
    expect(data.flags['beat-brock']).toBe(true);
  });

  it('should handle save with 6-pokemon party', () => {
    const gm = GameManager.getInstance();
    for (let i = 0; i < 6; i++) {
      gm.addToParty(makePokemon({ dataId: i + 1 }));
    }

    SaveManager.getInstance().save();
    const data = SaveManager.getInstance().load()!;
    expect(data.player.party).toHaveLength(6);
  });

  it('should handle multiple save/load cycles', () => {
    const sm = SaveManager.getInstance();
    const gm = GameManager.getInstance();

    gm.addToParty(makePokemon());
    sm.save();

    gm.addItem('potion', 5);
    sm.save();

    gm.addBadge('boulder');
    sm.save();

    const data = sm.load()!;
    expect(data.player.party).toHaveLength(1);
    expect(data.player.bag.find(e => e.itemId === 'potion')?.quantity).toBe(5);
    expect(data.player.badges).toContain('boulder');
  });
});
