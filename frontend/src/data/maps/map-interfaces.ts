import { Direction } from '@utils/type-helpers';
import { NPCBehaviorConfig } from '@systems/NPCBehavior';

export interface NpcSpawn {
  id: string;
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
  interactionType?: 'heal' | 'shop' | 'pc' | 'starter-select' | 'name-rater' | 'move-tutor' | 'tag-battle' | 'show-pokemon' | 'wild-encounter';
  /** Extra data for the interaction (e.g. tutorId for move-tutor). */
  interactionData?: string;
  /** Idle behavior config (look-around, wander, pace). */
  behavior?: NPCBehaviorConfig;
  /** If set, play this cutscene (by key) when the player interacts instead of normal dialogue. */
  triggerCutscene?: string;
}

export interface TrainerSpawn {
  id: string;          // NPC id
  trainerId: string;   // Key into trainerData
  tileX: number;
  tileY: number;
  textureKey: string;
  facing: Direction;
  lineOfSight: number;
  /** Game flag that must be set for this trainer to appear. */
  condition?: string;
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
  weather?: import('@systems/WeatherRenderer').OverworldWeather;
  /** Ambient sound effect type for this map. Defaults to 'none'. */
  ambientSfx?: import('@systems/AmbientSFX').AmbientType;
  /** Cutscene to play when entering this map. Skipped if the cutscene's setFlag flags are already set. */
  onEnterCutscene?: string;
  /** Flag that must be set for the onEnterCutscene to trigger. Supports '!' prefix for negation. */
  onEnterCutsceneRequireFlag?: string;
}
