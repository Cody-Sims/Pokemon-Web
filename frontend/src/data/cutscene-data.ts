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

  // ─── Morwen Prophecy (post-Gym 6) ───
  'morwen-prophecy': {
    id: 'morwen-prophecy',
    actions: [
      { type: 'dialogue', speaker: 'Morwen', lines: [
        'The sleeper beneath the spire will not distinguish between savior and destroyer.',
        'Be certain of your resolve.',
        'The dead whisper of a convergence... and of one who watches from the shadows.',
      ]},
      { type: 'setFlag', flag: 'morwen_prophecy' },
    ],
  },

  // ─── Solara Confession (post-Gym 8) ───
  'solara-confession': {
    id: 'solara-confession',
    actions: [
      { type: 'dialogue', speaker: 'Solara', lines: [
        'There\'s something I need to tell you.',
        'The Champion... Aldric Maren... he was my teacher.',
        'He changed after the incident at the Shattered Isles.',
        'He became obsessed with control. With perfecting Pokémon.',
        'End this. For his sake as much as ours.',
      ]},
      { type: 'setFlag', flag: 'solara_confession' },
    ],
  },

  // ─── Ashborne Warning (post-E4 #4) ───
  'ashborne-warning': {
    id: 'ashborne-warning',
    actions: [
      { type: 'dialogue', speaker: 'Ashborne', lines: [
        '...You truly are remarkable.',
        'The Champion awaits in the chamber above.',
        'But I must warn you...',
        'Whatever you find up there... don\'t lose yourself.',
      ]},
      { type: 'setFlag', flag: 'ashborne_warning' },
    ],
  },

  // ─── Aldric Offer (Abyssal Spire F5) ───
  'aldric-spire-offer': {
    id: 'aldric-spire-offer',
    actions: [
      { type: 'playBGM', key: 'bgm-legendary' },
      { type: 'dialogue', speaker: 'Aldric', lines: [
        'I\'ve seen what nature does to the creatures we claim to love.',
        'I choose to do better.',
        'Join me. Together, we can build a world where no Pokémon ever suffers again.',
      ]},
      { type: 'wait', ms: 500 },
      { type: 'dialogue', speaker: 'Narrator', lines: [
        'You shake your head firmly.',
      ]},
      { type: 'dialogue', speaker: 'Aldric', lines: [
        'A shame. Then you leave me no choice.',
        'The Aether converges at the League. That is where this ends.',
      ]},
      { type: 'screenShake', duration: 500, intensity: 0.01 },
      { type: 'flashScreen', duration: 500 },
      { type: 'fadeToBlack', duration: 1000 },
      { type: 'wait', ms: 500 },
      { type: 'fadeFromBlack', duration: 1000 },
      { type: 'dialogue', speaker: 'Narrator', lines: [
        'When the light fades, Aldric is gone.',
        'The Aether conduit pulses ominously.',
        'You must reach the Pokémon League before it\'s too late.',
      ]},
      { type: 'setFlag', flag: 'aldric_escaped_to_league' },
    ],
  },

  // ─── Post-Champion Victory ───
  'post-champion-victory': {
    id: 'post-champion-victory',
    actions: [
      { type: 'screenShake', duration: 1000, intensity: 0.015 },
      { type: 'flashScreen', duration: 800 },
      { type: 'dialogue', speaker: 'Narrator', lines: [
        'The Aether conduit destabilizes!',
        'Energy surges through the chamber...',
      ]},
      { type: 'wait', ms: 500 },
      { type: 'dialogue', speaker: 'Narrator', lines: [
        'Using Professor Willow\'s ley-line data, you redirect the energy safely.',
        'Deep below, the ancient guardian Solatheon stirs...',
        'But sensing your compassion, it returns to peaceful slumber.',
      ]},
      { type: 'dialogue', speaker: 'Aldric', lines: [
        '...It\'s over then.',
        'Perhaps... perhaps you were right.',
      ]},
      { type: 'wait', ms: 1000 },
      { type: 'dialogue', speaker: 'Narrator', lines: [
        'You are crowned Champion of the Aurum Region!',
      ]},
      { type: 'setFlag', flag: 'enteredHallOfFame' },
    ],
  },
};
