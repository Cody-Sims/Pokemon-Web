import { MapDefinition, parseMap } from '../shared';

// ─── Pokémon League Lobby ───
const lobbyGround = parseMap([
  'ŁŁŁŁŁŁŁŁŁŁŁŁ',
  'Łw××××××××wŁ',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł××××zz××××Ł',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł××vvvvvv××Ł',
]);

export const pokemonLeague: MapDefinition = {
  key: 'pokemon-league', width: 12, height: 12, ground: lobbyGround,
  encounterTableKey: '', isInterior: true, battleBg: 'bg-league',
  displayName: 'Pokémon League',
  npcs: [
    { id: 'league-guide', name: 'League Guide', tileX: 4, tileY: 9, textureKey: 'npc-male-3', facing: 'up',
      dialogue: [
        'Welcome to the Pokémon League!',
        'Beyond this hall lie the Elite Four and the Champion.',
        'Are you prepared?',
      ],
      // Plays the cinematic arrival sequence on first interaction; falls back to dialogue thereafter.
      triggerCutscene: 'league-arrival' },
    { id: 'tutor-league', name: 'Move Tutor', tileX: 8, tileY: 9, textureKey: 'npc-male-3', facing: 'left',
      dialogue: ['League Tutor: Only the strongest moves are taught here.', 'League Tutor: Are you ready to pay the price?'],
      interactionType: 'move-tutor', interactionData: 'tutor-league' },
    // ─── A.1 Battle Tower Attendant ───
    // Unlocks the Battle Tower lobby. Visible from the moment the player
    // enters the league hall — the tower itself is a side activity, but
    // becomes meaningful after Hall of Fame.
    { id: 'tower-attendant', name: 'Tower Attendant', tileX: 2, tileY: 4, textureKey: 'npc-female-1', facing: 'down',
      dialogue: [
        'Tower Attendant: Looking for an endless challenge?',
        'Tower Attendant: The Battle Tower runs streaks of 7 trainers.',
        'Tower Attendant: Win, and you earn Battle Points to spend later.',
      ],
      interactionType: 'battle-tower' },
  ],
  trainers: [],
  objects: [],
  warps: [
    // Exit to Victory Road
    { tileX: 4, tileY: 11, targetMap: 'victory-road', targetSpawnId: 'from-league' },
    { tileX: 5, tileY: 11, targetMap: 'victory-road', targetSpawnId: 'from-league' },
    { tileX: 6, tileY: 11, targetMap: 'victory-road', targetSpawnId: 'from-league' },
    { tileX: 7, tileY: 11, targetMap: 'victory-road', targetSpawnId: 'from-league' },
    // Enter Nerida's room
    { tileX: 5, tileY: 0, targetMap: 'pokemon-league-nerida', targetSpawnId: 'from-lobby' },
    { tileX: 6, tileY: 0, targetMap: 'pokemon-league-nerida', targetSpawnId: 'from-lobby' },
  ],
  spawnPoints: {
    'default': { x: 6, y: 10, direction: 'up' },
    'from-victory-road': { x: 6, y: 10, direction: 'up' },
    'from-pokemon-league-nerida': { x: 5, y: 1, direction: 'down' },
    'from-pokemon-league-champion': { x: 6, y: 10, direction: 'up' },
  },
};

// ─── Elite Four #1: Nerida (Water/Ice) ───
const neridaGround = parseMap([
  'ŁŁŁŁŁ××ŁŁŁŁŁ',
  'Łw××××××××wŁ',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł×W××××××W×Ł',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł×W××××××W×Ł',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł××vvvvvv××Ł',
]);

export const pokemonLeagueNerida: MapDefinition = {
  key: 'pokemon-league-nerida', width: 12, height: 14, ground: neridaGround,
  encounterTableKey: '', isInterior: true, battleBg: 'bg-league',
  displayName: 'Elite Four — Nerida',
  npcs: [],
  trainers: [
    { id: 'elite-nerida', name: 'Nerida', trainerId: 'elite-nerida', tileX: 5, tileY: 3,
      textureKey: 'npc-female-7', facing: 'down', lineOfSight: 5 },
  ],
  objects: [],
  warps: [
    // Back to lobby
    { tileX: 5, tileY: 13, targetMap: 'pokemon-league', targetSpawnId: 'from-pokemon-league-nerida' },
    { tileX: 6, tileY: 13, targetMap: 'pokemon-league', targetSpawnId: 'from-pokemon-league-nerida' },
    // Forward to Theron
    { tileX: 5, tileY: 0, targetMap: 'pokemon-league-theron', targetSpawnId: 'from-pokemon-league-nerida' },
    { tileX: 6, tileY: 0, targetMap: 'pokemon-league-theron', targetSpawnId: 'from-pokemon-league-nerida' },
  ],
  spawnPoints: {
    'default': { x: 5, y: 12, direction: 'up' },
    'from-lobby': { x: 5, y: 12, direction: 'up' },
    'from-pokemon-league-theron': { x: 5, y: 1, direction: 'down' },
  },
};

