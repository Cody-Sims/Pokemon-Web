import { MapDefinition, parseMap } from '../shared';

// Cinderfall Town — Town 9 (24×25). Gym 8 (Fire — Solara)
// Volcanic caldera town with ash ground, ember vents, hot springs
// Þ=VOLCANIC_WALL  Ø=LAVA_ROCK  «=ASH_GROUND  »=EMBER_VENT  ±=HOT_SPRING  µ=MAGMA_CRACK
const cinderfallGround = parseMap([
  'ÞÞÞÞÞÞÞÞÞÞ«PP«ÞÞÞÞÞÞÞÞÞÞ',
  'Þ««««««««««PP««««««««««Þ',
  'Þ«CCCCCCC««PP«RRRRRRR««Þ',
  'Þ«c$ccccc««PP«HH&HHHH««Þ',
  'Þ«ccecccc««PP«HHHDHHH««Þ',
  'Þ«µ««PP«PPPPPP«µ««««««ØÞ',
  'Þ«««ØPP««««««««»«««««Ø«Þ',
  'Þ««µ«PP««MMMMMM«««««««ØÞ',
  'Þ«««ØPP««mm&mmm«««»««Ø«Þ',
  'Þ««««PP««mmnmmm«««««µ««Þ',
  'Þ«««ØPPPPPPPPPPPPPPØ«««Þ',
  'Þ«µ«ØPP«««««µ««««Ø««µ««Þ',
  'Þ«»«ØPP««««««««»«Ø«««««Þ',
  'Þ«««ØPP«µ«««««µ««Ø«««««Þ',
  'Þ««««PPPPPPPPPP±±±±««««Þ',
  'Þ«µ««PP««««µ«««±±±±±«««Þ',
  'Þ«AAAAAAA««PP««±±±±«««ØÞ',
  'Þ«ggg&ggg««PP««««µ««««ØÞ',
  'Þ«gggaggg««PP«»«««««»«ØÞ',
  'Þ«µ««««««««PPµ«««µ««««ØÞ',
  'Þ«»««««««««PP««««««»«««Þ',
  'Þ«µ««««««««PP«««««««««ØÞ',
  'Þ««««««««««PP«««µ«»««««Þ',
  'Þ««««««««««PP«««««««««ØÞ',
  'ÞÞÞÞÞÞÞÞÞÞ«PP«ÞÞÞÞÞÞÞÞÞÞ',
]);

export const cinderfallTown: MapDefinition = {
  key: 'cinderfall-town', width: 24, height: 25, ground: cinderfallGround,
  encounterTableKey: '', battleBg: 'bg-fire', displayName: 'Cinderfall Town',
  weather: 'sandstorm',
  npcs: [
    { id: 'cinderfall-sign', tileX: 13, tileY: 1, textureKey: 'generic-trainer', facing: 'down',
      dialogue: ['CINDERFALL TOWN', '"Born From the Embers"'] },
    { id: 'cinderfall-npc', name: 'Townsperson', tileX: 16, tileY: 6, textureKey: 'npc-female-3', facing: 'left',
      dialogue: ['Solara is our Gym Leader. She was once Aldric\'s student.',
        'Her Fire Pokémon burn with incredible passion!',
        'Water, Ground, and Rock moves are your best bet.'] },
    { id: 'cinderfall-solara-story', name: 'Solara', tileX: 10, tileY: 12, textureKey: 'npc-female-4', facing: 'down',
      dialogue: ['Solara: You\'ve come far, challenger.',
        'Solara: I know what awaits you at the League.',
        'Solara: Aldric was my teacher once. The greatest trainer I ever knew.',
        'Solara: But the man he became after the Shattered Isles incident...',
        'Solara: That man needs to be stopped.',
        'Solara: End this. For his sake as much as ours.'],
      requireFlag: 'rook_identity_revealed', setsFlag: 'solara_confession' },
    { id: 'cinderfall-hotspring', name: 'Hot Spring Attendant', tileX: 14, tileY: 15, textureKey: 'npc-female-2', facing: 'left',
      dialogue: ['Hot Spring Attendant: Welcome! Our springs heal all ailments.',
        'Your Pokémon feel refreshed and fully healed!'],
      interactionType: 'heal' },
    // Dr. Ash — Volcanic Survey quest giver
    { id: 'cinderfall-dr-ash', name: 'Dr. Ash', tileX: 15, tileY: 20, textureKey: 'npc-scientist', facing: 'left',
      dialogue: [
        'Dr. Ash: I\'m studying the volcanic activity around Cinderfall.',
        'Dr. Ash: I need temperature readings from 5 vents, but the wild Pokémon are too aggressive.',
        'Dr. Ash: Could you take this device and record the data for me?',
      ],
      setsFlag: 'quest_volcanicSurvey_started',
      flagDialogue: [
        {
          flag: 'quest_volcanicSurvey_complete',
          dialogue: [
            'Dr. Ash: The data is incredible! Thank you!',
            'Dr. Ash: Here — take this Fire Stone and Charcoal as thanks.',
          ],
        },
        {
          flag: 'quest_volcanicSurvey_started',
          dialogue: [
            'Dr. Ash: Still collecting readings?',
            'Dr. Ash: The vents are scattered around Victory Road and the routes nearby.',
            'Dr. Ash: Be careful — Fire-types guard the vents!',
          ],
        },
      ],
    },
  ],
  trainers: [],
  warps: [
    { tileX: 11, tileY: 0, targetMap: 'scalecrest-citadel', targetSpawnId: 'from-cinderfall' },
    { tileX: 12, tileY: 0, targetMap: 'scalecrest-citadel', targetSpawnId: 'from-cinderfall' },
    { tileX: 11, tileY: 24, targetMap: 'route-8', targetSpawnId: 'from-cinderfall' },
    { tileX: 12, tileY: 24, targetMap: 'route-8', targetSpawnId: 'from-cinderfall' },
    { tileX: 4, tileY: 4, targetMap: 'cinderfall-pokecenter', targetSpawnId: 'default' },
    { tileX: 11, tileY: 9, targetMap: 'cinderfall-pokemart', targetSpawnId: 'default' },
    { tileX: 5, tileY: 18, targetMap: 'cinderfall-gym', targetSpawnId: 'default' },
    // House interior
    { tileX: 17, tileY: 4, targetMap: 'cinderfall-town-house-1', targetSpawnId: 'default' },
  ],
  spawnPoints: {
    'default': { x: 12, y: 12, direction: 'up' },
    'from-scalecrest': { x: 12, y: 1, direction: 'down' },
    'from-victory-road': { x: 12, y: 23, direction: 'up' },
    'from-route-8': { x: 12, y: 23, direction: 'up' },
    'from-pokecenter': { x: 4, y: 5, direction: 'down' },
    'from-pokemart': { x: 11, y: 10, direction: 'down' },
    'from-gym': { x: 5, y: 19, direction: 'down' },
    'from-house-1': { x: 17, y: 5, direction: 'down' },
  },
};
