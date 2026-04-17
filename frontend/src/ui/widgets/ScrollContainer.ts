import Phaser from 'phaser';

interface ScrollContainerConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  contentHeight: number;
  direction?: 'vertical' | 'horizontal';
  onScroll?: (offset: number) => void;
}

export class ScrollContainer {
  private scene: Phaser.Scene;
  private zone: Phaser.GameObjects.Zone;
  private offset = 0;
  private velocity = 0;
  private maxOffset: number;
  private dragging = false;
  private dragStartOffset = 0;
  private dragStartPointer = 0;
  private direction: 'vertical' | 'horizontal';
  private onScroll?: (offset: number) => void;
  private decayTimer?: Phaser.Time.TimerEvent;

  private static readonly FRICTION = 0.92;
  private static readonly MIN_VELOCITY = 0.5;
  private static readonly OVERSCROLL_RESISTANCE = 0.4;

  constructor(scene: Phaser.Scene, config: ScrollContainerConfig) {
    this.scene = scene;
    this.direction = config.direction ?? 'vertical';
    this.onScroll = config.onScroll;
    this.maxOffset = Math.max(0, config.contentHeight - config.height);

    this.zone = scene.add.zone(config.x, config.y, config.width, config.height)
      .setOrigin(0, 0)
      .setInteractive({ draggable: true });

    this.zone.on('dragstart', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      this.dragging = true;
      this.velocity = 0;
      this.dragStartOffset = this.offset;
      this.dragStartPointer = this.direction === 'vertical' ? dragY : dragX;
      this.decayTimer?.destroy();
    });

    this.zone.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      const current = this.direction === 'vertical' ? dragY : dragX;
      const delta = this.dragStartPointer - current;
      let newOffset = this.dragStartOffset + delta;

      // Rubber-band overscroll
      if (newOffset < 0) {
        newOffset *= ScrollContainer.OVERSCROLL_RESISTANCE;
      } else if (newOffset > this.maxOffset) {
        const over = newOffset - this.maxOffset;
        newOffset = this.maxOffset + over * ScrollContainer.OVERSCROLL_RESISTANCE;
      }

      this.offset = newOffset;
      this.onScroll?.(this.clampedOffset());
    });

    this.zone.on('dragend', (_pointer: Phaser.Input.Pointer) => {
      this.dragging = false;
      // Calculate release velocity from last drag delta
      const pointer = scene.input.activePointer;
      this.velocity = this.direction === 'vertical'
        ? -(pointer.velocity.y)
        : -(pointer.velocity.x);

      this.startDecay();
    });
  }

  private startDecay(): void {
    this.decayTimer?.destroy();
    this.decayTimer = this.scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        if (this.dragging) { this.decayTimer?.destroy(); return; }

        this.velocity *= ScrollContainer.FRICTION;
        this.offset += this.velocity * 0.016 * 60;

        // Snap back from overscroll
        if (this.offset < 0) {
          this.offset *= 0.8;
          if (Math.abs(this.offset) < 1) this.offset = 0;
        } else if (this.offset > this.maxOffset) {
          this.offset = this.maxOffset + (this.offset - this.maxOffset) * 0.8;
          if (this.offset - this.maxOffset < 1) this.offset = this.maxOffset;
        }

        this.onScroll?.(this.clampedOffset());

        if (Math.abs(this.velocity) < ScrollContainer.MIN_VELOCITY &&
            this.offset >= 0 && this.offset <= this.maxOffset) {
          this.decayTimer?.destroy();
        }
      },
    });
  }

  clampedOffset(): number {
    return Math.max(0, Math.min(this.maxOffset, this.offset));
  }

  getOffset(): number {
    return this.clampedOffset();
  }

  setContentHeight(h: number): void {
    this.maxOffset = Math.max(0, h - this.zone.height);
    if (this.offset > this.maxOffset) this.offset = this.maxOffset;
  }

  scrollTo(offset: number): void {
    this.offset = Math.max(0, Math.min(this.maxOffset, offset));
    this.velocity = 0;
    this.onScroll?.(this.offset);
  }

  destroy(): void {
    this.decayTimer?.destroy();
    this.zone.destroy();
  }
}
