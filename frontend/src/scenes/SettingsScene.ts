import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';
import { GameManager } from '@managers/GameManager';
import { AudioManager } from '@managers/AudioManager';
import { NinePatchPanel } from '@ui/NinePatchPanel';
import { MenuController } from '@ui/MenuController';
import { COLORS, FONTS } from '@ui/theme';
import { SFX } from '@utils/audio-keys';

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
];

export class SettingsScene extends Phaser.Scene {
  private controller?: MenuController;
  private settingTexts: { label: Phaser.GameObjects.Text; value: Phaser.GameObjects.Text }[] = [];
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

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bgDark);
    new NinePatchPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 60, GAME_HEIGHT - 60, {
      fillColor: COLORS.bgPanel,
      borderColor: COLORS.border,
      cornerRadius: 8,
    });

    // Title
    this.add.text(GAME_WIDTH / 2, 50, 'SETTINGS', { ...FONTS.heading, fontSize: '26px' }).setOrigin(0.5);
    this.add.rectangle(GAME_WIDTH / 2, 70, 180, 2, COLORS.borderHighlight, 0.4);

    // Settings rows
    const startY = 110;
    const rowH = 50;
    this.settingTexts = [];

    SETTING_DEFS.forEach((def, i) => {
      const y = startY + i * rowH;
      const label = this.add.text(100, y, def.label, { ...FONTS.body, fontSize: '17px' });
      const currentVal = gm.getSetting(def.key);
      const displayVal = this.formatValue(def, currentVal);
      const value = this.add.text(GAME_WIDTH - 150, y, `◀ ${displayVal} ▶`, {
        ...FONTS.body, fontSize: '17px', color: COLORS.textHighlight,
      }).setOrigin(0.5, 0);

      this.settingTexts.push({ label, value });
    });

    // Fullscreen row
    const fsY = startY + SETTING_DEFS.length * rowH;
    const fsLabel = this.add.text(100, fsY, 'Fullscreen', { ...FONTS.body, fontSize: '17px' });
    const fsState = this.scale.isFullscreen ? 'ON' : 'OFF';
    const fsValue = this.add.text(GAME_WIDTH - 150, fsY, `◀ ${fsState} ▶`, {
      ...FONTS.body, fontSize: '17px', color: COLORS.textHighlight,
    }).setOrigin(0.5, 0);
    this.settingTexts.push({ label: fsLabel, value: fsValue });

    // Close hint
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, 'ESC to go back   ◀ ▶ to change values', FONTS.caption).setOrigin(0.5);

    const allItemCount = SETTING_DEFS.length + 1; // +1 for fullscreen

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
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
      const state = this.scale.isFullscreen ? 'ON' : 'OFF';
      this.settingTexts[idx].value.setText(`◀ ${state} ▶`);
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
      this.settingTexts[idx].value.setText(`◀ ${this.formatValue(def, newVal)} ▶`);
    } else if (def.type === 'slider') {
      const min = def.min ?? 0;
      const max = def.max ?? 1;
      const step = def.step ?? 0.1;
      const curNum = typeof currentVal === 'number' ? currentVal : parseFloat(String(currentVal)) || min;
      const newVal = Math.round(Math.max(min, Math.min(max, curNum + dir * step)) * 100) / 100;
      gm.setSetting(def.key, newVal);
      this.settingTexts[idx].value.setText(`◀ ${this.formatValue(def, newVal)} ▶`);
    }

    // Apply audio changes in real-time
    const musicVol = gm.getSetting('musicVolume');
    const sfxVol = gm.getSetting('sfxVolume');
    if (typeof musicVol === 'number') audio.setBGMVolume(musicVol);
    if (typeof sfxVol === 'number') audio.setSFXVolume(sfxVol);

    audio.playSFX(SFX.CURSOR);
  }

  private formatValue(def: SettingDef, val: string | number | boolean | undefined): string {
    if (val === undefined) return '—';
    if (def.type === 'slider' && def.format) {
      return def.format(typeof val === 'number' ? val : parseFloat(String(val)) || 0);
    }
    if (def.key === 'battleAnimations') {
      return String(val) === 'true' ? 'ON' : 'OFF';
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
    this.scene.resume(this.returnScene);
  }
}
