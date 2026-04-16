import { CutsceneDefinition } from '@systems/engine/CutsceneEngine';

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
      { type: 'wait', ms: 800 },
      { type: 'dialogue', speaker: 'Narrator', lines: [
        'A familiar handwriting catches your eye in the Champion\'s records... Could it be?',
      ]},
      { type: 'setFlag', flag: 'quest_fatherTrail_started' },
    ],
  },

  // ─── Game Intro (entering Pallet Town) ───
  'game-intro': {
    id: 'game-intro',
    actions: [
      { type: 'fadeToBlack', duration: 800 },
      { type: 'playBGM', key: 'bgm-emotional' },
      { type: 'dialogue', speaker: 'Father\'s Letter', lines: [
        '"My dearest child..."',
        '"If you\'re reading this, I\'ve gone somewhere I cannot return from easily."',
        '"The Aurum Region holds secrets I must uncover. Forgive me."',
        '"One day, I hope you\'ll understand."',
      ]},
      { type: 'fadeFromBlack', duration: 800 },
      { type: 'wait', ms: 300 },
      { type: 'dialogue', speaker: 'Prof. Willow', lines: [
        'Ah, you must be the new arrival!',
        'Welcome to the Aurum Region, young Trainer!',
        'Your mother told me you\'d be coming.',
        'Come visit my lab when you\'re ready — I have something for you.',
      ]},
      { type: 'setFlag', flag: 'game_started' },
    ],
  },

  // ─── Rival Kael Lab Introduction ───
  'rival-kael-lab': {
    id: 'rival-kael-lab',
    actions: [
      { type: 'showEmote', targetId: 'kael', emote: 'exclamation' },
      { type: 'wait', ms: 400 },
      { type: 'dialogue', speaker: 'Kael', lines: [
        'Well, well! So YOU\'re the one Gramps chose?',
        'I already picked my partner. Obviously the best one.',
        'Let\'s battle right now — I\'ll show you the difference between us!',
      ]},
      { type: 'flashScreen', duration: 200 },
      { type: 'setFlag', flag: 'metKael' },
    ],
  },

  // ─── Ember Mines Discovery ───
  'ember-mines-discovery': {
    id: 'ember-mines-discovery',
    actions: [
      { type: 'showEmote', targetId: 'player', emote: 'exclamation' },
      { type: 'wait', ms: 300 },
      { type: 'dialogue', speaker: 'Narrator', lines: [
        'You find a hidden terminal deep in the Ember Mines.',
        'Data logs scroll across the cracked screen...',
      ]},
      { type: 'playSFX', key: 'sfx-beep' },
      { type: 'dialogue', speaker: 'Terminal', lines: [
        '"Project CONVERGENCE — Phase 2 initiated."',
        '"Aether extraction rate: 340% above baseline."',
        '"Subject tolerance declining. Recommend increased dosage."',
      ]},
      { type: 'dialogue', speaker: 'Marina', lines: [
        'What IS this...?',
        'Someone\'s been experimenting on Pokémon with concentrated Aether energy!',
        'We need to find out who\'s behind this. I\'ll analyze this data.',
      ]},
      { type: 'setFlag', flag: 'found_mines_terminal' },
    ],
  },

  // ─── Willow Kidnapping ───
  'willow-kidnapping': {
    id: 'willow-kidnapping',
    actions: [
      { type: 'playBGM', key: 'bgm-villain' },
      { type: 'screenShake', duration: 400, intensity: 0.01 },
      { type: 'dialogue', speaker: 'Synthesis Grunt', lines: [
        'The Professor is coming with us!',
        'Director\'s orders — no exceptions!',
      ]},
      { type: 'dialogue', speaker: 'Prof. Willow', lines: [
        'No! You can\'t—!',
        '...Take my research chip! Don\'t let them have it!',
      ]},
      { type: 'flashScreen', duration: 300 },
      { type: 'dialogue', speaker: 'Narrator', lines: [
        'The grunts vanish with Professor Willow into the night.',
        'In the dirt, you find a glowing Aether data chip.',
      ]},
      { type: 'setFlag', flag: 'willow_kidnapped' },
    ],
  },

  // ─── Rook's Identity Reveal ───
  'rook-reveal': {
    id: 'rook-reveal',
    actions: [
      { type: 'fadeToBlack', duration: 500 },
      { type: 'fadeFromBlack', duration: 500 },
      { type: 'dialogue', speaker: 'Rook', lines: [
        '...It\'s time you knew the truth.',
        'I was one of them. A Synthesis Collective scientist.',
        'I helped build the Aether extractors before I understood what they truly did.',
      ]},
      { type: 'wait', ms: 500 },
      { type: 'dialogue', speaker: 'Rook', lines: [
        'I left when they started testing on live Pokémon.',
        'Take this — the Aether Lens. It can reveal hidden energy signatures.',
        'You\'ll need it to find their base.',
      ]},
      { type: 'setFlag', flag: 'rook_revealed' },
      { type: 'setFlag', flag: 'hasAetherLens' },
    ],
  },

  // ─── Zara Lux Defection ───
  'zara-defection': {
    id: 'zara-defection',
    actions: [
      { type: 'playBGM', key: 'bgm-emotional' },
      { type: 'dialogue', speaker: 'Zara', lines: [
        'I joined the Collective to make Pokémon stronger. To protect them.',
        'But this... this isn\'t protection. This is cruelty.',
      ]},
      { type: 'wait', ms: 400 },
      { type: 'dialogue', speaker: 'Zara', lines: [
        'I can\'t fight Aldric alone. But I can help YOU.',
        'Take this keycard. It opens the containment level.',
        'Save the Professor. End this madness.',
      ]},
      { type: 'setFlag', flag: 'zara_provides_keycard' },
    ],
  },

  // ─── Willow Rescue ───
  'willow-rescue': {
    id: 'willow-rescue',
    actions: [
      { type: 'screenShake', duration: 300, intensity: 0.008 },
      { type: 'dialogue', speaker: 'Narrator', lines: [
        'You find Professor Willow in a containment cell, weakened but alive.',
      ]},
      { type: 'dialogue', speaker: 'Prof. Willow', lines: [
        'You came...! I knew you would.',
        'Listen carefully — while I was captive, I mapped their ley-line network.',
        'This data can shut down the Aether conduit at the League.',
        'Take it. You\'re our only hope now.',
      ]},
      { type: 'showEmote', targetId: 'player', emote: 'exclamation' },
      { type: 'setFlag', flag: 'rescued_willow' },
    ],
  },

  // ─── Champion Reveal ───
  'champion-reveal': {
    id: 'champion-reveal',
    actions: [
      { type: 'playBGM', key: 'bgm-legendary' },
      { type: 'screenShake', duration: 600, intensity: 0.012 },
      { type: 'flashScreen', duration: 400 },
      { type: 'dialogue', speaker: 'Narrator', lines: [
        'The Champion\'s throne room doors swing open...',
        'A familiar figure stands in the light.',
      ]},
      { type: 'wait', ms: 500 },
      { type: 'dialogue', speaker: 'Aldric', lines: [
        'Surprised? You shouldn\'t be.',
        'Who better to reshape the world than the strongest Trainer in the region?',
        'The Synthesis Collective was merely a means to an end.',
        'Now — let me show you what true power looks like.',
      ]},
      { type: 'setFlag', flag: 'champion_revealed' },
    ],
  },

  // ─── Father's Journal Discovery (Post-game) ───
  'fathers-journal-discovery': {
    id: 'fathers-journal-discovery',
    actions: [
      { type: 'fadeToBlack', duration: 1000 },
      { type: 'playBGM', key: 'bgm-emotional' },
      { type: 'dialogue', speaker: 'Father\'s Journal', lines: [
        '"Day 47. The ruins here predate any known civilization."',
        '"The Aether energy readings are off the charts."',
        '"I believe the temple at the island\'s heart holds the key."',
        '"If my theory is correct... this changes everything."',
      ]},
      { type: 'fadeFromBlack', duration: 1000 },
      { type: 'dialogue', speaker: 'Narrator', lines: [
        'Your father\'s handwriting fills the weathered journal.',
        'He was here. He walked these very shores.',
      ]},
      { type: 'setFlag', flag: 'fathers_journal_found' },
    ],
  },

  // ─── Father Reunion (Shattered Isles Temple) ───
  'father-reunion': {
    id: 'father-reunion',
    actions: [
      { type: 'playBGM', key: 'bgm-emotional' },
      { type: 'fadeToBlack', duration: 800 },
      { type: 'fadeFromBlack', duration: 800 },
      { type: 'dialogue', speaker: 'Narrator', lines: [
        'Deep within the temple, a figure stands before an ancient mural.',
        'He turns... and your heart stops.',
      ]},
      { type: 'wait', ms: 800 },
      { type: 'dialogue', speaker: 'Father', lines: [
        '...Is that really you?',
        'Look how much you\'ve grown.',
        'I\'m so sorry I left. I had to protect something important.',
      ]},
      { type: 'dialogue', speaker: 'Father', lines: [
        'This temple guards Solatheon\'s true resting place.',
        'If the Collective had found it first... I couldn\'t let that happen.',
        'But you\'ve already stopped them. I\'m so proud of you.',
      ]},
      { type: 'wait', ms: 500 },
      { type: 'dialogue', speaker: 'Father', lines: [
        'Here — take this. I found it in the deepest chamber.',
        'A Master Ball. The only one in the region.',
        'You\'ve earned it.',
      ]},
      { type: 'showEmote', targetId: 'player', emote: 'heart' },
      { type: 'setFlag', flag: 'father_found' },
    ],
  },
};
