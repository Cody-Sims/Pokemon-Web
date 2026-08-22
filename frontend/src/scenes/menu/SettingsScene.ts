import Phaser from 'phaser';
import { SceneInputRegistry } from '@scenes/SceneInputRegistry';
import { ui } from '@utils/ui-layout';
import { layoutOn } from '@utils/layout-on';
import { AudioManager, GameManager, SaveManager } from '@managers/index';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';
import { SelectableController } from '@ui/controls/SelectableController';
import { TouchControls } from '@ui/controls/TouchControls';
import { COLORS, FONTS, mobileFontSize, minTouchTarget } from '@ui/theme';
import { SFX } from '@utils/audio-keys';
import { setRenderQuality, type RenderQuality } from '@utils/perf-profile';
import { syncAccessibilitySettings, colorblindFilter } from '@utils/accessibility';
import { SceneRouter } from '@scenes/SceneRouter';
import { SceneKey, type SceneKeyName } from '@scenes/scene-keys';
import type { SettingsSceneData } from '@scenes/scene-data';
import { capitalize } from '@utils/format';

interface SettingDef {
  key: string;
  label: string;
  type: 'cycle' | 'slider';
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  format?: (val: number) => string;
}

const SETTING_DEFS: SettingDef[] = [
  { key: 'textSpeed', label: 'Text Speed', type: 'cycle', options: ['slow', 'medium', 'fast', 'instant'] },
  { key: 'musicVolume', label: 'Music Volume', type: 'slider', min: 0, max: 1, step: 0.1, format: (v) => `${Math.round(v * 100)}%` },
  { key: 'sfxVolume', label: 'SFX Volume', type: 'slider', min: 0, max: 1, step: 0.1, format: (v) => `${Math.round(v * 100)}%` },
  { key: 'battleAnimations', label: 'Battle Animations', type: 'cycle', options: ['true', 'false'] },
  { key: 'textScale', label: 'Text Size', type: 'cycle', options: ['small', 'medium', 'large'] },
  { key: 'colorblindMode', label: 'Colorblind Mode', type: 'cycle', options: ['off', 'protanopia', 'deuteranopia'] },
  { key: 'reducedMotion', label: 'Reduced Motion', type: 'cycle', options: ['false', 'true'] },
  { key: 'haptics', label: 'Haptics', type: 'cycle', options: ['true', 'false'] },
  { key: 'renderQuality', label: 'Render Quality', type: 'cycle', options: ['high', 'medium', 'low'] },
  { key: 'joystickSize', label: 'Joystick Size', type: 'cycle', options: ['small', 'medium', 'large'] },
  { key: 'oneHandedMode', label: 'One-Handed Mode', type: 'cycle', options: ['off', 'left', 'right'] },
  { key: 'swapAB', label: 'Swap A/B Buttons', type: 'cycle', options: ['false', 'true'] },
  { key: 'deadZone', label: 'Joystick Dead Zone', type: 'slider', min: 0.05, max: 0.4, step: 0.05, format: (v) => `${Math.round(v * 100)}%` },
  { key: 'highVisControls', label: 'High Vis Controls', type: 'cycle', options: ['false', 'true'] },
  { key: 'showMinimap', label: 'Show Minimap', type: 'cycle', options: ['true', 'false'] },
  { key: 'showTypeHints', label: 'Show Type Hints', type: 'cycle', options: ['true', 'false'] },
  { key: 'speedrunTimer', label: 'Speed-Run Timer', type: 'cycle', options: ['false', 'true'] },
];

export class SettingsScene extends Phaser.Scene {
  private controller?: SelectableController;
  private settingTexts: Array<{ label: Phaser.GameObjects.Text; value: Phaser.GameObjects.Text; leftArrow: Phaser.GameObjects.Text; rightArrow: Phaser.GameObjects.Text } | undefined> = [];
  private returnScene: SceneKeyName = SceneKey.Title;
  private isFullscreen = false;
  /** Layer holding every layout-derived game object so we can wipe + rebuild on resize. */
  private layoutLayer?: Phaser.GameObjects.Container;
  /** Cursor index preserved across re-layouts. */
  private savedCursor = 0;
  /** First visible settings row preserved across re-layouts. */
  private savedWindowStart = 0;

