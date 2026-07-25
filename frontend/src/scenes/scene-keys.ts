export const SceneKey = {
  Boot: 'BootScene',
  Preload: 'PreloadScene',
  Title: 'TitleScene',
  Overworld: 'OverworldScene',
  Battle: 'BattleScene',
  BattleUI: 'BattleUIScene',
  BattleTower: 'BattleTowerScene',
  BPShop: 'BPShopScene',
  Dialogue: 'DialogueScene',
  Menu: 'MenuScene',
  Inventory: 'InventoryScene',
  Party: 'PartyScene',
  Summary: 'SummaryScene',
  Transition: 'TransitionScene',
  StarterSelect: 'StarterSelectScene',
  Settings: 'SettingsScene',
  Shop: 'ShopScene',
  VoltorbFlip: 'VoltorbFlipScene',
  PC: 'PCScene',
  Pokedex: 'PokedexScene',
  Intro: 'IntroScene',
  QuestJournal: 'QuestJournalScene',
  QuestTracker: 'QuestTrackerScene',
  PartyQuickView: 'PartyQuickViewScene',
  MoveTutor: 'MoveTutorScene',
  Nickname: 'NicknameScene',
  FlyMap: 'FlyMapScene',
  TownMap: 'TownMapScene',
  Statistics: 'StatisticsScene',
  HallOfFame: 'HallOfFameScene',
  Achievement: 'AchievementScene',
  TrainerCard: 'TrainerCardScene',
  Minimap: 'MinimapScene',
} as const;

export type SceneKeyName = typeof SceneKey[keyof typeof SceneKey];

export const REGISTERED_SCENE_KEYS = Object.values(SceneKey) as SceneKeyName[];

export function isSceneKey(value: string): value is SceneKeyName {
  return REGISTERED_SCENE_KEYS.includes(value as SceneKeyName);
}
