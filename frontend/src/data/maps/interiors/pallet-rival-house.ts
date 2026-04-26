import { MapDefinition, parseMap } from '../shared';

const ground = parseMap([
  // 01234567
  '########', // 0 - north wall
  '#w____w#', // 1 - windows
  '#_t__b_#', // 2 - table + bookshelf
  '#_i____#', // 3 - chair
  '#______#', // 4
  '#__rr__#', // 5 - rug
  '#__rr__#', // 6 - rug
  '#___v__#', // 7 - exit mat
]);

export const palletRivalHouse: MapDefinition = {
  key: 'pallet-rival-house',
  width: 8,
  height: 8,
  ground,
  encounterTableKey: '',
  isInterior: true,
  displayName: "Rival's House",
  npcs: [
    {
      id: 'rival-sister',
      name: "Rival's Sister",
      tileX: 5,
      tileY: 3,
      textureKey: 'npc-female-1',
      facing: 'left',
      dialogue: [
        "My brother left a while ago.",
        "He's always so impatient!",
      ],
    },
  ],
  trainers: [],
  objects: [],
  warps: [
    { tileX: 4, tileY: 7, targetMap: 'pallet-town', targetSpawnId: 'from-rival-house' },
  ],
  spawnPoints: {
    'default': { x: 4, y: 6, direction: 'up' },
  },
};
