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
    root: path.resolve(__dirname),
    include: ['unit/**/*.test.ts', 'integration/**/*.test.ts', 'replay/**/*.test.ts'],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['../frontend/src/**/*.ts'],
      exclude: ['../frontend/src/scenes/**', '../frontend/src/main.ts'],
    },
  },
});
