import { MapDefinition, parseMap } from './shared';

const ground = parseMap([
  // 0123456789012
  '#############', // 0  - north wall
  '#w__b_b_b__w#', // 1  - windows + bookshelves
  '#___b_b_b___#', // 2  - bookshelves (research area)
  '#___________#', // 3
  '#_t_t_t_t_t_#', // 4  - lab desks
  '#_i_i_i_i_i_#', // 5  - chairs
  '#___________#', // 6
  '#____ooo____#', // 7  - starter Poké Balls on table
  '#____ttt____#', // 8  - table for starters
  '#___________#', // 9
  '#___________#', // 10
  '#_____v_____#', // 11 - exit mat
]);

export const palletOakLab: MapDefinition = {
  key: 'pallet-oak-lab',
  width: 13,
  height: 12,
  ground,
  encounterTableKey: '',
  isInterior: true,
  displayName: "Oak's Laboratory",
  npcs: [
    {
      id: 'lab-oak',
      tileX: 6,
      tileY: 3,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'Prof. Oak: Ah, there you are!',
        'Prof. Oak: The world of Pokémon awaits!',
        'Prof. Oak: Choose one of these three Pokémon!',
      ],
      interactionType: 'starter-select',
      requireFlag: '!receivedStarter',
    },
    {
      id: 'lab-oak-after',
      tileX: 6,
      tileY: 3,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'Prof. Oak: Your Pokémon is looking great!',
        'Prof. Oak: Go explore the world!',
      ],
      flagDialogue: [
        {
          flag: 'receivedPokedex',
          dialogue: [
            'Prof. Oak: Fill up that Pokédex for me!',
            'Prof. Oak: There are 151 Pokémon to discover!',
          ],
        },
        {
          flag: 'hasParcel',
          dialogue: [
            'Prof. Oak: Oh! Is that a package from the PokéMart?',
            'Prof. Oak: Thank you for delivering it!',
            'Prof. Oak: Here, take this Pokédex!',
            'Prof. Oak: It records data on all Pokémon you encounter.',
          ],
        },
      ],
      requireFlag: 'receivedStarter',
    },
    {
      id: 'lab-aide-1',
      tileX: 2,
      tileY: 5,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        "I'm one of Prof. Oak's aides.",
        'We study Pokémon habitats and behaviors.',
      ],
    },
    {
      id: 'lab-aide-2',
      tileX: 10,
      tileY: 5,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        "Prof. Oak is the authority on Pokémon!",
        "His research is known worldwide.",
      ],
    },
  ],
  trainers: [],
  warps: [
    { tileX: 6, tileY: 11, targetMap: 'pallet-town', targetSpawnId: 'from-oak-lab' },
  ],
  spawnPoints: {
    'default': { x: 6, y: 10, direction: 'up' },
  },
};
