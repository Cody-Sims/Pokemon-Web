import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@scenes': path.resolve(__dirname, '../frontend/src/scenes'),
      '@entities': path.resolve(__dirname, '../frontend/src/entities'),
      '@data': path.resolve(__dirname, '../frontend/src/data'),
      '@battle': path.resolve(__dirname, '../frontend/src/battle'),
      '@managers': path.resolve(__dirname, '../frontend/src/managers'),
      '@systems': path.resolve(__dirname, '../frontend/src/systems'),
      '@ui': path.resolve(__dirname, '../frontend/src/ui'),
      '@utils': path.resolve(__dirname, '../frontend/src/utils'),
      '@config': path.resolve(__dirname, '../frontend/src/config'),
    },
  },
  test: {
    root: path.resolve(__dirname, '..'),
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts', 'tests/replay/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reportsDirectory: 'tests/coverage',
      include: ['frontend/src/**/*.ts'],
      exclude: ['frontend/src/main.ts'],
      thresholds: {
        statements: 11,
        branches: 10,
        functions: 15,
        lines: 11,
      },
    },
  },
});
