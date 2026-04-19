import { MapDefinition, parseMap } from '../shared';

const ground = parseMap([
  // 0123456789012345
  '################', // 0  - north wall
  '#w____d_d____w#', // 1  - windows + display cases
  '#_j__d___d__j__#', // 2  - fossils + cases
  '#______________#', // 3  - open hall
  '#_d__________d_#', // 4  - side exhibits
  '#______________#', // 5  - center aisle
  '#_d__________d_#', // 6  - side exhibits
  '#______________#', // 7  - open area
  '#_j___kkkk__j__#', // 8  - fossils + counter
  '#______kk______#', // 9  - counter
  '#______________#', // 10 - lobby
  '####__vv__######', // 11 - exit
]);

export const pewterMuseum: MapDefinition = {
  key: 'pewter-museum',
  width: 16,
  height: 12,
  ground,
  encounterTableKey: '',
  isInterior: true,
  displayName: 'Pewter Museum of Science',
  npcs: [
    // ─── Museum Guide ───
    {
      id: 'museum-guide',
      tileX: 4,
      tileY: 5,
      textureKey: 'npc-female-3',
      facing: 'right',
      dialogue: [
        'Welcome to the Pewter Museum of Science!',
        'We have fossils from the ancient Kanto age!',
        'And a special Aether research exhibit on the upper floor.',
      ],
      behavior: { type: 'look-around' },
    },
    // ─── Fossil Scientist ───
    {
      id: 'museum-fossil-scientist',
      tileX: 12,
      tileY: 2,
      textureKey: 'npc-scientist',
      facing: 'down',
      dialogue: [
        'This Helix Fossil is over 300 million years old.',
        'We believe Pokémon like Omanyte were once abundant here.',
        'Modern Pokémon are descendants of these ancient creatures.',
      ],
      behavior: { type: 'look-around' },
    },
    // ─── Aether Researcher ───
    {
      id: 'museum-aether-researcher',
      tileX: 8,
      tileY: 5,
      textureKey: 'npc-scientist',
      facing: 'left',
      dialogue: [
        "I'm studying the connection between fossils and Aether energy.",
        'Ancient Pokémon may have drawn power directly from ley lines.',
        'The Synthesis Collective claims to have rediscovered this ability...',
      ],
      setsFlag: 'museum_aether_lore',
      flagDialogue: [
        {
          flag: 'saw_aldric_hologram',
          dialogue: [
            "You've seen Aldric's work firsthand?",
            'His methods are dangerous. The ancient Pokémon perished for a reason.',
            "The Aether isn't meant to be concentrated like that.",
          ],
        },
      ],
    },
    // ─── Fossil Revival NPC ───
    {
      id: 'museum-fossil-revival',
      tileX: 8,
      tileY: 9,
      textureKey: 'npc-male-3',
      facing: 'up',
      dialogue: [
        'I can revive fossils into living Pokémon!',
        'Bring me a Helix Fossil, Dome Fossil, or Old Amber.',
        'The process takes just a moment!',
      ],
      requireFlag: 'defeatedBrock',
      flagDialogue: [
        {
          flag: '!defeatedBrock',
          dialogue: [
            'This machine can revive fossils...',
            "But I need the Gym Leader's approval first.",
            "Come back after you've proven yourself to Brock!",
          ],
        },
      ],
    },
    // ─── Museum Visitor ───
    {
      id: 'museum-visitor',
      tileX: 3,
      tileY: 8,
      textureKey: 'npc-male-1',
      facing: 'right',
      dialogue: [
        'These fossils remind me of my childhood...',
        'My grandfather was a paleontologist in Sinnoh.',
      ],
      behavior: { type: 'look-around' },
    },
  ],
  trainers: [],
  warps: [
    { tileX: 6, tileY: 11, targetMap: 'pewter-city', targetSpawnId: 'from-museum' },
    { tileX: 7, tileY: 11, targetMap: 'pewter-city', targetSpawnId: 'from-museum' },
  ],
  spawnPoints: {
    'default': { x: 7, y: 10, direction: 'up' },
  },
};
