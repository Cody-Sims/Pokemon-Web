import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { COLORS, FONTS, mobileFontSize } from '@ui/theme';
import { SelectableController, type SelectableControllerConfig } from '@ui/controls/SelectableController';
import { SceneInputRegistry } from '@scenes/SceneInputRegistry';
import { NinePatchPanel } from './NinePatchPanel';

export interface TargetPickerEntry { label: string }

export interface TargetPickerPanelConfig {
  targets: readonly TargetPickerEntry[];
  selectedIndex?: number;
  sounds?: SelectableControllerConfig['sounds'];
  onConfirm: (index: number) => void;
  onCancel?: () => void;
}

export class TargetPickerPanel {
  private readonly panel: NinePatchPanel;
  private readonly texts: Phaser.GameObjects.Text[] = [];
  private readonly controller: SelectableController;
  private readonly input: SceneInputRegistry;

  constructor(private readonly scene: Phaser.Scene, private readonly config: TargetPickerPanelConfig) {
    const layout = ui(scene);
    const selectedIndex = config.selectedIndex ?? 0;
    this.panel = new NinePatchPanel(scene, layout.cx, layout.cy, 320, config.targets.length * 40 + 32, {
      fillColor: COLORS.bgPanelDark,
      fillAlpha: 0.95,
      borderColor: COLORS.borderLight,
      cornerRadius: 6,
    });
    this.controller = new SelectableController({
      itemCount: config.targets.length,
      initialIndex: selectedIndex,
      wrap: true,
      sounds: config.sounds,
      onMove: index => this.setSelectedIndex(index),
      onConfirm: config.onConfirm,
      onCancel: config.onCancel,
    });
    config.targets.forEach((target, index) => this.addTargetText(target.label, index, selectedIndex));
    this.input = new SceneInputRegistry(scene);
    this.bindInput();
  }

  destroy(): void {
    this.input.clear();
    this.controller.destroy();
    this.panel.destroy();
    this.texts.forEach(text => text.destroy());
    this.texts.length = 0;
  }

  private addTargetText(label: string, index: number, selectedIndex: number): void {
    const layout = ui(this.scene);
    const text = this.scene.add.text(layout.cx, layout.cy - ((this.config.targets.length - 1) * 20) + index * 40, label, {
      ...FONTS.body,
      fontSize: mobileFontSize(14),
      color: index === selectedIndex ? COLORS.textHighlight : COLORS.textWhite,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    text.on('pointerover', () => this.controller.hoverIndex(index));
    text.on('pointerdown', () => this.controller.clickIndex(index));
    this.texts.push(text);
  }

  private bindInput(): void {
    this.input.bindKey('keydown-UP', () => this.controller.navigate('up'));
    this.input.bindKey('keydown-DOWN', () => this.controller.navigate('down'));
    this.input.bindKey('keydown-W', () => this.controller.navigate('up'));
    this.input.bindKey('keydown-S', () => this.controller.navigate('down'));
    this.input.bindKey('keydown-ENTER', () => this.controller.confirm());
    this.input.bindKey('keydown-SPACE', () => this.controller.confirm());
    this.input.bindKey('keydown-Z', () => this.controller.confirm());
  }

  private setSelectedIndex(index: number): void {
    this.texts.forEach((text, textIndex) => text.setColor(textIndex === index ? COLORS.textHighlight : COLORS.textWhite));
  }
}
