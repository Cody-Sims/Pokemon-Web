import { describe, it, expect } from 'vitest';
import { EncounterSystem } from '../../../frontend/src/systems/overworld/EncounterSystem';

function sequenceRng(values: number[]): () => number {
  let index = 0;
  return () => {
    const value = values[index];
    index++;
    return value ?? 0.5;
  };
}

describe('EncounterSystem RNG injection', () => {
  it('uses the injected RNG for trigger, table, level, IV, nature, and shiny rolls', () => {
    const rolls = [
      0.01, // trigger
      0.99, // weighted table selection
      0.25, // level
      0.1, 0.2, 0.3, 0.4, 0.5, 0.6, // IVs
      0.7, // nature
      0.8, // shiny
    ];
    const first = new EncounterSystem();
    const second = new EncounterSystem();
    first.setRng(sequenceRng([...rolls]));
    second.setRng(sequenceRng([...rolls]));

    expect(first.checkEncounter('route-1')).toEqual(second.checkEncounter('route-1'));
  });

  it('keeps static wild creation deterministic when supplied a RNG', () => {
    const rolls = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];

    expect(EncounterSystem.createWildPokemon(4, 10, sequenceRng([...rolls]))).toEqual(
      EncounterSystem.createWildPokemon(4, 10, sequenceRng([...rolls])),
    );
  });
});
