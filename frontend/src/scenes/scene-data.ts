import type { DifficultyMode } from '@data/difficulty';
import type { ChallengeMode } from '@data/challenge-modes';
import type { PokemonInstance } from '@data/interfaces';
import type { TowerStreakState } from '@systems/engine/BattleTowerStreak';
import type { SceneKeyName } from './scene-keys';

type NoSceneData = undefined;
type ScenePayload = Record<string, unknown>;

export interface PreloadSceneData {
  manifest?: unknown;
}

export interface OverworldSceneData {
  mapKey?: string;
  spawnId?: string;
  flyTo?: string;
  resume?: boolean;
}

export interface BattleSceneData {
  enemyPokemon?: PokemonInstance;
  enemyParty?: PokemonInstance[];
  allyParty?: PokemonInstance[];
  isTrainer?: boolean;
  trainerId?: string;
  trainerSpriteKey?: string;
  trainerName?: string;
  isGymLeader?: boolean;
  isRival?: boolean;
  isLegendary?: boolean;
  isVillain?: boolean;
  isDouble?: boolean;
  victoryFlag?: string;
  battleBg?: string;
  suppressMoneyReward?: boolean;
  _returnScene?: SceneKeyName;
  _returnData?: ScenePayload;
}

export interface DialogueSceneData {
  dialogue: string[];
  speaker?: string;
  portraitKey?: string;
  choices?: { text: string; value: string }[];
  onChoice?: (value: string) => void;
  callingScene?: SceneKeyName;
}

export interface TransitionSceneData {
  targetScene: SceneKeyName;
  returnScene?: SceneKeyName;
  duration?: number;
  targetData?: ScenePayload;
  returnData?: ScenePayload;
  style?: 'fade' | 'stripes' | 'circles';
}

export interface InventorySceneData {
  battleMode?: boolean;
  savedCategoryIndex?: number;
  savedScrollOffset?: number;
}

export interface PartySceneData {
  selectMode?: boolean;
  forcedSwitch?: boolean;
}

export interface SummarySceneData {
  pokemon: PokemonInstance;
  partyIndex?: number;
}

export interface SettingsSceneData {
  returnScene?: SceneKeyName;
}

export interface ShopSceneData {
  shopId?: string;
  savedTab?: 'buy' | 'sell';
}

export interface IntroSceneData {
  difficulty?: DifficultyMode;
  challengeModes?: ChallengeMode[];
}

export interface MoveTutorSceneData {
  tutorId?: string;
  tmMode?: boolean;
  tmMoveId?: string;
}

export interface NicknameSceneData {
  pokemon: PokemonInstance;
  speciesName: string;
}

export interface BattleTowerSceneData {
  exitScene?: SceneKeyName;
  _towerState?: TowerStreakState;
}

export interface BPShopSceneData {
  exitScene?: SceneKeyName;
}

export interface SceneDataMap {
  BootScene: NoSceneData;
  PreloadScene: PreloadSceneData | undefined;
  TitleScene: NoSceneData;
  OverworldScene: OverworldSceneData | undefined;
  BattleScene: BattleSceneData | undefined;
  BattleUIScene: NoSceneData;
  BattleTowerScene: BattleTowerSceneData | undefined;
  BPShopScene: BPShopSceneData | undefined;
  DialogueScene: DialogueSceneData;
  MenuScene: NoSceneData;
  InventoryScene: InventorySceneData | undefined;
  PartyScene: PartySceneData | undefined;
  SummaryScene: SummarySceneData;
  TransitionScene: TransitionSceneData;
  StarterSelectScene: NoSceneData;
  SettingsScene: SettingsSceneData | undefined;
  ShopScene: ShopSceneData | undefined;
  VoltorbFlipScene: NoSceneData;
  PCScene: NoSceneData;
  PokedexScene: NoSceneData;
  IntroScene: IntroSceneData | undefined;
  QuestJournalScene: NoSceneData;
  QuestTrackerScene: NoSceneData;
  PartyQuickViewScene: NoSceneData;
  MoveTutorScene: MoveTutorSceneData | undefined;
  NicknameScene: NicknameSceneData;
  FlyMapScene: NoSceneData;
  TownMapScene: NoSceneData;
  StatisticsScene: NoSceneData;
  HallOfFameScene: NoSceneData;
  AchievementScene: NoSceneData;
  TrainerCardScene: NoSceneData;
  MinimapScene: NoSceneData;
}

export type SceneData<K extends SceneKeyName> = SceneDataMap[K];
export type SceneDataArgs<K extends SceneKeyName> = undefined extends SceneData<K>
  ? [data?: SceneData<K>]
  : [data: SceneData<K>];
