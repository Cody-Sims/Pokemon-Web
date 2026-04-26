import { describe, it, expect, beforeEach } from 'vitest';
import { GameManager } from '../../../frontend/src/managers/GameManager';
import {
  blockReasonForCatch,
  blockReasonForPartyAdd,
  blockReasonForItemUse,
} from '../../../frontend/src/systems/engine/ChallengeRules';
import { PokemonInstance } from '../../../frontend/src/data/interfaces';

const makePokemon = (dataId: number, overrides?: Partial<PokemonInstance>): PokemonInstance => ({
  dataId,
  level: 5,
  currentHp: 20,
  stats: { hp: 20, attack: 10, defense: 10, spAttack: 10, spDefense: 10, speed: 10 },
  ivs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy',
  moves: [{ moveId: 'tackle', currentPp: 35 }],
  status: null,
  exp: 0,
  friendship: 70,
  ...overrides,
});

describe('ChallengeRules', () => {
  beforeEach(() => {
    // @ts-expect-error reset singleton for isolation
    GameManager.instance = undefined;
  });

  describe('Solo Run', () => {
    it('allows the first Pokémon (the starter)', () => {
      const gm = GameManager.getInstance();
      gm.setChallengeModes(['soloRun']);
      expect(blockReasonForPartyAdd(makePokemon(4))).toBeNull();
    });

    it('blocks any later party additions', () => {
      const gm = GameManager.getInstance();
      gm.setChallengeModes(['soloRun']);
      gm.addToParty(makePokemon(4));
      const reason = blockReasonForPartyAdd(makePokemon(7));
      expect(reason).not.toBeNull();
      expect(reason!).toMatch(/Solo Run/);
    });
  });

  describe('Monotype', () => {
    it('allows same-type Pokémon when locked to fire', () => {
      const gm = GameManager.getInstance();
      gm.setChallengeModes(['monotype']);
      gm.setMonotypeLock('fire');
      // Charmander (4) is fire
      expect(blockReasonForPartyAdd(makePokemon(4))).toBeNull();
    });

    it('blocks off-type Pokémon when locked to fire', () => {
      const gm = GameManager.getInstance();
      gm.setChallengeModes(['monotype']);
      gm.setMonotypeLock('fire');
      // Squirtle (7) is water
      const reason = blockReasonForPartyAdd(makePokemon(7));
      expect(reason).not.toBeNull();
      expect(reason!).toMatch(/Monotype/i);
    });

    it('does nothing when no lock is set yet', () => {
      const gm = GameManager.getInstance();
      gm.setChallengeModes(['monotype']);
      expect(blockReasonForPartyAdd(makePokemon(7))).toBeNull();
    });
  });

  describe('Minimal Catches', () => {
    it('allows catches up to the limit', () => {
      const gm = GameManager.getInstance();
      gm.setChallengeModes(['minimalCatches']);
      // Stats start at 0 catches
      expect(blockReasonForCatch(makePokemon(4))).toBeNull();
    });

    it('blocks catch once the limit is reached', () => {
      const gm = GameManager.getInstance();
      gm.setChallengeModes(['minimalCatches']);
      // Bump the catch counter to 6 via the stats manager directly.
      const stats = gm.statsMgr.getGameStats();
      stats.totalCatches = 6;
      const reason = blockReasonForCatch(makePokemon(4));
      expect(reason).not.toBeNull();
      expect(reason!).toMatch(/Minimal Catches/);
    });
  });

  describe('No Items', () => {
    it('blocks item use on routes / cities', () => {
      const gm = GameManager.getInstance();
      gm.setChallengeModes(['noItems']);
      gm.setCurrentMap('route-1');
      expect(blockReasonForItemUse()).not.toBeNull();
    });

    it('allows item use inside Pokémon Centers', () => {
      const gm = GameManager.getInstance();
      gm.setChallengeModes(['noItems']);
      gm.setCurrentMap('cinderfall-pokecenter');
      expect(blockReasonForItemUse()).toBeNull();
    });

    it('does nothing when the rule is off', () => {
      const gm = GameManager.getInstance();
      gm.setCurrentMap('route-1');
      expect(blockReasonForItemUse()).toBeNull();
    });
  });

  describe('Persistence', () => {
    it('round-trips challenge modes + monotype lock through serialize/deserialize', () => {
      const gm = GameManager.getInstance();
      gm.setChallengeModes(['monotype', 'noItems']);
      gm.setMonotypeLock('water');
      const serialized = gm.serialize();
      // @ts-expect-error reset singleton
      GameManager.instance = undefined;
      const fresh = GameManager.getInstance();
      fresh.deserialize(serialized);
      expect(fresh.getChallengeModes().sort()).toEqual(['monotype', 'noItems'].sort());
      expect(fresh.getMonotypeLock()).toBe('water');
      expect(fresh.hasChallengeMode('monotype')).toBe(true);
      expect(fresh.hasChallengeMode('soloRun')).toBe(false);
    });
  });
});