// ─── Elite Four #2: Theron (Fighting/Rock) ───
const theronGround = parseMap([
  'ŁŁŁŁŁ××ŁŁŁŁŁ',
  'Łw××××××××wŁ',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł×q××××××q×Ł',
  'Ł××××uu××××Ł',
  'Ł××××uu××××Ł',
  'Ł×q××××××q×Ł',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł××vvvvvv××Ł',
]);

export const pokemonLeagueTheron: MapDefinition = {
  key: 'pokemon-league-theron', width: 12, height: 14, ground: theronGround,
  encounterTableKey: '', isInterior: true, battleBg: 'bg-league',
  displayName: 'Elite Four — Theron',
  npcs: [],
  trainers: [
    { id: 'elite-theron', name: 'Theron', trainerId: 'elite-theron', tileX: 5, tileY: 3,
      textureKey: 'npc-clerk', facing: 'down', lineOfSight: 5 },
  ],
  objects: [],
  warps: [
    // Back to Nerida
    { tileX: 5, tileY: 13, targetMap: 'pokemon-league-nerida', targetSpawnId: 'from-pokemon-league-theron' },
    { tileX: 6, tileY: 13, targetMap: 'pokemon-league-nerida', targetSpawnId: 'from-pokemon-league-theron' },
    // Forward to Lysandra
    { tileX: 5, tileY: 0, targetMap: 'pokemon-league-lysandra', targetSpawnId: 'from-pokemon-league-theron' },
    { tileX: 6, tileY: 0, targetMap: 'pokemon-league-lysandra', targetSpawnId: 'from-pokemon-league-theron' },
  ],
  spawnPoints: {
    'default': { x: 5, y: 12, direction: 'up' },
    'from-pokemon-league-nerida': { x: 5, y: 12, direction: 'up' },
    'from-pokemon-league-lysandra': { x: 5, y: 1, direction: 'down' },
  },
};

// ─── Elite Four #3: Lysandra (Psychic/Dark) ───
const lysandraGround = parseMap([
  'ŁŁŁŁŁ××ŁŁŁŁŁ',
  'Łw××××××××wŁ',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł×©××××××©×Ł',
  'Ł××××‡‡××××Ł',
  'Ł××××‡‡××××Ł',
  'Ł×©××××××©×Ł',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł××vvvvvv××Ł',
]);

export const pokemonLeagueLysandra: MapDefinition = {
  key: 'pokemon-league-lysandra', width: 12, height: 14, ground: lysandraGround,
  encounterTableKey: '', isInterior: true, battleBg: 'bg-league',
  displayName: 'Elite Four — Lysandra',
  npcs: [],
  trainers: [
    { id: 'elite-lysandra', name: 'Lysandra', trainerId: 'elite-lysandra', tileX: 5, tileY: 3,
      textureKey: 'npc-female-3', facing: 'down', lineOfSight: 5 },
  ],
  objects: [],
  warps: [
    // Back to Theron
    { tileX: 5, tileY: 13, targetMap: 'pokemon-league-theron', targetSpawnId: 'from-pokemon-league-lysandra' },
    { tileX: 6, tileY: 13, targetMap: 'pokemon-league-theron', targetSpawnId: 'from-pokemon-league-lysandra' },
    // Forward to Ashborne
    { tileX: 5, tileY: 0, targetMap: 'pokemon-league-ashborne', targetSpawnId: 'from-pokemon-league-lysandra' },
    { tileX: 6, tileY: 0, targetMap: 'pokemon-league-ashborne', targetSpawnId: 'from-pokemon-league-lysandra' },
  ],
  spawnPoints: {
    'default': { x: 5, y: 12, direction: 'up' },
    'from-pokemon-league-theron': { x: 5, y: 12, direction: 'up' },
    'from-pokemon-league-ashborne': { x: 5, y: 1, direction: 'down' },
  },
};

