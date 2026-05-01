import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { COLORS, FONTS, drawPanel, mobileFontSize, mobileScale } from '@ui/theme';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';
import { AudioManager } from '@managers/AudioManager';
import { GameManager } from '@managers/GameManager';
import { SFX } from '@utils/audio-keys';
import { mapRegistry } from '@data/maps';
import { OverworldAbilities } from '@systems/overworld/OverworldAbilities';

/**
 * Town destinations for Fly. Each entry maps a badge count requirement
 * to a town map key and display name. Towns are unlocked when the
 * player has visited them (map key is in visitedMaps).
 */
interface FlyDestination {
  mapKey: string;
  displayName: string;
  /** Grid position on the visual map (column, row) for layout. */
  gridX: number;
  gridY: number;
}

const FLY_DESTINATIONS: FlyDestination[] = [
  { mapKey: 'pallet-town',        displayName: 'Littoral Town',       gridX: 1, gridY: 7 },
  { mapKey: 'viridian-city',      displayName: 'Viridian City',       gridX: 1, gridY: 6 },
  { mapKey: 'pewter-city',        displayName: 'Pewter City',         gridX: 1, gridY: 4 },
  { mapKey: 'coral-harbor',       displayName: 'Coral Harbor',        gridX: 3, gridY: 4 },
  { mapKey: 'ironvale-city',      displayName: 'Ironvale City',       gridX: 3, gridY: 3 },
  { mapKey: 'verdantia-village',  displayName: 'Verdantia Village',   gridX: 5, gridY: 3 },
  { mapKey: 'voltara-city',       displayName: 'Voltara City',        gridX: 5, gridY: 2 },
  { mapKey: 'wraithmoor-town',    displayName: 'Wraithmoor Town',     gridX: 3, gridY: 1 },
  { mapKey: 'scalecrest-citadel', displayName: 'Scalecrest Citadel',  gridX: 5, gridY: 1 },
  { mapKey: 'cinderfall-town',    displayName: 'Cinderfall Town',     gridX: 7, gridY: 1 },
];

import { TouchControls } from '@ui/controls/TouchControls';

export class FlyMapScene extends Phaser.Scene {
  private cursor = 0;
  private destinations: FlyDestination[] = [];
  private destTexts: Phaser.GameObjects.Text[] = [];
  private cursorIcon!: Phaser.GameObjects.Text;
  private descText!: Phaser.GameObjects.Text;
  private pokemonName = '';

  constructor() {
    super({ key: 'FlyMapScene' });
  }

  create(): void {
    const gm = GameManager.getInstance();

    // Determine which towns player has visited (they've set foot on the map at some point)
    this.destinations = FLY_DESTINATIONS.filter(d => {
      // Player has been to this map if it's the current map OR a trainer/flag indicates a visit.
      // Simple heuristic: if the player's current map matches or any spawn flag for the town exists.
      // Use visitedMaps tracking from GameManager (we add it below) or fall back to checking
      // if the player has defeated a trainer or flag associated with that city.
      return gm.hasVisitedMap(d.mapKey);
    });

    if (this.destinations.length === 0) {
      this.destinations = FLY_DESTINATIONS.filter(d => d.mapKey === gm.getCurrentMap());
    }

    const flyUser = OverworldAbilities.getUser('fly');
    this.pokemonName = flyUser?.nickname ?? `Pokémon`;

    // Background
    const layout = ui(this);
    this.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, COLORS.bgDark);
    drawPanel(this, layout.cx, layout.cy, layout.w - 20, layout.h - 20);

    // Title
    this.add.text(layout.cx, 30, 'FLY — Choose Destination', {
      ...FONTS.heading, color: COLORS.textHighlight,
    }).setOrigin(0.5);

    // Destination list
    const startY = 80;
    const rowH = Math.round(40 * mobileScale());
    const fontSize = mobileFontSize(17);

    this.destTexts = this.destinations.map((dest, i) => {
      const currentMarker = dest.mapKey === gm.getCurrentMap() ? ' ◄' : '';
      const t = this.add.text(layout.cx, startY + i * rowH, dest.displayName + currentMarker, {
        ...FONTS.body, fontSize, color: COLORS.textWhite,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      t.on('pointerover', () => { this.cursor = i; this.updateCursor(); });
      t.on('pointerdown', () => { this.cursor = i; this.confirmFly(); });
      return t;
    });

    this.cursorIcon = this.add.text(0, 0, '▸', {
      ...FONTS.body, fontSize, color: COLORS.textHighlight,
    });

    // Description text
    this.descText = this.add.text(layout.cx, layout.h - 50, '', {
      ...FONTS.caption, color: COLORS.textGray,
    }).setOrigin(0.5);

    this.cursor = 0;
    this.updateCursor();

    // Back button for mobile users (no physical ESC key)
    const backBtn = this.add.text(40, layout.h - 30, '← BACK', {
      ...FONTS.body, fontSize: mobileFontSize(14), color: COLORS.textGray,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.setPadding(16, 12, 16, 12);
    backBtn.on('pointerdown', () => this.close());

    // Keyboard navigation
    this.input.keyboard!.on('keydown-UP', () => {
      this.cursor = (this.cursor - 1 + this.destinations.length) % this.destinations.length;
      this.updateCursor();
      AudioManager.getInstance().playSFX(SFX.CURSOR);
    });
    this.input.keyboard!.on('keydown-DOWN', () => {
      this.cursor = (this.cursor + 1) % this.destinations.length;
      this.updateCursor();
      AudioManager.getInstance().playSFX(SFX.CURSOR);
    });
    this.input.keyboard!.on('keydown-ENTER', () => this.confirmFly());
    this.input.keyboard!.on('keydown-SPACE', () => this.confirmFly());
    this.input.keyboard!.on('keydown-ESC', () => this.close());
  }

  update(): void {
    const tc = TouchControls.getInstance();
    if (tc?.consumeCancel()) {
      this.close();
    }
  }

  private updateCursor(): void {
    this.destTexts.forEach((t, i) => {
      t.setColor(i === this.cursor ? COLORS.textHighlight : COLORS.textWhite);
    });
    const sel = this.destTexts[this.cursor];
    if (sel) {
      this.cursorIcon.setPosition(sel.x - sel.width / 2 - 20, sel.y - 10);
    }
    const dest = this.destinations[this.cursor];
    const mapDef = mapRegistry[dest.mapKey];
    this.descText.setText(mapDef?.displayName ?? dest.displayName);
  }

  private confirmFly(): void {
    const dest = this.destinations[this.cursor];
    const gm = GameManager.getInstance();

    if (dest.mapKey === gm.getCurrentMap()) {
      // Already here — close the fly menu instead of trapping the user
      AudioManager.getInstance().playSFX(SFX.CANCEL);
      this.close();
      return;
    }

    AudioManager.getInstance().playSFX(SFX.CONFIRM);

    // Flash screen and transition to destination
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.stop('MenuScene');
      this.scene.stop('OverworldScene');
      this.scene.start('OverworldScene', {
        flyTo: dest.mapKey,
        spawnId: 'default',
      });
    });
  }

  private close(): void {
    AudioManager.getInstance().playSFX(SFX.CANCEL);
    this.scene.stop();
  }
}
