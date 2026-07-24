import Phaser from 'phaser';
import { SceneInputRegistry } from '@scenes/SceneInputRegistry';
import { ui } from '@utils/ui-layout';
import { COLORS, FONTS, drawPanel, mobileFontSize, mobileScale } from '@ui/theme';
import { AudioManager } from '@managers/AudioManager';
import { GameManager } from '@managers/GameManager';
import { SFX } from '@utils/audio-keys';
import { mapRegistry } from '@data/maps';
import { OverworldAbilities } from '@systems/overworld/OverworldAbilities';
import { SceneRouter } from '@scenes/SceneRouter';
import { SceneKey } from '@scenes/scene-keys';
import { TouchControls } from '@ui/controls/TouchControls';
import { RegionMapService } from '@systems/overworld/RegionMapService';
import type { RegionMapNode } from '@data/region-map';

export class FlyMapScene extends Phaser.Scene {
  private cursor = 0;
  private destinations: readonly RegionMapNode[] = [];
  private destTexts: Phaser.GameObjects.Text[] = [];
  private cursorIcon!: Phaser.GameObjects.Text;
  private descText!: Phaser.GameObjects.Text;

  private readonly inputRegistry = new SceneInputRegistry(this);
  private readonly regionMap = new RegionMapService();

  constructor() {
    super({ key: SceneKey.FlyMap });
  }

  create(): void {
    const gm = GameManager.getInstance();
    this.destinations = this.regionMap.getFlyableDestinations(mapKey => gm.hasVisitedMap(mapKey), gm.getCurrentMap());
    const flyUser = OverworldAbilities.getUser('fly');
    void flyUser;

    const layout = ui(this);
    this.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, COLORS.bgDark);
    drawPanel(this, layout.cx, layout.cy, layout.w - 20, layout.h - 20);

    this.add.text(layout.cx, 30, 'FLY — Choose Destination', {
      ...FONTS.heading,
      color: COLORS.textHighlight,
    }).setOrigin(0.5);

    const startY = 80;
    const rowH = Math.round(40 * mobileScale());
    const fontSize = mobileFontSize(17);
    this.destTexts = this.destinations.map((dest, index) => {
      const currentMarker = dest.mapKey === gm.getCurrentMap() ? ' ◄' : '';
      const text = this.add.text(layout.cx, startY + index * rowH, dest.label + currentMarker, {
        ...FONTS.body,
        fontSize,
        color: COLORS.textWhite,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      this.inputRegistry.bindPointer(text, 'pointerover', () => {
        this.cursor = index;
        this.updateCursor();
      });
      this.inputRegistry.bindPointer(text, 'pointerdown', () => {
        this.cursor = index;
        this.confirmFly();
      });
      return text;
    });

    if (this.destinations.length === 0) {
      this.add.text(layout.cx, startY, 'No fly destinations available.', {
        ...FONTS.body,
        fontSize,
        color: COLORS.textGray,
      }).setOrigin(0.5);
    }

    this.cursorIcon = this.add.text(0, 0, '▸', {
      ...FONTS.body,
      fontSize,
      color: COLORS.textHighlight,
    });

    this.descText = this.add.text(layout.cx, layout.h - 50, '', {
      ...FONTS.caption,
      color: COLORS.textGray,
    }).setOrigin(0.5);

    this.cursor = 0;
    this.updateCursor();
    this.addBackButton(layout.h, fontSize);
    this.bindInput();
  }

  update(): void {
    const touchControls = TouchControls.getInstance();
    if (touchControls?.consumeCancel()) this.close();
  }

  private addBackButton(height: number, fontSize: string): void {
    const backBtn = this.add.text(40, height - 30, '← BACK', {
      ...FONTS.body,
      fontSize: mobileFontSize(14),
      color: COLORS.textGray,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.setPadding(16, 12, 16, 12);
    this.inputRegistry.bindPointer(backBtn, 'pointerdown', () => this.close());
  }

  private bindInput(): void {
    this.inputRegistry.bindKey('keydown-UP', () => this.moveCursor(-1));
    this.inputRegistry.bindKey('keydown-DOWN', () => this.moveCursor(1));
    this.inputRegistry.bindKey('keydown-ENTER', () => this.confirmFly());
    this.inputRegistry.bindKey('keydown-SPACE', () => this.confirmFly());
    this.inputRegistry.bindKey('keydown-ESC', () => this.close());
  }

  private moveCursor(delta: number): void {
    if (this.destinations.length === 0) return;
    this.cursor = (this.cursor + delta + this.destinations.length) % this.destinations.length;
    this.updateCursor();
    AudioManager.getInstance().playSFX(SFX.CURSOR);
  }

  private updateCursor(): void {
    this.destTexts.forEach((text, index) => {
      text.setColor(index === this.cursor ? COLORS.textHighlight : COLORS.textWhite);
    });
    const selectedText = this.destTexts[this.cursor];
    this.cursorIcon.setVisible(Boolean(selectedText));
    if (selectedText) this.cursorIcon.setPosition(selectedText.x - selectedText.width / 2 - 20, selectedText.y - 10);
    const dest = this.destinations[this.cursor];
    this.descText.setText(dest ? (mapRegistry[dest.mapKey]?.displayName ?? dest.label) : 'Press ESC or BACK to close.');
  }

  private confirmFly(): void {
    const dest = this.destinations[this.cursor];
    const gm = GameManager.getInstance();
    if (!dest) {
      AudioManager.getInstance().playSFX(SFX.CANCEL);
      this.close();
      return;
    }

    if (dest.mapKey === gm.getCurrentMap()) {
      AudioManager.getInstance().playSFX(SFX.CANCEL);
      this.close();
      return;
    }

    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    const router = SceneRouter.for(this);
    router.stop(SceneKey.Menu);
    router.stop(SceneKey.Overworld);
    router.transitionTo(SceneKey.Overworld, {
      flyTo: dest.mapKey,
      spawnId: 'default',
    });
  }

  private close(): void {
    AudioManager.getInstance().playSFX(SFX.CANCEL);
    this.scene.stop();
  }
}
