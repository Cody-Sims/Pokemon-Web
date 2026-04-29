import { Direction } from '@utils/type-helpers';
import { NPCBehaviorConfig } from '@systems/overworld/NPCBehavior';
import type { TimePeriod } from '@systems/engine/GameClock';

/** Position override or 'hidden' for an NPC during a specific time period. */
export type NpcScheduleEntry = { x: number; y: number } | 'hidden';

export interface NpcSpawn {
  id: string;
  /** Display name shown in the dialogue speaker tag. */
  name?: string;
  tileX: number;
  tileY: number;
  textureKey: string;
  facing: Direction;
  dialogue: string[];
  /** If set, NPC only appears when this flag is true (or false if prefixed with '!'). */
  requireFlag?: string;
  /** Alternative dialogue when a given flag is set. */
  flagDialogue?: { flag: string; dialogue: string[]; setFlag?: string }[];
  /** On interaction, set this flag to true. */
  setsFlag?: string;
  /** On first interaction, give this item to the player (requires setsFlag to gate). */
  givesItem?: string;
  /** Special interaction type instead of plain dialogue. */
  interactionType?: 'heal' | 'shop' | 'pc' | 'starter-select' | 'name-rater' | 'move-tutor' | 'tag-battle' | 'show-pokemon' | 'wild-encounter' | 'fossil-revival' | 'berry-tree' | 'battle-tower';
  /** Extra data for the interaction (e.g. tutorId for move-tutor). */
  interactionData?: string;
  /** Idle behavior config (look-around, wander, pace). */
  behavior?: NPCBehaviorConfig;
  /** If set, play this cutscene (by key) when the player interacts instead of normal dialogue. */
  triggerCutscene?: string;
  /**
   * Time-based schedule: maps each TimePeriod to a position override or 'hidden'.
   * Periods not listed use the default tileX/tileY and remain visible.
   */
  schedule?: Partial<Record<TimePeriod, NpcScheduleEntry>>;
}

export interface TrainerSpawn {
  id: string;          // NPC id
  /** Display name shown in the dialogue speaker tag. */
  name?: string;
  trainerId: string;   // Key into trainerData
  tileX: number;
  tileY: number;
  textureKey: string;
  facing: Direction;
  lineOfSight: number;
  /** Game flag that must be set for this trainer to appear. */
  condition?: string;
}

export type ObjectType = 'sign' | 'item-ball' | 'pc' | 'door';

export interface ObjectSpawn {
  id: string;
  tileX: number;
  tileY: number;
  textureKey: string;
  objectType: ObjectType;
  dialogue: string[];
  /** If set, object only appears when this flag is true (or false if prefixed with '!'). */
  requireFlag?: string;
  /** Alternative dialogue when a given flag is set. */
  flagDialogue?: { flag: string; dialogue: string[]; setFlag?: string }[];
  /** On interaction, set this flag to true. */
  setsFlag?: string;
  /** On first interaction, give this item to the player (requires setsFlag to gate). */
  givesItem?: string;
  /** Special interaction type instead of plain dialogue. */
  interactionType?: 'heal' | 'shop' | 'pc' | 'starter-select' | 'name-rater' | 'move-tutor' | 'tag-battle' | 'show-pokemon' | 'wild-encounter' | 'fossil-revival' | 'berry-tree' | 'battle-tower';
  /** Extra data for the interaction (e.g. tutorId for move-tutor). */
  interactionData?: string;
  /** If set, play this cutscene (by key) when the player interacts instead of normal dialogue. */
  triggerCutscene?: string;
}

export interface WarpDefinition {
  tileX: number;
  tileY: number;
  targetMap: string;
  targetSpawnId: string;
  /** Game flag that must be set (or prefixed with '!' for negated) for this warp to work. */
  requireFlag?: string;
}

export interface SpawnPoint {
  x: number;
  y: number;
  direction: Direction;
}

export interface MapDefinition {
  key: string;
  width: number;
  height: number;
  ground: number[][];
  encounterTableKey: string;
  npcs: NpcSpawn[];
  trainers: TrainerSpawn[];
  objects: ObjectSpawn[];
  warps: WarpDefinition[];
  spawnPoints: Record<string, SpawnPoint>;
  /** If true, this is an interior map (smaller camera, no encounters). */
  isInterior?: boolean;
  /** Displayed when entering the map (e.g., "Oak's Laboratory"). */
  displayName?: string;
  /** Battle background key for encounters on this map. Falls back to procedural if not set. */
  battleBg?: string;
  /** If true, this map has cave darkness requiring Flash to navigate. */
  isDark?: boolean;
  /** Static light source positions (torches, lamps). */
  lightSources?: Array<{ tileX: number; tileY: number; radius?: number; color?: number }>;
  /** Overworld weather effect to render on this map. Defaults to 'none'. */
  weather?: import('@systems/rendering/WeatherRenderer').OverworldWeather;
  /** Ambient sound effect type for this map. Defaults to 'none'. */
  ambientSfx?: import('@systems/audio/AmbientSFX').AmbientType;
  /** Cutscene to play when entering this map. Skipped if the cutscene's setFlag flags are already set. */
  onEnterCutscene?: string;
  /** Flag that must be set for the onEnterCutscene to trigger. Supports '!' prefix for negation. */
  onEnterCutsceneRequireFlag?: string;
}
