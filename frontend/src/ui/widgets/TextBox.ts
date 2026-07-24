import Phaser from 'phaser';
import { NinePatchPanel, type NinePatchPanelOptions } from './NinePatchPanel';
import { COLORS, FONTS, PANEL_PRESETS, SPACING, mobileFontSize } from '@ui/theme';

export interface TextBoxMessage {
  text: string;
  speaker?: string;
  portraitKey?: string;
  portraitFrame?: string | number;
  onComplete?: () => void;
}

export interface TextBoxQueueOptions {
  waitForInput?: boolean;
  delayMs?: number;
  speaker?: string;
  portraitKey?: string;
  portraitFrame?: string | number;
  paginate?: boolean;
  maxCharsPerPage?: number;
}

export interface TextBoxOptions {
  typeDelayMs?: number;
  panel?: NinePatchPanelOptions;
  textStyle?: Phaser.Types.GameObjects.Text.TextStyle;
  bindAdvanceInput?: boolean;
  maxCharsPerPage?: number;
}

type KeyboardBinding = { keyboard: Phaser.Input.Keyboard.KeyboardPlugin; event: string; fn: () => void };

const DEFAULT_TYPE_DELAY_MS = 33;
const DEFAULT_MAX_CHARS_PER_PAGE = 180;
const ADVANCE_KEYS = ['keydown-ENTER', 'keydown-SPACE', 'keydown-Z'] as const;

/**
 * Canonical typewriter message widget for battle queues and dialogue boxes.
 * Use `showBattleQueue()` for timed sequential messages or `showDialogue()` /
 * `queueMessages({ waitForInput: true })` for confirm-to-advance speaker,
 * portrait, and paginated dialogue.
 */
