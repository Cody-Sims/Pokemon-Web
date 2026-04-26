import { MapDefinition, parseMap } from '../shared';

// Wraithmoor Town — Town 7 (24×25). Gym 6 (Ghost — Morwen)
// A haunted town built atop ancient ruins. Mist, graves, and crumbling stone.
//
// Legend (ghost/ruin biome):
//   † = GRAVE_MARKER   ‡ = CRACKED_FLOOR   ® = RUIN_WALL
//   © = RUIN_PILLAR    ° = MIST            2 = AUTUMN_TREE
//   4 = DARK_GRASS
//
// Layout:
//   NW — PokéCenter (safe haven)       NE — House remnant on cracked ground
//   W  — PokéMart (between ruins)      E  — Ruined cathedral / shrine
//   S  — Ghost Gym among gravestones   Center — graveyard, mist paths
const wraithmoorGround = parseMap([
  '222244444°‡PP‡°444442222', // 0  north border, exit 11-12
  '24°4‡‡°°°‡PP‡°°°‡‡4°4222', // 1  entrance path, sign
  '2CCCCCCC°‡PP‡°®©®°‡°2222', // 2  pokécenter roof
  '2c$ccccc°°PP°°°®‡®°°°°22', // 3  pokécenter walls
  '2ccecccc‡PPPP‡‡°°°‡°°°22', // 4  pokécenter door (col 3)
  '24°°‡‡PPPP°°°PP‡‡°°RRRRR', // 5  path splits, house roof NE
  '2°‡°°°°P°°‡°°P°°°‡°HH&HH', // 6  path east, house walls
  '24°MMMMMM°‡°°P‡°°‡°HHDHH', // 7  mart roof, house door (col 21)
  '2°°mm&mmm°°°°P°‡°°‡‡‡°°2', // 8  mart walls
  '24°mmnmmm‡°°PP°°°°‡°‡°°2', // 9  mart door (col 5)
  '2°‡°°°°‡‡°PPP°†°†°†°†°°2', // 10 graveyard north
  '2‡°©°°‡‡°PP‡°†°†°†°†°°°2', // 11 graveyard rows
  '22°®‡®°°PPP°°‡†‡†‡†‡°©°2', // 12 graveyard center
  '2°°©°°°PP°°°°†°†°†°°°°°2', // 13 graveyard south
  '2°‡°°°PP°°‡°°°°‡°°°‡®°°2', // 14 misty area, tutor
  '2‡°°‡PP‡°°°°PPPPP°°®‡®°2', // 15 path bends to gym & shrine
  '24°°‡P°°‡®©®°°°°P©®®©°°2', // 16 ruins, path to shrine
  '2AAAAAAA‡°°°®‡‡°P®‡‡®°°2', // 17 gym roof, shrine east
  '2ggg&ggg°‡°°©‡‡°P©‡‡©°°2', // 18 gym walls
  '2gggaggg°°PPPP°°PP°‡®°°2', // 19 gym door (col 4)
  '24°°°°°‡°P°°°PP°°°°°°4°2', // 20 south misty area
  '22°4°°‡‡°P°‡°°P°°4°2°4°2', // 21 dark grass & autumn trees
  '244°°°‡°°PP°°PP°°°°°4°°2', // 22 approach south exit
  '2224°°°°°°PPPP°°°°4°2°°2', // 23 south path narrows
  '222244444°‡PP‡°444442222', // 24 south border, exit 11-12
]);

