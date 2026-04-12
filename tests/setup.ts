import { vi } from 'vitest';

// Seed Math.random for deterministic tests
beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

afterEach(() => {
  vi.restoreAllMocks();
});
