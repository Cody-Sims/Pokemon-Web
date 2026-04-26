import { MapDefinition, parseMap } from '../shared';

// Route 7 — Dr. Vex blockade, connects Wraithmoor to Scalecrest
const route7Ground = parseMap([
  '^^^^^^^.PP.^^^^^^^^^',
  '^..4.....PP........^',
  '^.~GGG,..PP...GGG..^',
  '^..GGG...PP...GGG..^',
  '^.4..q...PP...~.4..^',
  '^....PPPPPPPPPP....^',
  '^.,..PP....4...~...^',
  '^....PP....GGG.....^',
  '^.,..PP....GGG.....^',
  '^.q..PP........,~..^',
  '^....PPPPPPPPPP....^',
  '^....4...PP........^',
  '^..GGG,..PP.,.GGG..^',
  '^..GGG...PP...GGG..^',
  '^.~.4....PP....4.~.^',
  '^........PP........^',
  '^....PPPPPPPPPP....^',
  '^..~.PP............^',
  '^.,..PP......GGG.~.^',
  '^....PP......GGG...^',
  '^.q..PP.....4...,..^',
  '^....PPPPPPPPPP....^',
  '^.4...,..PP..,..4..^',
  '^..f..~..PP..~..f..^',
  '^.4......PP......4.^',
  '^..GGG,..PP.,.GGG..^',
  '^..GGG...PP...GGG..^',
  '^.~..4...PP...4..~.^',
  '^........PP........^',
  '^^^^^^^.PP.^^^^^^^^^',
]);

export const route7: MapDefinition = {
  key: 'route-7', width: 20, height: 30, ground: route7Ground,
  encounterTableKey: 'route-7', battleBg: 'bg-ruins',
  weather: 'fog',
  npcs: [
    { id: 'route7-rook-reveal', name: 'Rook', tileX: 8, tileY: 15, textureKey: 'npc-male-5', facing: 'down',
      triggerCutscene: 'rook-reveal',
      dialogue: [
        'Rook: ...It\'s time I told you the truth.',
        'Rook: My name is Rook. I was a Synthesis Collective scientist.',
        'Rook: I helped design the Aether extraction process.',
        'Rook: When I saw what it did to the Pokémon... I couldn\'t stay.',
        'Rook: I\'ve been sabotaging their operations ever since.',
        'Rook: Take this — the Aether Lens. It reveals hidden ley-line passages.',
        'Rook: You\'ll need it in their base.',
      ],
      flagDialogue: [
        { flag: 'rook_revealed', dialogue: [
          'Rook: The Aether Lens will reveal hidden passages in the Spire.',
          'Rook: Be careful in there.',
        ], setFlag: 'hasAetherLens' },
      ],
      requireFlag: 'defeatedVex2', setsFlag: 'rook_revealed' }
  ],
  trainers: [
    { id: 'route7-grunt-6', name: 'Synthesis Grunt', trainerId: 'synthesis-grunt-3', tileX: 6, tileY: 7, textureKey: 'npc-grunt', facing: 'right', lineOfSight: 4 },
    { id: 'route7-grunt-7', name: 'Synthesis Grunt', trainerId: 'synthesis-grunt-3', tileX: 14, tileY: 13, textureKey: 'npc-grunt', facing: 'left', lineOfSight: 3 },
    { id: 'route7-grunt-8', name: 'Synthesis Grunt', trainerId: 'synthesis-grunt-3', tileX: 6, tileY: 19, textureKey: 'npc-grunt', facing: 'right', lineOfSight: 4 },
    // ─── Elite Grunt Gauntlet (disappear after Vex is defeated) ───
    { id: 'route7-elite-1', name: 'Synthesis Elite', trainerId: 'synth-elite-r7-1', tileX: 12, tileY: 5, textureKey: 'npc-grunt', facing: 'left', lineOfSight: 4, condition: '!defeatedVex2' },
    { id: 'route7-elite-2', name: 'Synthesis Elite', trainerId: 'synth-elite-r7-2', tileX: 5, tileY: 11, textureKey: 'npc-grunt', facing: 'right', lineOfSight: 4, condition: '!defeatedVex2' },
    { id: 'route7-elite-3', name: 'Synthesis Elite', trainerId: 'synth-elite-r7-3', tileX: 14, tileY: 17, textureKey: 'npc-grunt', facing: 'left', lineOfSight: 4, condition: '!defeatedVex2' },
    { id: 'route7-vex-2', name: 'Admin Vex', trainerId: 'admin-vex-2', tileX: 10, tileY: 10, textureKey: 'npc-admin-vex', facing: 'down', lineOfSight: 5 },
  ],
  objects: [
    { id: 'route7-sign', tileX: 11, tileY: 1, textureKey: 'sign-post', objectType: 'sign',
      dialogue: ['ROUTE 7', 'Scalecrest Citadel ↓  Wraithmoor Town ↑'] }
  ],
  warps: [
    { tileX: 8, tileY: 0, targetMap: 'wraithmoor-town', targetSpawnId: 'from-route-7' },
    { tileX: 9, tileY: 0, targetMap: 'wraithmoor-town', targetSpawnId: 'from-route-7' },
    { tileX: 8, tileY: 29, targetMap: 'scalecrest-citadel', targetSpawnId: 'from-route-7' },
    { tileX: 9, tileY: 29, targetMap: 'scalecrest-citadel', targetSpawnId: 'from-route-7' },
  ],
  spawnPoints: {
    'default': { x: 9, y: 15, direction: 'down' },
    'from-wraithmoor': { x: 9, y: 1, direction: 'down' },
    'from-scalecrest': { x: 9, y: 28, direction: 'up' },
  },
};
