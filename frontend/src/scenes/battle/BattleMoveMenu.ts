import Phaser from 'phaser';
import { moveData } from '@data/moves';
import { pokemonData } from '@data/pokemon';
import { getCombinedEffectiveness } from '@data/type-chart';
import type { PokemonType } from '@utils/type-helpers';
import { GameManager } from '@managers/GameManager';
import { COLORS, TYPE_COLORS, CATEGORY_COLORS, FONTS, mobileFontSize, MOBILE_SCALE, isMobile, minTouchTarget } from '@ui/theme';
import { ui } from '@utils/ui-layout';
import { getMoveTarget } from '@battle/core/DoubleBattleManager';
import type { BattleUIScene } from './BattleUIScene';

/**
 * Manages the move-selection menu: type-colored buttons, PP display,
 * category indicators, type effectiveness hints, double-battle target
 * labels, and target-selection arrows.
 */
export class BattleMoveMenu {
  private scene: BattleUIScene;

  moveTexts: Phaser.GameObjects.Text[] = [];
  moveDecorations: Phaser.GameObjects.GameObject[] = [];
  moveCursor = 0;
  moveMenuBg?: Phaser.GameObjects.Rectangle;
  /** Geometry of each move button: {x, y, w, h, typeColor} for cursor ring drawing. */
  private moveButtons: { x: number; y: number; w: number; h: number; typeColor: number }[] = [];
  /** Shared graphics object that draws a thicker bright ring around the selected button. */
  private selectionRing?: Phaser.GameObjects.Graphics;
  targetArrows: Phaser.GameObjects.Text[] = [];
  targetCursor = 0;
  pendingMoveId?: string;

  constructor(scene: BattleUIScene) {
    this.scene = scene;
  }

