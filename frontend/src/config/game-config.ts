import Phaser from 'phaser';
import { BootScene } from '@scenes/boot/BootScene';
import { PreloadScene } from '@scenes/boot/PreloadScene';
import { TitleScene } from '@scenes/title/TitleScene';
import { OverworldScene } from '@scenes/overworld/OverworldScene';
import { BattleScene } from '@scenes/battle/BattleScene';
import { BattleUIScene } from '@scenes/battle/BattleUIScene';
import { DialogueScene } from '@scenes/overworld/DialogueScene';
import { MenuScene } from '@scenes/menu/MenuScene';
import { InventoryScene } from '@scenes/menu/InventoryScene';
import { PartyScene } from '@scenes/menu/PartyScene';
import { SummaryScene } from '@scenes/menu/SummaryScene';
import { TransitionScene } from '@scenes/overworld/TransitionScene';
import { StarterSelectScene } from '@scenes/pokemon/StarterSelectScene';
import { SettingsScene } from '@scenes/menu/SettingsScene';
import { ShopScene } from '@scenes/minigame/ShopScene';
import { PCScene } from '@scenes/pokemon/PCScene';
import { PokedexScene } from '@scenes/menu/PokedexScene';
import { IntroScene } from '@scenes/title/IntroScene';
import { QuestJournalScene } from '@scenes/menu/QuestJournalScene';
import { QuestTrackerScene } from '@scenes/menu/QuestTrackerScene';
import { MoveTutorScene } from '@scenes/pokemon/MoveTutorScene';
import { NicknameScene } from '@scenes/pokemon/NicknameScene';
import { FlyMapScene } from '@scenes/menu/FlyMapScene';
import { StatisticsScene } from '@scenes/menu/StatisticsScene';
import { HallOfFameScene } from '@scenes/menu/HallOfFameScene';
import { AchievementScene } from '@scenes/menu/AchievementScene';
import { TrainerCardScene } from '@scenes/menu/TrainerCardScene';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';

import { isMobile } from '@ui/theme';

const mobile = isMobile();

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  input: {
    activePointers: 3, // Multi-touch: joystick + action buttons simultaneously
  },
  scale: {
    // ENVELOP fills the viewport fully on mobile (no black bars); FIT preserves
    // the aspect ratio on desktop (centred inside the desktop chrome frame).
    mode: mobile ? Phaser.Scale.ENVELOP : Phaser.Scale.FIT,
    autoCenter: mobile ? Phaser.Scale.NO_CENTER : Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    OverworldScene,
    BattleScene,
    BattleUIScene,
    DialogueScene,
    MenuScene,
    InventoryScene,
    PartyScene,
    SummaryScene,
    TransitionScene,
    StarterSelectScene,
    SettingsScene,
    ShopScene,
    PCScene,
    PokedexScene,
    IntroScene,
    QuestJournalScene,
    QuestTrackerScene,
    MoveTutorScene,
    NicknameScene,
    FlyMapScene,
    StatisticsScene,
    HallOfFameScene,
    AchievementScene,
    TrainerCardScene,
  ],
};
