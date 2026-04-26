import Phaser from 'phaser';
import { Direction } from '@utils/type-helpers';
import { TouchControls } from '@ui/controls/TouchControls';

export interface InputState {
  direction: Direction | null;
  confirm: boolean;
  cancel: boolean;
  menu: boolean;
  bicycle: boolean;
  _escRaw?: boolean; // Raw ESC key state for disambiguation
}

/** Unified input manager: WASD/Arrow keys + touch controls. */
export class InputManager {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private confirmKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private cancelKey!: Phaser.Input.Keyboard.Key;
  private bicycleKey!: Phaser.Input.Keyboard.Key;
  private touchControls?: TouchControls;

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
    this.spaceKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.bicycleKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.B);;
    this.cancelKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Create touch controls on touch-capable devices
    if (TouchControls.isTouchDevice()) {
      this.touchControls = new TouchControls(scene);
    }
  }

  /** Poll current input state (keyboard + touch merged). */
  getState(): InputState {
    let direction: Direction | null = null;

    if (this.cursors.up.isDown || this.wasd.W.isDown) direction = 'up';
    else if (this.cursors.down.isDown || this.wasd.S.isDown) direction = 'down';
    else if (this.cursors.left.isDown || this.wasd.A.isDown) direction = 'left';
    else if (this.cursors.right.isDown || this.wasd.D.isDown) direction = 'right';

    // Merge touch input
    if (!direction && this.touchControls) {
      direction = this.touchControls.getDirection();
    }

    const escPressed = Phaser.Input.Keyboard.JustDown(this.cancelKey);
    const touchConfirm = this.touchControls?.consumeConfirm() ?? false;
    const touchCancel = this.touchControls?.consumeCancel() ?? false;

    // ESC/cancel maps to 'cancel' in menus, 'menu' only from overworld
    const cancelActive = escPressed || touchCancel;

    return {
      direction,
      confirm: Phaser.Input.Keyboard.JustDown(this.confirmKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey) || touchConfirm,
      cancel: cancelActive,
      bicycle: Phaser.Input.Keyboard.JustDown(this.bicycleKey),
      // Menu fires from ESC key or touch cancel (hamburger button).
      // Both cancel and menu share the same gesture — consumers that check
      // cancel (e.g. BattleUI back) won't conflict because the OverworldScene
      // checks menu first and returns, consuming the frame.
      menu: escPressed || touchCancel,
      _escRaw: escPressed,
    };
  }

  /** Get the touch controls instance (or undefined on desktop). */
  getTouchControls(): TouchControls | undefined {
    return this.touchControls;
  }
}
