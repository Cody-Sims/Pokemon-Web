import { MapDefinition, parseMap } from '../shared';

// Abyssal Spire — Floor 4: Inner Sanctum
// Ancient temple revealed — cracked floors, ruin pillars, aether crystals
// Synthesis equipment parasitically grafted onto the ancient structure
const spireF4Ground = parseMap([
  '®®®®®®®®®®®®®®®', // 0
  '®‡‡‡‡÷‡‡‡‡÷‡‡‡®', // 1
  '®‡©‡‡‡‡‡‡‡‡‡©‡®', // 2  ruin pillars
  '®‡‡‡‡÷‡‡÷‡‡‡‡‡®', // 3  aether crystals
  '®‡‡‡‡‡‡‡‡‡‡‡‡‡®', // 4
  '®÷‡‡©‡‡‡‡‡©‡‡÷®', // 5
  '®‡‡‡‡‡‡ŦŦ‡‡‡‡‡®', // 6  lab equipment
  '®‡‡‡‡ŦƫŦŦ‡‡‡‡‡®', // 7  terminal
  '®‡‡‡‡‡‡ŦŦ‡‡‡‡‡®', // 8
  '®‡‡‡‡‡‡‡‡‡‡‡‡‡®', // 9
  '®÷‡‡©‡‡‡‡‡©‡‡÷®', // 10
  '®‡‡‡‡‡‡‡‡‡‡‡‡‡®', // 11
  '®‡©‡‡‡‡‡‡‡‡‡©‡®', // 12
  '®‡‡‡‡‡‡‡‡‡‡‡‡‡®', // 13
  '®®®®®®®‡‡®®®®®®', // 14
  '®®®®®®®‡‡®®®®®®', // 15
]);

export const abyssalSpireF4: MapDefinition = {
  key: 'abyssal-spire-f4',
  width: 15,
  height: 16,
  ground: spireF4Ground,
  encounterTableKey: 'abyssal-spire',
  battleBg: 'bg-cave',
  displayName: 'Abyssal Spire — Sanctum',
  npcs: [
    {
      id: 'professor-willow-rescue',
      tileX: 7,
      tileY: 7,
      textureKey: 'generic-trainer',
      facing: 'down',
      triggerCutscene: 'willow-rescue',
      dialogue: [
        'Professor Willow: You found me!',
        'Willow: Aldric captured me to extract my research on Aether energy.',
        'Willow: He\'s on the floor above — at the Altar.',
        'Willow: He\'s trying to harness the ancient power source beneath this temple.',
        'Willow: If he succeeds, he\'ll be unstoppable at the Pokemon League.',
        'Willow: Go! Stop him! I\'ll be alright — just go!',
      ],
      flagDialogue: [
        { flag: 'rescued_willow', dialogue: [
          'Willow: You must stop Aldric on the floor above.',
          'Willow: Be careful — he\'s absorbed a great deal of Aether energy.',
        ]},
      ],
      setsFlag: 'rescued_willow',
    },
    {
      id: 'sanctum-lore-1',
      tileX: 2,
      tileY: 2,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'Ancient glyphs cover this pillar...',
        '"The Aether flows through all living things."',
        '"To harness it is to defy the natural order."',
        'The Synthesis Collective built their lab right on top of this...',
      ],
    },
    {
      id: 'sanctum-lore-2',
      tileX: 12,
      tileY: 5,
      textureKey: 'generic-trainer',
      facing: 'down',
      dialogue: [
        'An aether crystal pulses with energy...',
        'You can feel the power radiating from it.',
        'Cables from Synthesis equipment snake into the crystal\'s base.',
        'They\'re draining the temple\'s power source.',
      ],
    },
  ],
  trainers: [],
  warps: [
    // South entrance → F3
    { tileX: 7, tileY: 15, targetMap: 'abyssal-spire-f3', targetSpawnId: 'default' },
    { tileX: 8, tileY: 15, targetMap: 'abyssal-spire-f3', targetSpawnId: 'default' },
    // North stairs → F5
    { tileX: 7, tileY: 0, targetMap: 'abyssal-spire-f5', targetSpawnId: 'from-f4' },
    { tileX: 8, tileY: 0, targetMap: 'abyssal-spire-f5', targetSpawnId: 'from-f4' },
  ],
  spawnPoints: {
    'default': { x: 7, y: 14, direction: 'up' },
    'from-f3': { x: 7, y: 14, direction: 'up' },
  },
};