export class TextBox {
  private readonly scene: Phaser.Scene;
  private readonly panel: NinePatchPanel;
  private readonly hitArea: Phaser.GameObjects.Rectangle;
  private readonly textObject: Phaser.GameObjects.Text;
  private readonly advanceIndicator: Phaser.GameObjects.Text;
  private speakerPanel?: NinePatchPanel;
  private speakerText?: Phaser.GameObjects.Text;
  private portrait?: Phaser.GameObjects.Image;
  private portraitBg?: NinePatchPanel;
  private fullText = '';
  private isTyping = false;
  private typeTimer?: Phaser.Time.TimerEvent;
  private delayTimer?: Phaser.Time.TimerEvent;
  private advanceTween?: Phaser.Tweens.Tween;
  private onComplete?: () => void;
  private queue: TextBoxMessage[] = [];
  private queueIndex = 0;
  private queueComplete?: () => void;
  private queueOptions: Required<Pick<TextBoxQueueOptions, 'waitForInput' | 'delayMs' | 'paginate' | 'maxCharsPerPage'>> = {
    waitForInput: false,
    delayMs: 900,
    paginate: false,
    maxCharsPerPage: DEFAULT_MAX_CHARS_PER_PAGE,
  };
  private pages: string[] = [];
  private pageIndex = 0;
  private messageCompletionFired = false;
  private keyboardBindings: KeyboardBinding[] = [];
  private readonly pointerAdvanceHandler: () => void;
  private destroyed = false;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, options: TextBoxOptions = {}) {
    this.scene = scene;
    this.panel = new NinePatchPanel(scene, x + width / 2, y + height / 2, width, height, {
      ...PANEL_PRESETS.dialogue,
      ...options.panel,
    });
    this.textObject = scene.add.text(x + SPACING.cardPadding, y + 10, '', {
      ...FONTS.body,
      fontSize: mobileFontSize(16),
      color: COLORS.textWhite,
      wordWrap: { width: width - SPACING.cardPadding * 2 },
      ...options.textStyle,
    });
    this.advanceIndicator = scene.add.text(x + width - SPACING.md, y + height - SPACING.md, '▼', {
      ...FONTS.caption,
      color: COLORS.textHighlight,
    }).setOrigin(0.5).setAlpha(0);
    this.hitArea = scene.add
      .rectangle(x + width / 2, y + height / 2, width, height, COLORS.transparent, 0)
      .setInteractive();
    this.pointerAdvanceHandler = () => this.handleAdvanceInput();
    this.hitArea.on('pointerdown', this.pointerAdvanceHandler);
    this.onComplete = undefined;
    this.queueOptions.maxCharsPerPage = options.maxCharsPerPage ?? DEFAULT_MAX_CHARS_PER_PAGE;

    this.typeDelayMs = options.typeDelayMs ?? DEFAULT_TYPE_DELAY_MS;
    if (options.bindAdvanceInput) this.bindAdvanceInput(scene);
    scene.events?.once('shutdown', () => this.destroy());
  }

  private typeDelayMs: number;

  /** Display one text string with the legacy auto-complete typewriter behaviour. */
  showText(text: string, onComplete?: () => void): void {
    this.clearQueue();
    this.startMessage({ text, onComplete }, { waitForInput: false, delayMs: 0, paginate: false, maxCharsPerPage: DEFAULT_MAX_CHARS_PER_PAGE }, undefined);
  }

  /** Queue arbitrary messages for either timed battle flow or confirm-driven dialogue. */
  queueMessages(messages: readonly (string | TextBoxMessage)[], options: TextBoxQueueOptions = {}, onComplete?: () => void): void {
    this.clearQueue();
    this.queue = messages.map((message) => typeof message === 'string' ? { text: message } : message);
    this.queueOptions = {
      waitForInput: options.waitForInput ?? false,
      delayMs: options.delayMs ?? 900,
      paginate: options.paginate ?? false,
      maxCharsPerPage: options.maxCharsPerPage ?? this.queueOptions.maxCharsPerPage,
    };
    this.queue = this.queue.map((message) => ({
      ...message,
      speaker: message.speaker ?? options.speaker,
      portraitKey: message.portraitKey ?? options.portraitKey,
      portraitFrame: message.portraitFrame ?? options.portraitFrame,
    }));
    this.queueComplete = onComplete;
    this.queueIndex = 0;
    this.playQueueMessage();
  }

  /** Battle-style timed queue: each message completes, waits, then advances. */
  showBattleQueue(messages: readonly (string | TextBoxMessage)[], onComplete: () => void, delayMs = 900): void {
    this.queueMessages(messages, { waitForInput: false, delayMs }, onComplete);
  }

  /** Dialogue-style queue with speaker, portrait, pagination, and confirm-to-advance. */
  showDialogue(messages: readonly (string | TextBoxMessage)[], options: Omit<TextBoxQueueOptions, 'waitForInput' | 'paginate'> = {}, onComplete?: () => void): void {
    this.queueMessages(messages, { ...options, waitForInput: true, paginate: true }, onComplete);
  }

  /** Advance input skips a typing page first, then advances page/message. */
  handleAdvanceInput(): boolean {
    if (this.isTyping) {
      this.skipToEnd();
      return true;
    }
    if (this.queue.length === 0 && !this.fullText) return false;
    this.advanceFromRestingState();
    return true;
  }

  /** Skip to full current page immediately. */
  skipToEnd(): void {
    if (!this.isTyping) return;
    this.typeTimer?.destroy();
    this.typeTimer = undefined;
    this.textObject.setText(this.fullText);
    this.completeTyping();
  }

  getIsTyping(): boolean {
    return this.isTyping;
  }

  isQueueActive(): boolean {
    return this.queue.length > 0;
  }

  bindAdvanceInput(scene: Phaser.Scene): void {
    const kb = scene.input.keyboard;
    if (!kb) return;
    for (const event of ADVANCE_KEYS) {
      const fn = () => this.handleAdvanceInput();
      kb.on(event, fn);
      this.keyboardBindings.push({ keyboard: kb, event, fn });
    }
  }

  setVisible(visible: boolean): void {
    this.panel.setVisible(visible);
    this.hitArea.setVisible(visible);
    this.textObject.setVisible(visible);
    this.advanceIndicator.setVisible(visible);
    this.speakerPanel?.setVisible(visible);
    this.speakerText?.setVisible(visible);
    this.portrait?.setVisible(visible);
    this.portraitBg?.setVisible(visible);
  }

  setDepth(depth: number): void {
    this.panel.setDepth(depth);
    this.hitArea.setDepth(depth + 1);
    this.textObject.setDepth(depth + 1);
    this.advanceIndicator.setDepth(depth + 2);
    this.speakerPanel?.setDepth(depth + 1);
    this.speakerText?.setDepth(depth + 2);
    this.portraitBg?.setDepth(depth + 1);
    this.portrait?.setDepth(depth + 2);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clearTimers();
    this.hitArea.off('pointerdown', this.pointerAdvanceHandler);
    for (const { keyboard, event, fn } of this.keyboardBindings) {
      keyboard.off(event, fn);
    }
    this.keyboardBindings = [];
    this.speakerPanel?.destroy();
    this.speakerText?.destroy();
    this.portrait?.destroy();
    this.portraitBg?.destroy();
    this.panel.destroy();
    this.hitArea.destroy();
    this.textObject.destroy();
    this.advanceIndicator.destroy();
  }

  private startMessage(
    message: TextBoxMessage,
    options: Required<Pick<TextBoxQueueOptions, 'waitForInput' | 'delayMs' | 'paginate' | 'maxCharsPerPage'>>,
    queueComplete?: () => void,
  ): void {
    this.clearTimers();
    this.onComplete = message.onComplete;
    this.queueComplete = queueComplete;
    this.messageCompletionFired = false;
    this.pages = options.paginate ? this.paginate(message.text, options.maxCharsPerPage) : [message.text];
    this.pageIndex = 0;
    this.renderSpeaker(message.speaker);
    this.renderPortrait(message.portraitKey, message.portraitFrame);
    this.showPage(this.pages[this.pageIndex] ?? '', options);
  }

  private showPage(text: string, options: Required<Pick<TextBoxQueueOptions, 'waitForInput' | 'delayMs' | 'paginate' | 'maxCharsPerPage'>>): void {
    this.fullText = text;
    this.queueOptions = options;
    this.textObject.setText('');
    this.isTyping = true;
    this.hideAdvanceIndicator();

    if (this.typeDelayMs === 0 || text.length === 0) {
      this.textObject.setText(text);
      this.completeTyping();
      return;
    }

    let charIndex = 0;
    this.typeTimer = this.scene.time.addEvent({
      delay: this.typeDelayMs,
      repeat: text.length - 1,
      callback: () => {
        charIndex++;
        this.textObject.setText(text.substring(0, charIndex));
        if (charIndex >= text.length) this.completeTyping();
      },
    });
  }

  private completeTyping(): void {
    if (!this.isTyping) return;
    this.isTyping = false;
    this.typeTimer?.destroy();
    this.typeTimer = undefined;
    const isFinalPage = this.pageIndex >= this.pages.length - 1;
    if (isFinalPage && !this.messageCompletionFired) {
      this.messageCompletionFired = true;
      this.onComplete?.();
    }
    if (this.queueOptions.waitForInput || !isFinalPage || this.queue.length === 0) {
      this.showAdvanceIndicator();
      return;
    }
    this.delayTimer = this.scene.time.delayedCall(this.queueOptions.delayMs, () => this.advanceQueue());
  }

  private advanceFromRestingState(): void {
    if (this.pageIndex < this.pages.length - 1) {
      this.pageIndex++;
      this.showPage(this.pages[this.pageIndex] ?? '', this.queueOptions);
      return;
    }
    if (this.queue.length > 0) {
      this.advanceQueue();
      return;
    }
    this.hideAdvanceIndicator();
  }

  private playQueueMessage(): void {
    if (this.queueIndex >= this.queue.length) {
      this.hideAdvanceIndicator();
      this.queueComplete?.();
      this.clearQueue();
      return;
    }
    this.startMessage(this.queue[this.queueIndex], this.queueOptions, this.queueComplete);
  }

  private advanceQueue(): void {
    this.delayTimer?.destroy();
    this.delayTimer = undefined;
    this.queueIndex++;
    this.playQueueMessage();
  }

  private clearQueue(): void {
    this.clearTimers();
    this.queue = [];
    this.queueIndex = 0;
    this.queueComplete = undefined;
    this.pages = [];
    this.pageIndex = 0;
  }

  private clearTimers(): void {
    this.typeTimer?.destroy();
    this.delayTimer?.destroy();
    this.advanceTween?.destroy();
    this.typeTimer = undefined;
    this.delayTimer = undefined;
    this.advanceTween = undefined;
  }

  private renderSpeaker(speaker?: string): void {
    this.speakerPanel?.destroy();
    this.speakerText?.destroy();
    this.speakerPanel = undefined;
    this.speakerText = undefined;
    if (!speaker) return;
    const width = Math.max(100, speaker.length * 10 + SPACING.lg);
    const x = this.textObject.x + width / 2 - SPACING.cardPadding;
    const y = this.textObject.y - SPACING.lg;
    this.speakerPanel = new NinePatchPanel(this.scene, x, y, width, 26, PANEL_PRESETS.speaker);
    this.speakerText = this.scene.add.text(x, y, speaker, {
      ...FONTS.caption,
      color: COLORS.textHighlight,
      fontSize: mobileFontSize(12),
    }).setOrigin(0.5);
  }

  private renderPortrait(portraitKey?: string, portraitFrame?: string | number): void {
    this.portrait?.destroy();
    this.portraitBg?.destroy();
    this.portrait = undefined;
    this.portraitBg = undefined;
    if (!portraitKey || !this.scene.textures.exists(portraitKey)) return;
    const x = this.textObject.x - 38;
    const y = this.textObject.y + 28;
    this.portraitBg = new NinePatchPanel(this.scene, x, y, 56, 56, PANEL_PRESETS.menu);
    this.portrait = this.scene.add.image(x, y, portraitKey, portraitFrame).setDisplaySize(48, 48);
  }

  private showAdvanceIndicator(): void {
    this.advanceIndicator.setAlpha(1);
    this.advanceTween?.destroy();
    this.advanceTween = this.scene.tweens.add({
      targets: this.advanceIndicator,
      alpha: 0.35,
      yoyo: true,
      repeat: -1,
      duration: 450,
      ease: 'Sine.easeInOut',
    });
  }

  private hideAdvanceIndicator(): void {
    this.advanceTween?.destroy();
    this.advanceTween = undefined;
    this.advanceIndicator.setAlpha(0);
  }

  private paginate(text: string, maxChars: number): string[] {
    if (text.length <= maxChars) return [text];
    const words = text.split(' ');
    const pages: string[] = [];
    let current = '';
    for (const word of words) {
      const candidate = current.length === 0 ? word : `${current} ${word}`;
      if (candidate.length > maxChars && current.length > 0) {
        pages.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current.length > 0) pages.push(current);
    return pages;
  }
}
