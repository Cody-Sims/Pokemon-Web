import { CutsceneDefinition } from '@systems/CutsceneEngine';

export const cutsceneData: Record<string, CutsceneDefinition> = {
  'rival-intro': {
    id: 'rival-intro',
    actions: [
      { type: 'showEmote', targetId: 'player', emote: 'exclamation' },
      { type: 'wait', ms: 500 },
      { type: 'dialogue', speaker: 'Kael', lines: [
        'Hey! You there!',
        'I heard you got a Pokémon from the Professor.',
        'Let\'s see how strong you really are!',
      ]},
      { type: 'flashScreen', duration: 200 },
    ],
  },
  'willow-lab-intro': {
    id: 'willow-lab-intro',
    actions: [
      { type: 'dialogue', speaker: 'Prof. Willow', lines: [
        'Welcome to my laboratory!',
        'I study the Pokémon of the Aurum Region.',
        'But first, choose your partner Pokémon!',
      ]},
    ],
  },
  'route-1-blockade': {
    id: 'route-1-blockade',
    actions: [
      { type: 'showEmote', targetId: 'player', emote: 'exclamation' },
      { type: 'wait', ms: 300 },
      { type: 'faceNPC', npcId: 'route1-guard', direction: 'down' },
      { type: 'dialogue', speaker: 'Old Man', lines: [
        'Hold on there, youngster!',
        'The tall grass ahead is full of wild Pokémon.',
        'You\'ll need your own Pokémon to get through safely!',
      ]},
      { type: 'setFlag', flag: 'route1BlockadeWarning' },
    ],
  },
};
