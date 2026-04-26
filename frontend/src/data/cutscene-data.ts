import { CutsceneDefinition } from '@systems/engine/CutsceneEngine';

export const cutsceneData: Record<string, CutsceneDefinition> = {
  'rival-intro': {
    id: 'rival-intro',
    actions: [
      { type: 'showEmote', targetId: 'player', emote: 'exclamation' },
      { type: 'wait', ms: 500 },
      { type: 'dialogue', speaker: 'Kael', portraitKey: 'rival', lines: [
        'Hey! You there!',
        'I heard you got a Pokémon from the Professor.',
        'Let\'s see how strong you really are!',
      ]},
      { type: 'flashScreen', duration: 200 },      { type: 'setFlag', flag: 'rival_intro_seen' },    ],
  },
  'willow-lab-intro': {
    id: 'willow-lab-intro',
    actions: [
      { type: 'dialogue', speaker: 'Prof. Willow', portraitKey: 'npc-oak', lines: [
        'Welcome to my laboratory!',
        'I study the Pokémon of the Aurum Region.',
        'But first, choose your partner Pokémon!',
      ]},      { type: 'setFlag', flag: 'willow_lab_intro_seen' },    ],
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
      { type: 'dialogue', speaker: 'Morwen', portraitKey: 'npc-gym-morwen', lines: [
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
      { type: 'dialogue', speaker: 'Solara', portraitKey: 'npc-gym-solara', lines: [
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
      { type: 'dialogue', speaker: 'Ashborne', portraitKey: 'npc-e4-ashborne', lines: [
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
      { type: 'dialogue', speaker: 'Aldric', portraitKey: 'npc-champion-aldric', lines: [
        'I\'ve seen what nature does to the creatures we claim to love.',
        'I choose to do better.',
        'Join me. Together, we can build a world where no Pokémon ever suffers again.',
      ]},
      { type: 'wait', ms: 500 },
      { type: 'dialogue', speaker: 'Narrator', lines: [
        'You shake your head firmly.',
      ]},
      { type: 'dialogue', speaker: 'Aldric', portraitKey: 'npc-champion-aldric', lines: [
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
      { type: 'dialogue', speaker: 'Aldric', portraitKey: 'npc-champion-aldric', lines: [
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

  // ─── Game Intro (entering Littoral Town) ───
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
      { type: 'dialogue', speaker: 'Prof. Willow', portraitKey: 'npc-oak', lines: [
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
      { type: 'dialogue', speaker: 'Kael', portraitKey: 'rival', lines: [
        'Well, well! So YOU\'re the one the Professor chose?',
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
      { type: 'dialogue', speaker: 'Marina', portraitKey: 'npc-marina', lines: [
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
      { type: 'dialogue', speaker: 'Prof. Willow', portraitKey: 'npc-oak', lines: [
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
      { type: 'dialogue', speaker: 'Prof. Willow', portraitKey: 'npc-oak', lines: [
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
      { type: 'dialogue', speaker: 'Aldric', portraitKey: 'npc-champion-aldric', lines: [
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

  // ─── Mother's farewell at Littoral Town (game start, post-game-intro) ───
  'mother-farewell': {
    id: 'mother-farewell',
    actions: [
      { type: 'playBGM', key: 'bgm-emotional' },
      { type: 'dialogue', speaker: 'Mom', portraitKey: 'npc-female-1', lines: [
        'So Professor Willow really gave you a Pokémon...',
        'It feels like only yesterday you were running around the yard with your father.',
        'Promise me you\'ll come home for dinner sometimes, alright?',
      ]},
      { type: 'wait', ms: 400 },
      { type: 'dialogue', speaker: 'Mom', portraitKey: 'npc-female-1', lines: [
        'And take this — your father left it in his desk before he went away.',
        'I think he meant for you to have it when the time was right.',
        'I love you. Be careful out there.',
      ]},
      { type: 'showEmote', targetId: 'player', emote: 'heart' },
      { type: 'setFlag', flag: 'mother_farewell' },
    ],
  },

  // ─── First Boulder Badge celebration (after defeating Brock) ───
  'first-badge-celebration': {
    id: 'first-badge-celebration',
    actions: [
      { type: 'playBGM', key: 'bgm-fanfare' },
      { type: 'flashScreen', duration: 250 },
      { type: 'dialogue', speaker: 'Narrator', lines: [
        'You earned the BOULDER BADGE!',
        'Pokémon up to level 25 will now obey you without question.',
      ]},
      { type: 'wait', ms: 400 },
      { type: 'dialogue', speaker: 'Brock', portraitKey: 'npc-gym-brock', lines: [
        'You\'ve got real grit, kid.',
        'Word of advice: the road ahead gets rougher fast.',
        'Stop by the Pewter Museum — Curator Dane has been digging into something strange near the coast.',
      ]},
      { type: 'setFlag', flag: 'first_badge_celebration' },
    ],
  },

  // ─── Marina first meeting (Route 2) ───
  'marina-first-meeting': {
    id: 'marina-first-meeting',
    actions: [
      { type: 'showEmote', targetId: 'marina', emote: 'exclamation' },
      { type: 'wait', ms: 300 },
      { type: 'dialogue', speaker: 'Marina', portraitKey: 'npc-marina', lines: [
        'Oh — you\'re the new trainer the Professor mentioned.',
        'I\'m Marina. I picked the starter neither you nor Kael wanted.',
        'I don\'t really battle for fun, but… I\'d like to see what your team can do.',
      ]},
      { type: 'wait', ms: 200 },
      { type: 'dialogue', speaker: 'Marina', portraitKey: 'npc-marina', lines: [
        'Watch the type matchups. The data tells me yours has a clear edge here.',
        'Let\'s go!',
      ]},
      { type: 'setFlag', flag: 'metMarina' },
    ],
  },

  // ─── Rook first encounter (Coral Harbor) ───
  'rook-first-encounter': {
    id: 'rook-first-encounter',
    actions: [
      { type: 'playBGM', key: 'bgm-mystery' },
      { type: 'dialogue', speaker: 'Rook', lines: [
        '...You walk light for someone carrying that much weight.',
        'A father gone missing. A region pretending nothing\'s wrong.',
        'Don\'t look so surprised — your eyes give you away.',
      ]},
      { type: 'wait', ms: 400 },
      { type: 'dialogue', speaker: 'Rook', lines: [
        'Watch the harbor at night. Boats come in that aren\'t on any manifest.',
        'And keep your Pokémon close. The ones you trust will trust you back.',
      ]},
      { type: 'showEmote', targetId: 'player', emote: 'question' },
      { type: 'setFlag', flag: 'metRook' },
    ],
  },

  // ─── Aldric hologram (Ironvale City, post Ember Mines disruption) ───
  'aldric-hologram': {
    id: 'aldric-hologram',
    actions: [
      { type: 'playBGM', key: 'bgm-villain' },
      { type: 'flashScreen', color: 0x66ccff, duration: 250 },
      { type: 'screenShake', duration: 300, intensity: 0.006 },
      { type: 'dialogue', speaker: 'Aldric', portraitKey: 'npc-champion-aldric', lines: [
        'A child playing hero in my mines. How quaint.',
        'I am Aldric Maren — Director of the Synthesis Collective.',
        'I have watched your progress with curiosity.',
      ]},
      { type: 'wait', ms: 300 },
      { type: 'dialogue', speaker: 'Aldric', portraitKey: 'npc-champion-aldric', lines: [
        'Continue if you must. But understand this:',
        'Every Pokémon I refine is one more saved from nature\'s cruelty.',
        'You think you\'re fighting villains. You\'re fighting a kindness you cannot yet see.',
      ]},
      { type: 'flashScreen', color: 0x66ccff, duration: 250 },
      { type: 'setFlag', flag: 'aldric_hologram_seen' },
    ],
  },

  // ─── Kael tag-team commitment (Ironvale, joins as partner) ───
  'kael-tag-team': {
    id: 'kael-tag-team',
    actions: [
      { type: 'showEmote', targetId: 'kael', emote: 'exclamation' },
      { type: 'dialogue', speaker: 'Kael', portraitKey: 'rival', lines: [
        'I saw the Synthesis lab in Ember Mines. What they\'re doing to those Pokémon...',
        'It\'s sick. It\'s wrong.',
      ]},
      { type: 'wait', ms: 300 },
      { type: 'dialogue', speaker: 'Kael', portraitKey: 'rival', lines: [
        'I\'ve been racing you this whole time like an idiot.',
        'Today we fight together. Two trainers, one front.',
        'Let\'s show these Synthesis suits what real bonds look like.',
      ]},
      { type: 'setFlag', flag: 'kael_tag_partner' },
    ],
  },

  // ─── Marina rescue (Canopy Trail, freed from Synthesis trap) ───
  'marina-rescue': {
    id: 'marina-rescue',
    actions: [
      { type: 'screenShake', duration: 300, intensity: 0.008 },
      { type: 'playSFX', key: 'sfx-cut' },
      { type: 'dialogue', speaker: 'Narrator', lines: [
        'You sever the Synthesis trap\'s vine restraints.',
        'Marina staggers free, breathing hard.',
      ]},
      { type: 'dialogue', speaker: 'Marina', portraitKey: 'npc-marina', lines: [
        'You came... I knew the readings here were too high.',
        'They tried to take my notes — they know I\'ve been mapping the ley lines.',
      ]},
      { type: 'wait', ms: 400 },
      { type: 'dialogue', speaker: 'Marina', portraitKey: 'npc-marina', lines: [
        'Listen — the Aether convergence point isn\'t a coincidence.',
        'Whoever\'s behind this is heading north. Toward the spire.',
        'Take this data chip. Get it to the Professor. Hurry.',
      ]},
      { type: 'showEmote', targetId: 'player', emote: 'exclamation' },
      { type: 'setFlag', flag: 'marina_rescued' },
    ],
  },

  // ─── Aldric inner-sanctum confrontation (Synthesis HQ, Aldric retreats) ───
  'aldric-inner-sanctum': {
    id: 'aldric-inner-sanctum',
    actions: [
      { type: 'playBGM', key: 'bgm-villain' },
      { type: 'dialogue', speaker: 'Aldric', portraitKey: 'npc-champion-aldric', lines: [
        'You made it further than I expected.',
        'You fight for a world that lets Pokémon suffer in silence.',
        'I fight for one where they never have to.',
      ]},
      { type: 'wait', ms: 400 },
      { type: 'dialogue', speaker: 'Aldric', portraitKey: 'npc-champion-aldric', lines: [
        'Join me, and the next century of Pokémon history is yours to shape.',
      ]},
      { type: 'dialogue', speaker: 'Narrator', lines: [
        'You shake your head, grip on your Poké Ball steady.',
      ]},
      { type: 'dialogue', speaker: 'Aldric', portraitKey: 'npc-champion-aldric', lines: [
        'A pity.',
        'When you understand what you\'ve refused, it will be too late.',
      ]},
      { type: 'flashScreen', duration: 400 },
      { type: 'fadeToBlack', duration: 500 },
      { type: 'wait', ms: 400 },
      { type: 'fadeFromBlack', duration: 500 },
      { type: 'dialogue', speaker: 'Narrator', lines: [
        'When the light fades, Aldric is gone.',
        'A subordinate steps forward — the next obstacle between you and the Director.',
      ]},
      { type: 'setFlag', flag: 'aldric_inner_sanctum' },
    ],
  },

  // ─── Pokémon League arrival (Victory Road exit) ───
  'league-arrival': {
    id: 'league-arrival',
    actions: [
      { type: 'fadeToBlack', duration: 600 },
      { type: 'playBGM', key: 'bgm-fanfare' },
      { type: 'fadeFromBlack', duration: 800 },
      { type: 'dialogue', speaker: 'Narrator', lines: [
        'The doors of the Pokémon League grind open.',
        'Marble columns rise toward a sky lit by Aether crystals.',
        'Eight badges chime softly at your side.',
      ]},
      { type: 'wait', ms: 500 },
      { type: 'dialogue', speaker: 'Kael', portraitKey: 'rival', lines: [
        'You actually made it. I lost to the first Elite, you know.',
        'Hah — I\'m supposed to be your rival, and here I am cheering for you.',
      ]},
      { type: 'wait', ms: 300 },
      { type: 'dialogue', speaker: 'Kael', portraitKey: 'rival', lines: [
        'Whatever\'s up there… don\'t flinch.',
        'Show the Champion who you really are.',
      ]},
      { type: 'setFlag', flag: 'league_arrival' },
    ],
  },

  // ─── Shattered Isles arrival (post-game) ───
  'shattered-isles-arrival': {
    id: 'shattered-isles-arrival',
    actions: [
      { type: 'fadeToBlack', duration: 800 },
      { type: 'playBGM', key: 'bgm-mystery' },
      { type: 'fadeFromBlack', duration: 1000 },
      { type: 'dialogue', speaker: 'Narrator', lines: [
        'Salt spray and silence.',
        'The Shattered Isles rise from the sea like broken teeth.',
        'Twenty years ago an Aether eruption tore this island apart.',
        'Now the wind carries the same low hum that fills your father\'s journal.',
      ]},
      { type: 'wait', ms: 500 },
      { type: 'dialogue', speaker: 'Narrator', lines: [
        'A weathered footprint marks the dust at the shore.',
        'Someone walked here recently.',
      ]},
      { type: 'showEmote', targetId: 'player', emote: 'exclamation' },
      { type: 'setFlag', flag: 'shattered_isles_arrival' },
    ],
  },
};
