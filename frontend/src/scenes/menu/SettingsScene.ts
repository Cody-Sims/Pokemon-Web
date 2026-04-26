import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { GameManager } from '@managers/GameManager';
import { AudioManager } from '@managers/AudioManager';
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
];

export class SettingsScene extends Phaser.Scene {
  private controller?: MenuController;
  private settingTexts: { label: Phaser.GameObjects.Text; value: Phaser.GameObjects.Text; leftArrow: Phaser.GameObjects.Text; rightArrow: Phaser.GameObjects.Text }[] = [];
  private returnScene = 'TitleScene';
  private isFullscreen = false;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  init(data?: { returnScene?: string }): void {
    this.returnScene = data?.returnScene ?? 'TitleScene';
  }

  create(): void {
    const gm = GameManager.getInstance();
    const isMobile = TouchControls.isTouchDevice();
    const layout = ui(this);
    const portrait = layout.h > layout.w;

    // Background
    this.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, COLORS.bgDark);
    new NinePatchPanel(this, layout.cx, layout.cy, layout.w - 32, layout.h - 32, {
      fillColor: COLORS.bgPanel,
      borderColor: COLORS.border,
      cornerRadius: 8,
    });

    // Title
    const titleSize = portrait ? 22 : 26;
    this.add.text(layout.cx, portrait ? 38 : 50, 'SETTINGS', { ...FONTS.heading, fontSize: mobileFontSize(titleSize) }).setOrigin(0.5);
    this.add.rectangle(layout.cx, portrait ? 56 : 70, 180, 2, COLORS.borderHighlight, 0.4);

    // Settings rows — compact layout in portrait so labels never overlap
    // the value/arrow column on narrow screens.
    const startY = portrait ? 78 : 100;
    // Reserve room for the back button + hint at the bottom of the panel.
    const bottomReserve = portrait ? 64 : 90;
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

    this.settingTexts = [];
    const rowHitAreas: Phaser.GameObjects.Rectangle[] = [];

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
      rowHitAreas.push(hitArea);

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
    fsLeftArrow.on('pointerdown', () => { this.controller?.setCursor(SETTING_DEFS.length); this.highlightRow(SETTING_DEFS.length); this.adjustValue(-1); });

    const fsValue = this.add.text(valueX, fsY, fsState, {
      ...FONTS.body, fontSize: mobileFontSize(rowFontPx), color: COLORS.textHighlight,
    }).setOrigin(0.5, 0);

    const fsRightArrow = this.add.text(rightArrowX, fsY, '▶', {
      ...FONTS.body, fontSize: mobileFontSize(rowFontPx), color: COLORS.textHighlight,
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    fsRightArrow.setPadding(12, 10, 12, 10);
    fsRightArrow.on('pointerdown', () => { this.controller?.setCursor(SETTING_DEFS.length); this.highlightRow(SETTING_DEFS.length); this.adjustValue(1); });

    const fsHitArea = this.add.rectangle(layout.cx, fsY + rowH / 2 - 4, layout.w - 40, rowH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    fsHitArea.on('pointerover', () => { this.controller?.setCursor(SETTING_DEFS.length); this.highlightRow(SETTING_DEFS.length); });
    rowHitAreas.push(fsHitArea);

    this.settingTexts.push({ label: fsLabel, value: fsValue, leftArrow: fsLeftArrow, rightArrow: fsRightArrow });

    // Back button (visible for touch users, always works)
    const backY = layout.h - (portrait ? 44 : 70);
    const backBtn = this.add.text(layout.cx, backY, '[ Back ]', {
      ...FONTS.body, fontSize: mobileFontSize(portrait ? 16 : 20), color: COLORS.textHighlight,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.closeSettings());
    backBtn.on('pointerover', () => backBtn.setColor(COLORS.textWhite));
    backBtn.on('pointerout', () => backBtn.setColor(COLORS.textHighlight));

    // Close hint
    const hintTxt = isMobile ? 'Tap ◀ ▶ to change  •  Tap [ Back ] to return' : 'ESC to go back   ◀ ▶ to change values';
    this.add.text(layout.cx, layout.h - (portrait ? 22 : 40), hintTxt, {
      ...FONTS.caption,
      fontSize: mobileFontSize(portrait ? 10 : 12),
    }).setOrigin(0.5);

    this.controller = new MenuController(this, {
      columns: 1,
      itemCount: allItemCount,
      wrap: true,
      onMove: (idx) => this.highlightRow(idx),
      onCancel: () => this.closeSettings(),
    });

    // LEFT/RIGHT to adjust value
    this.input.keyboard!.on('keydown-LEFT', () => this.adjustValue(-1));
    this.input.keyboard!.on('keydown-RIGHT', () => this.adjustValue(1));

    this.highlightRow(0);

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

    // Fullscreen toggle (last row)
    if (idx === SETTING_DEFS.length) {
      this.isFullscreen = !this.isFullscreen;
      if (this.isFullscreen) this.scale.startFullscreen();
      else this.scale.stopFullscreen();
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
    if (def.key === 'battleAnimations' || def.key === 'reducedMotion' || def.key === 'showMinimap' || def.key === 'showTypeHints') {
      return String(val) === 'true' ? 'ON' : 'OFF';
    }
    if (def.key === 'colorblindMode') {
      const labels: Record<string, string> = { off: 'Off', protanopia: 'Protanopia', deuteranopia: 'Deuteranopia' };
      return labels[String(val)] ?? String(val);
    }
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
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
}
