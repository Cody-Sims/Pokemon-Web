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
  'pallet-town':         BGM.PALLET_TOWN,
  'route-1':             BGM.ROUTE,
  'route-2':             BGM.ROUTE,
  'viridian-city':       BGM.PALLET_TOWN,
  'viridian-forest':     BGM.ROUTE,
  'pewter-city':         BGM.PALLET_TOWN,
  // Interiors
  'pallet-player-house': BGM.PALLET_TOWN,
  'pallet-rival-house':  BGM.PALLET_TOWN,
  'pallet-oak-lab':      BGM.PALLET_TOWN,
  'viridian-pokecenter':  BGM.POKEMON_CENTER,
  'viridian-pokemart':    BGM.PALLET_TOWN,
  'pewter-pokecenter':    BGM.POKEMON_CENTER,
  'pewter-gym':           BGM.BATTLE_GYM,
  'pewter-museum':        BGM.PALLET_TOWN,
  'crystal-cavern':        BGM.ROUTE,
  'route-3':               BGM.ROUTE,
  'coral-harbor':          BGM.PALLET_TOWN,
  'coral-pokecenter':      BGM.POKEMON_CENTER,
  'coral-pokemart':        BGM.PALLET_TOWN,
  'coral-gym':             BGM.BATTLE_GYM,
  'route-4':               BGM.ROUTE,
  'ember-mines':           BGM.ROUTE,
  'ironvale-city':         BGM.PALLET_TOWN,
  'ironvale-pokecenter':   BGM.POKEMON_CENTER,
  'ironvale-pokemart':     BGM.PALLET_TOWN,
  'ironvale-gym':          BGM.BATTLE_GYM,
  'route-5':               BGM.ROUTE,
  'verdantia-village':     BGM.PALLET_TOWN,
  'verdantia-pokecenter':  BGM.POKEMON_CENTER,
  'verdantia-pokemart':    BGM.PALLET_TOWN,
  'verdantia-gym':         BGM.BATTLE_GYM,
  'voltara-city':          BGM.PALLET_TOWN,
  'voltara-pokecenter':    BGM.POKEMON_CENTER,
  'voltara-pokemart':      BGM.PALLET_TOWN,
  'voltara-gym':           BGM.BATTLE_GYM,
  // Act 3
  'route-6':               BGM.ROUTE,
  'wraithmoor-town':       BGM.PALLET_TOWN,
  'wraithmoor-pokecenter': BGM.POKEMON_CENTER,
  'wraithmoor-pokemart':   BGM.PALLET_TOWN,
  'wraithmoor-gym':        BGM.BATTLE_GYM,
  'route-7':               BGM.ROUTE,
  'scalecrest-citadel':    BGM.PALLET_TOWN,
  'scalecrest-pokecenter': BGM.POKEMON_CENTER,
  'scalecrest-pokemart':   BGM.PALLET_TOWN,
  'scalecrest-gym':        BGM.BATTLE_GYM,
  'cinderfall-town':       BGM.PALLET_TOWN,
  'cinderfall-pokecenter': BGM.POKEMON_CENTER,
  'cinderfall-pokemart':   BGM.PALLET_TOWN,
  'cinderfall-gym':        BGM.BATTLE_GYM,
  // Act 4
  'victory-road':          BGM.ROUTE,
  'pokemon-league':        BGM.BATTLE_GYM,
};
