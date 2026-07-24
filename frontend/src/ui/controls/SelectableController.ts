import type Phaser from 'phaser';

export type SelectDirection = 'up' | 'down' | 'left' | 'right';
export type SelectableWrapConfig = boolean | { horizontal?: boolean; vertical?: boolean };

export interface SelectableWindowRange {
  start: number;
  end: number;
  size: number;
}

export interface SelectableControllerConfig {
  /** Total number of selectable entries. */
  itemCount: number;
  /** Number of columns in the selection grid. Use 1 for vertical lists. */
  columns?: number;
  /** Wrap around when navigating past an edge. Defaults to true. */
  wrap?: SelectableWrapConfig;
  /** Initial cursor index. Disabled entries are skipped. */
  initialIndex?: number;
  /** Entries that can be focused visually but cannot be selected. */
  disabledIndices?: Iterable<number> | ((index: number) => boolean);
  /** Number of entries visible in a scroll/windowed list. */
  visibleCount?: number;
  /** Initial first visible index for scroll/windowed lists. */
  windowStart?: number;
  /** Called when cursor moves. */
  onMove?: (index: number, previousIndex: number) => void;
  /** Called when confirm is pressed on an enabled entry. */
  onConfirm?: (index: number) => void;
  /** Called when cancel is pressed. */
  onCancel?: () => void;
  /** Called when the visible window changes. */
  onWindowChange?: (range: SelectableWindowRange) => void;
  /** Optional sound hooks. MenuController wires these to AudioManager. */
  sounds?: {
    move?: () => void;
    confirm?: () => void;
    cancel?: () => void;
  };
  /** Disable all input processing. */
  disabled?: boolean;
}

type BoundKeyboardHandler = { keyboard: Phaser.Input.Keyboard.KeyboardPlugin; event: string; fn: () => void };
type BoundPointerHandler = { element: Phaser.GameObjects.GameObject; event: string; fn: () => void };

const DEFAULT_COLUMNS = 1;

/**
 * Pure selection state machine for scene menus.
 *
 * Hand-rolled scenes can migrate by creating one controller per active menu,
 * forwarding keyboard/touch directions to `navigate()`, rendering from
 * `getCursor()`/`getWindowRange()`, and binding text/buttons with
 * `bindInteractive()` for hover + click parity.
 */
export class SelectableController {
  private cursor = 0;
  private columns: number;
  private itemCount: number;
  private wrapHorizontal: boolean;
  private wrapVertical: boolean;
  private disabledLookup: (index: number) => boolean;
  private disabledSet = new Set<number>();
  private visibleCount?: number;
  private windowStart: number;
  private disabled: boolean;
  private readonly onMove?: (index: number, previousIndex: number) => void;
  private readonly onConfirm?: (index: number) => void;
  private readonly onCancel?: () => void;
  private readonly onWindowChange?: (range: SelectableWindowRange) => void;
  private readonly sounds?: SelectableControllerConfig['sounds'];
  private keyHandlers: BoundKeyboardHandler[] = [];
  private pointerHandlers: BoundPointerHandler[] = [];

  constructor(config: SelectableControllerConfig) {
    this.columns = Math.max(DEFAULT_COLUMNS, Math.floor(config.columns ?? DEFAULT_COLUMNS));
    this.itemCount = Math.max(0, Math.floor(config.itemCount));
    const wrap = config.wrap ?? true;
    this.wrapHorizontal = typeof wrap === 'boolean' ? wrap : wrap.horizontal ?? true;
    this.wrapVertical = typeof wrap === 'boolean' ? wrap : wrap.vertical ?? true;
    this.visibleCount = config.visibleCount === undefined ? undefined : Math.max(1, Math.floor(config.visibleCount));
    this.windowStart = Math.max(0, Math.floor(config.windowStart ?? 0));
    this.disabled = config.disabled ?? false;
    this.onMove = config.onMove;
    this.onConfirm = config.onConfirm;
    this.onCancel = config.onCancel;
    this.onWindowChange = config.onWindowChange;
    this.sounds = config.sounds;
    this.disabledLookup = this.createDisabledLookup(config.disabledIndices);
    this.cursor = this.resolveInitialCursor(config.initialIndex ?? 0);
    this.clampWindowStart();
    this.ensureVisible(this.cursor, false);
  }

