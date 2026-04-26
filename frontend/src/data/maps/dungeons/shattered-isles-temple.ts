import { MapDefinition, parseMap } from '../shared';

// Shattered Isles — Temple (18 wide × 22 tall)
// The convergence point. Unlike the ruined exterior, the temple interior
// is eerily pristine, protected by Solatheon's presence.
// Ornate floor patterns, towering pillars, and a central altar.
const templeGround = parseMap([
  '®®®®®®®®®®®®®®®®®®', // 0
  '®Ð©ÐÐÐÐÐÐÐÐÐÐÐÐ©Ð®', // 1
  '®ÐÐÐÐ÷ÐÐÐÐÐÐ÷ÐÐÐÐ®', // 2
  '®Ð©ÐÐÐÐÐÐÐÐÐÐÐÐ©Ð®', // 3
  '®ÐÐÐÐÐƉÐÐÐƉÐÐÐÐÐÐ®', // 4
  '®®®®ÐÐÐÐÐÐÐÐÐÐ®®®®', // 5
  '®ÐÐÐÐÐÐ©ÐÐ©ÐÐÐÐÐÐ®', // 6
  '®ÐÐ÷ÐÐÐÐÐÐÐÐÐÐ÷ÐÐ®', // 7
  '®ÐÐÐÐÐÐÐÐÐÐÐÐÐÐÐÐ®', // 8
  '®Ð©ÐÐÐƉÐÐÐÐƉÐÐÐ©Ð®', // 9
  '®ÐÐÐÐÐÐÐÐÐÐÐÐÐÐÐÐ®', // 10
  '®ÐÐ÷ÐÐÐÐÐÐÐÐÐÐ÷ÐÐ®', // 11
  '®ÐÐÐÐÐÐ©ÐÐ©ÐÐÐÐÐÐ®', // 12
  '®ÐÐÐÐÐÐÐÐÐÐÐÐÐÐÐÐ®', // 13
  '®®®ÐÐÐÐÐÐÐÐÐÐÐ®®®®', // 14
  '®ÐÐÐÐÐƉÐÐÐƉÐÐÐÐÐÐ®', // 15
  '®Ð©ÐÐÐÐÐÐÐÐÐÐÐÐ©Ð®', // 16
  '®ÐÐÐÐ÷ÐÐÐÐÐÐ÷ÐÐÐÐ®', // 17
  '®ÐÐÐÐÐÐÐÐÐÐÐÐÐÐÐÐ®', // 18
  '®Ð©ÐÐÐÐÐÐÐÐÐÐÐÐ©Ð®', // 19
  '®®®®®®®®ÐÐÐÐ®®®®®®', // 20
  '®®®®®®®®ÐÐÐÐ®®®®®®', // 21
]);

export const shatteredIslesTemple: MapDefinition = {
  key: 'shattered-isles-temple',
  width: 18,
  height: 22,
  ground: templeGround,
  encounterTableKey: 'shattered-isles-temple',
  battleBg: 'bg-ruins',
  displayName: 'Shattered Isles — Temple',
  npcs: [
    // ─── Solatheon encounter at the altar ───
    {
      id: 'solatheon-altar',
      tileX: 9,
      tileY: 2,
      textureKey: 'item-ball',
      facing: 'down',
      requireFlag: '!solatheon_caught',
      dialogue: [
        'A brilliant light emanates from the altar...',
        'The air hums with ancient Aether energy.',
        'A legendary Pokémon stirs from its millennia-long slumber!',
      ],
      interactionType: 'wild-encounter',
      interactionData: '152',
    },
    // ─── Father NPC (appears after quest completion) ───
    {
      id: 'father-temple',
      name: 'Father',
      tileX: 9,
      tileY: 4,
      textureKey: 'npc-oak',
      facing: 'down',
      requireFlag: 'quest_fatherTrail_complete',
      triggerCutscene: 'father-reunion',
      dialogue: [
        'Father: ...You found me.',
        'Father: I\'ve been guarding this place for a long time.',
        'Father: The convergence point must be protected.',
        'Father: But seeing you here, standing tall as a Champion...',
        'Father: I couldn\'t be more proud.',
        'Father: Rest your Pokémon. You\'ve earned it.',
      ],
      flagDialogue: [
        { flag: 'father_found', dialogue: [
          'Father: I\'m so glad you\'re safe.',
          'Father: Rest your Pokémon here whenever you need to.',
        ]},
      ],
      interactionType: 'heal',
    },
  ],
  trainers: [],
  warps: [
    // South exit → Shattered Isles Ruins
    { tileX: 9, tileY: 21, targetMap: 'shattered-isles-ruins', targetSpawnId: 'from-temple' },
    { tileX: 10, tileY: 21, targetMap: 'shattered-isles-ruins', targetSpawnId: 'from-temple' },
  ],
  spawnPoints: {
    'default':     { x: 9, y: 20, direction: 'up' },
    'from-ruins':  { x: 9, y: 20, direction: 'up' },
  },
};
