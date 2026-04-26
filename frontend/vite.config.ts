import { defineConfig } from 'vite';
import path from 'path';
import swManifestPlugin from './plugins/vite-plugin-sw-manifest.js';

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
        codeSplitting: {
          groups: [
            { name: 'phaser', test: /node_modules\/phaser/ },
            { name: 'battle', test: /\/src\/battle\// },
            { name: 'data', test: /\/src\/data\/pokemon\/|\/src\/data\/moves\/|\/src\/data\/type-chart/ },
            { name: 'maps', test: /\/src\/data\/maps\// },
          ],
        },
      },
    },
  },
  plugins: [
    swManifestPlugin({ basePath: '/Pokemon-Web/' }),
  ],
  server: {
    port: 3020,
  },
});
