import { describe, it, expect } from 'vitest';
import { evolutionData } from '../../../frontend/src/data/evolution-data';
import { pokemonData } from '../../../frontend/src/data/pokemon';

describe('Evolution data sync between evolutionData and pokemonData', () => {
  describe('Forward sync: evolutionData entries exist in pokemonData.evolutionChain', () => {
    const evoEntries = Object.entries(evolutionData).map(
      ([id, evos]) => [Number(id), evos] as const
    );

    it.each(evoEntries)(
      'pokemonData[%i] should have matching evolutionChain entries',
      (id, evolutions) => {
        const pokemon = pokemonData[id];
        expect(pokemon, `pokemonData[${id}] does not exist`).toBeDefined();
        expect(
          pokemon.evolutionChain.length,
          `pokemonData[${id}] (${pokemon.name}) evolutionChain length mismatch`
        ).toBe(evolutions.length);

        for (const evo of evolutions) {
          const match = pokemon.evolutionChain.find(
            (chain) => chain.pokemonId === evo.evolvesTo
          );
          expect(
            match,
            `pokemonData[${id}] (${pokemon.name}) missing evolutionChain entry for target ${evo.evolvesTo}`
          ).toBeDefined();
        }
      }
    );
  });

  describe('Reverse sync: pokemonData.evolutionChain entries exist in evolutionData', () => {
    const pokemonWithEvolutions = Object.entries(pokemonData)
      .filter(([, data]) => data.evolutionChain.length > 0)
      .map(([id, data]) => [Number(id), data] as const);

    it.each(pokemonWithEvolutions)(
      'evolutionData[%i] should exist for pokemon with non-empty evolutionChain',
      (id, pokemon) => {
        const evos = evolutionData[id];
        expect(
          evos,
          `evolutionData[${id}] missing but pokemonData[${id}] (${pokemon.name}) has evolutionChain entries`
        ).toBeDefined();
        expect(
          evos.length,
          `evolutionData[${id}] length mismatch with pokemonData[${id}] (${pokemon.name}) evolutionChain`
        ).toBe(pokemon.evolutionChain.length);
      }
    );
  });

  describe('Target existence: every evolvesTo target exists in pokemonData', () => {
    const allTargets: [number, number][] = [];
    for (const [id, evos] of Object.entries(evolutionData)) {
      for (const evo of evos) {
        allTargets.push([Number(id), evo.evolvesTo]);
      }
    }

    it.each(allTargets)(
      'evolutionData[%i].evolvesTo(%i) should exist in pokemonData',
      (sourceId, targetId) => {
        const target = pokemonData[targetId];
        expect(
          target,
          `pokemonData[${targetId}] does not exist (referenced as evolvesTo from evolutionData[${sourceId}])`
        ).toBeDefined();
      }
    );
  });

  describe('Condition agreement: conditions match between both data sources', () => {
    const conditionPairs: { sourceId: number; targetId: number; evoCondition: any; chainCondition: any }[] = [];
    for (const [id, evos] of Object.entries(evolutionData)) {
      const numId = Number(id);
      const pokemon = pokemonData[numId];
      if (!pokemon) continue;
      for (const evo of evos) {
        const chainEntry = pokemon.evolutionChain.find(
          (c) => c.pokemonId === evo.evolvesTo
        );
        if (chainEntry) {
          conditionPairs.push({
            sourceId: numId,
            targetId: evo.evolvesTo,
            evoCondition: evo.condition,
            chainCondition: chainEntry.condition,
          });
        }
      }
    }

    it.each(conditionPairs)(
      'condition type should match for $sourceId -> $targetId',
      ({ sourceId, targetId, evoCondition, chainCondition }) => {
        expect(
          chainCondition.type,
          `Condition type mismatch for ${sourceId} -> ${targetId}: evolutionData has "${evoCondition.type}", pokemonData has "${chainCondition.type}"`
        ).toBe(evoCondition.type);
      }
    );

    it.each(conditionPairs)(
      'condition level should match for $sourceId -> $targetId',
      ({ sourceId, targetId, evoCondition, chainCondition }) => {
        expect(
          chainCondition.level,
          `Condition level mismatch for ${sourceId} -> ${targetId}: evolutionData has ${evoCondition.level}, pokemonData has ${chainCondition.level}`
        ).toBe(evoCondition.level);
      }
    );

    it.each(conditionPairs)(
      'condition itemId should match for $sourceId -> $targetId',
      ({ sourceId, targetId, evoCondition, chainCondition }) => {
        expect(
          chainCondition.itemId,
          `Condition itemId mismatch for ${sourceId} -> ${targetId}: evolutionData has "${evoCondition.itemId}", pokemonData has "${chainCondition.itemId}"`
        ).toBe(evoCondition.itemId);
      }
    );
  });
});
