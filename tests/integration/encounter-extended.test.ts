import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EncounterSystem } from '../../frontend/src/systems/EncounterSystem';
import { encounterTables } from '../../frontend/src/data/encounter-tables';
import { pokemonData } from '../../frontend/src/data/pokemon';
import { moveData } from '../../frontend/src/data/moves';
import { ExperienceCalculator } from '../../frontend/src/battle/ExperienceCalculator';

describe('EncounterSystem — Extended', () => {
  describe('createWildPokemon — all registered species', () => {
    const allIds = Object.keys(pokemonData).map(Number);

    it.each(allIds)('should create valid instance for pokemon #%d', (id) => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const pokemon = EncounterSystem.createWildPokemon(id, 10);

      expect(pokemon.dataId).toBe(id);
      expect(pokemon.level).toBe(10);
      expect(pokemon.currentHp).toBe(pokemon.stats.hp);
      expect(pokemon.status).toBeNull();
      expect(pokemon.moves.length).toBeGreaterThan(0);
      expect(pokemon.moves.length).toBeLessThanOrEqual(4);

      // All stats should be positive
      for (const [stat, val] of Object.entries(pokemon.stats)) {
        expect(val, `${pokemonData[id].name}.stats.${stat}`).toBeGreaterThan(0);
      }

      // All IVs should be valid
      for (const [stat, val] of Object.entries(pokemon.ivs)) {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(31);
      }

      // All EVs should be zero for wild pokemon
      for (const val of Object.values(pokemon.evs)) {
        expect(val).toBe(0);
      }

      // Moves should be valid
      for (const move of pokemon.moves) {
        expect(moveData[move.moveId], `Move ${move.moveId} not found`).toBeDefined();
        expect(move.currentPp).toBeGreaterThan(0);
      }
    });
  });

  describe('createWildPokemon — different levels', () => {
    it('level 1 pokemon should have minimal stats', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const low = EncounterSystem.createWildPokemon(4, 1);
      const high = EncounterSystem.createWildPokemon(4, 50);
      expect(high.stats.hp).toBeGreaterThan(low.stats.hp);
      expect(high.stats.attack).toBeGreaterThan(low.stats.attack);
    });

    it('higher level pokemon should know more moves (up to 4)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const low = EncounterSystem.createWildPokemon(4, 1);
      const high = EncounterSystem.createWildPokemon(4, 50);
      expect(high.moves.length).toBeGreaterThanOrEqual(low.moves.length);
    });

    it('should set EXP to expForLevel(level)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const pokemon = EncounterSystem.createWildPokemon(4, 10);
      expect(pokemon.exp).toBe(ExperienceCalculator.expForLevel(10));
    });
  });

  describe('checkEncounter — all routes', () => {
    const routes = Object.keys(encounterTables);

    it.each(routes)('route %s should return valid encounters', (route) => {
      vi.spyOn(Math, 'random').mockReturnValue(0.01); // Force encounter
      const es = new EncounterSystem();
      const pokemon = es.checkEncounter(route);

      expect(pokemon).not.toBeNull();
      expect(pokemonData[pokemon!.dataId]).toBeDefined();

      const entry = encounterTables[route].find(e => e.pokemonId === pokemon!.dataId);
      expect(entry).toBeDefined();
      expect(pokemon!.level).toBeGreaterThanOrEqual(entry!.levelRange[0]);
      expect(pokemon!.level).toBeLessThanOrEqual(entry!.levelRange[1]);
    });
  });

  describe('repel system', () => {
    it('should suppress encounters for exact number of steps', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.01);
      const es = new EncounterSystem();
      es.useRepel(3);

      expect(es.checkEncounter('route-1')).toBeNull(); // Step 1
      expect(es.checkEncounter('route-1')).toBeNull(); // Step 2
      expect(es.checkEncounter('route-1')).toBeNull(); // Step 3
      expect(es.checkEncounter('route-1')).not.toBeNull(); // Step 4: repel worn off
    });

    it('should allow overwriting repel with new one', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.01);
      const es = new EncounterSystem();
      es.useRepel(2);
      es.checkEncounter('route-1'); // Use 1 step
      es.useRepel(3); // New repel
      es.checkEncounter('route-1'); // Step 1
      es.checkEncounter('route-1'); // Step 2
      es.checkEncounter('route-1'); // Step 3
      expect(es.checkEncounter('route-1')).not.toBeNull(); // Repel worn off
    });
  });

  describe('weighted distribution', () => {
    it('should favor higher-weight pokemon over many encounters', () => {
      const counts: Record<number, number> = {};
      const n = 1000;

      for (let i = 0; i < n; i++) {
        // Use a true random-ish value to test distribution
        vi.spyOn(Math, 'random').mockReturnValue(Math.sin(i) * 0.5 + 0.5);
        const es = new EncounterSystem();
        const pokemon = es.checkEncounter('route-1');
        if (pokemon) {
          counts[pokemon.dataId] = (counts[pokemon.dataId] ?? 0) + 1;
        }
      }

      // Route 1: Pidgey(40), Rattata(40), Pikachu(20)
      // Pikachu should appear less often
      if (counts[25] && counts[16]) {
        expect(counts[16]).toBeGreaterThan(counts[25]);
      }
    });
  });
});
