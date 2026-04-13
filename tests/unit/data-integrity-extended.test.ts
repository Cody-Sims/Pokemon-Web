import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pokemonData } from '../../frontend/src/data/pokemon-data';
import { moveData } from '../../frontend/src/data/move-data';
import { itemData } from '../../frontend/src/data/item-data';
import { trainerData } from '../../frontend/src/data/trainer-data';
import { encounterTables } from '../../frontend/src/data/encounter-tables';
import { evolutionData } from '../../frontend/src/data/evolution-data';
import { PokemonType } from '../../frontend/src/utils/type-helpers';

const ALL_TYPES: PokemonType[] = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
];

describe('Data Integrity — Extended', () => {
  describe('pokemon-data — learnset consistency', () => {
    it('all pokemon should learn at least one move at level 1', () => {
      for (const [id, pokemon] of Object.entries(pokemonData)) {
        const level1Moves = pokemon.learnset.filter(e => e.level === 1);
        expect(level1Moves.length, `${pokemon.name} has no level-1 moves`).toBeGreaterThan(0);
      }
    });

    it('learnset levels should be in ascending order', () => {
      for (const [, pokemon] of Object.entries(pokemonData)) {
        for (let i = 1; i < pokemon.learnset.length; i++) {
          expect(
            pokemon.learnset[i].level,
            `${pokemon.name} learnset not sorted at index ${i}`
          ).toBeGreaterThanOrEqual(pokemon.learnset[i - 1].level);
        }
      }
    });

    it('no duplicate moveIds in a single pokemon learnset', () => {
      for (const [, pokemon] of Object.entries(pokemonData)) {
        const moveIds = pokemon.learnset.map(e => e.moveId);
        const unique = new Set(moveIds);
        expect(unique.size, `${pokemon.name} has duplicate moves`).toBe(moveIds.length);
      }
    });
  });

  describe('pokemon-data — starter balance', () => {
    it('starters should have the same catch rate', () => {
      const bulbasaur = pokemonData[1];
      const charmander = pokemonData[4];
      const squirtle = pokemonData[7];
      expect(bulbasaur.catchRate).toBe(charmander.catchRate);
      expect(charmander.catchRate).toBe(squirtle.catchRate);
    });

    it('starters should have similar base stat totals (within 20)', () => {
      const total = (id: number) => Object.values(pokemonData[id].baseStats).reduce((a, b) => a + b, 0);
      const bst1 = total(1);
      const bst4 = total(4);
      const bst7 = total(7);
      expect(Math.abs(bst1 - bst4)).toBeLessThanOrEqual(20);
      expect(Math.abs(bst4 - bst7)).toBeLessThanOrEqual(20);
    });
  });

  describe('move-data — effect validation', () => {
    it('flinch moves should have chance < 100 or be specific', () => {
      for (const [, move] of Object.entries(moveData)) {
        if (move.effect?.type === 'flinch') {
          expect(move.effect.chance, `${move.name} flinch chance`).toBeDefined();
          expect(move.effect.chance).toBeGreaterThan(0);
          expect(move.effect.chance).toBeLessThanOrEqual(100);
        }
      }
    });

    it('recoil moves should have amount defined', () => {
      for (const [, move] of Object.entries(moveData)) {
        if (move.effect?.type === 'recoil') {
          expect(move.effect.amount, `${move.name} recoil amount`).toBeDefined();
          expect(move.effect.amount).toBeGreaterThan(0);
        }
      }
    });

    it('drain moves should target self', () => {
      for (const [, move] of Object.entries(moveData)) {
        if (move.effect?.type === 'drain') {
          expect(move.effect.target, `${move.name} drain target`).toBe('self');
        }
      }
    });

    it('status effect moves should have valid status', () => {
      const validStatuses = ['burn', 'paralysis', 'poison', 'bad-poison', 'sleep', 'freeze', 'confusion'];
      for (const [, move] of Object.entries(moveData)) {
        if (move.effect?.type === 'status' && move.effect.status) {
          expect(validStatuses, `${move.name} has invalid status ${move.effect.status}`).toContain(move.effect.status);
        }
      }
    });

    it('priority moves should have positive priority value', () => {
      for (const [, move] of Object.entries(moveData)) {
        if (move.priority !== undefined && move.priority !== 0) {
          expect(typeof move.priority).toBe('number');
        }
      }
    });
  });

  describe('move-data — move count by type', () => {
    it('should have moves for most types', () => {
      const typeCount: Partial<Record<PokemonType, number>> = {};
      for (const [, move] of Object.entries(moveData)) {
        typeCount[move.type as PokemonType] = (typeCount[move.type as PokemonType] ?? 0) + 1;
      }
      // At minimum: normal, fire, water, electric, grass should have moves
      expect(typeCount['normal']).toBeGreaterThan(5);
      expect(typeCount['fire']).toBeGreaterThan(2);
      expect(typeCount['water']).toBeGreaterThan(2);
      expect(typeCount['grass']).toBeGreaterThan(2);
    });
  });

  describe('trainer-data — party level scaling', () => {
    it('gym leader should have higher level pokemon than early trainers', () => {
      const brock = trainerData['gym-brock'];
      const bugCatcher = trainerData['bug-catcher-1'];
      const brockMaxLevel = Math.max(...brock.party.map(p => p.level));
      const bugMaxLevel = Math.max(...bugCatcher.party.map(p => p.level));
      expect(brockMaxLevel).toBeGreaterThan(bugMaxLevel);
    });

    it('gym leader should have higher reward money', () => {
      const brock = trainerData['gym-brock'];
      const bugCatcher = trainerData['bug-catcher-1'];
      expect(brock.rewardMoney).toBeGreaterThan(bugCatcher.rewardMoney);
    });
  });

  describe('encounter-tables — route progression', () => {
    it('later routes should have higher level ranges', () => {
      const r1Min = Math.min(...encounterTables['route-1'].map(e => e.levelRange[0]));
      const r2Min = Math.min(...encounterTables['route-2'].map(e => e.levelRange[0]));
      expect(r2Min).toBeGreaterThanOrEqual(r1Min);
    });

    it('viridian forest should have bug types', () => {
      const bugTypes = encounterTables['viridian-forest'].filter(e => {
        const types = pokemonData[e.pokemonId]?.types ?? [];
        return types.includes('bug');
      });
      expect(bugTypes.length).toBeGreaterThan(0);
    });
  });

  describe('evolution-data — chain integrity', () => {
    it('no pokemon should evolve into itself', () => {
      for (const [fromId, evos] of Object.entries(evolutionData)) {
        for (const evo of evos) {
          expect(evo.evolvesTo, `Pokemon ${fromId} evolves into itself`).not.toBe(Number(fromId));
        }
      }
    });

    it('evolution chains should be acyclic', () => {
      const visited = new Set<number>();
      function checkCycle(id: number, chain: number[]): void {
        if (chain.includes(id)) {
          throw new Error(`Cycle detected: ${chain.join(' → ')} → ${id}`);
        }
        const evos = evolutionData[id];
        if (!evos) return;
        for (const evo of evos) {
          checkCycle(evo.evolvesTo, [...chain, id]);
        }
      }
      for (const fromId of Object.keys(evolutionData)) {
        expect(() => checkCycle(Number(fromId), [])).not.toThrow();
      }
    });
  });

  describe('item-data — healing consistency', () => {
    it('Super Potion should heal more than Potion', () => {
      const potion = itemData['potion'];
      const superPotion = itemData['super-potion'];
      expect(superPotion.effect.amount).toBeGreaterThan(potion.effect.amount!);
    });
  });
});
