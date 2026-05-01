import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { layoutOn } from '@utils/layout-on';
import { GameManager } from '@managers/GameManager';
import { AudioManager } from '@managers/AudioManager';
import { SaveManager } from '@managers/SaveManager';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';
import { MenuController } from '@ui/controls/MenuController';
import { TouchControls } from '@ui/controls/TouchControls';
import { COLORS, FONTS, mobileFontSize } from '@ui/theme';
import { SFX } from '@utils/audio-keys';
import { setRenderQuality, type RenderQuality } from '@utils/perf-profile';
import { syncAccessibilitySettings, colorblindFilter } from '@utils/accessibility';

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
  private controller?: MenuController;
  private settingTexts: { label: Phaser.GameObjects.Text; value: Phaser.GameObjects.Text; leftArrow: Phaser.GameObjects.Text; rightArrow: Phaser.GameObjects.Text }[] = [];
  private returnScene = 'TitleScene';
  private isFullscreen = false;
  /** Layer holding every layout-derived game object so we can wipe + rebuild on resize. */
  private layoutLayer?: Phaser.GameObjects.Container;
  /** Cursor index preserved across re-layouts. */
  private savedCursor = 0;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  init(data?: { returnScene?: string }): void {
    this.returnScene = data?.returnScene ?? 'TitleScene';
  }

  create(): void {
    const gm = GameManager.getInstance();

    // Re-layout on resize / orientation change. Everything inside builds the
    // panel + rows from scratch using the current viewport dimensions, so the
    // settings menu adapts cleanly when the device rotates while it's open.
    layoutOn(this, () => this.buildLayout());

    // LEFT/RIGHT to adjust value (registered once so the controller persists
    // across re-layouts).
    this.input.keyboard!.on('keydown-LEFT', () => this.adjustValue(-1));
    this.input.keyboard!.on('keydown-RIGHT', () => this.adjustValue(1));

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

    // Settings rows — compact layout in portrait so labels never overlap
    // the value/arrow column on narrow screens.
    const startY = portrait ? 78 : 100;
    // Reserve room for the back button + hint at the bottom of the panel,
    // PLUS extra clearance on mobile portrait so the bottom DOM touch
    // controls (~140 px) never overlap the bottom row of arrows.
    const portraitMobileReserve = portrait && isMobile ? 150 : 0;
    const bottomReserve = (portrait ? 64 : 90) + portraitMobileReserve;
    const allItemCount = SETTING_DEFS.length + 1; // +1 for fullscreen
    const availH = layout.h - startY - bottomReserve;
    const idealRowH = portrait ? 30 : 40;
    const rowH = Math.max(24, Math.min(idealRowH, Math.floor(availH / allItemCount)));
    const rowFontPx = portrait ? 14 : 17;

    // Column anchors (right-aligned controls so long labels have room).
    const labelX = portrait ? 24 : 100;
    const rightArrowX = layout.w - (portrait ? 28 : 95);
    const valueX = rightArrowX - (portrait ? 30 : 55);
    const leftArrowX = valueX - (portrait ? 38 : 60);

    SETTING_DEFS.forEach((def, i) => {
      const y = startY + i * rowH;
      const label = this.add.text(labelX, y, def.label, { ...FONTS.body, fontSize: mobileFontSize(rowFontPx) });
      const currentVal = gm.getSetting(def.key);
      const displayVal = this.formatValue(def, currentVal);

      // Tappable left arrow — enforce MIN_TOUCH_TARGET
      const leftArrow = this.add.text(leftArrowX, y, '◀', {
        ...FONTS.body, fontSize: mobileFontSize(rowFontPx), color: COLORS.textHighlight,
      }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
      leftArrow.setPadding(12, 10, 12, 10);
      leftArrow.on('pointerdown', () => { this.controller?.setCursor(i); this.highlightRow(i); this.adjustValue(-1); });

      // Value display
      const value = this.add.text(valueX, y, displayVal, {
        ...FONTS.body, fontSize: mobileFontSize(rowFontPx), color: COLORS.textHighlight,
      }).setOrigin(0.5, 0);

      // Tappable right arrow — enforce MIN_TOUCH_TARGET
      const rightArrow = this.add.text(rightArrowX, y, '▶', {
        ...FONTS.body, fontSize: mobileFontSize(rowFontPx), color: COLORS.textHighlight,
      }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
      rightArrow.setPadding(12, 10, 12, 10);
      rightArrow.on('pointerdown', () => { this.controller?.setCursor(i); this.highlightRow(i); this.adjustValue(1); });

      // Invisible row hit area for touch selection
      const hitArea = this.add.rectangle(layout.cx, y + rowH / 2 - 4, layout.w - 40, rowH, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      hitArea.on('pointerover', () => { this.controller?.setCursor(i); this.highlightRow(i); });

      this.layoutLayer!.add([label, leftArrow, value, rightArrow, hitArea]);
      this.settingTexts.push({ label, value, leftArrow, rightArrow });
    });

    // Fullscreen row
    const fsY = startY + SETTING_DEFS.length * rowH;
    const fsLabel = this.add.text(labelX, fsY, 'Fullscreen', { ...FONTS.body, fontSize: mobileFontSize(rowFontPx) });
    this.isFullscreen = this.scale.isFullscreen;
    const fsState = this.isFullscreen ? 'ON' : 'OFF';

    const fsLeftArrow = this.add.text(leftArrowX, fsY, '◀', {
      ...FONTS.body, fontSize: mobileFontSize(rowFontPx), color: COLORS.textHighlight,
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    fsLeftArrow.setPadding(12, 10, 12, 10);
    fsLeftArrow.on('pointerdown', () => { this.controller?.setCursor(SETTING_DEFS.length); this.highlightRow(SETTING_DEFS.length); this.toggleFullscreenFromGesture(); });

    const fsValue = this.add.text(valueX, fsY, fsState, {
      ...FONTS.body, fontSize: mobileFontSize(rowFontPx), color: COLORS.textHighlight,
    }).setOrigin(0.5, 0);

    const fsRightArrow = this.add.text(rightArrowX, fsY, '▶', {
      ...FONTS.body, fontSize: mobileFontSize(rowFontPx), color: COLORS.textHighlight,
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    fsRightArrow.setPadding(12, 10, 12, 10);
    fsRightArrow.on('pointerdown', () => { this.controller?.setCursor(SETTING_DEFS.length); this.highlightRow(SETTING_DEFS.length); this.toggleFullscreenFromGesture(); });

    const fsHitArea = this.add.rectangle(layout.cx, fsY + rowH / 2 - 4, layout.w - 40, rowH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    fsHitArea.on('pointerover', () => { this.controller?.setCursor(SETTING_DEFS.length); this.highlightRow(SETTING_DEFS.length); });

    this.layoutLayer!.add([fsLabel, fsLeftArrow, fsValue, fsRightArrow, fsHitArea]);
    this.settingTexts.push({ label: fsLabel, value: fsValue, leftArrow: fsLeftArrow, rightArrow: fsRightArrow });

    // Back button (visible for touch users, always works) — sit clear of
    // the OS home indicator + DOM touch controls so it's reachable on
    // mobile portrait/landscape phones.
    const portraitMobile = portrait && isMobile;
    const landscapeMobile = !portrait && isMobile;
    const bottomSafeReserve = portraitMobile ? 90 : landscapeMobile ? 24 : 16;
    const backY = layout.h - bottomSafeReserve - 22;
    const backBtn = this.add.text(layout.cx, backY, '[ Back ]', {
      ...FONTS.body, fontSize: mobileFontSize(portrait ? 16 : 20), color: COLORS.textHighlight,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.closeSettings());
    backBtn.on('pointerover', () => backBtn.setColor(COLORS.textWhite));
    backBtn.on('pointerout', () => backBtn.setColor(COLORS.textHighlight));

    // Save Export / Import buttons (plan.md D.6) — flank the Back button.
    const sideFont = mobileFontSize(portrait ? 12 : 14);
    const sideOffset = Math.min(portrait ? 90 : 140, layout.w / 2 - 56);
    const exportBtn = this.add.text(layout.cx - sideOffset, backY, '[ Export ]', {
      ...FONTS.body, fontSize: sideFont, color: COLORS.textGray,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    exportBtn.on('pointerdown', () => this.exportSave());
    exportBtn.on('pointerover', () => exportBtn.setColor(COLORS.textHighlight));
    exportBtn.on('pointerout', () => exportBtn.setColor(COLORS.textGray));

    const importBtn = this.add.text(layout.cx + sideOffset, backY, '[ Import ]', {
      ...FONTS.body, fontSize: sideFont, color: COLORS.textGray,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    importBtn.on('pointerdown', () => this.importSave());
    importBtn.on('pointerover', () => importBtn.setColor(COLORS.textHighlight));
    importBtn.on('pointerout', () => importBtn.setColor(COLORS.textGray));

    // Close hint — keep above the bottom OS reserve so it isn't clipped.
    const hintTxt = isMobile ? 'Tap ◀ ▶ to change  •  Tap [ Back ] to return' : 'ESC to go back   ◀ ▶ to change values';
    const hint = this.add.text(layout.cx, layout.h - bottomSafeReserve, hintTxt, {
      ...FONTS.caption,
      fontSize: mobileFontSize(portrait ? 10 : 12),
    }).setOrigin(0.5);
    this.layoutLayer!.add([backBtn, exportBtn, importBtn, hint]);

    this.controller = new MenuController(this, {
      columns: 1,
      itemCount: allItemCount,
      wrap: true,
      onMove: (idx) => this.highlightRow(idx),
      onCancel: () => this.closeSettings(),
    });
    // Restore cursor position from before the rebuild.
    const restored = Math.min(this.savedCursor, allItemCount - 1);
    this.controller.setCursor(restored);
    this.highlightRow(restored);
  }

  private highlightRow(idx: number): void {
    this.settingTexts.forEach((row, i) => {
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
      this.settingTexts[idx].value.setText(state);
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
      this.settingTexts[idx].value.setText(this.formatValue(def, newVal));
    } else if (def.type === 'slider') {
      const min = def.min ?? 0;
      const max = def.max ?? 1;
      const step = def.step ?? 0.1;
      const curNum = typeof currentVal === 'number' ? currentVal : parseFloat(String(currentVal)) || min;
      const newVal = Math.round(Math.max(min, Math.min(max, curNum + dir * step)) * 100) / 100;
      gm.setSetting(def.key, newVal);
      this.settingTexts[idx].value.setText(this.formatValue(def, newVal));
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
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
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
    this.scene.stop();
    // Use wake() to match the sleep() used by MenuScene, fall back to resume()
    const target = this.scene.get(this.returnScene);
    if (target && !target.scene.isActive()) {
      this.scene.wake(this.returnScene);
    } else {
      this.scene.resume(this.returnScene);
    }
  }

  update(): void {
    const tc = TouchControls.getInstance();
    if (tc?.consumeCancel()) {
      this.closeSettings();
    }
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
            this.scene.stop();
            this.scene.start('TitleScene');
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
