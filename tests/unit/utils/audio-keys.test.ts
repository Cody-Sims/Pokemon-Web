import { describe, it, expect } from 'vitest';
import { BGM, SFX, MAP_BGM } from '../../../frontend/src/utils/audio-keys';

describe('Audio Keys', () => {
  describe('BGM constants', () => {
    it('all BGM keys should be non-empty strings', () => {
      for (const [name, key] of Object.entries(BGM)) {
        expect(typeof key).toBe('string');
        expect(key.length, `BGM.${name} is empty`).toBeGreaterThan(0);
      }
    });

    it('all BGM keys should be unique', () => {
      const values = Object.values(BGM);
      expect(new Set(values).size).toBe(values.length);
    });

    it('should have expected BGM tracks', () => {
      expect(BGM.TITLE).toBeDefined();
      expect(BGM.BATTLE_WILD).toBeDefined();
      expect(BGM.BATTLE_TRAINER).toBeDefined();
      expect(BGM.VICTORY).toBeDefined();
    });
  });

  describe('SFX constants', () => {
    it('all SFX keys should be non-empty strings', () => {
      for (const [name, key] of Object.entries(SFX)) {
        expect(typeof key).toBe('string');
        expect(key.length, `SFX.${name} is empty`).toBeGreaterThan(0);
      }
    });

    it('all SFX keys should be unique', () => {
      const values = Object.values(SFX);
      expect(new Set(values).size).toBe(values.length);
    });

    it('should have battle SFX keys', () => {
      expect(SFX.HIT_NORMAL).toBeDefined();
      expect(SFX.HIT_SUPER).toBeDefined();
      expect(SFX.HIT_WEAK).toBeDefined();
      expect(SFX.FAINT).toBeDefined();
    });

    it('should have menu SFX keys', () => {
      expect(SFX.CURSOR).toBeDefined();
      expect(SFX.CONFIRM).toBeDefined();
      expect(SFX.CANCEL).toBeDefined();
    });
  });

  describe('MAP_BGM', () => {
    it('should map known locations to BGM keys', () => {
      expect(MAP_BGM['pallet-town']).toBe(BGM.PALLET_TOWN);
      expect(MAP_BGM['route-1']).toBe(BGM.ROUTE);
    });

    it('all MAP_BGM values should reference valid BGM keys', () => {
      const bgmValues = new Set(Object.values(BGM));
      for (const [map, bgm] of Object.entries(MAP_BGM)) {
        expect(bgmValues.has(bgm as any), `${map} references invalid BGM ${bgm}`).toBe(true);
      }
    });
  });
});
