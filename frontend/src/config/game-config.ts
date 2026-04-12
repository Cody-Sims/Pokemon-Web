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
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
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
  ],
};
