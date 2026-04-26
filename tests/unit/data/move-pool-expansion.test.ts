import { describe, it, expect } from 'vitest';
import { moveData } from '../../../frontend/src/data/moves';

/**
 * A.4 Move pool expansion — verifies the new moves added during the
 * Tier-A pass exist with the expected shape and types.
 */
describe('Move pool expansion (A.4)', () => {
  const NEW_MOVES_BY_TYPE: Record<string, string[]> = {
    electric: ['wild-charge', 'electroweb', 'charge-beam', 'spark'],
    ghost: ['shadow-claw'],
    ice: ['icicle-crash', 'frost-breath'],
    rock: ['power-gem', 'head-smash', 'accelerock', 'rock-polish', 'ancient-power'],
    steel: ['flash-cannon'],
    bug: ['x-scissor', 'signal-beam', 'fury-cutter', 'lunge', 'megahorn'],
  };

  it.each(Object.entries(NEW_MOVES_BY_TYPE))(
    '%s moves are registered',
    (type, ids) => {
      for (const id of ids) {
        const m = moveData[id];
        expect(m, `move ${id} should be defined`).toBeDefined();
        expect(m!.id).toBe(id);
        expect(m!.type).toBe(type);
      }
    },
  );

  it('priority moves carry a priority field', () => {
    expect(moveData['accelerock']?.priority).toBeGreaterThan(0);
    expect(moveData['bullet-punch']?.priority).toBeGreaterThan(0);
  });

  it('high-recoil moves declare a recoil effect', () => {
    expect(moveData['head-smash']?.effect?.type).toBe('recoil');
    expect(moveData['wild-charge']?.effect?.type).toBe('recoil');
  });

  it('weather setters declare their target weather', () => {
    expect(moveData['hail']?.effect).toMatchObject({ type: 'weather', weather: 'hail' });
  });
});
