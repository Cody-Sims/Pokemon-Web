import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { layoutOn } from '@utils/layout-on';
import { isMobile } from '@ui/theme';
import { GameManager } from '@managers/GameManager';
import { mapRegistry, MapDefinition, TILE_COLORS } from '@data/maps';

/**
 * Minimap radius in tiles from the player center.
 * The minimap renders a (RADIUS*2+1) x (RADIUS*2+1) tile window.
 */
const RADIUS = 7;
const DIAMETER = RADIUS * 2 + 1; // 15 tiles

/** Pixel size of each tile in the minimap. */
const PX_MOBILE = 4;
const PX_DESKTOP = 5;

/** Colours for special markers. */
const COLOR_PLAYER = 0xffffff;
const COLOR_NPC = 0xff4444;
const COLOR_TRAINER = 0xff8800;
const COLOR_WARP = 0xffee55;
const COLOR_OOB = 0x111111; // out-of-bounds (beyond map edge)
const COLOR_BORDER = 0x444466;
const BG_ALPHA = 0.7;

/**
 * MinimapScene -- Lightweight HUD overlay showing a small map in the bottom-right
 * corner of the overworld screen. Tiles are color-coded, with dots for the player,
 * NPCs, trainers, and warp points.
 *
 * Launched alongside OverworldScene, same pattern as QuestTrackerScene / PartyQuickViewScene.
 */
export class MinimapScene extends Phaser.Scene {
  private container!: Phaser.GameObjects.Container;
  private bg!: Phaser.GameObjects.Rectangle;
  private border!: Phaser.GameObjects.Rectangle;
  private rt!: Phaser.GameObjects.RenderTexture;
  private playerDot!: Phaser.GameObjects.Arc;
  private visible = true;

  /** Cached position to skip redraws when the player hasn't moved. */
  private lastTileX = -1;
  private lastTileY = -1;
  private lastMapKey = '';

  constructor() {
    super({ key: 'MinimapScene' });
  }

  create(): void {
    const layout = ui(this);
    const px = isMobile() ? PX_MOBILE : PX_DESKTOP;
    const size = DIAMETER * px;
    const padding = 4;
    const totalSize = size + padding * 2;

    const { x, y } = this.computePosition(layout.w, layout.h, totalSize);

    // Border rectangle
    this.border = this.add.rectangle(0, 0, totalSize, totalSize, COLOR_BORDER).setOrigin(0, 0);

    // Background (for out-of-bounds fill)
    this.bg = this.add.rectangle(padding, padding, size, size, COLOR_OOB, BG_ALPHA).setOrigin(0, 0);

    // RenderTexture for the tile colors
    this.rt = this.add.renderTexture(padding, padding, size, size).setOrigin(0, 0);

    // Player dot -- always in the center of the minimap
    const centerPx = padding + Math.floor(DIAMETER / 2) * px + px / 2;
    const dotRadius = Math.max(2, Math.floor(px / 2) + 1);
    this.playerDot = this.add.circle(centerPx, centerPx, dotRadius, COLOR_PLAYER);
    this.playerDot.setStrokeStyle(1, 0x000000);
    this.playerDot.setDepth(10);

    this.container = this.add.container(x, y, [this.border, this.bg, this.rt, this.playerDot]);
    this.container.setDepth(99);
    this.container.setScrollFactor(0);

    // Re-position on viewport resize / orientation change so the minimap
    // continues to clear the touch action buttons in portrait mode.
    layoutOn(this, () => {
      const l = ui(this);
      const pos = this.computePosition(l.w, l.h, totalSize);
      this.container.setPosition(pos.x, pos.y);
    });

    // Read the showMinimap setting
    const gm = GameManager.getInstance();
    const showSetting = gm.getSetting('showMinimap');
    this.visible = showSetting !== false && showSetting !== 'false';
    this.container.setVisible(this.visible);

    // Force an initial draw
    this.lastTileX = -1;
    this.lastTileY = -1;
    this.lastMapKey = '';

    // Refresh on wake / resume (returning from menus / battles)
    this.events.on('wake', () => {
      this.lastTileX = -1; // force redraw
      this.refreshVisibility();
    });
    this.events.on('resume', () => {
      this.lastTileX = -1;
      this.refreshVisibility();
    });

    this.events.once('shutdown', () => {
      this.rt?.destroy();
    });
  }

  update(): void {
    if (!this.visible) return;

    const gm = GameManager.getInstance();
    const mapKey = gm.getCurrentMap();
    const pos = gm.getPlayerPosition();
    const tileX = pos.x;
    const tileY = pos.y;

    // Skip redraw if nothing changed
    if (tileX === this.lastTileX && tileY === this.lastTileY && mapKey === this.lastMapKey) {
      return;
    }
    this.lastTileX = tileX;
    this.lastTileY = tileY;
    this.lastMapKey = mapKey;

    this.drawMinimap(mapKey, tileX, tileY);
  }

