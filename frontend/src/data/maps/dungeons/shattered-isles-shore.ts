import { MapDefinition, parseMap } from '../shared';

// Shattered Isles — Shore (25 wide × 30 tall)
// A once-beautiful island scarred by the Aether eruption 20 years ago.
// Fractured ground, crystalline growths, dead tree stumps, ruined structures.
// Rook stands near a campfire, seeking redemption.
const shoreGround = parseMap([
  'WWWWWWWWWWWWWWWWWWWWWWWWW', // 0
  'WWWW¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬WWW', // 1
  'WWW¬¬¬÷¬¬¬¬¬¬¬¬÷¬¬¬¬WWW', // 2
  'WW¬¬¬¬¬¬®®®¬¬¬¬¬¬¬¬¬WWW', // 3
  'WW¬¬÷¬¬¬®¬®¬¬T¬¬¬÷¬¬WWW', // 4
  'WW¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬WWW', // 5
  'WW¬¬¬¬T¬¬¬¬¬¬÷¬¬¬¬¬¬WWW', // 6
  'WW¬¬¬¬¬¬¬¬¬¬¬¬¬¬T¬¬¬WWW', // 7
  'WW¬÷¬¬¬¬¬¬¬¬¬¬¬¬¬¬÷WWWW', // 8
  'WW¬¬¬¬®®®®¬¬¬¬¬¬¬¬¬WWWW', // 9
  'WW¬¬¬¬®¬¬®¬¬÷¬¬¬¬¬¬WWWW', // 10
  'WW¬¬¬¬®¬¬®¬¬¬¬¬T¬¬¬WWWW', // 11
  'WW¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬WWWW', // 12
  'WW¬÷¬¬¬¬¬¬¬¬¬¬¬¬÷¬¬WWWW', // 13
  'WW¬¬¬¬T¬¬¬¬¬¬¬¬¬¬¬¬WWWW', // 14
  'WW¬¬¬¬¬¬¬÷¬¬¬¬¬¬¬¬¬WWWW', // 15
  'WW¬¬¬¬¬¬¬¬¬¬¬¬T¬¬¬¬WWWW', // 16
  'WW¬÷¬¬¬¬¬¬¬¬¬¬¬¬÷¬¬WWWW', // 17
  'WW¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬WWWW', // 18
  'WW¬¬¬¬®®¬¬¬¬÷¬¬¬¬¬¬WWWW', // 19
  'WW¬¬¬¬®¬¬¬¬¬¬¬¬T¬¬¬WWWW', // 20
  'WW¬¬÷¬¬¬¬¬¬¬¬¬¬¬¬¬¬WWWW', // 21
  'WW¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬÷¬WWWW', // 22
  'WWs¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬WWWW', // 23
  'WWss¬¬¬¬¬¬¬¬¬¬¬¬¬¬ssWWWW', // 24
  'WWsss¬¬¬¬¬¬¬¬¬¬¬¬sssWWWW', // 25
  'WWssss¬¬¬¬¬¬¬¬¬¬ssssWWWW', // 26
  'WWWssssss¬¬¬¬¬sssssWWWWW', // 27
  'WWWWssssss¬¬¬¬ssssWWWWWW', // 28
  'WWWWWWWWss¬¬ssWWWWWWWWWW', // 29
]);

export const shatteredIslesShore: MapDefinition = {
  key: 'shattered-isles-shore',
  width: 25,
  height: 30,
  ground: shoreGround,
  encounterTableKey: 'shattered-isles-shore',
  battleBg: 'bg-ruins',
  displayName: 'Shattered Isles — Shore',
  onEnterCutscene: 'fathers-journal-discovery',
  onEnterCutsceneRequireFlag: 'quest_fatherTrail_started',
  npcs: [
    // ─── Rook NPC — seeking redemption ───
    {
      id: 'rook-postgame-npc',
      tileX: 7,
      tileY: 12,
      textureKey: 'npc-rook',
      facing: 'down',
      requireFlag: 'enteredHallOfFame',
      dialogue: [
        'Rook: ...You came all the way out here.',
        'Rook: I used to work for the Synthesis Collective.',
        'Rook: I did terrible things in the name of progress.',
        'Rook: But standing on these shattered shores... I see what that ambition cost.',
        'Rook: If you want to test yourself against someone who\'s seen the worst...',
        'Rook: Then face me. Let me see if you have the strength to set things right.',
      ],
    },
  ],
  trainers: [
    {
      id: 'rook-postgame-trainer',
      trainerId: 'rook-postgame',
      tileX: 7,
      tileY: 12,
      textureKey: 'npc-rook',
      facing: 'down',
      lineOfSight: 0,
      condition: 'enteredHallOfFame',
    },
  ],
  warps: [
    // South dock → Coral Harbor
    { tileX: 11, tileY: 29, targetMap: 'coral-harbor', targetSpawnId: 'from-shattered-isles' },
    { tileX: 12, tileY: 29, targetMap: 'coral-harbor', targetSpawnId: 'from-shattered-isles' },
    // North path → Shattered Isles Ruins
    { tileX: 11, tileY: 0, targetMap: 'shattered-isles-ruins', targetSpawnId: 'from-shore' },
    { tileX: 12, tileY: 0, targetMap: 'shattered-isles-ruins', targetSpawnId: 'from-shore' },
  ],
  spawnPoints: {
    'default':             { x: 11, y: 28, direction: 'up' },
    'from-coral-harbor':   { x: 11, y: 28, direction: 'up' },
    'from-ruins':          { x: 12, y: 1, direction: 'down' },
  },
};