  openMoveMenu(): void {
    this.scene.state = 'moves';
    this.moveCursor = 0;
    this.moveButtons = [];
    this.scene.hideActions();
    const moves = this.scene.battle().playerPokemon.moves;
    const moveRowH = Math.round(35 * MOBILE_SCALE);

    const { w: mw, h: mh, cx: mcx } = ui(this.scene);
    const compactMoves = isMobile() && (window.innerHeight < 400 || mh < 400);
    const moveMenuH = compactMoves ? 50 : 100;
    // BUG-003: Match the action menu's bottomReserve so the move grid
    // doesn't render under the DOM joystick / A-B overlay on mobile portrait.
    const isPortraitM = mh > mw;
    const bottomReserveM = isMobile() && isPortraitM ? 100 : 10;
    const menuY = mh - moveMenuH / 2 - bottomReserveM;
    this.moveMenuBg = this.scene.add
      .rectangle(mcx, menuY, mw - 20, moveMenuH, 0x1a1a2e, 0.95)
      .setStrokeStyle(2, COLORS.borderLight);

    // Selection ring graphics — drawn on top of move buttons, repositioned by updateMoveCursor.
    this.selectionRing?.destroy();
    this.selectionRing = this.scene.add.graphics().setDepth(12);

    // Pre-compute enemy types for type effectiveness hints
    const typeHintSetting = GameManager.getInstance().getSetting('showTypeHints');
    const showTypeHints = typeHintSetting !== false && typeHintSetting !== 'false';
    const b = this.scene.battle();
    const enemyData = pokemonData[b.enemyPokemon.dataId];
    const enemyTypes = enemyData
      ? (enemyData.types as [PokemonType] | [PokemonType, PokemonType])
      : undefined;

    this.moveTexts = moves.map((m, i) => {
      const md = moveData[m.moveId];
      let x: number, y: number;
      if (compactMoves) {
        const spacing = mw / (moves.length + 1);
        x = spacing * (i + 1);
        y = menuY;
      } else {
        const col = i % 2;
        const row = Math.floor(i / 2);
        x = mcx - 120 + col * 240;
        // Anchor rows to the same menuY used above so portrait + landscape stay aligned.
        y = menuY - moveRowH / 2 + row * moveRowH;
      }

      // Type-colored button background
      const typeCol = md ? (TYPE_COLORS[md.type] ?? 0x888888) : 0x888888;
      const btnW = compactMoves ? 120 : 180;
      const btnH = Math.max(minTouchTarget(), compactMoves ? 30 : 40);
      const bg = this.scene.add.graphics();
      bg.fillStyle(typeCol, 0.25);
      bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 4);
      bg.lineStyle(1, typeCol, 0.6);
      bg.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 4);
      bg.setDepth(9);
      this.moveDecorations.push(bg);
      this.moveButtons.push({ x, y, w: btnW, h: btnH, typeColor: typeCol });

      // Category indicator (P/S/St)
      if (md) {
        const catAbbr = md.category === 'physical' ? 'P' : md.category === 'special' ? 'S' : 'St';
        const catColor = CATEGORY_COLORS[md.category] ?? 0x888899;
        const catText = this.scene.add
          .text(x - btnW / 2 + 6, y + 4, catAbbr, {
            fontSize: mobileFontSize(10),
            color: `#${catColor.toString(16).padStart(6, '0')}`,
            fontFamily: 'monospace',
            fontStyle: 'bold',
          })
          .setDepth(10);
        this.moveDecorations.push(catText);
      }

      // PP coloring: normal=white, low (<=25%)=yellow, empty=red
      let ppColor: string = '#aaaaaa';
      if (md) {
        const ppPct = m.currentPp / md.pp;
        if (ppPct <= 0) ppColor = COLORS.textDanger;
        else if (ppPct <= 0.25) ppColor = COLORS.textHighlight;
      }

      // PP text (right-aligned inside button)
      if (md) {
        const ppText = this.scene.add
          .text(x + btnW / 2 - 8, y + 4, `${m.currentPp}/${md.pp}`, {
            fontSize: mobileFontSize(10),
            color: ppColor,
          })
          .setOrigin(1, 0)
          .setDepth(10);
        this.moveDecorations.push(ppText);
      }

      // Double battle: target label
      if (this.scene.battle().isDouble && md && !compactMoves) {
        const targeting = getMoveTarget(m.moveId);
        let targetLabel = '';
        let labelColor = '#88ccff';
        if (targeting === 'all-adjacent' || targeting === 'both-enemies' || targeting === 'all') {
          targetLabel = 'Hits all';
          labelColor = '#ffcc44';
        } else if (targeting === 'single-enemy') {
          targetLabel = 'Pick target';
          labelColor = '#88ccff';
        } else if (targeting === 'self') {
          targetLabel = 'Self';
          labelColor = '#88ff88';
        }
        if (targetLabel) {
          const lbl = this.scene.add
            .text(x + btnW / 2 - 8, y - btnH / 2 + 2, targetLabel, {
              fontSize: mobileFontSize(8),
              color: labelColor,
              fontStyle: 'italic',
            })
            .setOrigin(1, 0)
            .setDepth(11);
          this.moveDecorations.push(lbl);
        }
      }

      // Type effectiveness indicator (top-left corner of button)
      if (showTypeHints && md && enemyTypes && md.category !== 'status') {
        const eff = getCombinedEffectiveness(md.type as PokemonType, enemyTypes);
        let effLabel = '';
        let effColor = '';
        if (eff === 0) {
          effLabel = '0x';
          effColor = '#888888';
        } else if (eff >= 4) {
          effLabel = '4x';
          effColor = '#44ff66';
        } else if (eff >= 2) {
          effLabel = '2x';
          effColor = '#44ff66';
        } else if (eff <= 0.25) {
          effLabel = '\u00BCx';
          effColor = '#ff5555';
        } else if (eff <= 0.5) {
          effLabel = '\u00BDx';
          effColor = '#ff5555';
        }
        // Only show indicator for non-neutral effectiveness
        if (effLabel) {
          const effText = this.scene.add
            .text(x - btnW / 2 + 6, y - btnH / 2 + 2, effLabel, {
              fontSize: mobileFontSize(9),
              color: effColor,
              fontFamily: 'monospace',
              fontStyle: 'bold',
            })
            .setDepth(11);
          this.moveDecorations.push(effText);
        }
      }

      // Move name text
      const t = this.scene.add
        .text(x - btnW / 2 + 8, y - 8, md ? md.name : m.moveId, {
          ...FONTS.body,
          fontSize: mobileFontSize(13),
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setDepth(10)
        .setInteractive({ useHandCursor: true });
      t.setPadding(2, 2, 2, 2);

      // Expand the hit area to cover the full button
      t.setInteractive(
        new Phaser.Geom.Rectangle(-2, -6, btnW, btnH),
        Phaser.Geom.Rectangle.Contains,
      );

      t.on('pointerover', () => {
        if (this.scene.state === 'moves') {
          this.moveCursor = i;
          this.updateMoveCursor();
        }
      });
      t.on('pointerdown', () => {
        if (this.scene.state === 'moves') {
          this.moveCursor = i;
          this.selectMove();
        }
      });
      return t;
    });
    // Back button
    const back = this.scene.add
      .text(mw - 60, mh - 115, '\u2190 Back', { ...FONTS.bodySmall, fontSize: mobileFontSize(14) })
      .setInteractive({ useHandCursor: true });
    back.setPadding(8, 6, 8, 6);
    back.on('pointerdown', () => this.closeMoveMenu());
    this.moveTexts.push(back);
    this.updateMoveCursor();
    this.scene.msg('Choose a move!');
  }

