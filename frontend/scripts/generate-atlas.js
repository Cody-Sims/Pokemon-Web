#!/usr/bin/env node
/**
 * Build-time asset manifest generator.
 *
 * Scans frontend/public/assets/ and produces asset-manifest.json —
 * a categorized index of every sprite, atlas, spritesheet, and audio
 * file.  PreloadScene consumes this manifest at runtime so that asset
 * loading is data-driven rather than hardcoded.
 *
 * Categories marked "deferred" (pokemon front/back battle sprites) are
 * NOT loaded at boot — they are fetched on demand by MapPreloader.
 *
 * Usage:  node frontend/scripts/generate-atlas.js
 */
import { readdirSync, writeFileSync, existsSync, statSync } from 'fs';
import { resolve, join, basename, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, '..', 'public');
const ASSETS = join(PUBLIC, 'assets');

// ── Helpers ──────────────────────────────────────────────────────────

/** List files in a directory whose name ends with `suffix`. */
function listFiles(dir, suffix) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith(suffix) && statSync(join(dir, f)).isFile())
    .sort();
}

/** Derive a Phaser texture key from a filename (strip extension). */
function keyFromFile(filename) {
  return basename(filename, extname(filename));
}

/**
 * Scan a directory for atlas pairs (key.png + key.json).
 * Only files that have BOTH a .png and a .json are included.
 */
function scanAtlases(dir, pathPrefix) {
  const pngs = new Set(listFiles(dir, '.png').map(keyFromFile));
  const jsons = new Set(listFiles(dir, '.json').map(keyFromFile));
  const keys = [...pngs].filter(k => jsons.has(k)).sort();
  return keys.map(k => ({
    key: k,
    texture: `${pathPrefix}/${k}.png`,
    atlas: `${pathPrefix}/${k}.json`,
  }));
}

// ── Category builders ────────────────────────────────────────────────

function buildPokemonIcons() {
  const dir = join(ASSETS, 'sprites', 'pokemon');
  const files = listFiles(dir, '-icon.png');
  return {
    loadType: 'image',
    assets: files.map(f => ({
      key: keyFromFile(f),
      path: `assets/sprites/pokemon/${f}`,
    })),
  };
}

/** @param {'front'|'back'} suffix */
function buildPokemonBattle(suffix) {
  const dir = join(ASSETS, 'sprites', 'pokemon');
  const files = listFiles(dir, `-${suffix}.png`);
  return {
    loadType: 'image',
    deferred: true,
    assets: files.map(f => ({
      key: keyFromFile(f),
      path: `assets/sprites/pokemon/${f}`,
    })),
  };
}

function buildTilesets() {
  return {
    loadType: 'mixed',
    assets: [
      { key: 'overworld-tiles', loadType: 'image', path: 'assets/tilesets/overworld.png' },
      {
        key: 'tileset',
        loadType: 'spritesheet',
        path: 'assets/tilesets/tileset.png',
        frameWidth: 16,
        frameHeight: 16,
      },
    ],
  };
}

function buildPlayer() {
  const dir = join(ASSETS, 'sprites', 'player');
  return {
    loadType: 'atlas',
    assets: scanAtlases(dir, 'assets/sprites/player'),
  };
}

function buildIntro() {
  // Single sprite needed by TitleScene / IntroScene before any map loads.
  return {
    loadType: 'image',
    assets: [
      { key: 'pikachu-front', path: 'assets/sprites/pokemon/pikachu-front.png' },
    ],
  };
}

/** @param {string} subfolder — relative to assets/sprites/npcs/ */
function buildNpcCategory(subfolder) {
  const dir = join(ASSETS, 'sprites', 'npcs', subfolder);
  return {
    loadType: 'atlas',
    assets: scanAtlases(dir, `assets/sprites/npcs/${subfolder}`),
  };
}

function buildUI() {
  return {
    loadType: 'spritesheet',
    assets: [
      { key: 'type-badges', path: 'assets/ui/type-badges.png', frameWidth: 32, frameHeight: 14 },
      { key: 'status-badges', path: 'assets/ui/status-badges.png', frameWidth: 32, frameHeight: 14 },
    ],
  };
}

/** @param {'bgm'|'sfx'} subfolder */
function buildAudio(subfolder) {
  const dir = join(ASSETS, 'audio', subfolder);
  const files = listFiles(dir, '.wav');
  return {
    loadType: 'audio',
    assets: files.map(f => ({
      key: keyFromFile(f),
      path: `assets/audio/${subfolder}/${f}`,
    })),
  };
}

// ── Main ─────────────────────────────────────────────────────────────

const manifest = {
  version: 1,
  generated: new Date().toISOString(),
  categories: {
    'pokemon-icons':    buildPokemonIcons(),
    'pokemon-front':    buildPokemonBattle('front'),
    'pokemon-back':     buildPokemonBattle('back'),
    'tilesets':         buildTilesets(),
    'player':           buildPlayer(),
    'intro':            buildIntro(),
    'npc-males':        buildNpcCategory('Males'),
    'npc-females':      buildNpcCategory('Females'),
    'npc-story':        buildNpcCategory('story'),
    'npc-trainers':     buildNpcCategory('trainers'),
    'npc-gym-leaders':  buildNpcCategory('gym-leaders'),
    'npc-elite-four':   buildNpcCategory('elite-four'),
    'npc-villains':     buildNpcCategory('villains'),
    'ui':               buildUI(),
    'bgm':              buildAudio('bgm'),
    'sfx':              buildAudio('sfx'),
  },
};

// ── Summary ──────────────────────────────────────────────────────────

let totalAssets = 0;
let totalDeferred = 0;

console.log('Asset manifest categories:');
for (const [name, cat] of Object.entries(manifest.categories)) {
  const count = cat.assets.length;
  totalAssets += count;
  if (cat.deferred) totalDeferred += count;
  console.log(`  ${name}: ${count} asset${count !== 1 ? 's' : ''}${cat.deferred ? ' (deferred)' : ''}`);
}

const outPath = join(PUBLIC, 'assets', 'asset-manifest.json');
writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n');

console.log(`\nWrote ${outPath}`);
console.log(`Total: ${totalAssets} assets (${totalAssets - totalDeferred} preloaded, ${totalDeferred} deferred)`);