  navigate(direction: SelectDirection): boolean {
    if (this.disabled || this.itemCount === 0) return false;
    const next = this.findDirectionalCandidate(direction);
    if (next === this.cursor) return false;
    this.applyCursor(next, true);
    this.sounds?.move?.();
    return true;
  }

  confirm(): boolean {
    if (this.disabled || !this.isSelectable(this.cursor)) return false;
    this.sounds?.confirm?.();
    this.onConfirm?.(this.cursor);
    return true;
  }

  cancel(): boolean {
    if (this.disabled) return false;
    this.sounds?.cancel?.();
    this.onCancel?.();
    return true;
  }

  getCursor(): number {
    return this.cursor;
  }

  getSelectedIndex(): number {
    return this.cursor;
  }

  setCursor(index: number, emit = true): boolean {
    const normalized = this.normalizeIndex(index);
    if (normalized === undefined || !this.isSelectable(normalized)) return false;
    this.applyCursor(normalized, emit);
    return true;
  }

  hoverIndex(index: number): boolean {
    if (this.disabled) return false;
    return this.setCursor(index);
  }

  clickIndex(index: number): boolean {
    if (this.disabled || !this.hoverIndex(index)) return false;
    return this.confirm();
  }

  setDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }

  isDisabled(): boolean {
    return this.disabled;
  }

  setItemCount(count: number): void {
    this.itemCount = Math.max(0, Math.floor(count));
    const next = this.resolveInitialCursor(Math.min(this.cursor, Math.max(0, this.itemCount - 1)));
    this.applyCursor(next, true);
    this.clampWindowStart();
    this.ensureVisible(this.cursor, true);
  }

  getItemCount(): number {
    return this.itemCount;
  }

  setDisabledIndices(disabledIndices?: Iterable<number> | ((index: number) => boolean)): void {
    this.disabledLookup = this.createDisabledLookup(disabledIndices);
    if (!this.isSelectable(this.cursor)) {
      this.applyCursor(this.resolveInitialCursor(this.cursor), true);
    }
  }

  isIndexEnabled(index: number): boolean {
    return this.isSelectable(index);
  }

  setVisibleCount(visibleCount?: number): void {
    this.visibleCount = visibleCount === undefined ? undefined : Math.max(1, Math.floor(visibleCount));
    this.clampWindowStart();
    this.ensureVisible(this.cursor, true);
  }

  getWindowStart(): number {
    return this.windowStart;
  }

  setWindowStart(start: number): void {
    const previous = this.windowStart;
    this.windowStart = Math.max(0, Math.floor(start));
    this.clampWindowStart();
    if (previous !== this.windowStart) this.emitWindowChange();
  }

  getWindowRange(): SelectableWindowRange {
    const size = this.visibleCount ?? this.itemCount;
    return {
      start: this.windowStart,
      end: Math.min(this.itemCount, this.windowStart + size),
      size,
    };
  }

  getVisibleItems<T>(items: readonly T[]): readonly T[] {
    const range = this.getWindowRange();
    return items.slice(range.start, range.end);
  }

  bindKeyboard(scene: Phaser.Scene): void {
    const kb = scene.input.keyboard;
    if (!kb) return;

    const bind = (event: string, fn: () => void) => {
      kb.on(event, fn);
      this.keyHandlers.push({ keyboard: kb, event, fn });
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

  bindInteractive(elements: Phaser.GameObjects.GameObject[], options?: { startIndex?: number }): void {
    const startIndex = options?.startIndex ?? 0;
    elements.forEach((element, offset) => {
      const index = startIndex + offset;
      if ('setInteractive' in element && typeof element.setInteractive === 'function') {
        element.setInteractive({ useHandCursor: true });
      }
      const over = () => this.hoverIndex(index);
      const down = () => this.clickIndex(index);
      element.on('pointerover', over);
      element.on('pointerdown', down);
      this.pointerHandlers.push({ element, event: 'pointerover', fn: over });
      this.pointerHandlers.push({ element, event: 'pointerdown', fn: down });
    });
  }

  destroy(): void {
    for (const { keyboard, event, fn } of this.keyHandlers) {
      keyboard.off(event, fn);
    }
    this.keyHandlers = [];
    for (const { element, event, fn } of this.pointerHandlers) {
      element.off(event, fn);
    }
    this.pointerHandlers = [];
  }

  private applyCursor(index: number, emit: boolean): void {
    const previous = this.cursor;
    this.cursor = index;
    this.ensureVisible(index, true);
    if (emit && previous !== index) this.onMove?.(index, previous);
  }

  private findDirectionalCandidate(direction: SelectDirection): number {
    return direction === 'left' || direction === 'right'
      ? this.findHorizontalCandidate(direction)
      : this.findVerticalCandidate(direction);
  }

  private findHorizontalCandidate(direction: 'left' | 'right'): number {
    const rowStart = Math.floor(this.cursor / this.columns) * this.columns;
    const rowEnd = Math.min(rowStart + this.columns - 1, this.itemCount - 1);
    const step = direction === 'left' ? -1 : 1;
    const wraps = this.wrapHorizontal;
    let candidate = this.cursor;

    for (let attempts = 0; attempts < this.columns; attempts++) {
      const next = candidate + step;
      if (next < rowStart || next > rowEnd) {
        if (!wraps) return this.cursor;
        candidate = direction === 'left' ? rowEnd : rowStart;
      } else {
        candidate = next;
      }
      if (this.isSelectable(candidate)) return candidate;
      if (candidate === this.cursor) return this.cursor;
    }
    return this.cursor;
  }

  private findVerticalCandidate(direction: 'up' | 'down'): number {
    const rows = Math.ceil(this.itemCount / this.columns);
    const currentRow = Math.floor(this.cursor / this.columns);
    const col = this.cursor % this.columns;
    const step = direction === 'up' ? -1 : 1;
    const wraps = this.wrapVertical;
    let row = currentRow;

    for (let attempts = 0; attempts < rows; attempts++) {
      const nextRow = row + step;
      if (nextRow < 0 || nextRow >= rows) {
        if (!wraps) return this.cursor;
        row = direction === 'up' ? rows - 1 : 0;
      } else {
        row = nextRow;
      }
      const rowStart = row * this.columns;
      const rowEnd = Math.min(rowStart + this.columns - 1, this.itemCount - 1);
      const candidate = Math.min(rowStart + col, rowEnd);
      if (this.isSelectable(candidate)) return candidate;
      if (row === currentRow) return this.cursor;
    }
    return this.cursor;
  }

  private resolveInitialCursor(preferred: number): number {
    const normalized = this.normalizeIndex(preferred);
    if (normalized !== undefined && this.isSelectable(normalized)) return normalized;
    for (let index = 0; index < this.itemCount; index++) {
      if (this.isSelectable(index)) return index;
    }
    return 0;
  }

  private normalizeIndex(index: number): number | undefined {
    const normalized = Math.floor(index);
    if (normalized < 0 || normalized >= this.itemCount) return undefined;
    return normalized;
  }

  private isSelectable(index: number): boolean {
    return index >= 0 && index < this.itemCount && !this.disabledLookup(index);
  }

  private createDisabledLookup(disabledIndices?: Iterable<number> | ((index: number) => boolean)): (index: number) => boolean {
    if (typeof disabledIndices === 'function') return disabledIndices;
    this.disabledSet = new Set(disabledIndices ?? []);
    return (index: number) => this.disabledSet.has(index);
  }

  private ensureVisible(index: number, emit: boolean): void {
    if (this.visibleCount === undefined || this.itemCount === 0) return;
    const previous = this.windowStart;
    if (index < this.windowStart) {
      this.windowStart = index;
    } else if (index >= this.windowStart + this.visibleCount) {
      this.windowStart = index - this.visibleCount + 1;
    }
    this.clampWindowStart();
    if (emit && previous !== this.windowStart) this.emitWindowChange();
  }

  private clampWindowStart(): void {
    if (this.visibleCount === undefined) {
      this.windowStart = 0;
      return;
    }
    const maxStart = Math.max(0, this.itemCount - this.visibleCount);
    this.windowStart = Math.min(Math.max(0, this.windowStart), maxStart);
  }

  private emitWindowChange(): void {
    this.onWindowChange?.(this.getWindowRange());
  }
}
