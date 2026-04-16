import Phaser from 'phaser';
import { BootScene } from '@scenes/BootScene';
import { PreloadScene } from '@scenes/PreloadScene';
import { TitleScene } from '@scenes/TitleScene';
import { OverworldScene } from '@scenes/OverworldScene';
import { BattleScene } from '@scenes/BattleScene';
import { BattleUIScene } from '@scenes/BattleUIScene';
import { DialogueScene } from '@scenes/DialogueScene';
import { MenuScene } from '@scenes/MenuScene';
import { InventoryScene } from '@scenes/InventoryScene';
import { PartyScene } from '@scenes/PartyScene';
import { SummaryScene } from '@scenes/SummaryScene';
import { TransitionScene } from '@scenes/TransitionScene';
import { StarterSelectScene } from '@scenes/StarterSelectScene';
import { SettingsScene } from '@scenes/SettingsScene';
import { ShopScene } from '@scenes/ShopScene';
import { PCScene } from '@scenes/PCScene';
import { PokedexScene } from '@scenes/PokedexScene';
import { IntroScene } from '@scenes/IntroScene';
import { QuestJournalScene } from '@scenes/QuestJournalScene';
import { QuestTrackerScene } from '@scenes/QuestTrackerScene';
import { MoveTutorScene } from '@scenes/MoveTutorScene';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';

const isMobile = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  input: {
    activePointers: 3, // Multi-touch: joystick + action buttons simultaneously
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: isMobile ? Phaser.Scale.CENTER_HORIZONTALLY : Phaser.Scale.CENTER_BOTH,
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
  ],
};
