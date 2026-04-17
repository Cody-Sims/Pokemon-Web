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
    target: 'es2020',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/phaser')) return 'phaser';
          if (id.includes('/src/battle/')) return 'battle';
          if (id.includes('/src/data/pokemon/') || id.includes('/src/data/moves/') || id.includes('/src/data/type-chart')) return 'data';
          if (id.includes('/src/data/maps/')) return 'maps';
        },
      },
    },
  },
  server: {
    port: 3020,
  },
});
