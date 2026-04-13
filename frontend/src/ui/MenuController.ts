import Phaser from 'phaser';
import { AudioManager } from '@managers/AudioManager';
import { SFX } from '@utils/audio-keys';

export interface MenuControllerConfig {
  /** Number of columns in the grid (1 = vertical list). */
  columns?: number;
  /** Total number of items. */
  itemCount: number;
  /** Wrap around when navigating past boundaries. */
  wrap?: boolean;
  /** Called when cursor moves. */
  onMove?: (index: number) => void;
  /** Called when confirm is pressed. */
  onConfirm?: (index: number) => void;
  /** Called when cancel is pressed. */
  onCancel?: () => void;
  /** Play audio feedback on navigation. */
  audioFeedback?: boolean;
  /** Disable all input processing. */
  disabled?: boolean;
}

/**
 * Unified menu input controller.
 * Manages cursor tracking for 1D and 2D grids with keyboard + mouse support.
 * Plays SFX for cursor movement, confirm, and cancel.
 */
export class MenuController {
  private scene: Phaser.Scene;
  private cursor = 0;
  private columns: number;
  private itemCount: number;
  private wrap: boolean;
  private onMove?: (index: number) => void;
  private onConfirm?: (index: number) => void;
  private onCancel?: () => void;
  private audioFeedback: boolean;
  private disabled: boolean;
  private keyHandlers: { event: string; fn: () => void }[] = [];

  constructor(scene: Phaser.Scene, config: MenuControllerConfig) {
    this.scene = scene;
    this.columns = config.columns ?? 1;
    this.itemCount = config.itemCount;
    this.wrap = config.wrap ?? true;
    this.onMove = config.onMove;
    this.onConfirm = config.onConfirm;
    this.onCancel = config.onCancel;
    this.audioFeedback = config.audioFeedback ?? true;
    this.disabled = config.disabled ?? false;

    this.bindKeys();
  }

  private bindKeys(): void {
    const kb = this.scene.input.keyboard;
    if (!kb) return;

    const bind = (event: string, fn: () => void) => {
      kb.on(event, fn);
      this.keyHandlers.push({ event, fn });
    };

    bind('keydown-UP', () => this.navigate('up'));
    bind('keydown-DOWN', () => this.navigate('down'));
    bind('keydown-LEFT', () => this.navigate('left'));
    bind('keydown-RIGHT', () => this.navigate('right'));
    bind('keydown-W', () => this.navigate('up'));
    bind('keydown-S', () => this.navigate('down'));
    bind('keydown-A', () => this.navigate('left'));
    bind('keydown-D', () => this.navigate('right'));
    bind('keydown-ENTER', () => this.confirm());
    bind('keydown-SPACE', () => this.confirm());
    bind('keydown-Z', () => this.confirm());
    bind('keydown-ESC', () => this.cancel());
    bind('keydown-X', () => this.cancel());
  }

  navigate(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (this.disabled || this.itemCount === 0) return;

    let newCursor = this.cursor;
    const col = this.cursor % this.columns;
    const row = Math.floor(this.cursor / this.columns);
    const rows = Math.ceil(this.itemCount / this.columns);

    switch (direction) {
      case 'up':
        if (row > 0) newCursor = this.cursor - this.columns;
        else if (this.wrap) newCursor = Math.min((rows - 1) * this.columns + col, this.itemCount - 1);
        break;
      case 'down':
        if (this.cursor + this.columns < this.itemCount) newCursor = this.cursor + this.columns;
        else if (this.wrap) newCursor = col < this.itemCount ? col : 0;
        break;
      case 'left':
        if (col > 0) newCursor = this.cursor - 1;
        else if (this.wrap) newCursor = Math.min(row * this.columns + this.columns - 1, this.itemCount - 1);
        break;
      case 'right':
        if (col < this.columns - 1 && this.cursor + 1 < this.itemCount) newCursor = this.cursor + 1;
        else if (this.wrap) newCursor = row * this.columns;
        break;
    }

    if (newCursor !== this.cursor) {
      this.cursor = newCursor;
      if (this.audioFeedback) AudioManager.getInstance().playSFX(SFX.CURSOR);
      this.onMove?.(this.cursor);
    }
  }

  confirm(): void {
    if (this.disabled) return;
    if (this.audioFeedback) AudioManager.getInstance().playSFX(SFX.CONFIRM);
    this.onConfirm?.(this.cursor);
  }

  cancel(): void {
    if (this.disabled) return;
    if (this.audioFeedback) AudioManager.getInstance().playSFX(SFX.CANCEL);
    this.onCancel?.();
  }

  getCursor(): number { return this.cursor; }

  setCursor(index: number): void {
    if (index >= 0 && index < this.itemCount) {
      this.cursor = index;
      this.onMove?.(this.cursor);
    }
  }

  setDisabled(disabled: boolean): void { this.disabled = disabled; }

  isDisabled(): boolean { return this.disabled; }

  setItemCount(count: number): void {
    this.itemCount = count;
    if (this.cursor >= count) {
      this.cursor = Math.max(0, count - 1);
    }
  }

  /** Set the cursor to a specific index by mouse hover. */
  hoverIndex(index: number): void {
    if (this.disabled || index < 0 || index >= this.itemCount) return;
    if (index !== this.cursor) {
      this.cursor = index;
      this.onMove?.(this.cursor);
    }
  }

  /** Select a specific index by mouse click. */
  clickIndex(index: number): void {
    if (this.disabled || index < 0 || index >= this.itemCount) return;
    this.cursor = index;
    this.confirm();
  }

  destroy(): void {
    const kb = this.scene.input.keyboard;
    if (kb) {
      for (const { event, fn } of this.keyHandlers) {
        kb.off(event, fn);
      }
    }
    this.keyHandlers = [];
  }
}
