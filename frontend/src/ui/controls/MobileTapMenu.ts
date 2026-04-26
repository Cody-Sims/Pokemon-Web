import Phaser from 'phaser';

/**
 * Scene-level tap handler with generous hit zones for reliable mobile menu input.
 *
 * Registers a single `pointerdown` listener on the scene's input manager
 * that finds the closest menu item to each tap. Uses a frame-delayed
 * registration to prevent the tap that created this menu from immediately
 * selecting an item.
 *
 * Call {@link destroy} to remove the listener when the menu is dismissed.
 */
export class MobileTapMenu {
  private scene: Phaser.Scene;
  private items: Phaser.GameObjects.Text[];
  private onSelect: (index: number) => void;
  private extraWidth: number;
  private extraHeight: number;
  private registered = false;

  /** Bound handler reference for clean add/remove. */
  private readonly handler: (pointer: Phaser.Input.Pointer) => void;

  /**
   * @param scene       The Phaser scene to attach the listener to.
   * @param items       The text game objects that represent menu choices.
   * @param onSelect    Callback invoked with the selected item index.
   * @param extraWidth  Extra horizontal padding added to each item's hit zone (default 80).
   * @param extraHeight Extra vertical padding added to each item's hit zone (default 10).
   */
  constructor(
    scene: Phaser.Scene,
    items: Phaser.GameObjects.Text[],
    onSelect: (index: number) => void,
    extraWidth = 80,
    extraHeight = 10,
  ) {
    this.scene = scene;
    this.items = items;
    this.onSelect = onSelect;
    this.extraWidth = extraWidth;
    this.extraHeight = extraHeight;

    this.handler = (pointer: Phaser.Input.Pointer) => {
      let bestIdx = -1;
      let bestDist = Infinity;
      for (let i = 0; i < this.items.length; i++) {
        const item = this.items[i];
        const dy = Math.abs(pointer.y - item.y);
        const dx = Math.abs(pointer.x - item.x);
        const halfSpacing = i < this.items.length - 1
          ? Math.abs(this.items[i + 1].y - item.y) / 2
          : i > 0
            ? Math.abs(item.y - this.items[i - 1].y) / 2
            : 20;
        if (dx < item.width / 2 + this.extraWidth && dy < halfSpacing + this.extraHeight) {
          if (dy < bestDist) {
            bestDist = dy;
            bestIdx = i;
          }
        }
      }
      if (bestIdx >= 0) {
        this.onSelect(bestIdx);
      }
    };

    // Frame-delayed registration prevents the current tap from
    // immediately triggering a selection.
    scene.time.delayedCall(0, () => {
      if (!this.scene.scene.isActive(this.scene)) return;
      this.scene.input.on('pointerdown', this.handler);
      this.registered = true;
    });
  }

  /** Remove the scene-level listener. Safe to call multiple times. */
  destroy(): void {
    if (this.registered) {
      this.scene.input.off('pointerdown', this.handler);
      this.registered = false;
    }
  }

  /** Re-register the listener (e.g. after returning from a sub-menu). */
  reattach(): void {
    if (!this.registered) {
      this.scene.input.on('pointerdown', this.handler);
      this.registered = true;
    }
  }
}