  /** Toggle visibility externally (e.g., from settings). */
  toggle(): void {
    this.visible = !this.visible;
    this.container.setVisible(this.visible);
    // Persist to settings
    GameManager.getInstance().setSetting('showMinimap', this.visible);
  }

  /** Re-read the setting and apply. */
  private refreshVisibility(): void {
    const showSetting = GameManager.getInstance().getSetting('showMinimap');
    this.visible = showSetting !== false && showSetting !== 'false';
    this.container.setVisible(this.visible);
  }

  /**
   * Compute the minimap anchor position. In portrait the action buttons sit
   * in the bottom-right and the clock + location HUD takes the top-center,
   * so we anchor the minimap to the top-left where it stays clear of every
   * other interactive element. In landscape (or desktop) we keep the
   * traditional bottom-right corner.
   */
  private computePosition(w: number, h: number, totalSize: number): { x: number; y: number } {
    const mobile = isMobile();
    const isPortrait = h > w;
    const margin = mobile ? 10 : 12;

    if (isPortrait) {
      // Top-left, pushed down past the location-text strip (~28px) so it
      // doesn't overlap the map name banner at the top of the screen.
      const topGap = 32;
      return { x: margin, y: topGap };
    }

    // Landscape / desktop: keep the legacy bottom-right placement, but
    // clear the action buttons on landscape phones.
    const landscapeMobileClear = 130; // legacy mobile landscape gap
    const bottomGap = mobile ? landscapeMobileClear : margin;
    return {
      x: w - totalSize - margin,
      y: h - totalSize - bottomGap,
    };
  }

  private drawMinimap(mapKey: string, playerTX: number, playerTY: number): void {
    const mapDef: MapDefinition | undefined = mapRegistry[mapKey];
    if (!mapDef) return;

    const px = isMobile() ? PX_MOBILE : PX_DESKTOP;

    // Clear the render texture
    this.rt.clear();
    this.rt.fill(COLOR_OOB, BG_ALPHA);

    // Use a temporary graphics object to stamp colored rectangles
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.setVisible(false);

    // Draw tiles
    for (let dy = -RADIUS; dy <= RADIUS; dy++) {
      for (let dx = -RADIUS; dx <= RADIUS; dx++) {
        const tx = playerTX + dx;
        const ty = playerTY + dy;

        // Out of bounds
        if (tx < 0 || ty < 0 || tx >= mapDef.width || ty >= mapDef.height) {
          continue; // already filled with OOB color
        }

        const tileId = mapDef.ground[ty]?.[tx];
        if (tileId === undefined) continue;

        const color = TILE_COLORS[tileId] ?? COLOR_OOB;
        const drawX = (dx + RADIUS) * px;
        const drawY = (dy + RADIUS) * px;

        gfx.fillStyle(color, 1);
        gfx.fillRect(drawX, drawY, px, px);
      }
    }

    // Draw warp markers
    for (const warp of mapDef.warps) {
      const dx = warp.tileX - playerTX;
      const dy = warp.tileY - playerTY;
      if (Math.abs(dx) <= RADIUS && Math.abs(dy) <= RADIUS) {
        const drawX = (dx + RADIUS) * px;
        const drawY = (dy + RADIUS) * px;
        gfx.fillStyle(COLOR_WARP, 1);
        gfx.fillRect(drawX, drawY, px, px);
      }
    }

    // Draw NPC markers
    for (const npc of mapDef.npcs) {
      const dx = npc.tileX - playerTX;
      const dy = npc.tileY - playerTY;
      if (Math.abs(dx) <= RADIUS && Math.abs(dy) <= RADIUS) {
        const drawX = (dx + RADIUS) * px;
        const drawY = (dy + RADIUS) * px;
        gfx.fillStyle(COLOR_NPC, 1);
        gfx.fillRect(drawX, drawY, px, px);
      }
    }

    // Draw trainer markers
    for (const trainer of mapDef.trainers) {
      const dx = trainer.tileX - playerTX;
      const dy = trainer.tileY - playerTY;
      if (Math.abs(dx) <= RADIUS && Math.abs(dy) <= RADIUS) {
        const drawX = (dx + RADIUS) * px;
        const drawY = (dy + RADIUS) * px;
        gfx.fillStyle(COLOR_TRAINER, 1);
        gfx.fillRect(drawX, drawY, px, px);
      }
    }

    // Stamp the graphics onto the render texture
    this.rt.draw(gfx, 0, 0);
    gfx.destroy();
  }

  shutdown(): void {
    this.rt?.destroy();
    this.input.removeAllListeners();
  }
}
