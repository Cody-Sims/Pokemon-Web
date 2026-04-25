import { MapDefinition, parseMap } from '../shared';

const ground = parseMap([
  // 01234567
  '########', // 0 - north wall
  '#w_V__w#', // 1 - window + TV
  '#_t__b_#', // 2 - table + bookshelf
  '#_i__N_#', // 3 - chair + plant
  '#______#', // 4
  '#__rr__#', // 5 - rug
  '#__rr__#', // 6 - rug
  '#___v__#', // 7 - exit mat
]);

export const palletPlayerHouse: MapDefinition = {
  key: 'pallet-player-house',
  width: 8,
  height: 8,
  ground,
  encounterTableKey: '',
  isInterior: true,
  displayName: 'Your House',
  npcs: [
    {
      id: 'house-mom',
      name: 'Mom',
      tileX: 2,
      tileY: 4,
      textureKey: 'npc-mom',
      facing: 'down',
      dialogue: [
        'Mom: Good morning, sweetie!',
        'Mom: Prof. Willow is in the lab to the south.',
      ],
      interactionType: 'heal',
      flagDialogue: [
        {
          flag: 'enteredHallOfFame',
          dialogue: [
            'Mom: Champion! Your father would be so proud...',
            'Mom: You\'ve done something incredible.',
            'Mom: But you\'ll always be my baby. Come rest up!',
          ],
        },
        {
          flag: 'defeatedBrock',
          dialogue: [
            'Mom: I heard you beat the Pewter Gym! I\'m so proud!',
            'Mom: Be careful out there! Come back if you need to rest.',
          ],
        },
        {
          flag: 'runningShoes',
          dialogue: [
            'Mom: Be careful out there!',
            'Mom: Come home whenever you need a rest!',
          ],
        },
        {
          flag: 'receivedStarter',
          dialogue: [
            'Mom: Be careful out there!',
            'Mom: Oh! Before you go, take these.',
            'Mom: They\'re RUNNING SHOES! Hold SHIFT to run!',
          ],
          setFlag: 'runningShoes',
        },
      ],
    },
  ],
  trainers: [],
  warps: [
    // Exit mat → Pallet Town (one tile below the door)
    { tileX: 4, tileY: 7, targetMap: 'pallet-town', targetSpawnId: 'from-player-house' },
  ],
  spawnPoints: {
    'default': { x: 4, y: 6, direction: 'up' },
  },
};
