// Pokemon types
export type PokemonType =
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

// Direction enum for movement
export type Direction = 'up' | 'down' | 'left' | 'right';

// Status conditions
export type StatusCondition = 'burn' | 'paralysis' | 'poison' | 'bad-poison' | 'sleep' | 'freeze';
export type VolatileStatus = 'confusion' | 'flinch' | 'leech-seed' | 'trapped';

// Nature affects stats
export type Nature =
  | 'hardy' | 'lonely' | 'brave' | 'adamant' | 'naughty'
  | 'bold' | 'docile' | 'relaxed' | 'impish' | 'lax'
  | 'timid' | 'hasty' | 'serious' | 'jolly' | 'naive'
  | 'modest' | 'mild' | 'quiet' | 'bashful' | 'rash'
  | 'calm' | 'gentle' | 'sassy' | 'careful' | 'quirky';

// Battle result
export type BattleResult = 'victory' | 'defeat' | 'flee' | 'capture';

// Stat stages tracked during battle (-6 to +6)
export interface StatStages {
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

// Move effect types
export interface MoveEffect {
  type: 'stat-change' | 'status' | 'heal' | 'recoil' | 'drain' | 'multi-hit' | 'flinch'
    | 'ohko' | 'fixed-damage' | 'level-damage' | 'self-destruct' | 'leech-seed' | 'trap';
  target: 'self' | 'enemy';
  stat?: keyof Stats;
  stages?: number;
  status?: StatusCondition | VolatileStatus;
  chance?: number; // 0-100 probability
  amount?: number; // Fixed damage, heal %, or recoil %
  hits?: number;   // Exact hit count for multi-hit (e.g. 2 for Double Kick)
}

// Item effect types
export interface ItemEffect {
  type: 'heal-hp' | 'heal-status' | 'capture' | 'boost-stat' | 'key' | 'teach-move';
  amount?: number;
  status?: StatusCondition | 'all';
  catchRateMultiplier?: number;
  moveId?: string;
}

// Stats interface
export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

// Evolution node
export interface EvolutionNode {
  pokemonId: number;
  condition: EvolutionCondition;
}

export interface EvolutionCondition {
  type: 'level' | 'item' | 'trade';
  level?: number;
  itemId?: string;
}
