import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { COLORS, FONTS, mobileFontSize } from '@ui/theme';
import { SelectableController, type SelectableControllerConfig } from '@ui/controls/SelectableController';
import { NinePatchPanel } from './NinePatchPanel';

export interface InventoryActionMenuConfig {
  labels: readonly string[];
  sounds?: SelectableControllerConfig['sounds'];
  onConfirm: (label: string) => void;
  onCancel: () => void;
}

export class InventoryActionMenu {
  private readonly panel: NinePatchPanel;
  private readonly texts: Phaser.GameObjects.Text[];
  private readonly controller: SelectableController;

  constructor(private readonly scene: Phaser.Scene, private readonly config: InventoryActionMenuConfig) {
    const layout = ui(scene);
    const panelX = Math.min(Math.max(layout.cx, 140), layout.w - 80);
    this.panel = new NinePatchPanel(scene, panelX, layout.cy, 140, config.labels.length * 34 + 16, {
      fillColor: COLORS.bgPanelDark,
      fillAlpha: 0.95,
      borderColor: COLORS.borderLight,
      cornerRadius: 6,
    });
    this.texts = config.labels.map((label, index) => scene.add.text(panelX, layout.cy - ((config.labels.length - 1) * 17) + index * 34, label, {
      ...FONTS.body,
      fontSize: mobileFontSize(16),
      color: index === 0 ? COLORS.textHighlight : COLORS.textWhite,
    }).setOrigin(0.5));
    this.controller = new SelectableController({
      itemCount: config.labels.length,
      wrap: true,
      sounds: config.sounds,
      onMove: index => this.setSelectedIndex(index),
      onConfirm: index => config.onConfirm(config.labels[index]),
      onCancel: config.onCancel,
    });
    this.controller.bindKeyboard(scene);
  }

  destroy(): void {
    this.controller.destroy();
    this.panel.destroy();
    this.texts.forEach(text => text.destroy());
  }

  private setSelectedIndex(index: number): void {
    this.texts.forEach((text, textIndex) => text.setColor(textIndex === index ? COLORS.textHighlight : COLORS.textWhite));
  }
}
