import { describe, it, expect } from 'vitest';
import { TILE_SIZE, WALK_DURATION, MAX_PARTY_SIZE, MAX_MOVES, CRIT_CHANCE, STAB_MULTIPLIER, CRIT_MULTIPLIER, RANDOM_MIN, RANDOM_MAX, BASE_ENCOUNTER_RATE, TRAINER_EXP_MULTIPLIER, GAME_WIDTH, GAME_HEIGHT } from '../../../frontend/src/utils/constants';

describe('Game Constants', () => {
  describe('tile and movement', () => {
    it('TILE_SIZE should be positive', () => {
      expect(TILE_SIZE).toBeGreaterThan(0);
    });

    it('WALK_DURATION should be positive ms', () => {
      expect(WALK_DURATION).toBeGreaterThan(0);
    });

    it('MAX_PARTY_SIZE should be 6', () => {
      expect(MAX_PARTY_SIZE).toBe(6);
    });

    it('MAX_MOVES should be 4', () => {
      expect(MAX_MOVES).toBe(4);
    });
  });

  describe('battle constants', () => {
    it('CRIT_CHANCE should be between 0 and 1', () => {
      expect(CRIT_CHANCE).toBeGreaterThan(0);
      expect(CRIT_CHANCE).toBeLessThan(1);
    });

    it('STAB_MULTIPLIER should be 1.5', () => {
      expect(STAB_MULTIPLIER).toBe(1.5);
    });

    it('CRIT_MULTIPLIER should be 1.5', () => {
      expect(CRIT_MULTIPLIER).toBe(1.5);
    });

    it('RANDOM_MIN and RANDOM_MAX should define a valid range', () => {
      expect(RANDOM_MIN).toBeGreaterThan(0);
      expect(RANDOM_MAX).toBeLessThanOrEqual(1);
      expect(RANDOM_MAX).toBeGreaterThan(RANDOM_MIN);
    });
  });

  describe('encounter and EXP', () => {
    it('BASE_ENCOUNTER_RATE should be between 0 and 1', () => {
      expect(BASE_ENCOUNTER_RATE).toBeGreaterThan(0);
      expect(BASE_ENCOUNTER_RATE).toBeLessThanOrEqual(1);
    });

    it('TRAINER_EXP_MULTIPLIER should be > 1', () => {
      expect(TRAINER_EXP_MULTIPLIER).toBeGreaterThan(1);
    });
  });

  describe('game dimensions', () => {
    it('GAME_WIDTH should be positive', () => {
      expect(GAME_WIDTH).toBeGreaterThan(0);
    });

    it('GAME_HEIGHT should be positive', () => {
      expect(GAME_HEIGHT).toBeGreaterThan(0);
    });
  });
});
