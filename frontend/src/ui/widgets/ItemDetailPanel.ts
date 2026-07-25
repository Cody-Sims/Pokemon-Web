import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { COLORS, FONTS, mobileFontSize } from '@ui/theme';
import type { InventoryEntry } from '@systems/inventory';

export class ItemDetailPanel {
  private readonly group: Phaser.GameObjects.Group;

  constructor(private readonly scene: Phaser.Scene) {
    this.group = scene.add.group();
  }

  render(entry: InventoryEntry | undefined): void {
    this.group.clear(true, true);
    if (!entry) return;

    const layout = ui(this.scene);
    const isPortrait = layout.h > layout.w;
    const x = isPortrait ? 24 : layout.w - 280;
    const wrapW = isPortrait ? layout.w - 48 : 240;
    let y = isPortrait ? 90 + Math.floor((layout.h - 130) * 0.55) + 24 : 110;

    this.group.add(this.scene.add.text(x, y, entry.item.name, {
      ...FONTS.body,
      fontStyle: 'bold',
      fontSize: mobileFontSize(17),
    }));
    y += 28;

    const desc = this.scene.add.text(x, y, entry.item.description, {
      ...FONTS.bodySmall,
      wordWrap: { width: wrapW },
    });
    this.group.add(desc);
    y += desc.height + 16;

    this.group.add(this.scene.add.text(x, y, `Quantity: ${entry.qty}`, FONTS.bodySmall));
    y += 28;

    const effectText = effectSummary(entry);
    if (effectText) {
      this.group.add(this.scene.add.text(x, y, effectText, {
        ...FONTS.caption,
        color: COLORS.textBlue,
      }));
    }
  }

  destroy(): void {
    this.group.destroy(true, true);
  }
}

function effectSummary(entry: InventoryEntry): string {
  const effect = entry.item.effect;
  if (effect.type === 'heal-hp') return effect.amount === -1 ? 'Revives to half HP' : `Heals ${effect.amount} HP`;
  if (effect.type === 'heal-status') return `Cures: ${effect.status}`;
  if (effect.type === 'full-restore') return 'Heals HP + cures status';
  if (effect.type === 'level-up') return 'Raises level by 1';
  if (effect.type === 'capture') return `Catch rate: x${effect.catchRateMultiplier}`;
  if (effect.type === 'key') return 'Key item';
  return '';
}