export const wraithmoorTown: MapDefinition = {
  key: 'wraithmoor-town', width: 24, height: 25, ground: wraithmoorGround,
  encounterTableKey: '', battleBg: 'bg-ruins', displayName: 'Wraithmoor Town',
  weather: 'fog',
  npcs: [
    { id: 'wraithmoor-sign', tileX: 10, tileY: 1, textureKey: 'sign-post', facing: 'down',
      dialogue: ['WRAITHMOOR TOWN', '"Where Spirits Linger"'] },
    { id: 'wraithmoor-npc', name: 'Townsperson', tileX: 7, tileY: 6, textureKey: 'npc-male-2', facing: 'left',
      dialogue: ['Morwen is our Gym Leader. She communes with spirits.', 'Her Ghost Pokémon are terrifying...', 'Normal and Fighting moves won\'t work!'] },
    { id: 'wraithmoor-ghost-girl', name: 'Ghost Girl', tileX: 11, tileY: 12, textureKey: 'npc-female-2', facing: 'down',
      dialogue: ['...Do you see them too?', 'The memories of those who came before...', 'Find the three fragments. They hold the truth.'],
      setsFlag: 'quest_restlessSpirit_started' },
    { id: 'tutor-wraithmoor', name: 'Move Tutor', tileX: 8, tileY: 14, textureKey: 'npc-female-2', facing: 'left',
      dialogue: ['Shadow Tutor: The spirits whisper their secrets to me...', 'Shadow Tutor: Bring Heart Scales and I will teach your Pokémon shadow moves.'],
      interactionType: 'move-tutor', interactionData: 'tutor-wraithmoor' },
    { id: 'wraithmoor-edith', name: 'Edith', tileX: 14, tileY: 16, textureKey: 'npc-female-7', facing: 'left',
      dialogue: ['Historian Edith: The ancient civilization built temples over the ley lines.',
        'Edith: They sealed guardians within to protect the Aether flow.',
        'Edith: But if someone were to break those seals...',
        'Edith: Take this Temple Map. It marks the sacred sites.'],
      setsFlag: 'received_temple_map' },
    // Memory fragment interaction points for Restless Spirit quest
    { id: 'wraithmoor-memory-1', tileX: 11, tileY: 11, textureKey: 'item-ball', facing: 'down',
      dialogue: ['A faint glow emanates from the graveyard stones...', 'You found a memory fragment! It pulses with ghostly light.'],
      requireFlag: '!memory-1-found', setsFlag: 'memory-1-found' },
    { id: 'wraithmoor-memory-2', tileX: 4, tileY: 13, textureKey: 'item-ball', facing: 'down',
      dialogue: ['An old book on the library shelf glows faintly...', 'You found a memory fragment! Words shimmer on the page.'],
      requireFlag: '!memory-2-found', setsFlag: 'memory-2-found' },
    { id: 'wraithmoor-memory-3', tileX: 16, tileY: 18, textureKey: 'item-ball', facing: 'down',
      dialogue: ['The ruined shrine hums with spectral energy...', 'You found a memory fragment! A ghostly figure smiles.'],
      requireFlag: '!memory-3-found', setsFlag: 'memory-3-found' },
  ],
  trainers: [],
  warps: [
    { tileX: 11, tileY: 0, targetMap: 'route-6', targetSpawnId: 'from-wraithmoor' },
    { tileX: 12, tileY: 0, targetMap: 'route-6', targetSpawnId: 'from-wraithmoor' },
    { tileX: 11, tileY: 24, targetMap: 'route-7', targetSpawnId: 'from-wraithmoor' },
    { tileX: 12, tileY: 24, targetMap: 'route-7', targetSpawnId: 'from-wraithmoor' },
    { tileX: 3, tileY: 4, targetMap: 'wraithmoor-pokecenter', targetSpawnId: 'default' },
    { tileX: 5, tileY: 9, targetMap: 'wraithmoor-pokemart', targetSpawnId: 'default' },
    { tileX: 4, tileY: 19, targetMap: 'wraithmoor-gym', targetSpawnId: 'default' },
    // House interior (NE remnant)
    { tileX: 21, tileY: 7, targetMap: 'wraithmoor-town-house-1', targetSpawnId: 'default' },
  ],
  spawnPoints: {
    'default': { x: 11, y: 12, direction: 'up' },
    'from-route-6': { x: 12, y: 1, direction: 'down' },
    'from-route-7': { x: 12, y: 23, direction: 'up' },
    'from-pokecenter': { x: 3, y: 5, direction: 'down' },
    'from-pokemart': { x: 5, y: 10, direction: 'down' },
    'from-gym': { x: 4, y: 20, direction: 'down' },
    'from-house-1': { x: 21, y: 8, direction: 'down' },
  },
};
