import { MoveData } from './interfaces';

/**
 * Complete Gen 1 move catalogue (165 moves) + a few later-gen moves
 * referenced by existing learnsets.
 */
export const moveData: Record<string, MoveData> = {
  // ═══════════════════════════════════════════════════════════════════
  // Gen 1 Moves  (#1 – #165)
  // ═══════════════════════════════════════════════════════════════════

  // ─── Normal – Physical ───
  'pound':        { id: 'pound', name: 'Pound', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35 },
  'scratch':      { id: 'scratch', name: 'Scratch', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35 },
  'tackle':       { id: 'tackle', name: 'Tackle', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35 },
  'vice-grip':    { id: 'vice-grip', name: 'Vice Grip', type: 'normal', category: 'physical', power: 55, accuracy: 100, pp: 30 },
  'slam':         { id: 'slam', name: 'Slam', type: 'normal', category: 'physical', power: 80, accuracy: 75, pp: 20 },
  'horn-attack':  { id: 'horn-attack', name: 'Horn Attack', type: 'normal', category: 'physical', power: 65, accuracy: 100, pp: 25 },
  'headbutt':     { id: 'headbutt', name: 'Headbutt', type: 'normal', category: 'physical', power: 70, accuracy: 100, pp: 15, effect: { type: 'flinch', target: 'enemy', chance: 30 } },
  'stomp':        { id: 'stomp', name: 'Stomp', type: 'normal', category: 'physical', power: 65, accuracy: 100, pp: 20, effect: { type: 'flinch', target: 'enemy', chance: 30 } },
  'mega-punch':   { id: 'mega-punch', name: 'Mega Punch', type: 'normal', category: 'physical', power: 80, accuracy: 85, pp: 20 },
  'mega-kick':    { id: 'mega-kick', name: 'Mega Kick', type: 'normal', category: 'physical', power: 120, accuracy: 75, pp: 5 },
  'pay-day':      { id: 'pay-day', name: 'Pay Day', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 20 },
  'body-slam':    { id: 'body-slam', name: 'Body Slam', type: 'normal', category: 'physical', power: 85, accuracy: 100, pp: 15, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 30 } },
  'wrap':         { id: 'wrap', name: 'Wrap', type: 'normal', category: 'physical', power: 15, accuracy: 90, pp: 20 },
  'bind':         { id: 'bind', name: 'Bind', type: 'normal', category: 'physical', power: 15, accuracy: 85, pp: 20 },
  'take-down':    { id: 'take-down', name: 'Take Down', type: 'normal', category: 'physical', power: 90, accuracy: 85, pp: 20, effect: { type: 'recoil', target: 'self', amount: 25 } },
  'double-edge':  { id: 'double-edge', name: 'Double-Edge', type: 'normal', category: 'physical', power: 120, accuracy: 100, pp: 15, effect: { type: 'recoil', target: 'self', amount: 33 } },
  'thrash':       { id: 'thrash', name: 'Thrash', type: 'normal', category: 'physical', power: 120, accuracy: 100, pp: 10 },
  'rage':         { id: 'rage', name: 'Rage', type: 'normal', category: 'physical', power: 20, accuracy: 100, pp: 20 },
  'quick-attack': { id: 'quick-attack', name: 'Quick Attack', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 30, priority: 1 },
  'hyper-fang':   { id: 'hyper-fang', name: 'Hyper Fang', type: 'normal', category: 'physical', power: 80, accuracy: 90, pp: 15, effect: { type: 'flinch', target: 'enemy', chance: 10 } },
  'slash':        { id: 'slash', name: 'Slash', type: 'normal', category: 'physical', power: 70, accuracy: 100, pp: 20 },
  'cut':          { id: 'cut', name: 'Cut', type: 'normal', category: 'physical', power: 50, accuracy: 95, pp: 30 },
  'strength':     { id: 'strength', name: 'Strength', type: 'normal', category: 'physical', power: 80, accuracy: 100, pp: 15 },
  'constrict':    { id: 'constrict', name: 'Constrict', type: 'normal', category: 'physical', power: 10, accuracy: 100, pp: 35, effect: { type: 'stat-change', target: 'enemy', stat: 'speed', stages: -1, chance: 10 } },
  'egg-bomb':     { id: 'egg-bomb', name: 'Egg Bomb', type: 'normal', category: 'physical', power: 100, accuracy: 75, pp: 10 },
  'skull-bash':   { id: 'skull-bash', name: 'Skull Bash', type: 'normal', category: 'physical', power: 130, accuracy: 100, pp: 10 },
  'dizzy-punch':  { id: 'dizzy-punch', name: 'Dizzy Punch', type: 'normal', category: 'physical', power: 70, accuracy: 100, pp: 10, effect: { type: 'status', target: 'enemy', status: 'confusion', chance: 20 } },
  'comet-punch':  { id: 'comet-punch', name: 'Comet Punch', type: 'normal', category: 'physical', power: 18, accuracy: 85, pp: 15, effect: { type: 'multi-hit', target: 'enemy' } },
  'fury-attack':  { id: 'fury-attack', name: 'Fury Attack', type: 'normal', category: 'physical', power: 15, accuracy: 85, pp: 20, effect: { type: 'multi-hit', target: 'enemy' } },
  'fury-swipes':  { id: 'fury-swipes', name: 'Fury Swipes', type: 'normal', category: 'physical', power: 18, accuracy: 80, pp: 15, effect: { type: 'multi-hit', target: 'enemy' } },
  'spike-cannon': { id: 'spike-cannon', name: 'Spike Cannon', type: 'normal', category: 'physical', power: 20, accuracy: 100, pp: 15, effect: { type: 'multi-hit', target: 'enemy' } },
  'barrage':      { id: 'barrage', name: 'Barrage', type: 'normal', category: 'physical', power: 15, accuracy: 85, pp: 20, effect: { type: 'multi-hit', target: 'enemy' } },
  'double-slap':  { id: 'double-slap', name: 'Double Slap', type: 'normal', category: 'physical', power: 15, accuracy: 85, pp: 10, effect: { type: 'multi-hit', target: 'enemy' } },
  'super-fang':   { id: 'super-fang', name: 'Super Fang', type: 'normal', category: 'physical', power: null, accuracy: 90, pp: 10 },
  'guillotine':   { id: 'guillotine', name: 'Guillotine', type: 'normal', category: 'physical', power: null, accuracy: 30, pp: 5, effect: { type: 'ohko', target: 'enemy' } },
  'horn-drill':   { id: 'horn-drill', name: 'Horn Drill', type: 'normal', category: 'physical', power: null, accuracy: 30, pp: 5, effect: { type: 'ohko', target: 'enemy' } },

  // ─── Normal – Special ───
  'hyper-beam':   { id: 'hyper-beam', name: 'Hyper Beam', type: 'normal', category: 'special', power: 150, accuracy: 90, pp: 5 },
  'swift':        { id: 'swift', name: 'Swift', type: 'normal', category: 'special', power: 60, accuracy: 100, pp: 20 },
  'tri-attack':   { id: 'tri-attack', name: 'Tri Attack', type: 'normal', category: 'special', power: 80, accuracy: 100, pp: 10, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 20 } },
  'sonic-boom':   { id: 'sonic-boom', name: 'Sonic Boom', type: 'normal', category: 'special', power: null, accuracy: 90, pp: 20, effect: { type: 'fixed-damage', target: 'enemy', amount: 20 } },

  // ─── Normal – Status ───
  'growl':        { id: 'growl', name: 'Growl', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 40, effect: { type: 'stat-change', target: 'enemy', stat: 'attack', stages: -1 } },
  'leer':         { id: 'leer', name: 'Leer', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 30, effect: { type: 'stat-change', target: 'enemy', stat: 'defense', stages: -1 } },
  'tail-whip':    { id: 'tail-whip', name: 'Tail Whip', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 30, effect: { type: 'stat-change', target: 'enemy', stat: 'defense', stages: -1 } },
  'screech':      { id: 'screech', name: 'Screech', type: 'normal', category: 'status', power: null, accuracy: 85, pp: 40, effect: { type: 'stat-change', target: 'enemy', stat: 'defense', stages: -2 } },
  'harden':       { id: 'harden', name: 'Harden', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 30, effect: { type: 'stat-change', target: 'self', stat: 'defense', stages: 1 } },
  'defense-curl': { id: 'defense-curl', name: 'Defense Curl', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 40, effect: { type: 'stat-change', target: 'self', stat: 'defense', stages: 1 } },
  'sharpen':      { id: 'sharpen', name: 'Sharpen', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 30, effect: { type: 'stat-change', target: 'self', stat: 'attack', stages: 1 } },
  'swords-dance': { id: 'swords-dance', name: 'Swords Dance', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 20, effect: { type: 'stat-change', target: 'self', stat: 'attack', stages: 2 } },
  'smokescreen':  { id: 'smokescreen', name: 'Smokescreen', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 20, effect: { type: 'stat-change', target: 'enemy', stat: 'attack', stages: -1 } },
  'double-team':  { id: 'double-team', name: 'Double Team', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 15, effect: { type: 'stat-change', target: 'self', stat: 'speed', stages: 1 } },
  'minimize':     { id: 'minimize', name: 'Minimize', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 10, effect: { type: 'stat-change', target: 'self', stat: 'speed', stages: 2 } },
  'focus-energy': { id: 'focus-energy', name: 'Focus Energy', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 30, effect: { type: 'stat-change', target: 'self', stat: 'attack', stages: 1 } },
  'growth':       { id: 'growth', name: 'Growth', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 20, effect: { type: 'stat-change', target: 'self', stat: 'spAttack', stages: 1 } },
  'recover':      { id: 'recover', name: 'Recover', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 10, effect: { type: 'heal', target: 'self', amount: 50 } },
  'soft-boiled':  { id: 'soft-boiled', name: 'Soft-Boiled', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 10, effect: { type: 'heal', target: 'self', amount: 50 } },
  'disable':      { id: 'disable', name: 'Disable', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 20 },
  'roar':         { id: 'roar', name: 'Roar', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 20 },
  'sing':         { id: 'sing', name: 'Sing', type: 'normal', category: 'status', power: null, accuracy: 55, pp: 15, effect: { type: 'status', target: 'enemy', status: 'sleep', chance: 100 } },
  'supersonic':   { id: 'supersonic', name: 'Supersonic', type: 'normal', category: 'status', power: null, accuracy: 55, pp: 20, effect: { type: 'status', target: 'enemy', status: 'confusion', chance: 100 } },
  'glare':        { id: 'glare', name: 'Glare', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 30, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 100 } },
  'lovely-kiss':  { id: 'lovely-kiss', name: 'Lovely Kiss', type: 'normal', category: 'status', power: null, accuracy: 75, pp: 10, effect: { type: 'status', target: 'enemy', status: 'sleep', chance: 100 } },
  'flash':        { id: 'flash', name: 'Flash', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 20, effect: { type: 'stat-change', target: 'enemy', stat: 'attack', stages: -1 } },
  'splash':       { id: 'splash', name: 'Splash', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 40 },
  'transform':    { id: 'transform', name: 'Transform', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 10 },
  'conversion':   { id: 'conversion', name: 'Conversion', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 30 },
  'substitute':   { id: 'substitute', name: 'Substitute', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 10 },
  'mimic':        { id: 'mimic', name: 'Mimic', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 10 },
  'metronome':    { id: 'metronome', name: 'Metronome', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 10 },
  'bide':         { id: 'bide', name: 'Bide', type: 'normal', category: 'physical', power: null, accuracy: 100, pp: 10 },
  'self-destruct':{ id: 'self-destruct', name: 'Self-Destruct', type: 'normal', category: 'physical', power: 200, accuracy: 100, pp: 5, effect: { type: 'self-destruct', target: 'self' } },
  'explosion':    { id: 'explosion', name: 'Explosion', type: 'normal', category: 'physical', power: 250, accuracy: 100, pp: 5, effect: { type: 'self-destruct', target: 'self' } },

  // ─── Fire ───
  'ember':        { id: 'ember', name: 'Ember', type: 'fire', category: 'special', power: 40, accuracy: 100, pp: 25, effect: { type: 'status', target: 'enemy', status: 'burn', chance: 10 } },
  'flamethrower': { id: 'flamethrower', name: 'Flamethrower', type: 'fire', category: 'special', power: 90, accuracy: 100, pp: 15, effect: { type: 'status', target: 'enemy', status: 'burn', chance: 10 } },
  'fire-blast':   { id: 'fire-blast', name: 'Fire Blast', type: 'fire', category: 'special', power: 110, accuracy: 85, pp: 5, effect: { type: 'status', target: 'enemy', status: 'burn', chance: 10 } },
  'fire-spin':    { id: 'fire-spin', name: 'Fire Spin', type: 'fire', category: 'special', power: 35, accuracy: 85, pp: 15 },
  'fire-punch':   { id: 'fire-punch', name: 'Fire Punch', type: 'fire', category: 'physical', power: 75, accuracy: 100, pp: 15, effect: { type: 'status', target: 'enemy', status: 'burn', chance: 10 } },
  'fire-fang':    { id: 'fire-fang', name: 'Fire Fang', type: 'fire', category: 'physical', power: 65, accuracy: 95, pp: 15, effect: { type: 'status', target: 'enemy', status: 'burn', chance: 10 } },

  // ─── Water ───
  'water-gun':    { id: 'water-gun', name: 'Water Gun', type: 'water', category: 'special', power: 40, accuracy: 100, pp: 25 },
  'hydro-pump':   { id: 'hydro-pump', name: 'Hydro Pump', type: 'water', category: 'special', power: 110, accuracy: 80, pp: 5 },
  'surf':         { id: 'surf', name: 'Surf', type: 'water', category: 'special', power: 90, accuracy: 100, pp: 15 },
  'bubble':       { id: 'bubble', name: 'Bubble', type: 'water', category: 'special', power: 40, accuracy: 100, pp: 30, effect: { type: 'stat-change', target: 'enemy', stat: 'speed', stages: -1, chance: 10 } },
  'bubble-beam':  { id: 'bubble-beam', name: 'Bubble Beam', type: 'water', category: 'special', power: 65, accuracy: 100, pp: 20, effect: { type: 'stat-change', target: 'enemy', stat: 'speed', stages: -1, chance: 10 } },
  'waterfall':    { id: 'waterfall', name: 'Waterfall', type: 'water', category: 'physical', power: 80, accuracy: 100, pp: 15, effect: { type: 'flinch', target: 'enemy', chance: 20 } },
  'crabhammer':   { id: 'crabhammer', name: 'Crabhammer', type: 'water', category: 'physical', power: 100, accuracy: 90, pp: 10 },
  'clamp':        { id: 'clamp', name: 'Clamp', type: 'water', category: 'physical', power: 35, accuracy: 85, pp: 15 },
  'withdraw':     { id: 'withdraw', name: 'Withdraw', type: 'water', category: 'status', power: null, accuracy: 100, pp: 40, effect: { type: 'stat-change', target: 'self', stat: 'defense', stages: 1 } },
  'water-pulse':  { id: 'water-pulse', name: 'Water Pulse', type: 'water', category: 'special', power: 60, accuracy: 100, pp: 20, effect: { type: 'status', target: 'enemy', status: 'confusion', chance: 20 } },

  // ─── Electric ───
  'thunder-shock':{ id: 'thunder-shock', name: 'Thunder Shock', type: 'electric', category: 'special', power: 40, accuracy: 100, pp: 30, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 10 } },
  'thunderbolt':  { id: 'thunderbolt', name: 'Thunderbolt', type: 'electric', category: 'special', power: 90, accuracy: 100, pp: 15, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 10 } },
  'thunder':      { id: 'thunder', name: 'Thunder', type: 'electric', category: 'special', power: 110, accuracy: 70, pp: 10, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 30 } },
  'thunder-wave': { id: 'thunder-wave', name: 'Thunder Wave', type: 'electric', category: 'status', power: null, accuracy: 90, pp: 20, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 100 } },
  'thunder-punch':{ id: 'thunder-punch', name: 'Thunder Punch', type: 'electric', category: 'physical', power: 75, accuracy: 100, pp: 15, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 10 } },

  // ─── Grass ───
  'vine-whip':    { id: 'vine-whip', name: 'Vine Whip', type: 'grass', category: 'physical', power: 45, accuracy: 100, pp: 25 },
  'razor-leaf':   { id: 'razor-leaf', name: 'Razor Leaf', type: 'grass', category: 'physical', power: 55, accuracy: 95, pp: 25 },
  'solar-beam':   { id: 'solar-beam', name: 'Solar Beam', type: 'grass', category: 'special', power: 120, accuracy: 100, pp: 10 },
  'absorb':       { id: 'absorb', name: 'Absorb', type: 'grass', category: 'special', power: 20, accuracy: 100, pp: 25, effect: { type: 'drain', target: 'self', chance: 100 } },
  'mega-drain':   { id: 'mega-drain', name: 'Mega Drain', type: 'grass', category: 'special', power: 40, accuracy: 100, pp: 15, effect: { type: 'drain', target: 'self', chance: 100 } },
  'leech-seed':   { id: 'leech-seed', name: 'Leech Seed', type: 'grass', category: 'status', power: null, accuracy: 90, pp: 10 },
  'petal-dance':  { id: 'petal-dance', name: 'Petal Dance', type: 'grass', category: 'special', power: 120, accuracy: 100, pp: 10 },
  'stun-spore':   { id: 'stun-spore', name: 'Stun Spore', type: 'grass', category: 'status', power: null, accuracy: 75, pp: 30, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 100 } },
  'sleep-powder': { id: 'sleep-powder', name: 'Sleep Powder', type: 'grass', category: 'status', power: null, accuracy: 75, pp: 15, effect: { type: 'status', target: 'enemy', status: 'sleep', chance: 100 } },
  'spore':        { id: 'spore', name: 'Spore', type: 'grass', category: 'status', power: null, accuracy: 100, pp: 15, effect: { type: 'status', target: 'enemy', status: 'sleep', chance: 100 } },

  // ─── Ice ───
  'ice-beam':     { id: 'ice-beam', name: 'Ice Beam', type: 'ice', category: 'special', power: 90, accuracy: 100, pp: 10, effect: { type: 'status', target: 'enemy', status: 'freeze', chance: 10 } },
  'blizzard':     { id: 'blizzard', name: 'Blizzard', type: 'ice', category: 'special', power: 110, accuracy: 70, pp: 5, effect: { type: 'status', target: 'enemy', status: 'freeze', chance: 10 } },
  'aurora-beam':  { id: 'aurora-beam', name: 'Aurora Beam', type: 'ice', category: 'special', power: 65, accuracy: 100, pp: 20, effect: { type: 'stat-change', target: 'enemy', stat: 'attack', stages: -1, chance: 10 } },
  'ice-punch':    { id: 'ice-punch', name: 'Ice Punch', type: 'ice', category: 'physical', power: 75, accuracy: 100, pp: 15, effect: { type: 'status', target: 'enemy', status: 'freeze', chance: 10 } },
  'mist':         { id: 'mist', name: 'Mist', type: 'ice', category: 'status', power: null, accuracy: 100, pp: 30 },
  'haze':         { id: 'haze', name: 'Haze', type: 'ice', category: 'status', power: null, accuracy: 100, pp: 30 },

  // ─── Fighting ───
  'karate-chop':  { id: 'karate-chop', name: 'Karate Chop', type: 'fighting', category: 'physical', power: 50, accuracy: 100, pp: 25 },
  'double-kick':  { id: 'double-kick', name: 'Double Kick', type: 'fighting', category: 'physical', power: 30, accuracy: 100, pp: 30, effect: { type: 'multi-hit', target: 'enemy', hits: 2 } },
  'jump-kick':    { id: 'jump-kick', name: 'Jump Kick', type: 'fighting', category: 'physical', power: 100, accuracy: 95, pp: 10 },
  'high-jump-kick':{ id: 'high-jump-kick', name: 'High Jump Kick', type: 'fighting', category: 'physical', power: 130, accuracy: 90, pp: 10 },
  'rolling-kick': { id: 'rolling-kick', name: 'Rolling Kick', type: 'fighting', category: 'physical', power: 60, accuracy: 85, pp: 15, effect: { type: 'flinch', target: 'enemy', chance: 30 } },
  'low-kick':     { id: 'low-kick', name: 'Low Kick', type: 'fighting', category: 'physical', power: 50, accuracy: 100, pp: 20 },
  'submission':   { id: 'submission', name: 'Submission', type: 'fighting', category: 'physical', power: 80, accuracy: 80, pp: 20, effect: { type: 'recoil', target: 'self', amount: 25 } },
  'counter':      { id: 'counter', name: 'Counter', type: 'fighting', category: 'physical', power: null, accuracy: 100, pp: 20 },
  'seismic-toss': { id: 'seismic-toss', name: 'Seismic Toss', type: 'fighting', category: 'physical', power: null, accuracy: 100, pp: 20, effect: { type: 'level-damage', target: 'enemy' } },

  // ─── Poison ───
  'poison-sting': { id: 'poison-sting', name: 'Poison Sting', type: 'poison', category: 'physical', power: 15, accuracy: 100, pp: 35, effect: { type: 'status', target: 'enemy', status: 'poison', chance: 30 } },
  'acid':         { id: 'acid', name: 'Acid', type: 'poison', category: 'special', power: 40, accuracy: 100, pp: 30, effect: { type: 'stat-change', target: 'enemy', stat: 'spDefense', stages: -1, chance: 10 } },
  'sludge':       { id: 'sludge', name: 'Sludge', type: 'poison', category: 'special', power: 65, accuracy: 100, pp: 20, effect: { type: 'status', target: 'enemy', status: 'poison', chance: 30 } },
  'smog':         { id: 'smog', name: 'Smog', type: 'poison', category: 'special', power: 30, accuracy: 70, pp: 20, effect: { type: 'status', target: 'enemy', status: 'poison', chance: 40 } },
  'poison-powder':{ id: 'poison-powder', name: 'Poison Powder', type: 'poison', category: 'status', power: null, accuracy: 75, pp: 35, effect: { type: 'status', target: 'enemy', status: 'poison', chance: 100 } },
  'poison-gas':   { id: 'poison-gas', name: 'Poison Gas', type: 'poison', category: 'status', power: null, accuracy: 90, pp: 40, effect: { type: 'status', target: 'enemy', status: 'poison', chance: 100 } },
  'toxic':        { id: 'toxic', name: 'Toxic', type: 'poison', category: 'status', power: null, accuracy: 90, pp: 10, effect: { type: 'status', target: 'enemy', status: 'bad-poison', chance: 100 } },
  'twineedle':    { id: 'twineedle', name: 'Twineedle', type: 'bug', category: 'physical', power: 25, accuracy: 100, pp: 20, effect: { type: 'multi-hit', target: 'enemy', hits: 2 } },
  'acid-armor':   { id: 'acid-armor', name: 'Acid Armor', type: 'poison', category: 'status', power: null, accuracy: 100, pp: 20, effect: { type: 'stat-change', target: 'self', stat: 'defense', stages: 2 } },

  // ─── Ground ───
  'sand-attack':  { id: 'sand-attack', name: 'Sand Attack', type: 'ground', category: 'status', power: null, accuracy: 100, pp: 15, effect: { type: 'stat-change', target: 'enemy', stat: 'attack', stages: -1 } },
  'earthquake':   { id: 'earthquake', name: 'Earthquake', type: 'ground', category: 'physical', power: 100, accuracy: 100, pp: 10 },
  'dig':          { id: 'dig', name: 'Dig', type: 'ground', category: 'physical', power: 80, accuracy: 100, pp: 10 },
  'fissure':      { id: 'fissure', name: 'Fissure', type: 'ground', category: 'physical', power: null, accuracy: 30, pp: 5, effect: { type: 'ohko', target: 'enemy' } },
  'bone-club':    { id: 'bone-club', name: 'Bone Club', type: 'ground', category: 'physical', power: 65, accuracy: 85, pp: 20, effect: { type: 'flinch', target: 'enemy', chance: 10 } },
  'bonemerang':   { id: 'bonemerang', name: 'Bonemerang', type: 'ground', category: 'physical', power: 50, accuracy: 90, pp: 10, effect: { type: 'multi-hit', target: 'enemy', hits: 2 } },

  // ─── Flying ───
  'gust':         { id: 'gust', name: 'Gust', type: 'flying', category: 'special', power: 40, accuracy: 100, pp: 35 },
  'peck':         { id: 'peck', name: 'Peck', type: 'flying', category: 'physical', power: 35, accuracy: 100, pp: 35 },
  'wing-attack':  { id: 'wing-attack', name: 'Wing Attack', type: 'flying', category: 'physical', power: 60, accuracy: 100, pp: 35 },
  'drill-peck':   { id: 'drill-peck', name: 'Drill Peck', type: 'flying', category: 'physical', power: 80, accuracy: 100, pp: 20 },
  'fly':          { id: 'fly', name: 'Fly', type: 'flying', category: 'physical', power: 90, accuracy: 95, pp: 15 },
  'sky-attack':   { id: 'sky-attack', name: 'Sky Attack', type: 'flying', category: 'physical', power: 140, accuracy: 90, pp: 5 },
  'hurricane':    { id: 'hurricane', name: 'Hurricane', type: 'flying', category: 'special', power: 110, accuracy: 70, pp: 10, effect: { type: 'status', target: 'enemy', status: 'confusion', chance: 30 } },
  'mirror-move':  { id: 'mirror-move', name: 'Mirror Move', type: 'flying', category: 'status', power: null, accuracy: 100, pp: 20 },
  'whirlwind':    { id: 'whirlwind', name: 'Whirlwind', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 20 },

  // ─── Psychic ───
  'confusion':    { id: 'confusion', name: 'Confusion', type: 'psychic', category: 'special', power: 50, accuracy: 100, pp: 25, effect: { type: 'status', target: 'enemy', status: 'confusion', chance: 10 } },
  'psybeam':      { id: 'psybeam', name: 'Psybeam', type: 'psychic', category: 'special', power: 65, accuracy: 100, pp: 20, effect: { type: 'status', target: 'enemy', status: 'confusion', chance: 10 } },
  'psychic':      { id: 'psychic', name: 'Psychic', type: 'psychic', category: 'special', power: 90, accuracy: 100, pp: 10, effect: { type: 'stat-change', target: 'enemy', stat: 'spDefense', stages: -1, chance: 10 } },
  'psywave':      { id: 'psywave', name: 'Psywave', type: 'psychic', category: 'special', power: null, accuracy: 100, pp: 15, effect: { type: 'level-damage', target: 'enemy' } },
  'dream-eater':  { id: 'dream-eater', name: 'Dream Eater', type: 'psychic', category: 'special', power: 100, accuracy: 100, pp: 15, effect: { type: 'drain', target: 'self', chance: 100 } },
  'hypnosis':     { id: 'hypnosis', name: 'Hypnosis', type: 'psychic', category: 'status', power: null, accuracy: 60, pp: 20, effect: { type: 'status', target: 'enemy', status: 'sleep', chance: 100 } },
  'meditate':     { id: 'meditate', name: 'Meditate', type: 'psychic', category: 'status', power: null, accuracy: 100, pp: 40, effect: { type: 'stat-change', target: 'self', stat: 'attack', stages: 1 } },
  'agility':      { id: 'agility', name: 'Agility', type: 'psychic', category: 'status', power: null, accuracy: 100, pp: 30, effect: { type: 'stat-change', target: 'self', stat: 'speed', stages: 2 } },
  'amnesia':      { id: 'amnesia', name: 'Amnesia', type: 'psychic', category: 'status', power: null, accuracy: 100, pp: 20, effect: { type: 'stat-change', target: 'self', stat: 'spDefense', stages: 2 } },
  'barrier':      { id: 'barrier', name: 'Barrier', type: 'psychic', category: 'status', power: null, accuracy: 100, pp: 20, effect: { type: 'stat-change', target: 'self', stat: 'defense', stages: 2 } },
  'light-screen': { id: 'light-screen', name: 'Light Screen', type: 'psychic', category: 'status', power: null, accuracy: 100, pp: 30, effect: { type: 'stat-change', target: 'self', stat: 'spDefense', stages: 1 } },
  'reflect':      { id: 'reflect', name: 'Reflect', type: 'psychic', category: 'status', power: null, accuracy: 100, pp: 20, effect: { type: 'stat-change', target: 'self', stat: 'defense', stages: 1 } },
  'rest':         { id: 'rest', name: 'Rest', type: 'psychic', category: 'status', power: null, accuracy: 100, pp: 10, effect: { type: 'heal', target: 'self', amount: 100 } },
  'teleport':     { id: 'teleport', name: 'Teleport', type: 'psychic', category: 'status', power: null, accuracy: 100, pp: 20 },
  'kinesis':      { id: 'kinesis', name: 'Kinesis', type: 'psychic', category: 'status', power: null, accuracy: 80, pp: 15, effect: { type: 'stat-change', target: 'enemy', stat: 'attack', stages: -1 } },

  // ─── Bug ───
  'string-shot':  { id: 'string-shot', name: 'String Shot', type: 'bug', category: 'status', power: null, accuracy: 95, pp: 40, effect: { type: 'stat-change', target: 'enemy', stat: 'speed', stages: -1 } },
  'pin-missile':  { id: 'pin-missile', name: 'Pin Missile', type: 'bug', category: 'physical', power: 25, accuracy: 95, pp: 20, effect: { type: 'multi-hit', target: 'enemy' } },
  'leech-life':   { id: 'leech-life', name: 'Leech Life', type: 'bug', category: 'physical', power: 20, accuracy: 100, pp: 15, effect: { type: 'drain', target: 'self', chance: 100 } },

  // ─── Rock ───
  'rock-throw':   { id: 'rock-throw', name: 'Rock Throw', type: 'rock', category: 'physical', power: 50, accuracy: 90, pp: 15 },
  'rock-slide':   { id: 'rock-slide', name: 'Rock Slide', type: 'rock', category: 'physical', power: 75, accuracy: 90, pp: 10, effect: { type: 'flinch', target: 'enemy', chance: 30 } },
  'rock-tomb':    { id: 'rock-tomb', name: 'Rock Tomb', type: 'rock', category: 'physical', power: 60, accuracy: 95, pp: 15, effect: { type: 'stat-change', target: 'enemy', stat: 'speed', stages: -1 } },

  // ─── Ghost ───
  'lick':         { id: 'lick', name: 'Lick', type: 'ghost', category: 'physical', power: 30, accuracy: 100, pp: 30, effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 30 } },
  'night-shade':  { id: 'night-shade', name: 'Night Shade', type: 'ghost', category: 'special', power: null, accuracy: 100, pp: 15, effect: { type: 'level-damage', target: 'enemy' } },
  'confuse-ray':  { id: 'confuse-ray', name: 'Confuse Ray', type: 'ghost', category: 'status', power: null, accuracy: 100, pp: 10, effect: { type: 'status', target: 'enemy', status: 'confusion', chance: 100 } },

  // ─── Dragon ───
  'dragon-rage':  { id: 'dragon-rage', name: 'Dragon Rage', type: 'dragon', category: 'special', power: null, accuracy: 100, pp: 10, effect: { type: 'fixed-damage', target: 'enemy', amount: 40 } },

  // ─── Dark ───
  'bite':         { id: 'bite', name: 'Bite', type: 'dark', category: 'physical', power: 60, accuracy: 100, pp: 25, effect: { type: 'flinch', target: 'enemy', chance: 30 } },

  // ─── Razor Wind (Normal, Special, charge move — simplified to 1 turn) ───
  'razor-wind':   { id: 'razor-wind', name: 'Razor Wind', type: 'normal', category: 'special', power: 80, accuracy: 100, pp: 10 },

  // ─── Struggle (fallback when out of PP) ───
  'struggle':     { id: 'struggle', name: 'Struggle', type: 'normal', category: 'physical', power: 50, accuracy: 100, pp: 1, effect: { type: 'recoil', target: 'self', amount: 25 } },
};
