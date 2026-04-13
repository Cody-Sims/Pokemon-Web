import { MapDefinition, parseMap } from '../shared';

const ground = parseMap([
  // 01234567890123
  '##############', // 0  - north wall
  '#w__________w#', // 1  - windows
  '#__dddddddd__#', // 2  - display cases
  '#____________#', // 3
  '#__dddddddd__#', // 4  - display cases
  '#____________#', // 5
  '#__j______j__#', // 6  - fossils
  '#____________#', // 7
  '#__dddddddd__#', // 8  - display cases
  '#______v_____#', // 9  - exit mat
]);

export const pewterMuseum: MapDefinition = {
  key: 'pewter-museum',
  width: 14,
  height: 10,
  ground,
  encounterTableKey: '',
  isInterior: true,
  displayName: 'Pewter Museum of Science',
  npcs: [
    {
      id: 'museum-guide',
      tileX: 6,
      tileY: 5,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'Welcome to the Pewter Museum of Science!',
        'We have fossils of ancient Pokémon on display.',
      ],
    },
    {
      id: 'museum-scientist',
      tileX: 10,
      tileY: 3,
      textureKey: 'generic-trainer',
      facing: 'left',
      dialogue: [
        'This fossil is from an ancient Pokémon called Aerodactyl.',
        "It's said to have ruled the skies millions of years ago!",
      ],
    },
    {
      id: 'museum-visitor',
      tileX: 3,
      tileY: 7,
      textureKey: 'generic-trainer',
      facing: 'right',
      dialogue: [
        'These fossils are incredible!',
        'I wonder if we could revive them someday...',
      ],
    },
  ],
  trainers: [],
  warps: [
    { tileX: 7, tileY: 9, targetMap: 'pewter-city', targetSpawnId: 'from-museum' },
  ],
  spawnPoints: {
    'default': { x: 7, y: 8, direction: 'up' },
  },
};
