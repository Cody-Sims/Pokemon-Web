import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameManager } from '../../../frontend/src/managers/GameManager';
import { getTrainerData } from '../../../frontend/src/systems/engine/TrainerResolver';
import { createLocalStorageMock } from '../../mocks/local-storage-mock';

describe('TrainerResolver', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
    GameManager.getInstance().reset();
  });

  it.each([
    ['starterChoice_1', 4, 5, 6],
    ['starterChoice_4', 7, 8, 9],
    ['starterChoice_7', 1, 2, 3],
  ] as const)('resolves Kael starter line for %s', (flag, base, middle, final) => {
    const gm = GameManager.getInstance();
    gm.setFlag(flag);

    expect(getTrainerData('rival-1')?.party[0].pokemonId).toBe(base);
    expect(getTrainerData('rival-2')?.party[0].pokemonId).toBe(middle);
    expect(getTrainerData('rival-6')?.party[0].pokemonId).toBe(final);
  });

  it('keeps default Charmander line fallback when no starter flag is set', () => {
    expect(getTrainerData('rival-1')?.party[0].pokemonId).toBe(4);
    expect(getTrainerData('rival-2')?.party[0].pokemonId).toBe(5);
    expect(getTrainerData('rival-5')?.party[0].pokemonId).toBe(6);
  });

  it('does not mutate static trainer data between starter choices', () => {
    const gm = GameManager.getInstance();
    gm.setFlag('starterChoice_4');
    expect(getTrainerData('rival-1')?.party[0].pokemonId).toBe(7);

    gm.reset();
    gm.setFlag('starterChoice_7');
    expect(getTrainerData('rival-1')?.party[0].pokemonId).toBe(1);
  });
});
