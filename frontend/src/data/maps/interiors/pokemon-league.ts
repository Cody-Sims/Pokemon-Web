import { MapDefinition, parseMap } from '../shared';

// Pokémon League — Elite Four + Champion
const leagueGround = parseMap([
  '##########',
  '#w______w#',
  '#________#',
  '#________#',
  '#___zz___#',
  '#________#',
  '#________#',
  '#________#',
  '#________#',
  '#__vvvv__#',
]);

export const pokemonLeague: MapDefinition = {
  key: 'pokemon-league', width: 10, height: 10, ground: leagueGround,
  encounterTableKey: '', isInterior: true, battleBg: 'bg-league',
  displayName: 'Pokémon League',
  npcs: [
    { id: 'league-guide', tileX: 5, tileY: 8, textureKey: 'npc-male-4', facing: 'up',
      dialogue: ['Welcome to the Pokémon League!',
        'Beyond this hall lie the Elite Four and the Champion.',
        'Are you prepared?'] },
  ],
  trainers: [
    // Elite Four Nerida (Water/Ice)
    { id: 'elite-nerida', trainerId: 'elite-nerida', tileX: 4, tileY: 2,
      textureKey: 'npc-female-7', facing: 'down', lineOfSight: 5 },
  ],
  warps: [
    { tileX: 3, tileY: 9, targetMap: 'victory-road', targetSpawnId: 'from-league' },
    { tileX: 4, tileY: 9, targetMap: 'victory-road', targetSpawnId: 'from-league' },
    { tileX: 5, tileY: 9, targetMap: 'victory-road', targetSpawnId: 'from-league' },
    { tileX: 6, tileY: 9, targetMap: 'victory-road', targetSpawnId: 'from-league' },
  ],
  spawnPoints: {
    'default': { x: 5, y: 8, direction: 'up' },
    'from-victory-road': { x: 5, y: 8, direction: 'up' },
  },
};
