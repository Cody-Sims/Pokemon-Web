// Vite plugin: injects a precache manifest into sw.js after build
// Scans the dist output for all critical assets and replaces the
// __PRECACHE_MANIFEST__ placeholder in the service worker.
import fs from 'fs';
import path from 'path';

/**
 * Recursively list files in a directory, returning paths relative to `root`.
 */
function walkDir(dir, root) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walkDir(full, root));
    } else {
      results.push(path.relative(root, full));
    }
  }
  return results;
}

/** File extensions worth precaching (JS, CSS, HTML — the app shell) */
const PRECACHE_EXTENSIONS = new Set([
  '.html', '.js', '.css', '.json', '.webmanifest',
]);

/** Extensions that are runtime-cached (too large / numerous to precache) */
const RUNTIME_CACHE_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
  '.mp3', '.ogg', '.wav', '.m4a',
  '.woff', '.woff2', '.ttf', '.eot',
]);

/**
 * @param {{ basePath?: string }} options
 * @returns {import('vite').Plugin}
 */
export default function swManifestPlugin(options = {}) {
  const basePath = options.basePath || '/Pokemon-Web/';
  let resolvedOutDir = '';

  return {
    name: 'sw-precache-manifest',
    apply: 'build',

    // Capture the resolved output directory from Vite config
    configResolved(config) {
      resolvedOutDir = config.build.outDir;
    },

    closeBundle() {
      const outDir = resolvedOutDir || path.resolve('dist');
      const swPath = path.join(outDir, 'sw.js');

      if (!fs.existsSync(swPath)) {
        console.warn('[sw-manifest] sw.js not found in output — skipping manifest injection');
        return;
      }

      // Gather all files from dist
      const allFiles = walkDir(outDir, outDir);

      // Split into precache (critical, small) and runtime-only lists
      const precacheUrls = [];
      const runtimeHints = [];

      for (const file of allFiles) {
        // Skip source maps and the SW itself
        if (file.endsWith('.map') || file === 'sw.js') continue;

        const ext = path.extname(file).toLowerCase();
        const url = basePath + file.replace(/\\/g, '/');

        if (PRECACHE_EXTENSIONS.has(ext)) {
          // Skip overly large JSON files (map data, pokemon data) — runtime cache those
          const stat = fs.statSync(path.join(outDir, file));
          if (ext === '.json' && stat.size > 256 * 1024) {
            runtimeHints.push(url);
          } else {
            precacheUrls.push(url);
          }
        } else if (RUNTIME_CACHE_EXTENSIONS.has(ext)) {
          runtimeHints.push(url);
        }
      }

      // Always include the root URL
      if (!precacheUrls.includes(basePath)) {
        precacheUrls.unshift(basePath);
      }

      // Read SW, inject manifest
      let sw = fs.readFileSync(swPath, 'utf-8');
      sw = sw.replace(
        "'__PRECACHE_MANIFEST__'",
        JSON.stringify(precacheUrls, null, 2),
      );
      sw = sw.replace(
        "'__RUNTIME_URLS__'",
        JSON.stringify(runtimeHints, null, 2),
      );
      fs.writeFileSync(swPath, sw, 'utf-8');

      console.log(
        `[sw-manifest] Injected ${precacheUrls.length} precache URLs and ${runtimeHints.length} runtime-cache URLs into sw.js`,
      );
    },
  };
}
