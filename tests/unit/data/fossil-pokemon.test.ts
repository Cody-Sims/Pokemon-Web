import { describe, it, expect } from 'vitest';
import { pokemonData } from '../../../frontend/src/data/pokemon';
import { itemData } from '../../../frontend/src/data/item-data';
import { crystalCavernDepths } from '../../../frontend/src/data/maps/dungeons/crystal-cavern-depths';
import { emberMines } from '../../../frontend/src/data/maps/dungeons/ember-mines';
import { pewterMuseum } from '../../../frontend/src/data/maps/interiors/pewter-museum';

/**
 * A.3 Fossil Pokémon (#154 Lithoclaw, #155 Aerolith) — verifies species,
 * the matching key items, dungeon spawn placements, and the museum NPC
 * wiring all line up.
 */
describe('Fossil Pokémon (A.3)', () => {
  describe('species data', () => {
    it('Lithoclaw (#154) is a Rock/Water fossil with valid stats', () => {
      const p = pokemonData[154];
      expect(p).toBeDefined();
      expect(p!.name).toBe('Lithoclaw');
      expect(p!.types).toEqual(['rock', 'water']);
      for (const v of Object.values(p!.baseStats)) {
        expect(v).toBeGreaterThan(0);
      }
      expect(p!.catchRate).toBeGreaterThan(0);
      expect(p!.expYield).toBeGreaterThan(0);
    });

    it('Aerolith (#155) is a Rock/Flying fossil with valid stats', () => {
      const p = pokemonData[155];
      expect(p).toBeDefined();
      expect(p!.name).toBe('Aerolith');
      expect(p!.types).toEqual(['rock', 'flying']);
      for (const v of Object.values(p!.baseStats)) {
        expect(v).toBeGreaterThan(0);
      }
    });

    it('both fossil Pokémon have non-empty learnsets', () => {
      expect(pokemonData[154]!.learnset.length).toBeGreaterThan(0);
      expect(pokemonData[155]!.learnset.length).toBeGreaterThan(0);
    });
  });

  describe('fossil items', () => {
    it('Claw Fossil exists as a key item', () => {
      const item = itemData['claw-fossil'];
      expect(item).toBeDefined();
      expect(item!.category).toBe('key');
      expect(item!.name).toBe('Claw Fossil');
    });

    it('Wing Fossil exists as a key item', () => {
      const item = itemData['wing-fossil'];
      expect(item).toBeDefined();
      expect(item!.category).toBe('key');
      expect(item!.name).toBe('Wing Fossil');
    });
  });

  describe('dungeon placement', () => {
    it('Crystal Cavern Depths drops a Claw Fossil item ball', () => {
      const obj = crystalCavernDepths.objects.find(o => o.givesItem === 'claw-fossil');
      expect(obj, 'expected a Claw Fossil item-ball in Crystal Cavern Depths').toBeDefined();
      expect(obj!.objectType).toBe('item-ball');
      expect(obj!.setsFlag).toBeTruthy();
      expect(obj!.requireFlag).toMatch(/^!/);
    });

    it('Ember Mines drops a Wing Fossil item ball', () => {
      const obj = emberMines.objects.find(o => o.givesItem === 'wing-fossil');
      expect(obj, 'expected a Wing Fossil item-ball in Ember Mines').toBeDefined();
      expect(obj!.objectType).toBe('item-ball');
      expect(obj!.setsFlag).toBeTruthy();
    });
  });

  describe('museum revival NPC', () => {
    it('Pewter Museum has a fossil-revival NPC gated behind Brock', () => {
      const npc = pewterMuseum.npcs.find(n => n.id === 'museum-fossil-revival');
      expect(npc, 'museum-fossil-revival NPC missing').toBeDefined();
      expect(npc!.interactionType).toBe('fossil-revival');
      expect(npc!.requireFlag).toBe('defeatedBrock');
    });
  });
});
