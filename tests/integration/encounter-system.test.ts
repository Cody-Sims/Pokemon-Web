import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EncounterSystem } from '../../frontend/src/systems/overworld/EncounterSystem';
import { PokemonInstance } from '../../frontend/src/data/interfaces';
import { pokemonData } from '../../frontend/src/data/pokemon';
import { encounterTables } from '../../frontend/src/data/encounter-tables';

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.01); // Always trigger encounters
});

describe('EncounterSystem', () => {
  describe('checkEncounter', () => {
    it('should return null for non-encounter zones', () => {
      const es = new EncounterSystem();
      const result = es.checkEncounter('nonexistent-route');
      expect(result).toBeNull();
    });

    it('should trigger encounter when random is below encounter rate', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.01); // < 0.1 encounter rate
      const es = new EncounterSystem();
      const result = es.checkEncounter('route-1');
      expect(result).not.toBeNull();
    });

    it('should not trigger encounter when random is above encounter rate', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99); // > 0.1 encounter rate
      const es = new EncounterSystem();
      const result = es.checkEncounter('route-1');
      expect(result).toBeNull();
    });

    it('should return a valid pokemon from the route table', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.01);
      const es = new EncounterSystem();
      const pokemon = es.checkEncounter('route-1');

      expect(pokemon).not.toBeNull();
      const validIds = encounterTables['route-1'].map(e => e.pokemonId);
      expect(validIds).toContain(pokemon!.dataId);
    });

    it('encountered pokemon should have correct level range', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.01);
      const es = new EncounterSystem();
      const pokemon = es.checkEncounter('route-1');
      expect(pokemon).not.toBeNull();

      const entry = encounterTables['route-1'].find(e => e.pokemonId === pokemon!.dataId);
      expect(entry).toBeDefined();
      expect(pokemon!.level).toBeGreaterThanOrEqual(entry!.levelRange[0]);
      expect(pokemon!.level).toBeLessThanOrEqual(entry!.levelRange[1]);
    });

    it('should suppress encounters during repel', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.01); // Would normally trigger
      const es = new EncounterSystem();
      es.useRepel(5);

      for (let i = 0; i < 5; i++) {
        expect(es.checkEncounter('route-1')).toBeNull();
      }
      // After repel wears off, encounter should trigger
      const result = es.checkEncounter('route-1');
      expect(result).not.toBeNull();
    });
  });

  describe('createWildPokemon', () => {
    it('should create valid PokemonInstance', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const pokemon = EncounterSystem.createWildPokemon(4, 10);

      expect(pokemon.dataId).toBe(4);
      expect(pokemon.level).toBe(10);
      expect(pokemon.currentHp).toBe(pokemon.stats.hp);
      expect(pokemon.moves.length).toBeGreaterThan(0);
      expect(pokemon.moves.length).toBeLessThanOrEqual(4);
      expect(pokemon.status).toBeNull();
    });

    it('should generate IVs between 0 and 31', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const pokemon = EncounterSystem.createWildPokemon(4, 10);

      for (const stat of Object.values(pokemon.ivs)) {
        expect(stat).toBeGreaterThanOrEqual(0);
        expect(stat).toBeLessThanOrEqual(31);
      }
    });

    it('should have moves from learnset at or below level', () => {
      const pokemon = EncounterSystem.createWildPokemon(4, 10);
      const data = pokemonData[4];

      for (const move of pokemon.moves) {
        const learnEntry = data.learnset.find(e => e.moveId === move.moveId);
        expect(learnEntry, `Move ${move.moveId} not in learnset`).toBeDefined();
        expect(learnEntry!.level).toBeLessThanOrEqual(10);
      }
    });

    it('should have at most 4 moves', () => {
      // Level 50 Charmander would know many moves, but should cap at 4
      const pokemon = EncounterSystem.createWildPokemon(4, 50);
      expect(pokemon.moves.length).toBeLessThanOrEqual(4);
    });

    it('should throw for invalid pokemon ID', () => {
      expect(() => EncounterSystem.createWildPokemon(99999, 10)).toThrow();
    });

    it('should set all EVs to 0', () => {
      const pokemon = EncounterSystem.createWildPokemon(4, 10);
      for (const stat of Object.values(pokemon.evs)) {
        expect(stat).toBe(0);
      }
    });

    it('should have stats > 0', () => {
      const pokemon = EncounterSystem.createWildPokemon(4, 10);
      for (const stat of Object.values(pokemon.stats)) {
        expect(stat).toBeGreaterThan(0);
      }
    });
  });
});
