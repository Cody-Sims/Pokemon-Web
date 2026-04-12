/** BGM track keys — must match asset filenames loaded in PreloadScene. */
export const BGM = {
  TITLE:          'bgm-title',
  PALLET_TOWN:    'bgm-pallet-town',
  ROUTE:          'bgm-route',
  BATTLE_WILD:    'bgm-battle-wild',
  BATTLE_TRAINER: 'bgm-battle-trainer',
  BATTLE_GYM:     'bgm-battle-gym',
  VICTORY:        'bgm-victory',
  POKEMON_CENTER: 'bgm-pokemon-center',
} as const;

/** SFX keys — must match asset filenames loaded in PreloadScene. */
export const SFX = {
  // Menu
  CURSOR:     'sfx-cursor',
  CONFIRM:    'sfx-confirm',
  CANCEL:     'sfx-cancel',
  ERROR:      'sfx-error',

  // Battle
  HIT_NORMAL:       'sfx-hit-normal',
  HIT_SUPER:        'sfx-hit-super',
  HIT_WEAK:         'sfx-hit-weak',
  HIT_CRIT:         'sfx-hit-crit',
  FAINT:            'sfx-faint',
  BALL_THROW:       'sfx-ball-throw',
  BALL_SHAKE:       'sfx-ball-shake',
  CATCH_SUCCESS:    'sfx-catch-success',
  EXP_FILL:         'sfx-exp-fill',
  LEVEL_UP:         'sfx-level-up',

  // Overworld
  DOOR_OPEN:    'sfx-door-open',
  LEDGE_JUMP:   'sfx-ledge-jump',
  BUMP:         'sfx-bump',
  ENCOUNTER:    'sfx-encounter',
} as const;

/** Map key → BGM key mapping. */
export const MAP_BGM: Record<string, string> = {
  'pallet-town':     BGM.PALLET_TOWN,
  'route-1':         BGM.ROUTE,
  'route-2':         BGM.ROUTE,
  'viridian-city':   BGM.PALLET_TOWN,   // reuse town theme for now
  'viridian-forest': BGM.ROUTE,
  'pewter-city':     BGM.PALLET_TOWN,
};
