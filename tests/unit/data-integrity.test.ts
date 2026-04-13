import { describe, it, expect } from 'vitest';
import { pokemonData } from '../../frontend/src/data/pokemon';
import { moveData } from '../../frontend/src/data/moves';
import { itemData } from '../../frontend/src/data/item-data';
import { trainerData } from '../../frontend/src/data/trainer-data';
import { encounterTables } from '../../frontend/src/data/encounter-tables';
import { evolutionData } from '../../frontend/src/data/evolution-data';

describe('Data Integrity', () => {
  describe('pokemon-data', () => {
    it('all Pokemon have base stats > 0', () => {
      for (const [id, pokemon] of Object.entries(pokemonData)) {
        for (const [stat, value] of Object.entries(pokemon.baseStats)) {
          expect(value, `${pokemon.name}.baseStats.${stat}`).toBeGreaterThan(0);
        }
      }
    });

    it('all Pokemon have valid types', () => {
      const validTypes = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
      for (const [, pokemon] of Object.entries(pokemonData)) {
        for (const type of pokemon.types) {
          expect(validTypes, `${pokemon.name} has invalid type ${type}`).toContain(type);
        }
        expect(pokemon.types.length).toBeGreaterThanOrEqual(1);
        expect(pokemon.types.length).toBeLessThanOrEqual(2);
      }
    });

    it('all Pokemon learnset moves exist in move-data', () => {
      for (const [, pokemon] of Object.entries(pokemonData)) {
        for (const entry of pokemon.learnset) {
          expect(moveData[entry.moveId], `${pokemon.name} has invalid move ${entry.moveId}`).toBeDefined();
        }
      }
    });

    it('all Pokemon have positive catch rate', () => {
      for (const [, pokemon] of Object.entries(pokemonData)) {
        expect(pokemon.catchRate, `${pokemon.name} catchRate`).toBeGreaterThan(0);
      }
    });

    it('all Pokemon have positive exp yield', () => {
      for (const [, pokemon] of Object.entries(pokemonData)) {
        expect(pokemon.expYield, `${pokemon.name} expYield`).toBeGreaterThan(0);
      }
    });

    it('all Pokemon evolution targets exist in pokemon-data', () => {
      for (const [, pokemon] of Object.entries(pokemonData)) {
        for (const evo of pokemon.evolutionChain) {
          expect(pokemonData[evo.pokemonId], `${pokemon.name} evolves to invalid ID ${evo.pokemonId}`).toBeDefined();
        }
      }
    });

    it('all Pokemon have sprite keys', () => {
      for (const [, pokemon] of Object.entries(pokemonData)) {
        expect(pokemon.spriteKeys.front, `${pokemon.name} missing front sprite`).toBeTruthy();
        expect(pokemon.spriteKeys.back, `${pokemon.name} missing back sprite`).toBeTruthy();
        expect(pokemon.spriteKeys.icon, `${pokemon.name} missing icon sprite`).toBeTruthy();
      }
    });
  });

  describe('move-data', () => {
    it('all moves have valid types', () => {
      const validTypes = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
      for (const [, move] of Object.entries(moveData)) {
        expect(validTypes, `Move ${move.name} has invalid type ${move.type}`).toContain(move.type);
      }
    });

    it('all moves have PP > 0', () => {
      for (const [, move] of Object.entries(moveData)) {
        expect(move.pp, `Move ${move.name} PP`).toBeGreaterThan(0);
      }
    });

    it('status moves have null power', () => {
      for (const [, move] of Object.entries(moveData)) {
        if (move.category === 'status') {
          expect(move.power, `Status move ${move.name} should have null power`).toBeNull();
        }
      }
    });

    it('all moves have accuracy between 0 and 100', () => {
      for (const [, move] of Object.entries(moveData)) {
        expect(move.accuracy, `Move ${move.name} accuracy`).toBeGreaterThan(0);
        expect(move.accuracy, `Move ${move.name} accuracy`).toBeLessThanOrEqual(100);
      }
    });

    it('all moves have valid category', () => {
      for (const [, move] of Object.entries(moveData)) {
        expect(['physical', 'special', 'status'], `Move ${move.name} invalid category`).toContain(move.category);
      }
    });
  });

  describe('item-data', () => {
    it('all items have valid categories', () => {
      const validCategories = ['pokeball', 'medicine', 'battle', 'key', 'tm'];
      for (const [, item] of Object.entries(itemData)) {
        expect(validCategories, `Item ${item.name} has invalid category ${item.category}`).toContain(item.category);
      }
    });

    it('all items have a description', () => {
      for (const [, item] of Object.entries(itemData)) {
        expect(item.description, `Item ${item.name} has no description`).toBeTruthy();
      }
    });

    it('all items have an effect', () => {
      for (const [, item] of Object.entries(itemData)) {
        expect(item.effect, `Item ${item.name} has no effect`).toBeDefined();
      }
    });

    it('pokeballs have catch rate multiplier > 0', () => {
      for (const [, item] of Object.entries(itemData)) {
        if (item.category === 'pokeball') {
          expect(item.effect.catchRateMultiplier, `${item.name} missing catchRateMultiplier`).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('trainer-data', () => {
    it('all trainer party Pokemon exist in pokemon-data', () => {
      for (const [, trainer] of Object.entries(trainerData)) {
        for (const member of trainer.party) {
          expect(pokemonData[member.pokemonId], `Trainer ${trainer.name} has invalid Pokemon ID ${member.pokemonId}`).toBeDefined();
        }
      }
    });

    it('all trainer party moves exist in move-data', () => {
      for (const [, trainer] of Object.entries(trainerData)) {
        for (const member of trainer.party) {
          if (member.moves) {
            for (const moveId of member.moves) {
              expect(moveData[moveId], `Trainer ${trainer.name} Pokemon has invalid move ${moveId}`).toBeDefined();
            }
          }
        }
      }
    });

    it('all trainers have reward money >= 0', () => {
      for (const [, trainer] of Object.entries(trainerData)) {
        expect(trainer.rewardMoney, `Trainer ${trainer.name} rewardMoney`).toBeGreaterThanOrEqual(0);
      }
    });

    it('all trainers have dialogue', () => {
      for (const [, trainer] of Object.entries(trainerData)) {
        expect(trainer.dialogue.before.length, `Trainer ${trainer.name} missing before dialogue`).toBeGreaterThan(0);
        expect(trainer.dialogue.after.length, `Trainer ${trainer.name} missing after dialogue`).toBeGreaterThan(0);
      }
    });
  });

  describe('encounter-tables', () => {
    it('all encounter table Pokemon exist in pokemon-data', () => {
      for (const [route, entries] of Object.entries(encounterTables)) {
        for (const entry of entries) {
          expect(pokemonData[entry.pokemonId], `Route ${route} has invalid Pokemon ID ${entry.pokemonId}`).toBeDefined();
        }
      }
    });

    it('all encounter entries have valid level ranges', () => {
      for (const [route, entries] of Object.entries(encounterTables)) {
        for (const entry of entries) {
          expect(entry.levelRange[0], `Route ${route} min level`).toBeGreaterThan(0);
          expect(entry.levelRange[1], `Route ${route} max level`).toBeGreaterThanOrEqual(entry.levelRange[0]);
        }
      }
    });

    it('all encounter entries have positive weights', () => {
      for (const [route, entries] of Object.entries(encounterTables)) {
        for (const entry of entries) {
          expect(entry.weight, `Route ${route} weight`).toBeGreaterThan(0);
        }
      }
    });

    it('encounter weights sum to a reasonable total per route', () => {
      for (const [route, entries] of Object.entries(encounterTables)) {
        const total = entries.reduce((sum, e) => sum + e.weight, 0);
        expect(total, `Route ${route} total weight`).toBeGreaterThan(0);
      }
    });
  });

  describe('evolution-data', () => {
    it('all evolution targets exist in pokemon-data', () => {
      for (const [fromId, evos] of Object.entries(evolutionData)) {
        for (const evo of evos) {
          expect(pokemonData[evo.evolvesTo], `Pokemon ${fromId} evolves to invalid ID ${evo.evolvesTo}`).toBeDefined();
        }
      }
    });

    it('all evolution sources exist in pokemon-data', () => {
      for (const fromId of Object.keys(evolutionData)) {
        expect(pokemonData[Number(fromId)], `Evolution source ${fromId} not in pokemon-data`).toBeDefined();
      }
    });

    it('level-based evolutions have valid levels', () => {
      for (const [, evos] of Object.entries(evolutionData)) {
        for (const evo of evos) {
          if (evo.condition.type === 'level') {
            expect(evo.condition.level, `Evolution level`).toBeGreaterThan(0);
            expect(evo.condition.level, `Evolution level`).toBeLessThanOrEqual(100);
          }
        }
      }
    });
  });
});