  updateMoveCursor(): void {
    const moveCount = this.scene.battle().playerPokemon.moves.length;
    this.moveTexts.forEach((t, i) => {
      if (i < moveCount)
        t.setColor(i === this.moveCursor ? COLORS.textHighlight : COLORS.textWhite);
    });

    // Draw a bright ring on the active button using its move's type color.
    if (this.selectionRing) {
      this.selectionRing.clear();
      const btn = this.moveButtons[this.moveCursor];
      if (btn) {
        const ringX = btn.x - btn.w / 2 - 1;
        const ringY = btn.y - btn.h / 2 - 1;
        const ringW = btn.w + 2;
        const ringH = btn.h + 2;
        // Outer dark shadow
        this.selectionRing.lineStyle(4, 0x000000, 0.45);
        this.selectionRing.strokeRoundedRect(ringX, ringY, ringW, ringH, 5);
        // Bright type-colored ring
        this.selectionRing.lineStyle(2, btn.typeColor, 1);
        this.selectionRing.strokeRoundedRect(ringX, ringY, ringW, ringH, 5);
      }
    }
  }

  selectMove(): void {
    const b = this.scene.battle();

    // Auto-use Struggle when all moves are at 0 PP
    const allDepleted = b.playerPokemon.moves.every(m => m.currentPp <= 0);
    if (allDepleted) {
      this.closeMoveMenu();
      this.scene.state = 'animating';
      this.scene.hideActions();
      this.scene.executeTurn('struggle');
      return;
    }

    const mi = b.playerPokemon.moves[this.moveCursor];
    if (!mi || mi.currentPp <= 0) return;
    const md = moveData[mi.moveId];
    if (!md) return;

    this.closeMoveMenu();
    this.scene.state = 'animating';
    this.scene.hideActions();

    if (b.isDouble) {
      this.showTargetSelection(mi.moveId);
    } else {
      this.scene.executeTurn(mi.moveId);
    }
  }

  closeMoveMenu(): void {
    this.scene.state = 'actions';
    this.moveMenuBg?.destroy();
    this.selectionRing?.destroy();
    this.selectionRing = undefined;
    this.moveButtons = [];
    this.moveTexts.forEach(t => t.destroy());
    this.moveTexts = [];
    this.moveDecorations.forEach(d => d.destroy());
    this.moveDecorations = [];
    this.scene.showActions();
    this.scene.msg('What will you do?');
  }

  // ─── Double battle target selection ───

  showTargetSelection(moveId: string): void {
    const b = this.scene.battle();
    if (!b.isDouble || b.enemySprites.length < 2) {
      this.scene.executeTurn(moveId);
      return;
    }

    const targeting = getMoveTarget(moveId);

    if (
      targeting === 'self' ||
      targeting === 'all-adjacent' ||
      targeting === 'both-enemies' ||
      targeting === 'all'
    ) {
      if (targeting === 'all-adjacent' || targeting === 'both-enemies' || targeting === 'all') {
        const md = moveData[moveId];
        const moveName = md?.name ?? moveId;
        this.scene.msg(`${moveName} hits all targets!`);
      }
      this.scene.executeTurn(moveId);
      return;
    }

    // Single enemy target — show selection arrows
    this.pendingMoveId = moveId;
    this.scene.state = 'target-select';
    this.targetCursor = 0;
    const md = moveData[moveId];
    const moveName = md?.name ?? moveId;
    this.scene.msg(`Choose a target for ${moveName}!`);

    this.clearTargetArrows();
    b.enemySprites.forEach((spr, i) => {
      const enemyPoke = b.enemyPokemonSlots[i];
      const enemyName = enemyPoke ? (pokemonData[enemyPoke.dataId]?.name ?? '???') : '???';
      const arrow = this.scene.add
        .text(spr.x, spr.y - 50, `\u25bc\n${enemyName}`, {
          fontSize: mobileFontSize(18),
          color: i === 0 ? COLORS.textHighlight : COLORS.textWhite,
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(100);
      this.targetArrows.push(arrow);
    });
  }

  updateTargetCursor(): void {
    this.targetArrows.forEach((a, i) => {
      a.setColor(i === this.targetCursor ? COLORS.textHighlight : COLORS.textWhite);
    });
  }

  confirmTarget(): void {
    const moveId = this.pendingMoveId;
    this.pendingMoveId = undefined;
    this.clearTargetArrows();
    if (moveId) this.scene.executeTurn(moveId);
  }

  clearTargetArrows(): void {
    this.targetArrows.forEach(a => a.destroy());
    this.targetArrows = [];
  }
}