  private readonly inputRegistry = new SceneInputRegistry(this);

  constructor() {
    super({ key: SceneKey.Settings });
  }

  init(data?: SettingsSceneData): void {
    this.returnScene = data?.returnScene ?? SceneKey.Title;
  }

  create(): void {
    const gm = GameManager.getInstance();

    // Re-layout on resize / orientation change. Everything inside builds the
    // panel + rows from scratch using the current viewport dimensions, so the
    // settings menu adapts cleanly when the device rotates while it's open.
    layoutOn(this, () => this.buildLayout());

    // LEFT/RIGHT to adjust value (registered once so the controller persists
    // across re-layouts).
    this.inputRegistry.bindKey('keydown-LEFT', () => this.adjustValue(-1));
    this.inputRegistry.bindKey('keydown-RIGHT', () => this.adjustValue(1));
    this.inputRegistry.bindKey('keydown-UP', () => this.controller?.navigate('up'));
    this.inputRegistry.bindKey('keydown-DOWN', () => this.controller?.navigate('down'));
    this.inputRegistry.bindKey('keydown-ENTER', () => this.adjustValue(1));
    this.inputRegistry.bindKey('keydown-SPACE', () => this.adjustValue(1));
    this.inputRegistry.bindKey('keydown-ESC', () => this.closeSettings());

    // Sync accessibility settings on scene create
    syncAccessibilitySettings({
      textScale: String(gm.getSetting('textScale') ?? 'medium'),
      reducedMotion: String(gm.getSetting('reducedMotion') ?? 'false'),
      colorblindMode: String(gm.getSetting('colorblindMode') ?? 'off'),
    });
    // Apply saved colorblind filter to canvas
    const savedMode = String(gm.getSetting('colorblindMode') ?? 'off');
    this.game.canvas.style.filter = savedMode === 'off' ? 'none' : colorblindFilter(savedMode);
  }

  /**
   * Build (or rebuild) every layout-dependent UI element from current
   * viewport dimensions. Safe to call repeatedly; existing layout objects
   * are destroyed first so we don't leak duplicates after a rotation.
   */
  private buildLayout(): void {
    const gm = GameManager.getInstance();
    const isMobile = TouchControls.isTouchDevice();
    const layout = ui(this);
    const portrait = layout.h > layout.w;

    // Wipe previous layout so this method is idempotent on resize.
    if (this.layoutLayer) {
      this.savedCursor = this.controller?.getCursor() ?? this.savedCursor;
      this.controller?.destroy();
      this.controller = undefined;
      this.layoutLayer.destroy(true);
    }
    this.layoutLayer = this.add.container(0, 0).setDepth(0);
    this.settingTexts = [];

    // Background
    const bgRect = this.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, COLORS.bgDark);
    const panel = new NinePatchPanel(this, layout.cx, layout.cy, layout.w - 32, layout.h - 32, {
      fillColor: COLORS.bgPanel,
      borderColor: COLORS.border,
      cornerRadius: 8,
    });
    this.layoutLayer.add([bgRect, panel.getGraphics()]);

    // Title
    const titleSize = portrait ? 22 : 26;
    const title = this.add.text(layout.cx, portrait ? 38 : 50, 'SETTINGS', { ...FONTS.heading, fontSize: mobileFontSize(titleSize) }).setOrigin(0.5);
    const titleRule = this.add.rectangle(layout.cx, portrait ? 56 : 70, 180, 2, COLORS.borderHighlight, 0.4);
    this.layoutLayer.add([title, titleRule]);

