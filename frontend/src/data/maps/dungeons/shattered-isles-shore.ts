import { MapDefinition, parseMap } from '../shared';

// Shattered Isles — Shore (25 wide × 30 tall)
// A once-beautiful island scarred by the Aether eruption 20 years ago.
// Fractured ground, crystalline growths, dead tree stumps, ruined structures.
// Rook stands near a campfire, seeking redemption.
const shoreGround = parseMap([
  'WWWWWWWWWWWssWWWWWWWWWWWW', // 0
  'WWWW¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬WWWWW', // 1
  'WWW¬¬¬÷¬¬¬¬¬¬¬¬÷¬¬¬¬WWWWW', // 2
  'WW¬¬¬¬¬¬®®®¬¬¬¬¬¬¬¬¬WWWWW', // 3
  'WW¬¬÷¬¬¬®¬®¬¬T¬¬¬÷¬¬WWWWW', // 4
  'WW¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬WWWWW', // 5
  'WW¬¬¬¬T¬¬¬¬¬¬÷¬¬¬¬¬¬WWWWW', // 6
  'WW¬¬¬¬¬¬¬¬¬¬¬¬¬¬T¬¬¬WWWWW', // 7
  'WW¬÷¬¬¬¬¬¬¬¬¬¬¬¬¬¬÷WWWWWW', // 8
  'WW¬¬¬¬®®®®¬¬¬¬¬¬¬¬¬WWWWWW', // 9
  'WW¬¬¬¬®¬¬®¬¬÷¬¬¬¬¬¬WWWWWW', // 10
  'WW¬¬¬¬®¬¬®¬¬¬¬¬T¬¬¬WWWWWW', // 11
  'WW¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬WWWWWW', // 12
  'WW¬÷¬¬¬¬¬¬¬¬¬¬¬¬÷¬¬WWWWWW', // 13
  'WW¬¬¬¬T¬¬¬¬¬¬¬¬¬¬¬¬WWWWWW', // 14
  'WW¬¬¬¬¬¬¬÷¬¬¬¬¬¬¬¬¬WWWWWW', // 15
  'WW¬¬¬¬¬¬¬¬¬¬¬¬T¬¬¬¬WWWWWW', // 16
  'WW¬÷¬¬¬¬¬¬¬¬¬¬¬¬÷¬¬WWWWWW', // 17
  'WW¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬WWWWWW', // 18
  'WW¬¬¬¬®®¬¬¬¬÷¬¬¬¬¬¬WWWWWW', // 19
  'WW¬¬¬¬®¬¬¬¬¬¬¬¬T¬¬¬WWWWWW', // 20
  'WW¬¬÷¬¬¬¬¬¬¬¬¬¬¬¬¬¬WWWWWW', // 21
  'WW¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬÷¬WWWWWW', // 22
  'WWs¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬WWWWWW', // 23
  'WWss¬¬¬¬¬¬¬¬¬¬¬¬¬¬ssWWWWW', // 24
  'WWsss¬¬¬¬¬¬¬¬¬¬¬¬sssWWWWW', // 25
  'WWssss¬¬¬¬¬¬¬¬¬¬ssssWWWWW', // 26
  'WWWssssss¬¬¬¬¬sssssWWWWWW', // 27
  'WWWWssssss¬¬¬¬ssssWWWWWWW', // 28
  'WWWWWWWWss¬¬ssWWWWWWWWWWW', // 29
]);

export const shatteredIslesShore: MapDefinition = {
  key: 'shattered-isles-shore',
  width: 25,
  height: 30,
  ground: shoreGround,
  encounterTableKey: 'shattered-isles-shore',
  battleBg: 'bg-ruins',
  displayName: 'Shattered Isles — Shore',
  weather: 'rain',
  onEnterCutscene: 'fathers-journal-discovery',
  onEnterCutsceneRequireFlag: 'quest_fatherTrail_started',
  npcs: [
    // ─── Rook NPC — seeking redemption ───
    {
      id: 'rook-postgame-npc',
      name: 'Rook',
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
      name: 'Rook',
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
