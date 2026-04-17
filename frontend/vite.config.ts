import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname),
  base: '/Pokemon-Web/',
  resolve: {
    alias: {
      '@scenes': path.resolve(__dirname, 'src/scenes'),
      '@entities': path.resolve(__dirname, 'src/entities'),
      '@data': path.resolve(__dirname, 'src/data'),
      '@battle': path.resolve(__dirname, 'src/battle'),
      '@managers': path.resolve(__dirname, 'src/managers'),
      '@systems': path.resolve(__dirname, 'src/systems'),
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@config': path.resolve(__dirname, 'src/config'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '..', 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
          battle: [
            './src/battle/index.ts',
          ],
        },
      },
    },
  },
  server: {
    port: 3020,
  },
});
