import Phaser from 'phaser';
import { AudioManager } from '@managers/AudioManager';
import { SFX } from '@utils/audio-keys';
import { SelectableController, type SelectableControllerConfig } from './SelectableController';

export interface MenuControllerConfig extends Omit<SelectableControllerConfig, 'sounds' | 'onMove'> {
  /** Called when cursor moves. Kept single-argument for existing scenes/tests. */
  onMove?: (index: number) => void;
  /** Play audio feedback on navigation. */
  audioFeedback?: boolean;
}

/**
 * Backward-compatible facade for scenes already using MenuController.
 * New scene migrations should prefer SelectableController directly for pure
 * cursor state, disabled entries, 2-D grids, pointer binding, and windowing.
 */
export class MenuController extends SelectableController {
  constructor(scene: Phaser.Scene, config: MenuControllerConfig) {
    const { audioFeedback: configuredAudioFeedback, onMove, ...controllerConfig } = config;
    const audioFeedback = configuredAudioFeedback ?? true;
    super({
      ...controllerConfig,
      onMove: (index) => onMove?.(index),
      sounds: audioFeedback
        ? {
            move: () => AudioManager.getInstance().playSFX(SFX.CURSOR),
            confirm: () => AudioManager.getInstance().playSFX(SFX.CONFIRM),
            cancel: () => AudioManager.getInstance().playSFX(SFX.CANCEL),
          }
        : undefined,
    });
    this.bindKeyboard(scene);
    scene.events?.once('shutdown', () => this.destroy());
  }
}