    // Settings rows use a scroll window on short screens so every visible
    // target keeps a phone-sized hit area instead of squeezing 18 rows into
    // a 390px landscape viewport.
    const startY = portrait ? 72 : 70;
    const bottomSafeReserve = portrait && isMobile ? 120 : !portrait && isMobile ? 58 : 58;
    const rowH = Math.max(minTouchTarget(), portrait ? 46 : 48);
    const allItemCount = SETTING_DEFS.length + 1; // +1 for fullscreen
    const visibleCount = Math.max(3, Math.min(allItemCount, Math.floor((layout.h - startY - bottomSafeReserve) / rowH)));
    let windowStart = Math.min(this.savedWindowStart, Math.max(0, allItemCount - visibleCount));
    if (this.savedCursor < windowStart) windowStart = this.savedCursor;
    if (this.savedCursor >= windowStart + visibleCount) windowStart = this.savedCursor - visibleCount + 1;
    this.savedWindowStart = Math.max(0, Math.min(windowStart, Math.max(0, allItemCount - visibleCount)));
    const rowFontPx = portrait ? 14 : 16;

    // Column anchors (right-aligned controls so long labels have room).
    const labelX = portrait ? 24 : 72;
    const rightArrowX = layout.w - (portrait ? 28 : 88);
    const valueX = rightArrowX - (portrait ? 34 : 78);
    const leftArrowX = valueX - (portrait ? 40 : 70);
    const rowW = layout.w - 40;

