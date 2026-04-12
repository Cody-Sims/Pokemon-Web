import Phaser from 'phaser';
import { Direction } from '@utils/type-helpers';

export interface InputState {
  direction: Direction | null;
  confirm: boolean;
  cancel: boolean;
  menu: boolean;
}

/** Unified input manager: WASD/Arrow keys + confirm/cancel. */
export class InputManager {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private confirmKey!: Phaser.Input.Keyboard.Key;
  private cancelKey!: Phaser.Input.Keyboard.Key;
  private menuKey!: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.wasd = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.confirmKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.cancelKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.menuKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  /** Poll current input state. */
  getState(): InputState {
    let direction: Direction | null = null;

    if (this.cursors.up.isDown || this.wasd.W.isDown) direction = 'up';
    else if (this.cursors.down.isDown || this.wasd.S.isDown) direction = 'down';
    else if (this.cursors.left.isDown || this.wasd.A.isDown) direction = 'left';
    else if (this.cursors.right.isDown || this.wasd.D.isDown) direction = 'right';

    return {
      direction,
      confirm: Phaser.Input.Keyboard.JustDown(this.confirmKey),
      cancel: Phaser.Input.Keyboard.JustDown(this.cancelKey),
      menu: Phaser.Input.Keyboard.JustDown(this.menuKey),
    };
  }
}
