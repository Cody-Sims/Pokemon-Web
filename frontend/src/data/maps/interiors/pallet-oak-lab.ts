import { MapDefinition, parseMap } from '../shared';

const ground = parseMap([
  // 0123456789012
  '#############', // 0  - north wall
  '#w_lb_b_b__w#', // 1  - windows + bookshelves on lab floor
  '#ll_b_b_b_ll#', // 2  - lab floor + bookshelves
  '#lllllllllll#', // 3  - lab floor
  '#lt_t_t_t_tl#', // 4  - lab desks
  '#li_i_i_i_il#', // 5  - chairs
  '#lllllllllll#', // 6  - lab floor
  '#lllltttllll#', // 7  - table for starters (back)
  '#llllooollll#', // 8  - starter Poké Balls (on table)
  '#lllllllllll#', // 9  - lab floor
  '#llx_____xll#', // 10 - lab machines (sides)
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
      textureKey: 'npc-oak',
      facing: 'down',
      dialogue: [
        'Prof. Oak: Ah, there you are!',
        'Prof. Oak: The world of Pokémon awaits!',
        'Prof. Oak: Go ahead and choose one of the three Poké Balls on the table!',
      ],
      setsFlag: 'oakOfferedStarter',
      requireFlag: '!receivedStarter',
    },
    {
      id: 'lab-oak-after',
      tileX: 6,
      tileY: 3,
      textureKey: 'npc-oak',
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
      textureKey: 'npc-scientist',
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
      textureKey: 'npc-scientist',
      facing: 'down',
      dialogue: [
        "Prof. Oak is the authority on Pokémon!",
        "His research is known worldwide.",
      ],
    },
    {
      id: 'lab-pc',
      tileX: 11,
      tileY: 10,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        "Oak's Lab PC is booted up.",
        'Access the Pokémon Storage System?',
      ],
      interactionType: 'pc',
    },
  ],
  trainers: [
    {
      id: 'lab-rival-kael',
      trainerId: 'rival-1',
      tileX: 8,
      tileY: 9,
      textureKey: 'rival',
      facing: 'left',
      lineOfSight: 3,
      condition: 'receivedStarter',
    },
  ],
  warps: [
    { tileX: 5, tileY: 11, targetMap: 'pallet-town', targetSpawnId: 'from-oak-lab' },
    { tileX: 6, tileY: 11, targetMap: 'pallet-town', targetSpawnId: 'from-oak-lab' },
    { tileX: 7, tileY: 11, targetMap: 'pallet-town', targetSpawnId: 'from-oak-lab' },
  ],
  spawnPoints: {
    'default': { x: 6, y: 10, direction: 'up' },
  },
};
