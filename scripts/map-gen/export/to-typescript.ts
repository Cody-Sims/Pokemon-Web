/**
 * Export a generated map to a full TypeScript MapDefinition file.
 * Produces a .ts file compatible with the game's map system.
 */

export interface ExportConfig {
  key: string;
  displayName?: string;
  charGrid: string[];
  encounterTableKey?: string;
  isInterior?: boolean;
  isDark?: boolean;
  battleBg?: string;
  warps?: Array<{
    tileX: number;
    tileY: number;
    targetMap: string;
    targetSpawnId: string;
    requireFlag?: string;
  }>;
  npcs?: Array<{
    id: string;
    tileX: number;
    tileY: number;
    textureKey: string;
    facing: string;
    dialogue: string[];
  }>;
  trainers?: Array<{
    id: string;
    trainerId: string;
    tileX: number;
    tileY: number;
    textureKey: string;
    facing: string;
    lineOfSight: number;
  }>;
  spawnPoints?: Record<string, { x: number; y: number; direction: string }>;
  weather?: string;
  ambientSfx?: string;
}

/**
 * Generate a TypeScript source file string for a MapDefinition.
 */
export function exportToTypeScript(config: ExportConfig): string {
  const {
    key,
    displayName,
    charGrid,
    encounterTableKey = '',
    isInterior = false,
    isDark = false,
    battleBg,
    warps = [],
    npcs = [],
    trainers = [],
    spawnPoints = { default: { x: 1, y: 1, direction: 'down' } },
    weather,
    ambientSfx,
  } = config;

  const width = charGrid.length > 0 ? [...charGrid[0]].length : 0;
  const height = charGrid.length;

  const varName = toCamelCase(key);
  const lines: string[] = [];

  lines.push(`import { MapDefinition, parseMap } from '../shared';`);
  lines.push('');

  // Character grid
  lines.push(`const ${varName}Ground = parseMap([`);
  for (let i = 0; i < charGrid.length; i++) {
    const comment = i === 0 ? ` // row ${i} (${width} chars wide)` : ` // row ${i}`;
    lines.push(`  '${charGrid[i]}',${comment}`);
  }
  lines.push(']);');
  lines.push('');

  // MapDefinition object
  lines.push(`export const ${varName}: MapDefinition = {`);
  lines.push(`  key: '${key}',`);
  if (displayName) lines.push(`  displayName: '${displayName}',`);
  lines.push(`  width: ${width},`);
  lines.push(`  height: ${height},`);
  lines.push(`  ground: ${varName}Ground,`);
  lines.push(`  encounterTableKey: '${encounterTableKey}',`);
  if (isInterior) lines.push(`  isInterior: true,`);
  if (isDark) lines.push(`  isDark: true,`);
  if (battleBg) lines.push(`  battleBg: '${battleBg}',`);
  if (weather) lines.push(`  weather: '${weather}' as any,`);
  if (ambientSfx) lines.push(`  ambientSfx: '${ambientSfx}' as any,`);

  // NPCs
  lines.push(`  npcs: [`);
  for (const npc of npcs) {
    lines.push(`    {`);
    lines.push(`      id: '${npc.id}',`);
    lines.push(`      tileX: ${npc.tileX},`);
    lines.push(`      tileY: ${npc.tileY},`);
    lines.push(`      textureKey: '${npc.textureKey}',`);
    lines.push(`      facing: '${npc.facing}',`);
    lines.push(`      dialogue: [`);
    for (const d of npc.dialogue) {
      lines.push(`        '${escapeQuotes(d)}',`);
    }
    lines.push(`      ],`);
    lines.push(`    },`);
  }
  lines.push(`  ],`);

  // Trainers
  lines.push(`  trainers: [`);
  for (const tr of trainers) {
    lines.push(`    {`);
    lines.push(`      id: '${tr.id}',`);
    lines.push(`      trainerId: '${tr.trainerId}',`);
    lines.push(`      tileX: ${tr.tileX},`);
    lines.push(`      tileY: ${tr.tileY},`);
    lines.push(`      textureKey: '${tr.textureKey}',`);
    lines.push(`      facing: '${tr.facing}',`);
    lines.push(`      lineOfSight: ${tr.lineOfSight},`);
    lines.push(`    },`);
  }
  lines.push(`  ],`);

  // Warps
  lines.push(`  warps: [`);
  for (const w of warps) {
    const flagPart = w.requireFlag ? `, requireFlag: '${w.requireFlag}'` : '';
    lines.push(`    { tileX: ${w.tileX}, tileY: ${w.tileY}, targetMap: '${w.targetMap}', targetSpawnId: '${w.targetSpawnId}'${flagPart} },`);
  }
  lines.push(`  ],`);

  // Spawn points
  lines.push(`  spawnPoints: {`);
  for (const [id, sp] of Object.entries(spawnPoints)) {
    lines.push(`    '${id}': { x: ${sp.x}, y: ${sp.y}, direction: '${sp.direction}' },`);
  }
  lines.push(`  },`);

  lines.push('};');
  lines.push('');

  return lines.join('\n');
}

function toCamelCase(kebab: string): string {
  return kebab.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function escapeQuotes(s: string): string {
  return s.replace(/'/g, "\\'");
}