    for (let visibleIndex = 0; visibleIndex < visibleCount; visibleIndex++) {
      const i = this.savedWindowStart + visibleIndex;
      const y = startY + visibleIndex * rowH;
      const isFullscreenRow = i === SETTING_DEFS.length;
      const def = SETTING_DEFS[i];
      const labelText = isFullscreenRow ? 'Fullscreen' : def.label;
      const currentVal = isFullscreenRow ? (this.scale.isFullscreen ? 'ON' : 'OFF') : this.formatValue(def, gm.getSetting(def.key));

      const rowBg = this.add.rectangle(layout.cx, y + rowH / 2, rowW, rowH - 6, COLORS.bgCard, 0.55)
        .setStrokeStyle(1, COLORS.border)
        .setInteractive({ useHandCursor: true });
      this.inputRegistry.bindPointer(rowBg, 'pointerover', () => { this.controller?.setCursor(i); this.highlightRow(i); });
      this.inputRegistry.bindPointer(rowBg, 'pointerdown', () => {
        this.controller?.setCursor(i);
        this.highlightRow(i);
        if (isFullscreenRow) this.toggleFullscreenFromGesture(); else this.adjustValue(1);
      });

      const label = this.add.text(labelX, y + rowH / 2, labelText, {
        ...FONTS.body,
        fontSize: mobileFontSize(rowFontPx),
        wordWrap: { width: Math.max(160, leftArrowX - labelX - 16) },
      }).setOrigin(0, 0.5);

      const leftArrow = this.add.text(leftArrowX, y + rowH / 2, '◀', {
        ...FONTS.body, fontSize: mobileFontSize(rowFontPx), color: COLORS.textHighlight,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      leftArrow.setPadding(12, 12, 12, 12);
      this.inputRegistry.bindPointer(leftArrow, 'pointerdown', () => {
        this.controller?.setCursor(i);
        this.highlightRow(i);
        if (isFullscreenRow) this.toggleFullscreenFromGesture(); else this.adjustValue(-1);
      });

      const value = this.add.text(valueX, y + rowH / 2, currentVal, {
        ...FONTS.body, fontSize: mobileFontSize(rowFontPx), color: COLORS.textHighlight,
      }).setOrigin(0.5);

      const rightArrow = this.add.text(rightArrowX, y + rowH / 2, '▶', {
        ...FONTS.body, fontSize: mobileFontSize(rowFontPx), color: COLORS.textHighlight,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      rightArrow.setPadding(12, 12, 12, 12);
      this.inputRegistry.bindPointer(rightArrow, 'pointerdown', () => {
        this.controller?.setCursor(i);
        this.highlightRow(i);
        if (isFullscreenRow) this.toggleFullscreenFromGesture(); else this.adjustValue(1);
      });

      this.layoutLayer!.add([rowBg, label, leftArrow, value, rightArrow]);
      this.settingTexts[i] = { label, value, leftArrow, rightArrow };
    }

    const rangeText = this.add.text(layout.cx, layout.h - bottomSafeReserve + 2, `${this.savedWindowStart + 1}-${Math.min(allItemCount, this.savedWindowStart + visibleCount)} / ${allItemCount}  ▲▼`, {
      ...FONTS.caption,
      fontSize: mobileFontSize(10),
      color: COLORS.textDim,
    }).setOrigin(0.5);
    this.layoutLayer!.add(rangeText);

    // Back button (visible for touch users, always works) — sit clear of
    // the OS home indicator + DOM touch controls so it's reachable on
    // mobile portrait/landscape phones.
    const portraitMobile = portrait && isMobile;
    const landscapeMobile = !portrait && isMobile;
    const buttonBottomReserve = portraitMobile ? 86 : landscapeMobile ? 18 : 12;
    const backY = layout.h - buttonBottomReserve - 22;
    const backBtn = this.add.text(layout.cx, backY, '[ Back ]', {
      ...FONTS.body, fontSize: mobileFontSize(portrait ? 16 : 20), color: COLORS.textHighlight,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.setPadding(16, 12, 16, 12);
    this.inputRegistry.bindPointer(backBtn, 'pointerdown', () => this.closeSettings());
    this.inputRegistry.bindPointer(backBtn, 'pointerover', () => backBtn.setColor(COLORS.textWhite));
    this.inputRegistry.bindPointer(backBtn, 'pointerout', () => backBtn.setColor(COLORS.textHighlight));

    // Save Export / Import buttons (plan.md D.6) — flank the Back button.
    const sideFont = mobileFontSize(portrait ? 12 : 14);
    const sideOffset = Math.min(portrait ? 90 : 140, layout.w / 2 - 56);
    const exportBtn = this.add.text(layout.cx - sideOffset, backY, '[ Export ]', {
      ...FONTS.body, fontSize: sideFont, color: COLORS.textGray,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    exportBtn.setPadding(12, 12, 12, 12);
    this.inputRegistry.bindPointer(exportBtn, 'pointerdown', () => this.exportSave());
    this.inputRegistry.bindPointer(exportBtn, 'pointerover', () => exportBtn.setColor(COLORS.textHighlight));
    this.inputRegistry.bindPointer(exportBtn, 'pointerout', () => exportBtn.setColor(COLORS.textGray));

    const importBtn = this.add.text(layout.cx + sideOffset, backY, '[ Import ]', {
      ...FONTS.body, fontSize: sideFont, color: COLORS.textGray,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    importBtn.setPadding(12, 12, 12, 12);
    this.inputRegistry.bindPointer(importBtn, 'pointerdown', () => this.importSave());
    this.inputRegistry.bindPointer(importBtn, 'pointerover', () => importBtn.setColor(COLORS.textHighlight));
    this.inputRegistry.bindPointer(importBtn, 'pointerout', () => importBtn.setColor(COLORS.textGray));

    // Close hint — keep above the bottom OS reserve so it isn't clipped.
    const hintTxt = isMobile ? 'Tap ◀ ▶ to change  •  Tap [ Back ] to return' : 'ESC to go back   ◀ ▶ to change values';
    const hint = this.add.text(layout.cx, layout.h - buttonBottomReserve, hintTxt, {
      ...FONTS.caption,
      fontSize: mobileFontSize(portrait ? 10 : 12),
    }).setOrigin(0.5);
    this.layoutLayer!.add([backBtn, exportBtn, importBtn, hint]);

    this.controller = new SelectableController({
      columns: 1,
      itemCount: allItemCount,
      wrap: true,
      visibleCount,
      windowStart: this.savedWindowStart,
      onMove: (idx) => { this.savedCursor = idx; this.highlightRow(idx); },
      onConfirm: () => this.adjustValue(1),
      onCancel: () => this.closeSettings(),
      onWindowChange: range => {
        this.savedWindowStart = range.start;
        this.time.delayedCall(0, () => {
          if (this.scene.isActive()) this.buildLayout();
        });
      },
      sounds: {
        move: () => AudioManager.getInstance().playSFX(SFX.CURSOR),
        confirm: () => AudioManager.getInstance().playSFX(SFX.CURSOR),
        cancel: () => AudioManager.getInstance().playSFX(SFX.CANCEL),
      },
    });
    // Restore cursor position from before the rebuild.
    const restored = Math.min(this.savedCursor, allItemCount - 1);
    this.controller.setCursor(restored);
    this.highlightRow(restored);
  }

  private highlightRow(idx: number): void {
    this.settingTexts.forEach((row, i) => {
      if (!row) return;
      row.label.setColor(i === idx ? COLORS.textHighlight : COLORS.textWhite);
      row.value.setColor(i === idx ? COLORS.textHighlight : COLORS.textGray);
    });
  }

  private adjustValue(dir: number): void {
    const idx = this.controller?.getCursor() ?? 0;
    const gm = GameManager.getInstance();
    const audio = AudioManager.getInstance();

    // Fullscreen toggle (last row) — only togglable via direct pointer gesture
    // because the Fullscreen API requires a user-activation event. Keyboard
    // path would fail silently on Safari / iOS. Show a hint instead.
    if (idx === SETTING_DEFS.length) {
      // Re-read actual fullscreen state to stay in sync
      this.isFullscreen = this.scale.isFullscreen;
      const state = this.isFullscreen ? 'ON' : 'OFF';
      this.settingTexts[idx]?.value.setText(state);
      audio.playSFX(SFX.CURSOR);
      return;
    }

    const def = SETTING_DEFS[idx];
    if (!def) return;

    const currentVal = gm.getSetting(def.key);

    if (def.type === 'cycle' && def.options) {
      const curStr = String(currentVal);
      const curIdx = def.options.indexOf(curStr);
      const newIdx = (curIdx + dir + def.options.length) % def.options.length;
      const newVal = def.options[newIdx];
      gm.setSetting(def.key, newVal);
      this.settingTexts[idx]?.value.setText(this.formatValue(def, newVal));
    } else if (def.type === 'slider') {
      const min = def.min ?? 0;
      const max = def.max ?? 1;
      const step = def.step ?? 0.1;
      const curNum = typeof currentVal === 'number' ? currentVal : parseFloat(String(currentVal)) || min;
      const newVal = Math.round(Math.max(min, Math.min(max, curNum + dir * step)) * 100) / 100;
      gm.setSetting(def.key, newVal);
      this.settingTexts[idx]?.value.setText(this.formatValue(def, newVal));
    }

    // Apply audio changes in real-time
    const musicVol = gm.getSetting('musicVolume');
    const sfxVol = gm.getSetting('sfxVolume');
    if (typeof musicVol === 'number') audio.setBGMVolume(musicVol);
    if (typeof sfxVol === 'number') audio.setSFXVolume(sfxVol);

    audio.playSFX(SFX.CURSOR);

    // Sync accessibility settings when relevant keys change
    if (def.key === 'textScale' || def.key === 'reducedMotion' || def.key === 'colorblindMode') {
      syncAccessibilitySettings({
        textScale: String(gm.getSetting('textScale') ?? 'medium'),
        reducedMotion: String(gm.getSetting('reducedMotion') ?? 'false'),
        colorblindMode: String(gm.getSetting('colorblindMode') ?? 'off'),
      });
    }
    // Apply colorblind filter to canvas in real-time
    if (def.key === 'colorblindMode') {
      const mode = String(gm.getSetting('colorblindMode') ?? 'off');
      this.game.canvas.style.filter = mode === 'off' ? 'none' : colorblindFilter(mode);
    }
    // Apply render quality change in real-time
    if (def.key === 'renderQuality') {
      setRenderQuality(String(gm.getSetting('renderQuality') ?? 'high') as RenderQuality);
    }
  }

  private formatValue(def: SettingDef, val: string | number | boolean | undefined): string {
    if (val === undefined) return '—';
    if (def.type === 'slider' && def.format) {
      return def.format(typeof val === 'number' ? val : parseFloat(String(val)) || 0);
    }
    if (def.key === 'battleAnimations' || def.key === 'reducedMotion' || def.key === 'showMinimap' || def.key === 'showTypeHints' || def.key === 'speedrunTimer') {
      return String(val) === 'true' ? 'ON' : 'OFF';
    }
    if (def.key === 'colorblindMode') {
      const labels: Record<string, string> = { off: 'Off', protanopia: 'Protanopia', deuteranopia: 'Deuteranopia' };
      return labels[String(val)] ?? String(val);
    }
    return capitalize(String(val));
  }

  /** Toggle fullscreen from a direct pointer gesture (required by the Fullscreen API). */
  private toggleFullscreenFromGesture(): void {
    this.scale.toggleFullscreen();
    // Re-read actual state after the request to stay in sync
    this.time.delayedCall(100, () => {
      this.isFullscreen = this.scale.isFullscreen;
      const idx = SETTING_DEFS.length;
      if (this.settingTexts[idx]) {
        this.settingTexts[idx].value.setText(this.isFullscreen ? 'ON' : 'OFF');
      }
    });
    AudioManager.getInstance().playSFX(SFX.CURSOR);
  }

  private closeSettings(): void {
    // Persist settings to localStorage
    const gm = GameManager.getInstance();
    try {
      localStorage.setItem('pokemon-web-settings', JSON.stringify(gm.getSettings()));
    } catch { /* ignore */ }

    this.controller?.destroy();
    const router = SceneRouter.for(this);
    router.stop();
    // Use wake() to match the sleep() used by MenuScene, fall back to resume()
    const target = router.get(this.returnScene);
    if (target && !target.scene.isActive()) {
      router.wake(this.returnScene);
    } else {
      router.resume(this.returnScene);
    }
  }

  update(): void {
    const tc = TouchControls.getInstance();
    if (tc?.consumeCancel()) {
      this.closeSettings();
      return;
    }
    if (tc?.consumeSwipeUp()) this.controller?.navigate('up');
    else if (tc?.consumeSwipeDown()) this.controller?.navigate('down');
  }

  /** Plan.md D.6 — download current save as JSON. */
  private exportSave(): void {
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    try {
      SaveManager.getInstance().downloadJson();
      this.flashStatus('Save exported.');
    } catch {
      this.flashStatus('Export failed.');
    }
  }

  /** Plan.md D.6 — pick a JSON file and import it. */
  private importSave(): void {
    if (typeof document === 'undefined') return;
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? '');
        const err = SaveManager.getInstance().importJson(text);
        if (err) {
          this.flashStatus(`Import failed: ${err}`);
        } else {
          this.flashStatus('Save imported. Returning to title…');
          this.time.delayedCall(900, () => {
            SceneRouter.for(this).transitionTo(SceneKey.Title);
          });
        }
      };
      reader.onerror = () => this.flashStatus('Could not read file.');
      reader.readAsText(file);
    });
    document.body.appendChild(input);
    input.click();
    setTimeout(() => input.remove(), 0);
  }

  /** Brief on-screen status toast for export/import results. */
  private flashStatus(message: string): void {
    const layout = ui(this);
    const toast = this.add.text(layout.cx, layout.h - 90, message, {
      ...FONTS.body, fontSize: mobileFontSize(13), color: COLORS.textHighlight,
      backgroundColor: '#0f0f1add', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setDepth(200);
    this.time.delayedCall(2400, () => toast.destroy());
  }
}
