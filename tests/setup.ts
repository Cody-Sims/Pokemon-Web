import { vi } from 'vitest';
import { seedRng } from '../frontend/src/utils/math-helpers';

// Seed the game PRNG and Math.random for deterministic tests
beforeEach(() => {
  seedRng(12345);
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

afterEach(() => {
  vi.restoreAllMocks();
});
