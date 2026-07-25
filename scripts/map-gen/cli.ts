#!/usr/bin/env npx tsx
/**
 * Map Generation CLI
 *
 * Usage:
 *   npx tsx scripts/map-gen/cli.ts <command> [options]
 *
 * Commands:
 *   validate [--map <key>]              Validate maps (all or specific)
 *   preview  [--map <key>] [--all] [--grid]  Render map preview images
 *   dungeon  --width N --height N [--seed N] [--biome B]  Generate BSP dungeon
 *   cave     --width N --height N [--seed N] [--biome B]  Generate cellular cave
 *   route    --width N --height N [--seed N]              Generate route
 *   maze     --width N --height N [--seed N]              Generate maze
 *   compose  <file.json>               Compose map from descriptor file
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

const args = process.argv.slice(2);
const command = args[0];

function getOpt(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

function printUsage(): void {
  console.log(`
Map Generation CLI — Pokemon Web

Usage: npx tsx scripts/map-gen/cli.ts <command> [options]

Commands:
  validate [--map <key>]                     Validate maps (all or specific)
  preview  [--map <key>] [--all] [--grid]    Render map preview images
  dungeon  --width N --height N [options]     Generate BSP dungeon
  cave     --width N --height N [options]     Generate cellular cave
  route    --width N --height N [options]     Generate route (rectangular)
  organic-route --width N --height N [options] Generate non-rectangular route
  maze     --width N --height N [options]     Generate maze
  compose  <file.json>                        Compose map from template descriptor

Generator Options:
  --seed N          Random seed (default: 42)
  --biome B         Biome theme: standard, volcanic, coastal, forest, ghost, dragon, mine, electric, synthesis, cave
  --shape S         organic-route silhouette: forest, coastal, cliffside, peninsula (default: forest)
  --roughness R     organic-route edge roughness 0..1 (default: 0.55)
  --no-ledges       organic-route: skip ledge placement
  --out <path>      Output file path (default: stdout)
  --format <fmt>    Output format: charmap (default), typescript, grid

Example:
  npx tsx scripts/map-gen/cli.ts dungeon --width 31 --height 25 --seed 42 --biome cave
  npx tsx scripts/map-gen/cli.ts organic-route --width 22 --height 38 --shape coastal --seed 7
  npx tsx scripts/map-gen/cli.ts validate --map pallet-town
  npx tsx scripts/map-gen/cli.ts preview --all
  npx tsx scripts/map-gen/cli.ts compose temp/my-town.json
`);
}

async function main(): Promise<void> {
  if (!command || command === 'help' || command === '--help') {
    printUsage();
    return;
  }

  switch (command) {
    case 'validate':
      await runValidate();
      break;
    case 'preview':
      await runPreview();
      break;
    case 'dungeon':
      await runDungeon();
      break;
    case 'cave':
      await runCave();
      break;
    case 'route':
      await runRoute();
      break;
    case 'organic-route':
      await runOrganicRoute();
      break;
    case 'maze':
      await runMaze();
      break;
    case 'compose':
      await runCompose();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

async function runValidate(): Promise<void> {
  // Delegate to the validator script
  const mapKey = getOpt('map');
  const validatorArgs = mapKey ? [mapKey] : [];
  const { execSync } = await import('node:child_process');
  const cmd = `npx tsx ${path.join(__dirname, 'validate/map-validator.ts')} ${validatorArgs.join(' ')}`;
  try {
    execSync(cmd, { cwd: REPO_ROOT, stdio: 'inherit' });
  } catch {
    // validator script exits with non-zero on errors
  }
}

async function runPreview(): Promise<void> {
  const mapKey = getOpt('map');
  const all = hasFlag('all');
  const grid = hasFlag('grid');
  const { execSync } = await import('node:child_process');
  const previewArgs = [
    all ? '--all' : (mapKey ?? ''),
    grid ? '--grid' : '',
  ].filter(Boolean);
  const cmd = `npx tsx ${path.join(__dirname, 'validate/preview-renderer.ts')} ${previewArgs.join(' ')}`;
  try {
    execSync(cmd, { cwd: REPO_ROOT, stdio: 'inherit' });
  } catch {
    // preview script may warn
  }
}

async function runDungeon(): Promise<void> {
  const width = parseInt(getOpt('width') ?? '31', 10);
  const height = parseInt(getOpt('height') ?? '25', 10);
  const seed = parseInt(getOpt('seed') ?? '42', 10);
  const biome = getOpt('biome') ?? 'cave';
  const outPath = getOpt('out');
  const format = getOpt('format') ?? 'charmap';

  const { generateDungeon } = await import('./algorithms/bsp-dungeon');
  const { simpleGridToCharMap } = await import('./export/to-charmap');
  const { applyBiome, getBiomeDefaults } = await import('./core/biome-themes');

  const defaults = getBiomeDefaults(biome);
  const result = generateDungeon({ width, height, seed });

  // Map generator values to biome characters
  const charGrid = simpleGridToCharMap(result.grid, {
    0: defaults.ground.length === 1 ? defaults.ground : ',', // floor
    1: defaults.border.length === 1 ? defaults.border : ';', // wall
    2: defaults.ground.length === 1 ? defaults.ground : ',', // door (same as floor in char representation)
  });

  const finalGrid = biome !== 'cave' ? applyBiome(charGrid, biome) : charGrid;

  outputResult(finalGrid, format, outPath, `generated-dungeon-${seed}`);
  console.error(`\nGenerated ${width}x${height} dungeon (seed: ${seed}, biome: ${biome})`);
  console.error(`Rooms: ${result.rooms.length}`);
}

async function runCave(): Promise<void> {
  const width = parseInt(getOpt('width') ?? '40', 10);
  const height = parseInt(getOpt('height') ?? '30', 10);
  const seed = parseInt(getOpt('seed') ?? '42', 10);
  const biome = getOpt('biome') ?? 'cave';
  const outPath = getOpt('out');
  const format = getOpt('format') ?? 'charmap';

  const { generateCave } = await import('./algorithms/cellular-cave');
  const { simpleGridToCharMap } = await import('./export/to-charmap');
  const { applyBiome, getBiomeDefaults } = await import('./core/biome-themes');

  const defaults = getBiomeDefaults(biome);
  const result = generateCave({ width, height, seed });

  const charGrid = simpleGridToCharMap(result.grid, {
    0: defaults.ground.length === 1 ? defaults.ground : ',',
    1: defaults.border.length === 1 ? defaults.border : ';',
  });

  const finalGrid = biome !== 'cave' ? applyBiome(charGrid, biome) : charGrid;

  outputResult(finalGrid, format, outPath, `generated-cave-${seed}`);
  console.error(`\nGenerated ${width}x${height} cave (seed: ${seed}, biome: ${biome})`);
  console.error(`Entrance: (${result.entrance.x}, ${result.entrance.y}), Exit: (${result.exit.x}, ${result.exit.y})`);
}

async function runRoute(): Promise<void> {
  const width = parseInt(getOpt('width') ?? '25', 10);
  const height = parseInt(getOpt('height') ?? '30', 10);
  const seed = parseInt(getOpt('seed') ?? '42', 10);
  const outPath = getOpt('out');
  const format = getOpt('format') ?? 'charmap';

  const { generateRoute } = await import('./algorithms/route-carver');
  const { gridToCharMap } = await import('./export/to-charmap');

  const result = generateRoute({
    width,
    height,
    seed,
    entrances: [
      { x: Math.floor(width / 2), y: 0, side: 'north' },
      { x: Math.floor(width / 2), y: height - 1, side: 'south' },
    ],
  });

  const charGrid = gridToCharMap(result.grid);
  outputResult(charGrid, format, outPath, `generated-route-${seed}`);
  console.error(`\nGenerated ${width}x${height} route (seed: ${seed}), ${result.features.length} features placed`);
}

async function runOrganicRoute(): Promise<void> {
  const width = parseInt(getOpt('width') ?? '22', 10);
  const height = parseInt(getOpt('height') ?? '38', 10);
  const seed = parseInt(getOpt('seed') ?? '42', 10);
  const biome = getOpt('biome') ?? 'standard';
  const shape = (getOpt('shape') ?? 'forest') as 'forest' | 'coastal' | 'cliffside' | 'peninsula';
  const roughness = parseFloat(getOpt('roughness') ?? '0.55');
  const ledges = !hasFlag('no-ledges');
  const outPath = getOpt('out');
  const format = getOpt('format') ?? 'charmap';

  const { generateOrganicRoute } = await import('./algorithms/organic-route');
  const { gridToCharMap } = await import('./export/to-charmap');
  const { applyBiome } = await import('./core/biome-themes');

  const result = generateOrganicRoute({ width, height, seed, shape, roughness, ledges });
  const charGrid = gridToCharMap(result.grid);
  const finalGrid = biome !== 'standard' ? applyBiome(charGrid, biome) : charGrid;

  outputResult(finalGrid, format, outPath, `organic-route-${shape}-${seed}`);
  console.error(
    `\nGenerated ${width}x${height} organic-route (shape: ${shape}, seed: ${seed}, biome: ${biome})`,
  );
  console.error(`Alcoves: ${result.alcoves.length}, Ledges: ${result.ledges.length}`);
}

async function runMaze(): Promise<void> {
  const width = parseInt(getOpt('width') ?? '21', 10);
  const height = parseInt(getOpt('height') ?? '21', 10);
  const seed = parseInt(getOpt('seed') ?? '42', 10);
  const biome = getOpt('biome') ?? 'cave';
  const outPath = getOpt('out');
  const format = getOpt('format') ?? 'charmap';

  const { generateMaze } = await import('./algorithms/maze-generator');
  const { simpleGridToCharMap } = await import('./export/to-charmap');
  const { applyBiome, getBiomeDefaults } = await import('./core/biome-themes');

  const defaults = getBiomeDefaults(biome);
  const result = generateMaze({ width, height, seed });

  const charGrid = simpleGridToCharMap(result.grid, {
    0: defaults.ground.length === 1 ? defaults.ground : ',',
    1: defaults.border.length === 1 ? defaults.border : ';',
  });

  const finalGrid = biome !== 'standard' ? applyBiome(charGrid, biome) : charGrid;

  outputResult(finalGrid, format, outPath, `generated-maze-${seed}`);
  console.error(`\nGenerated ${width}x${height} maze (seed: ${seed}, biome: ${biome})`);
}

async function runCompose(): Promise<void> {
  const jsonFile = args[1];
  if (!jsonFile) {
    console.error('Usage: compose <file.json>');
    process.exit(1);
    return;
  }

  const absPath = path.resolve(REPO_ROOT, jsonFile);

  if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
    return;
  }

  const { composeMap } = await import('./compose/map-composer');
  const { connectDoorsToPath } = await import('./compose/path-connector');

  const composition = JSON.parse(fs.readFileSync(absPath, 'utf-8'));
  const templatesDir = path.resolve(REPO_ROOT, 'temp/map-templates');
  const outPath = getOpt('out');
  const format = getOpt('format') ?? 'charmap';

  let charGrid = composeMap(composition, templatesDir);
  charGrid = connectDoorsToPath(charGrid);

  outputResult(charGrid, format, outPath, composition.name ?? 'composed-map');
  console.error(`\nComposed map: ${composition.name} (${composition.width}x${composition.height})`);
}

async function outputResult(
  charGrid: string[],
  format: string,
  outPath: string | undefined,
  defaultName: string,
): Promise<void> {
  let output: string;

  switch (format) {
    case 'typescript': {
      const { exportToTypeScript } = await import('./export/to-typescript');
      output = exportToTypeScript({
        key: defaultName,
        charGrid,
        spawnPoints: { default: { x: 1, y: 1, direction: 'down' } },
      });
      break;
    }
    case 'grid':
      output = charGrid.map((row, i) =>
        `${String(i).padStart(3)}| ${row} |`
      ).join('\n');
      break;
    case 'charmap':
    default:
      output = charGrid.join('\n');
      break;
  }

  if (outPath) {
    const absOut = path.resolve(REPO_ROOT, outPath);
    fs.mkdirSync(path.dirname(absOut), { recursive: true });
    fs.writeFileSync(absOut, output, 'utf-8');
    console.error(`Written to: ${absOut}`);
  } else {
    console.log(output);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
