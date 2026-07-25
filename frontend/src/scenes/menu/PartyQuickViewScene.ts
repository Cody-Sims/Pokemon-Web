import Phaser from 'phaser';
import { SceneInputRegistry } from '@scenes/SceneInputRegistry';
import { layoutOn } from '@utils/layout-on';
import { COLORS, isMobile, minTouchTarget, mobileScale } from '@ui/theme';
import { computeTouchMetrics } from '@ui/controls/touch-geometry';
import { getGameSafeAreaInsets } from '@utils/safe-area';
import { GameManager } from '@managers/GameManager';
import { EventManager } from '@managers/EventManager';
import { SceneRouter } from '@scenes/SceneRouter';
import { SceneKey } from '@scenes/scene-keys';
import { computeOverworldHudLayout } from '@scenes/overworld/overworld-hud-layout';

const MAX_PARTY = 6;
const STROKE_WIDTH = 2;

/** Compute ball radius based on current device state. */
function ballRadius(): number {
  return isMobile() ? 10 : 8;
}
/** Compute ball spacing based on current device state. */
function ballSpacing(): number {
  return isMobile() ? 28 : 24;
}

/** HP-based fill colours matching theme constants. */
const HP_GREEN = COLORS.hpGreen; // >50%
const HP_YELLOW = COLORS.hpYellow; // 25-50%
const HP_RED = COLORS.hpRed; // <25%
const HP_FAINTED = 0x666666; // 0 HP
const SLOT_EMPTY = 0x333344; // no Pokemon in slot
const OUTLINE_COLOR = 0xcccccc;
const OUTLINE_EMPTY = 0x555566;

/**
 * PartyQuickViewScene -- Lightweight HUD overlay showing up to 6 Poke Ball
 * icons at the top-center of the screen, coloured by HP status.
 *
 * Colour key:
 *   green  = HP > 50%
 *   yellow = HP 25-50%
 *   red    = HP < 25%
 *   gray   = fainted (0 HP)
 *   empty slot = dim placeholder (no icon drawn)
 *
 * Tapping the strip opens the full PartyScene.
 * Launched alongside OverworldScene, same pattern as QuestTrackerScene.
 */
export class PartyQuickViewScene extends Phaser.Scene {
  private container!: Phaser.GameObjects.Container;
  private balls: Phaser.GameObjects.Arc[] = [];
  private bg!: Phaser.GameObjects.Rectangle;

  private readonly inputRegistry = new SceneInputRegistry(this);

  constructor() {
    super({ key: SceneKey.PartyQuickView });
  }

  create(): void {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    const BALL_RADIUS = ballRadius();
    const BALL_SPACING = ballSpacing();

    // Total width of the row of balls
    const totalWidth = (MAX_PARTY - 1) * BALL_SPACING;
    const startX = -totalWidth / 2;
    // Semi-transparent background pill behind the balls
    const bgWidth = totalWidth + BALL_RADIUS * 2 + 16;
    const bgHeight = BALL_RADIUS * 2 + 12;
    this.bg = this.add.rectangle(0, 0, bgWidth, bgHeight, 0x000000, 0.4);
    this.bg.setStrokeStyle(1, 0x444466);

    this.balls = [];
    const children: Phaser.GameObjects.GameObject[] = [this.bg];

    for (let i = 0; i < MAX_PARTY; i++) {
      const ball = this.add.circle(startX + i * BALL_SPACING, 0, BALL_RADIUS, SLOT_EMPTY);
      ball.setStrokeStyle(STROKE_WIDTH, OUTLINE_EMPTY);
      this.balls.push(ball);
      children.push(ball);
    }

    this.container = this.add.container(0, 0, children);
    this.container.setDepth(100);
    this.container.setScrollFactor(0);

    // Interactive hit zone covering the full strip -- meets minimum touch target
    const hitWidth = bgWidth;
    const hitHeight = Math.max(bgHeight, minTouchTarget());
    const hitZone = this.add.zone(0, 0, hitWidth, hitHeight).setInteractive();
    this.container.add(hitZone);

    this.inputRegistry.bindPointer(hitZone, 'pointerdown', () => {
      // Guard: don't open if PartyScene or MenuScene is already up
      const router = SceneRouter.for(this);
      if (router.isActive(SceneKey.Party) || router.isActive(SceneKey.Menu)) return;
      router.launch(SceneKey.Party);
    });

    layoutOn(this, () => {
      const position = this.computePosition(bgWidth, bgHeight);
      this.container.setPosition(position.x, position.y);
    });

    // Listen for party / HP changes via EventManager
    const em = EventManager.getInstance();
    const updateHandler = () => this.refresh();
    em.onTagged(this.scene.key, 'party-changed', updateHandler);
    em.onTagged(this.scene.key, 'flag-set', updateHandler);

    // Refresh when scene resumes (returning from menus / battles)
    this.inputRegistry.bindSceneEvent('wake', () => this.refresh());
    this.inputRegistry.bindSceneEvent('resume', () => this.refresh());

    // Clean up listeners on shutdown
    this.events.once('shutdown', () => {
      em.clearByTag(this.scene.key);
    });

    this.refresh();
  }

  /** Re-draw ball colours based on current party HP. */
  refresh(): void {
    const party = GameManager.getInstance().getParty();

    for (let i = 0; i < MAX_PARTY; i++) {
      const ball = this.balls[i];
      if (!ball) continue;

      if (i >= party.length) {
        // Empty slot -- dim placeholder
        ball.setFillStyle(SLOT_EMPTY);
        ball.setStrokeStyle(STROKE_WIDTH, OUTLINE_EMPTY);
        ball.setAlpha(0.5);
        continue;
      }

      ball.setAlpha(1);
      ball.setStrokeStyle(STROKE_WIDTH, OUTLINE_COLOR);

      const poke = party[i];
      const maxHp = poke.stats.hp;
      const ratio = maxHp > 0 ? poke.currentHp / maxHp : 0;

      if (poke.currentHp <= 0) {
        ball.setFillStyle(HP_FAINTED);
      } else if (ratio < 0.25) {
        ball.setFillStyle(HP_RED);
      } else if (ratio <= 0.5) {
        ball.setFillStyle(HP_YELLOW);
      } else {
        ball.setFillStyle(HP_GREEN);
      }
    }

    // Hide the entire strip when party is empty (pre-starter)
    this.container.setVisible(party.length > 0);
  }

  shutdown(): void {
    this.inputRegistry.clear();
  }

  private computePosition(width: number, height: number): { x: number; y: number } {
    const touchMetrics = computeTouchMetrics(minTouchTarget(), mobileScale());
    const layout = computeOverworldHudLayout({
      width: this.cameras.main.width,
      height: this.cameras.main.height,
      safeArea: getGameSafeAreaInsets(this.cameras.main),
      hasTouchControls: isMobile(),
      hasSpeedrunTimer: false,
      partyWidth: width,
      partyHeight: height,
      questWidth: isMobile() ? 200 : 230,
      questHeight: 48,
      minimapSize: (isMobile() ? 4 : 5) * 15 + 8,
      touchPanelWidth: isMobile() ? touchMetrics.panelWidth + touchMetrics.edgePadding : 0,
    });
    return layout.partyQuickView;
  }
}