// ─── Elite Four #4: Ashborne (Fire/Dragon) ───
const ashborneGround = parseMap([
  'ŁŁŁŁŁ××ŁŁŁŁŁ',
  'Łw××××××××wŁ',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'ŁØ××××××××ØŁ',
  'Ł××µ××××µ××Ł',
  'Ł××××××××××Ł',
  'ŁØ××××××××ØŁ',
  'Ł××µ××××µ××Ł',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł××××××××××Ł',
  'Ł××vvvvvv××Ł',
]);

export const pokemonLeagueAshborne: MapDefinition = {
  key: 'pokemon-league-ashborne', width: 12, height: 14, ground: ashborneGround,
  encounterTableKey: '', isInterior: true, battleBg: 'bg-league',
  displayName: 'Elite Four — Ashborne',
  npcs: [],
  trainers: [
    { id: 'elite-ashborne', name: 'Ashborne', trainerId: 'elite-ashborne', tileX: 5, tileY: 3,
      textureKey: 'npc-male-5', facing: 'down', lineOfSight: 5 },
  ],
  objects: [],
  warps: [
    // Back to Lysandra
    { tileX: 5, tileY: 13, targetMap: 'pokemon-league-lysandra', targetSpawnId: 'from-pokemon-league-ashborne' },
    { tileX: 6, tileY: 13, targetMap: 'pokemon-league-lysandra', targetSpawnId: 'from-pokemon-league-ashborne' },
    // Forward to Champion
    { tileX: 5, tileY: 0, targetMap: 'pokemon-league-champion', targetSpawnId: 'from-pokemon-league-ashborne' },
    { tileX: 6, tileY: 0, targetMap: 'pokemon-league-champion', targetSpawnId: 'from-pokemon-league-ashborne' },
  ],
  spawnPoints: {
    'default': { x: 5, y: 12, direction: 'up' },
    'from-pokemon-league-lysandra': { x: 5, y: 12, direction: 'up' },
    'from-pokemon-league-champion': { x: 5, y: 1, direction: 'down' },
  },
};

// ─── Champion: Aldric Maren ───
const championGround = parseMap([
  'ŁŁŁŁŁŁ××ŁŁŁŁŁŁ',
  'ŁwƉ××××××××ƉwŁ',
  'ŁƉ××××ÝÝ××××ƉŁ',
  'ŁƉ××××××××××ƉŁ',
  'Ł××××××××××××Ł',
  'Ł××××××××××××Ł',
  'ŁƉ××××××××××ƉŁ',
  'Ł××××××××××××Ł',
  'Ł××××××××××××Ł',
  'ŁƉ××××××××××ƉŁ',
  'Ł××××××××××××Ł',
  'Ł××××××××××××Ł',
  'Ł××××××××××××Ł',
  'Ł××××××××××××Ł',
  'Ł××××××××××××Ł',
  'Ł×××vvvvvv×××Ł',
]);

export const pokemonLeagueChampion: MapDefinition = {
  key: 'pokemon-league-champion', width: 14, height: 16, ground: championGround,
  encounterTableKey: '', isInterior: true, battleBg: 'bg-league',
  displayName: 'Champion\'s Chamber',
  onEnterCutscene: 'champion-reveal',
  onEnterCutsceneRequireFlag: 'aldric_escaped_to_league',
  npcs: [],
  trainers: [
    { id: 'champion-aldric', name: 'Aldric', trainerId: 'champion-aldric', tileX: 6, tileY: 4,
      textureKey: 'npc-male-5', facing: 'down', lineOfSight: 5 },
  ],
  objects: [],
  warps: [
    // Back to Ashborne
    { tileX: 6, tileY: 15, targetMap: 'pokemon-league-ashborne', targetSpawnId: 'from-pokemon-league-champion' },
    { tileX: 7, tileY: 15, targetMap: 'pokemon-league-ashborne', targetSpawnId: 'from-pokemon-league-champion' },
    // Return to lobby after victory
    { tileX: 6, tileY: 0, targetMap: 'pokemon-league', targetSpawnId: 'from-pokemon-league-champion' },
    { tileX: 7, tileY: 0, targetMap: 'pokemon-league', targetSpawnId: 'from-pokemon-league-champion' },
  ],
  spawnPoints: {
    'default': { x: 6, y: 14, direction: 'up' },
    'from-pokemon-league-ashborne': { x: 6, y: 14, direction: 'up' },
  },
};
