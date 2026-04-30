import { MapDefinition, parseMap } from '../shared';

// Shattered Isles — Ruins (20 wide × 25 tall)
// Ancient civilization remains destroyed by the Aether eruption.
// Collapsed walls, exposed ley-lines, pillars leaning at angles.
// Father's journal entries are found at 5 interactable points.
const ruinsGround = parseMap([
  '®®®®®®®®®‡‡®®®®®®®®®', // 0
  '®‡‡‡‡‡®‡‡‡‡‡‡®‡‡‡‡‡®', // 1
  '®‡‡©‡‡‡‡‡÷‡‡‡‡‡‡©‡‡®', // 2
  '®‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡®', // 3
  '®‡‡‡Ɖ‡‡‡‡‡‡‡‡‡Ɖ‡‡‡‡®', // 4
  '®‡‡‡‡‡©‡‡‡‡‡©‡‡‡‡‡‡®', // 5
  '®‡÷‡‡‡‡‡‡‡‡‡‡‡‡‡÷‡‡®', // 6
  '®®®®‡‡‡‡‡‡‡‡‡‡‡‡®®®®', // 7
  '®‡‡‡‡‡‡©‡‡‡‡©‡‡‡‡‡‡®', // 8
  '®‡‡‡‡‡‡‡‡Ɖ‡‡‡‡‡‡‡‡‡®', // 9
  '®‡‡÷‡‡‡‡‡‡‡‡‡‡‡÷‡‡‡®', // 10
  '®‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡®', // 11
  '®‡‡‡‡©‡‡‡‡‡‡‡‡©‡‡‡‡®', // 12
  '®‡‡‡‡‡‡‡‡÷‡‡‡‡‡‡‡‡‡®', // 13
  '®®®‡‡‡‡‡‡‡‡‡‡‡‡‡‡®®®', // 14
  '®‡‡‡‡‡Ɖ‡‡‡‡‡‡Ɖ‡‡‡‡‡®', // 15
  '®‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡®', // 16
  '®‡÷‡‡‡‡©‡‡‡‡©‡‡‡‡÷‡®', // 17
  '®‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡®', // 18
  '®‡‡‡©‡‡‡‡Ɖ‡‡‡‡©‡‡‡‡®', // 19
  '®‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡®', // 20
  '®‡‡÷‡‡‡‡‡‡‡‡‡‡‡‡÷‡‡®', // 21
  '®‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡‡®', // 22
  '®®®®®®®®‡‡‡‡®®®®®®®®', // 23
  '®®®®®®®®‡‡‡‡®®®®®®®®', // 24
]);

export const shatteredIslesRuins: MapDefinition = {
  key: 'shattered-isles-ruins',
  width: 20,
  height: 25,
  ground: ruinsGround,
  encounterTableKey: 'shattered-isles-ruins',
  battleBg: 'bg-ruins',
  displayName: 'Shattered Isles — Ruins',
  npcs: [],
  trainers: [],
  objects: [
    {
      id: 'fathers-trail-clue-1',
      tileX: 4,
      tileY: 3,
      textureKey: 'ruins-pedestal', objectType: 'item-ball',
      dialogue: [
        'You find a weathered journal page wedged between the stones...',
        '"Day 1 — I\'ve arrived at the Shattered Isles. The devastation is worse than the reports suggested."',
        '"The Aether ley lines are unstable. I can feel them pulsing beneath the ground."',
        '"I must find the source before the Collective does."',
      ],
      setsFlag: 'fatherTrail_clue1' },
    {
      id: 'fathers-trail-clue-2',
      tileX: 15,
      tileY: 6,
      textureKey: 'ruins-pedestal', objectType: 'item-ball',
      dialogue: [
        'Another journal fragment lies among the rubble...',
        '"Day 4 — The ruins are extensive. An entire civilization once thrived here."',
        '"They built their temple at the convergence point — where all ley lines meet."',
        '"I\'m getting closer. The crystal formations are growing denser."',
      ],
      setsFlag: 'fatherTrail_clue2' },
    {
      id: 'fathers-trail-clue-3',
      tileX: 9,
      tileY: 11,
      textureKey: 'ruins-pedestal', objectType: 'item-ball',
      dialogue: [
        'A crumpled page is pinned under a fallen pillar...',
        '"Day 7 — I\'ve made contact with local Pokémon. They\'re drawn to the Aether energy."',
        '"The stronger ones guard the inner ruins fiercely."',
        '"Something ancient sleeps at the heart of the temple. I can sense it."',
      ],
      setsFlag: 'fatherTrail_clue3' },
    {
      id: 'fathers-trail-clue-4',
      tileX: 5,
      tileY: 16,
      textureKey: 'ruins-pedestal', objectType: 'item-ball',
      dialogue: [
        'A torn page flutters in the wind near a glowing conduit...',
        '"Day 12 — The temple entrance is sealed by an ancient mechanism."',
        '"It responds to the badges — symbols of a trainer\'s proven strength."',
        '"Perhaps the ancients designed it this way. Only the worthy may enter."',
      ],
      setsFlag: 'fatherTrail_clue4' },
    {
      id: 'fathers-trail-clue-5',
      tileX: 14,
      tileY: 20,
      textureKey: 'ruins-pedestal', objectType: 'item-ball',
      dialogue: [
        'The final journal entry is carefully placed on a stone pedestal...',
        '"Day 15 — I\'ve done it. The temple has accepted me."',
        '"Inside, I found Solatheon — the Guardian of the Aether."',
        '"I\'ve chosen to stay and protect the convergence point."',
        '"If you\'re reading this... I\'m proud of how far you\'ve come."',
      ],
      setsFlag: 'fatherTrail_clue5' }
  ],
  warps: [
    // South exit → Shattered Isles Shore
    { tileX: 9, tileY: 24, targetMap: 'shattered-isles-shore', targetSpawnId: 'from-ruins' },
    { tileX: 10, tileY: 24, targetMap: 'shattered-isles-shore', targetSpawnId: 'from-ruins' },
    // North exit → Shattered Isles Temple
    { tileX: 9, tileY: 0, targetMap: 'shattered-isles-temple', targetSpawnId: 'from-ruins' },
    { tileX: 10, tileY: 0, targetMap: 'shattered-isles-temple', targetSpawnId: 'from-ruins' },
  ],
  spawnPoints: {
    'default':     { x: 10, y: 23, direction: 'up' },
    'from-shore':  { x: 10, y: 23, direction: 'up' },
    'from-temple': { x: 10, y: 1, direction: 'down' },
  },
};
