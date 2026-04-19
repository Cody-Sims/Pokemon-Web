import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { layoutOn } from '@utils/layout-on';
import { moveData } from '@data/moves';
import { pokemonData } from '@data/pokemon';
import { MoveExecutor } from '@battle/execution/MoveExecutor';
import { playMoveAnimation } from '@battle/execution/MoveAnimationPlayer';
import { StatusEffectHandler } from '@battle/effects/StatusEffectHandler';
import { AbilityHandler } from '@battle/effects/AbilityHandler';
import { HeldItemHandler } from '@battle/effects/HeldItemHandler';
import type { WeatherManager } from '@battle/effects/WeatherManager';
import type { BattleScene } from './BattleScene';
import type { PokemonInstance } from '@data/interfaces';
import { AudioManager } from '@managers/AudioManager';
import { GameManager } from '@managers/GameManager';
import { SFX } from '@utils/audio-keys';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';
import { COLORS, TYPE_COLORS, CATEGORY_COLORS, FONTS, mobileFontSize, MOBILE_SCALE, isMobile } from '@ui/theme';
import { TouchControls } from '@ui/controls/TouchControls';
import { SynthesisHandler } from '@battle/effects/SynthesisHandler';
import { SYNTHESIS_ITEM, SYNTHESIS_ELIGIBLE } from '@data/synthesis-data';
import { getMoveTarget } from '@battle/core/DoubleBattleManager';
import { trainerData } from '@data/trainers';
import { pickEnemyMove, calculateTurnOrder } from './BattleTurnRunner';
import { showMessageQueue as showMsgQueue } from './BattleMessageQueue';
import { showDamagePopup as showDmgPopup } from './BattleDamageNumbers';
import { collectEndOfTurnEffects } from './BattleEndOfTurn';
import { handlePokeBallUse as doCatch, type CatchContext } from './BattleCatchHandler';
import { runVictorySequence as doVictory, type VictoryContext } from './BattleVictorySequence';

type UIState = 'actions' | 'moves' | 'animating' | 'message' | 'target-select';

export class BattleUIScene extends Phaser.Scene {
  private actionTexts: Phaser.GameObjects.Text[] = [];
  private cursor = 0;
  private moveTexts: Phaser.GameObjects.Text[] = [];
  private moveDecorations: Phaser.GameObjects.GameObject[] = [];
  private moveCursor = 0;
  private moveMenuBg?: Phaser.GameObjects.Rectangle;
  private actionMenuBg!: Phaser.GameObjects.Rectangle;
  private state: UIState = 'actions';
  private messageText!: Phaser.GameObjects.Text;
  private statusHandler!: StatusEffectHandler;
  private weatherManager!: WeatherManager;
  private weatherText?: Phaser.GameObjects.Text;
  private pendingWaitConfirm?: () => void;
  private synthesisHandler!: SynthesisHandler;
  private synthText?: Phaser.GameObjects.Text;
  private targetArrows: Phaser.GameObjects.Text[] = [];
  private targetCursor = 0;
  private bossSynthesisTriggered = false;
  private fleeAttempts = 0;

  constructor() {
    super({ key: 'BattleUIScene' });
  }

  create(): void {
    this.state = 'actions';
    this.fleeAttempts = 0;

    // Use the StatusEffectHandler from BattleManager (single source of truth)
    this.statusHandler = this.battle().battleManager.getStatusHandler();
    this.weatherManager = this.battle().battleManager.getWeatherManager();
    this.synthesisHandler = new SynthesisHandler();

    const { w, h, cx } = ui(this);

    // Compact mode for small mobile screens
    const compact = isMobile() && (window.innerHeight < 400 || h < 400);
    const menuH = compact ? 50 : 100;

    // Weather indicator (top-center, hidden initially)
    this.weatherText = this.add.text(cx, 12, '', {
      ...FONTS.caption, fontSize: mobileFontSize(12), color: COLORS.textHighlight,
    }).setOrigin(0.5).setDepth(50);

    // Nine-patch message bar
    new NinePatchPanel(this, cx, h - (compact ? 80 : 120), w - 20, 30, {
      fillColor: 0x0a0a18, fillAlpha: 0.92, borderColor: COLORS.border, borderWidth: 1, cornerRadius: 4,
    });
    this.messageText = this.add.text(30, h - (compact ? 92 : 132), 'What will you do?', { ...FONTS.body, fontSize: mobileFontSize(16) });

    // Nine-patch action menu
    this.actionMenuBg = this.add.rectangle(cx, h - menuH / 2 - 10, w - 20, menuH, 0x1a1a2e, 0.95);
    this.actionMenuBg.setStrokeStyle(2, COLORS.borderLight);
    new NinePatchPanel(this, cx, h - menuH / 2 - 10, w - 20, menuH, {
      fillColor: COLORS.bgPanel, fillAlpha: 0.95, borderColor: COLORS.borderLight, borderWidth: 2, cornerRadius: 6,
    });

    const actions = ['FIGHT', 'BAG', 'POKEMON', 'RUN'];
    const actionFontSize = mobileFontSize(compact ? 15 : 18);
    const actionRowH = Math.round(35 * MOBILE_SCALE);
    this.actionTexts = actions.map((action, i) => {
      let x: number, y: number;
      if (compact) {
        // Single row: evenly spaced
        const spacing = w / 5;
        x = spacing * (i + 1);
        y = h - menuH / 2 - 10;
      } else {
        // 2x2 grid
        const col = i % 2;
        const row = Math.floor(i / 2);
        x = cx - 80 + col * 160;
        y = h - 85 + row * actionRowH;
      }
      const t = this.add.text(
        x, y,
        action, { ...FONTS.menuItem, fontSize: actionFontSize }
      ).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.setPadding(12, 8, 12, 8);
      t.on('pointerover', () => { if (this.state === 'actions') { this.cursor = i; this.updateCursor(); } });
      t.on('pointerdown', () => { if (this.state === 'actions') { this.cursor = i; this.selectAction(); } });
      return t;
    });
    this.cursor = 0;
    this.updateCursor();

    // ── SYNTH button (conditionally shown) ──
    this.synthText = this.add.text(
      cx, h - 15,
      'SYNTH', { ...FONTS.menuItem, fontSize: actionFontSize }
    ).setOrigin(0.5).setVisible(false).setInteractive({ useHandCursor: true });
    this.synthText.setPadding(12, 8, 12, 8);
    this.synthText.on('pointerdown', () => { if (this.state === 'actions') this.activateSynthesis(); });

    // Keyboard
    this.input.keyboard!.on('keydown-LEFT', () => this.nav('left'));
    this.input.keyboard!.on('keydown-RIGHT', () => this.nav('right'));
    this.input.keyboard!.on('keydown-UP', () => this.nav('up'));
    this.input.keyboard!.on('keydown-DOWN', () => this.nav('down'));
    this.input.keyboard!.on('keydown-ENTER', () => this.confirm());
    this.input.keyboard!.on('keydown-SPACE', () => this.confirm());
    this.input.keyboard!.on('keydown-ESC', () => this.cancel());

    // Re-layout on resize / orientation change
    layoutOn(this, () => {
      const { w, h, cx } = ui(this);
      const cpt = isMobile() && (window.innerHeight < 400 || h < 400);
      const mH = cpt ? 50 : 100;
      this.weatherText?.setPosition(cx, 12);
      this.messageText.setPosition(30, h - (cpt ? 92 : 132));
      this.actionMenuBg.setPosition(cx, h - mH / 2 - 10).setSize(w - 20, mH);
      this.actionTexts.forEach((t, i) => {
        if (cpt) {
          const sp = w / 5;
          t.setPosition(sp * (i + 1), h - mH / 2 - 10);
        } else {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const rowH = Math.round(35 * MOBILE_SCALE);
          t.setPosition(cx - 80 + col * 160, h - 85 + row * rowH);
        }
      });
      this.synthText?.setPosition(cx, h - 15);
    });
  }

  /** Poll touch A/B buttons each frame. */
  update(): void {
    const tc = TouchControls.getInstance();
    if (tc?.consumeConfirm()) {
      if (this.pendingWaitConfirm) {
        const cb = this.pendingWaitConfirm;
        this.pendingWaitConfirm = undefined;
        cb();
      } else {
        this.confirm();
      }
    }
    if (tc?.consumeCancel()) this.cancel();
  }

  private battle(): BattleScene { return this.scene.get('BattleScene') as BattleScene; }

  // ─── Input routing ───
  private nav(dir: string): void {
    if (this.state === 'animating' || this.state === 'message') return;
    AudioManager.getInstance().playSFX(SFX.CURSOR);
    if (this.state === 'target-select') {
      if (dir === 'left' && this.targetCursor > 0) this.targetCursor--;
      if (dir === 'right' && this.targetCursor < this.targetArrows.length - 1) this.targetCursor++;
      this.updateTargetCursor();
      return;
    }
    const cur = this.state === 'moves' ? 'moveCursor' : 'cursor';
    const len = this.state === 'moves' ? this.battle().playerPokemon.moves.length : 4;
    const compact = isMobile() && (window.innerHeight < 400 || this.cameras.main.height < 400);
    if (compact) {
      // Single row nav: left/right only
      if (dir === 'left' && this[cur] > 0) this[cur]--;
      if (dir === 'right' && this[cur] + 1 < len) this[cur]++;
    } else {
      if (dir === 'left'  && this[cur] % 2 === 1) this[cur]--;
      if (dir === 'right' && this[cur] % 2 === 0 && this[cur] + 1 < len) this[cur]++;
      if (dir === 'up'    && this[cur] >= 2) this[cur] -= 2;
      if (dir === 'down'  && this[cur] + 2 < len) this[cur] += 2;
    }
    this.state === 'moves' ? this.updateMoveCursor() : this.updateCursor();
  }

  private confirm(): void {
    if (this.state === 'animating') return;
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    if (this.state === 'target-select') { this.confirmTarget(); return; }
    if (this.state === 'message') { this.state = 'actions'; this.showActions(); this.msg('What will you do?'); return; }
    if (this.state === 'actions') this.selectAction();
    else if (this.state === 'moves') this.selectMove();
  }

  private cancel(): void {
    if (this.state === 'animating') return;
    AudioManager.getInstance().playSFX(SFX.CANCEL);
    if (this.state === 'target-select') { this.clearTargetArrows(); this.state = 'moves'; this.openMoveMenu(); return; }
    if (this.state === 'moves') this.closeMoveMenu();
  }

  // ─── Action menu ───
  private updateCursor(): void { this.actionTexts.forEach((t, i) => t.setColor(i === this.cursor ? COLORS.textHighlight : COLORS.textWhite)); }
  private showActions(): void {
    this.actionMenuBg.setVisible(true);
    this.actionTexts.forEach(t => t.setVisible(true));
    this.updateSynthButton();
    this.updateCursor();
  }
  private hideActions(): void { this.actionMenuBg.setVisible(false); this.actionTexts.forEach(t => t.setVisible(false)); this.synthText?.setVisible(false); }

  private selectAction(): void {
    switch (this.actionTexts[this.cursor].text) {
      case 'FIGHT': this.openMoveMenu(); break;
      case 'BAG': {
        this.scene.sleep();
        this.scene.launch('InventoryScene', { battleMode: true });
        const invScene = this.scene.get('InventoryScene');
        let ballUsed = false;
        let itemUsed = false;
        // Listen for pokeball use
        invScene.events.once('use-pokeball', (ballItemId: string) => {
          ballUsed = true;
          this.scene.wake();
          this.handlePokeBallUse(ballItemId);
        });
        // Listen for non-ball item use in battle (BUG-064)
        invScene.events.once('use-battle-item', () => {
          itemUsed = true;
        });
        invScene.events.once('shutdown', () => {
          if (ballUsed) return;
          this.scene.wake();
          // If a non-ball item was used, enemy gets a free attack (BUG-064)
          if (itemUsed) {
            this.executeEnemyOnlyTurn();
          }
        });
        break;
      }
      case 'POKEMON': {
        this.scene.sleep();
        this.scene.launch('PartyScene', { selectMode: true });
        const partyScene = this.scene.get('PartyScene');
        let switched = false;
        // Listen for pokemon selection (BUG-063)
        partyScene.events.once('pokemon-selected', (index: number) => {
          switched = true;
          const gm = GameManager.getInstance();
          const party = gm.getParty();
          const b = this.battle();
          // Don't switch to the active Pokemon or fainted Pokemon
          if (index === 0 || !party[index] || party[index].currentHp <= 0) {
            switched = false;
            return;
          }
          // Swap the selected Pokemon to the front
          const temp = party[0];
          party[0] = party[index];
          party[index] = temp;
          b.playerPokemon = party[0];
          const pData = pokemonData[party[0].dataId];
          if (pData) b.playerSprite.setTexture(pData.spriteKeys.back);
          b.updateHpBars();
          const name = pData?.name ?? '???';
          this.msg(`Go! ${name}!`);
          this.statusHandler.clearPokemon(party[index]);
        });
        partyScene.events.once('shutdown', () => {
          this.scene.wake();
          if (switched) {
            // Enemy gets a free attack after switch (BUG-063)
            this.executeEnemyOnlyTurn();
          }
        });
        break;
      }
      case 'RUN': {
        const b = this.battle();
        if (b.battleManager.getBattleType() === 'trainer') {
          this.msg('Can\'t escape from a trainer battle!');
          return;
        }
        // Speed-based flee formula: fleeChance = (playerSpeed * 128 / enemySpeed + 30 * fleeAttempts) / 256
        if (!this.fleeAttempts) this.fleeAttempts = 0;
        this.fleeAttempts++;
        const playerSpeed = this.statusHandler.getEffectiveStat(b.playerPokemon, 'speed');
        const enemySpeed = this.statusHandler.getEffectiveStat(b.enemyPokemon, 'speed');
        const fleeChance = Math.floor((playerSpeed * 128 / Math.max(1, enemySpeed) + 30 * this.fleeAttempts) % 256);
        if (playerSpeed >= enemySpeed || Math.random() * 256 < fleeChance) {
          AudioManager.getInstance().playSFX(SFX.RUN_SUCCESS);
          this.msg('Got away safely!');
          this.time.delayedCall(800, () => this.endBattle());
        } else {
          this.msg('Can\'t escape!');
          this.state = 'animating';
          this.time.delayedCall(800, () => {
            // Enemy gets a free attack on failed flee (BUG-065)
            this.executeEnemyOnlyTurn();
          });
        }
        break;
      }
    }
  }

  // ─── Synthesis ───
  private updateSynthButton(): void {
    if (!this.synthText) return;
    const gm = GameManager.getInstance();
    const hasItem = gm.getItemCount(SYNTHESIS_ITEM) > 0;
    const canSynth = this.synthesisHandler.canSynthesize(this.battle().playerPokemon, hasItem);
    this.synthText.setVisible(canSynth);
  }

  private activateSynthesis(): void {
    const b = this.battle();
    const player = b.playerPokemon;
    const gm = GameManager.getInstance();
    const hasItem = gm.getItemCount(SYNTHESIS_ITEM) > 0;

    if (!this.synthesisHandler.canSynthesize(player, hasItem)) return;

    this.state = 'animating';
    this.hideActions();

    // Camera flash for synthesis activation
    this.cameras.main.flash(200, 255, 255, 255);
    AudioManager.getInstance().playSFX(SFX.STAT_UP);

    const { messages } = this.synthesisHandler.activate(player);

    // Tell BattleScene to show the aura
    b.showSynthesisAura();

    this.time.delayedCall(300, () => {
      this.showMessageQueue(messages, 0, () => {
        // After synthesis messages, auto-open FIGHT menu
        this.time.delayedCall(400, () => {
          this.state = 'actions';
          this.showActions();
          this.openMoveMenu();
        });
      });
    });
  }

  // ─── Double battle target selection ───
  private pendingMoveId?: string;

  private showTargetSelection(moveId: string): void {
    const b = this.battle();
    if (!b.isDouble || b.enemySprites.length < 2) {
      // Single target or only one enemy remains — no selection needed
      this.executeTurn(moveId);
      return;
    }

    const targeting = getMoveTarget(moveId);

    if (targeting === 'self' || targeting === 'all-adjacent' || targeting === 'both-enemies' || targeting === 'all') {
      // Auto-target, no selection needed
      this.executeTurn(moveId);
      return;
    }

    // Single enemy target — show selection arrows
    this.pendingMoveId = moveId;
    this.state = 'target-select';
    this.targetCursor = 0;
    this.msg('Choose a target!');

    // Create arrows above enemy sprites
    this.clearTargetArrows();
    b.enemySprites.forEach((spr, i) => {
      const arrow = this.add.text(spr.x, spr.y - 40, '▼', {
        fontSize: mobileFontSize(24), color: i === 0 ? COLORS.textHighlight : COLORS.textWhite,
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(100);
      this.targetArrows.push(arrow);
    });
  }

  private updateTargetCursor(): void {
    this.targetArrows.forEach((a, i) => {
      a.setColor(i === this.targetCursor ? COLORS.textHighlight : COLORS.textWhite);
    });
  }

  private confirmTarget(): void {
    const moveId = this.pendingMoveId;
    this.pendingMoveId = undefined;
    this.clearTargetArrows();
    if (moveId) this.executeTurn(moveId);
  }

  private clearTargetArrows(): void {
    this.targetArrows.forEach(a => a.destroy());
    this.targetArrows = [];
  }

  // ─── Move menu ───
  private openMoveMenu(): void {
    this.state = 'moves';
    this.moveCursor = 0;
    this.hideActions();
    const moves = this.battle().playerPokemon.moves;
    const moveFontSize = mobileFontSize(15);
    const moveRowH = Math.round(35 * MOBILE_SCALE);

    const { w: mw, h: mh, cx: mcx } = ui(this);
    const compactMoves = isMobile() && (window.innerHeight < 400 || mh < 400);
    const moveMenuH = compactMoves ? 50 : 100;
    this.moveMenuBg = this.add.rectangle(mcx, mh - moveMenuH / 2 - 10, mw - 20, moveMenuH, 0x1a1a2e, 0.95).setStrokeStyle(2, COLORS.borderLight);
    this.moveTexts = moves.map((m, i) => {
      const md = moveData[m.moveId];
      let x: number, y: number;
      if (compactMoves) {
        // Single row evenly spaced
        const spacing = mw / (moves.length + 1);
        x = spacing * (i + 1);
        y = mh - moveMenuH / 2 - 10;
      } else {
        const col = i % 2; const row = Math.floor(i / 2);
        x = mcx - 120 + col * 240;
        y = mh - 85 + row * moveRowH;
      }

      // Type-colored button background
      const typeCol = md ? (TYPE_COLORS[md.type] ?? 0x888888) : 0x888888;
      const btnW = compactMoves ? 120 : 180;
      const btnH = compactMoves ? 30 : 40;
      const bg = this.add.graphics();
      bg.fillStyle(typeCol, 0.25);
      bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 4);
      bg.lineStyle(1, typeCol, 0.6);
      bg.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 4);
      bg.setDepth(9);
      this.moveDecorations.push(bg);

      // Category indicator (P/S/St)
      if (md) {
        const catAbbr = md.category === 'physical' ? 'P' : md.category === 'special' ? 'S' : 'St';
        const catColor = CATEGORY_COLORS[md.category] ?? 0x888899;
        const catText = this.add.text(x - btnW / 2 + 6, y + 4, catAbbr, { fontSize: mobileFontSize(10), color: `#${catColor.toString(16).padStart(6, '0')}`, fontFamily: 'monospace', fontStyle: 'bold' }).setDepth(10);
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
        const ppText = this.add.text(x + btnW / 2 - 8, y + 4, `${m.currentPp}/${md.pp}`, { fontSize: mobileFontSize(10), color: ppColor }).setOrigin(1, 0).setDepth(10);
        this.moveDecorations.push(ppText);
      }

      // Move name text (bold, white, left-aligned inside button)
      const t = this.add.text(x - btnW / 2 + 8, y - 8,
        md ? md.name : m.moveId,
        { ...FONTS.body, fontSize: mobileFontSize(13), color: '#ffffff', fontStyle: 'bold' }
      ).setDepth(10).setInteractive({ useHandCursor: true });
      t.setPadding(2, 2, 2, 2);

      // Expand the hit area to cover the full button
      t.setInteractive(new Phaser.Geom.Rectangle(-2, -6, btnW, btnH), Phaser.Geom.Rectangle.Contains);

      t.on('pointerover', () => { if (this.state === 'moves') { this.moveCursor = i; this.updateMoveCursor(); } });
      t.on('pointerdown', () => { if (this.state === 'moves') { this.moveCursor = i; this.selectMove(); } });
      return t;
    });
    // Back button
    const back = this.add.text(mw - 60, mh - 115, '← Back', { ...FONTS.bodySmall, fontSize: mobileFontSize(14) })
      .setInteractive({ useHandCursor: true });
    back.setPadding(8, 6, 8, 6);
    back.on('pointerdown', () => this.closeMoveMenu());
    this.moveTexts.push(back);
    this.updateMoveCursor();
    this.msg('Choose a move!');
  }

  private updateMoveCursor(): void {
    const moveCount = this.battle().playerPokemon.moves.length;
    this.moveTexts.forEach((t, i) => { if (i < moveCount) t.setColor(i === this.moveCursor ? COLORS.textHighlight : COLORS.textWhite); });
  }

  private selectMove(): void {
    const b = this.battle();
    const mi = b.playerPokemon.moves[this.moveCursor];
    if (!mi || mi.currentPp <= 0) return;
    const md = moveData[mi.moveId];
    if (!md) return;

    this.closeMoveMenu();
    this.state = 'animating';
    this.hideActions();

    if (b.isDouble) {
      this.showTargetSelection(mi.moveId);
    } else {
      this.executeTurn(mi.moveId);
    }
  }

  // ─── Turn execution ───
  private executeTurn(playerMoveId: string): void {
    const b = this.battle();
    const player = b.playerPokemon;
    const enemy = b.enemyPokemon;

    // Boss Synthesis: trigger on first turn if trainer data says so
    if (!this.bossSynthesisTriggered && b.isTrainerBattle) {
      const tData = b.trainerId ? trainerData[b.trainerId] : null;
      if (tData && tData.useSynthesis && enemy.dataId in SYNTHESIS_ELIGIBLE) {
        this.bossSynthesisTriggered = true;
        this.state = 'animating';
        this.hideActions();
        this.cameras.main.flash(200, 200, 50, 200);
        AudioManager.getInstance().playSFX(SFX.STAT_UP);
        const { messages } = this.synthesisHandler.activate(enemy);
        b.showEnemySynthesisAura?.();
        this.time.delayedCall(300, () => {
          this.showMessageQueue(messages, 0, () => {
            this.time.delayedCall(400, () => this.doExecuteTurn(playerMoveId));
          });
        });
        return;
      }
    }

    this.doExecuteTurn(playerMoveId);
  }

  private doExecuteTurn(playerMoveId: string): void {
    const b = this.battle();
    const player = b.playerPokemon;
    const enemy = b.enemyPokemon;

    // BUG-033: Clear stale flinch volatiles at turn start
    this.statusHandler.clearFlinchAll();

    // Check if player is charging a two-turn move — auto-execute it
    const playerCharging = this.statusHandler.getChargingMove(player);
    const actualPlayerMoveId = playerCharging ?? playerMoveId;

    const enemyMoveId = this.pickEnemyMove(enemy);
    const order = calculateTurnOrder(player, enemy, actualPlayerMoveId, enemyMoveId, this.statusHandler);

    this.runTurnStep(order, 0);
  }

  private runTurnStep(order: { attacker: PokemonInstance; defender: PokemonInstance; moveId: string; isPlayer: boolean }[], idx: number): void {
    if (idx >= order.length) {
      // ── End-of-turn residual damage ──
      this.runEndOfTurn(order);
      return;
    }

    const { attacker, defender, moveId, isPlayer } = order[idx];
    if (attacker.currentHp <= 0) {
      // Already fainted from previous step
      this.runTurnStep(order, idx + 1);
      return;
    }

    const b = this.battle();
    const name = pokemonData[attacker.dataId]?.name ?? '???';
    const moveName = moveData[moveId]?.name ?? moveId;

    // ── Flinch check (only the slower pokemon can flinch) ──
    const flinchMsg = idx > 0 ? this.statusHandler.checkFlinch(attacker) : null;
    if (flinchMsg) {
      this.msg(flinchMsg);
      b.updateHpBars();
      this.time.delayedCall(900, () => this.runTurnStep(order, idx + 1));
      return;
    }

    // ── Status turn-start check (sleep, freeze, paralysis, confusion) ──
    const turnStart = this.statusHandler.checkTurnStart(attacker);
    if (turnStart.messages.length > 0) {
      this.showMessageQueue(turnStart.messages, 0, () => {
        b.updateHpBars();
        if (!turnStart.canAct) {
          // Check if confusion self-damage fainted the attacker
          if (attacker.currentHp <= 0) {
            const atkName = pokemonData[attacker.dataId]?.name ?? '???';
            this.time.delayedCall(600, () => {
              b.faintSprite(isPlayer ? b.playerSprite : b.enemySprite);
              this.msg(`${atkName} fainted!`);
              this.time.delayedCall(1500, () => {
                if (isPlayer) {
                  // BUG-062: Check for alive party members before blacking out
                  if (this.hasAlivePartyMember()) {
                    this.promptPartySwitch();
                  } else {
                    this.msg('You blacked out...');
                    this.state = 'message';
                    this.time.delayedCall(2000, () => this.endBattle());
                  }
                } else {
                  this.runVictorySequence();
                }
              });
            });
            return;
          }
          this.time.delayedCall(600, () => this.runTurnStep(order, idx + 1));
          return;
        }
        // Can act — proceed with the move
        this.executeMove(order, idx, name, moveName);
      });
      return;
    }

    // No status messages — execute the move directly
    this.executeMove(order, idx, name, moveName);
  }

  /** Execute a single move with animations and effect messages. */
  private executeMove(
    order: { attacker: PokemonInstance; defender: PokemonInstance; moveId: string; isPlayer: boolean }[],
    idx: number,
    name: string,
    moveName: string,
  ): void {
    const { attacker, defender, moveId, isPlayer } = order[idx];
    const b = this.battle();

    this.msg(`${name} used ${moveName}!`);

    this.time.delayedCall(700, () => {
      // Play move animation before applying damage
      const attackerSprite = isPlayer ? b.playerSprite : b.enemySprite;
      const defenderSprite = isPlayer ? b.enemySprite : b.playerSprite;
      playMoveAnimation(this, moveId, attackerSprite, defenderSprite, isPlayer).then(() => {
        this.applyMoveResult(order, idx, name, moveName);
      });
    });
  }

  /** Apply move result after animation completes. */
  private applyMoveResult(
    order: { attacker: PokemonInstance; defender: PokemonInstance; moveId: string; isPlayer: boolean }[],
    idx: number,
    name: string,
    moveName: string,
  ): void {
    const { attacker, defender, moveId, isPlayer } = order[idx];
    const b = this.battle();
    {
      const result = MoveExecutor.execute(attacker, defender, moveId, this.statusHandler, this.weatherManager);
      b.updateHpBars();
      this.checkLowHpWarning();

      // Weather move: update display
      if (result.weatherSet) {
        this.updateWeatherDisplay();
      }

      // Two-turn charge: skip damage display, just show charging message
      if (result.isCharging) {
        this.showMessageQueue(result.effectMessages, 0, () => {
          this.time.delayedCall(400, () => this.runTurnStep(order, idx + 1));
        });
        return;
      }

      if (result.moveHit && result.damage.damage > 0) {
        b.flashSprite(isPlayer ? b.enemySprite : b.playerSprite);
        // Show floating damage number
        this.showDamagePopup(result.damage.damage, !isPlayer, result.damage.effectiveness);
        // Play appropriate hit SFX
        const audio = AudioManager.getInstance();
        if (result.damage.isCritical) audio.playSFX(SFX.HIT_CRIT);
        else if (result.damage.effectiveness > 1) audio.playSFX(SFX.HIT_SUPER);
        else if (result.damage.effectiveness < 1 && result.damage.effectiveness > 0) audio.playSFX(SFX.HIT_WEAK);
        else audio.playSFX(SFX.HIT_NORMAL);
        if (result.damage.isCritical) b.critShake();
        if (result.damage.effectiveness > 1) b.superEffectiveFlash();
        let extra = '';
        if (result.damage.effectiveness > 1) extra = " It's super effective!";
        else if (result.damage.effectiveness < 1 && result.damage.effectiveness > 0) extra = " Not very effective...";
        else if (result.damage.effectiveness === 0) extra = " No effect!";
        if (result.damage.isCritical) extra += ' Critical hit!';
        this.msg(`${name} used ${moveName}! ${result.damage.damage} dmg.${extra}`);
      } else if (!result.moveHit) {
        this.msg(`${name}'s attack missed!`);
      } else {
        this.msg(`${name} used ${moveName}!`);
      }

      // Show effect messages (status applied, stat changes, drain, recoil, etc.)
      const allEffectMsgs = [...result.effectMessages];

      // ── Ability: onAfterDamage (contact effects like Static, Flame Body) ──
      if (result.moveHit && result.damage.damage > 0) {
        const md = moveData[moveId];
        if (md) {
          const abilityResult = AbilityHandler.onAfterDamage(attacker, defender, md, result.damage.damage);
          allEffectMsgs.push(...abilityResult.messages);
        }
        // ── Held item: Life Orb recoil on attacker ──
        const lifeOrbResult = HeldItemHandler.onAttackLanded(attacker, result.damage.damage);
        allEffectMsgs.push(...lifeOrbResult.messages);
        // ── Held item: Focus Sash on defender ──
        const hpBeforeHit = defender.currentHp + result.damage.damage;
        const focusResult = HeldItemHandler.onAfterDamage(defender, attacker, result.damage.damage, hpBeforeHit);
        allEffectMsgs.push(...focusResult.messages);
        // ── Held item: HP threshold check (Sitrus Berry, etc.) ──
        const threshResult = HeldItemHandler.checkHPThreshold(defender);
        allEffectMsgs.push(...threshResult.messages);
      }

      // ── Held item: status berry check after StatusEffectHandler effects ──
      if (defender.status) {
        const statusBerryResult = HeldItemHandler.onStatusApplied(defender);
        allEffectMsgs.push(...statusBerryResult.messages);
      }
      if (attacker.status) {
        const atkStatusBerry = HeldItemHandler.onStatusApplied(attacker);
        allEffectMsgs.push(...atkStatusBerry.messages);
      }

      // Play stat change SFX based on effect messages
      for (const msg of allEffectMsgs) {
        if (msg.includes('rose') || msg.includes('raised')) {
          AudioManager.getInstance().playSFX(SFX.STAT_UP);
          break;
        }
        if (msg.includes('fell') || msg.includes('lowered')) {
          AudioManager.getInstance().playSFX(SFX.STAT_DOWN);
          break;
        }
      }

      // Handle recoil updating attacker HP bar
      if (result.recoilDamage && result.recoilDamage > 0) {
        b.updateHpBars();
      }
      // Handle drain healing attacker HP bar
      if (result.healedHp && result.healedHp > 0) {
        b.updateHpBars();
      }

      // Show effect messages sequentially then check faint
      this.time.delayedCall(700, () => {
        this.showMessageQueue(allEffectMsgs, 0, () => {
          // Check for self-destruct (attacker faints)
          if (result.selfDestruct && attacker.currentHp <= 0) {
            b.updateHpBars();
            this.time.delayedCall(400, () => {
              b.faintSprite(isPlayer ? b.playerSprite : b.enemySprite);
            });
          }

          // Check defender faint
          if (defender.currentHp <= 0) {
            // Friendship survival: 10% chance to hold on at 1 HP (player's pokemon only, friendship >= 220)
            if (!isPlayer && defender.friendship >= 220 && Math.random() < 0.1) {
              defender.currentHp = 1;
              b.updateHpBars();
              const survName = defender.nickname ?? pokemonData[defender.dataId]?.name ?? '???';
              this.msg(`${survName} held on so you wouldn't feel sad!`);
              this.time.delayedCall(1200, () => this.runTurnStep(order, idx + 1));
              return;
            }
            const defName = pokemonData[defender.dataId]?.name ?? '???';
            // Apply friendship loss if player's pokemon fainted
            if (!isPlayer) this.applyFaintFriendshipLoss(defender);
            this.time.delayedCall(800, () => {
              AudioManager.getInstance().playSFX(SFX.FAINT);
              AudioManager.getInstance().playCry(defender.dataId);
              b.faintSprite(isPlayer ? b.enemySprite : b.playerSprite);
              this.msg(`${defName} fainted!`);
              this.time.delayedCall(1500, () => {
                if (defender === b.enemyPokemon) {
                  this.runVictorySequence();
                } else {
                  // Player's Pokemon fainted — check for remaining alive party members
                  const gm = GameManager.getInstance();
                  const aliveParty = gm.getParty().filter(p => p.currentHp > 0);
                  if (aliveParty.length === 0) {
                    this.msg('You blacked out...');
                    this.state = 'message';
                    this.time.delayedCall(2000, () => this.endBattle());
                  } else {
                    // Prompt player to switch
                    this.msg('Choose your next Pokémon!');
                    this.time.delayedCall(800, () => {
                      this.scene.sleep();
                      this.scene.launch('PartyScene', { forcedSwitch: true });
                      this.scene.get('PartyScene').events.once('shutdown', () => {
                        this.scene.wake();
                        // Update battle references to the new active Pokemon
                        const newActive = gm.getParty().find(p => p.currentHp > 0);
                        if (newActive) {
                          b.playerPokemon = newActive;
                          // Update the player sprite texture
                          const newData = pokemonData[newActive.dataId];
                          if (newData?.spriteKeys?.back) {
                            b.playerSprite.setTexture(newData.spriteKeys.back);
                          }
                          b.updateHpBars();
                          this.statusHandler.initPokemon(newActive);
                          // Trigger switch-in abilities
                          const switchResult = AbilityHandler.onSwitchIn(newActive, b.enemyPokemon, this.statusHandler);
                          if (switchResult.messages.length > 0) {
                            this.showMessageQueue(switchResult.messages, 0, () => {
                              this.state = 'actions';
                              this.showActions();
                              this.msg('What will you do?');
                            });
                          } else {
                            this.state = 'actions';
                            this.showActions();
                            this.msg('What will you do?');
                          }
                        }
                      });
                    });
                  }
                }
              });
            });
            return;
          }

          // Check attacker faint from recoil / self-destruct
          if (attacker.currentHp <= 0) {
            const atkName = pokemonData[attacker.dataId]?.name ?? '???';
            // Apply friendship loss if player's pokemon fainted
            if (isPlayer) this.applyFaintFriendshipLoss(attacker);
            this.time.delayedCall(800, () => {
              AudioManager.getInstance().playSFX(SFX.FAINT);
              AudioManager.getInstance().playCry(attacker.dataId);
              b.faintSprite(isPlayer ? b.playerSprite : b.enemySprite);
              this.msg(`${atkName} fainted!`);
              this.time.delayedCall(1500, () => {
                if (isPlayer) {
                  // BUG-062: Check for alive party members before blacking out
                  if (this.hasAlivePartyMember()) {
                    this.promptPartySwitch();
                  } else {
                    this.msg('You blacked out...');
                    this.state = 'message';
                    this.time.delayedCall(2000, () => this.endBattle());
                  }
                } else {
                  this.runVictorySequence();
                }
              });
            });
            return;
          }

          // Next step in the turn
          this.time.delayedCall(400, () => this.runTurnStep(order, idx + 1));
        });
      });
    }
  }

  /** Run end-of-turn residual damage (burn, poison, leech seed, trapping) for both Pokemon. */
  private runEndOfTurn(order: { attacker: PokemonInstance; defender: PokemonInstance; moveId: string; isPlayer: boolean }[]): void {
    const b = this.battle();
    const player = b.playerPokemon;
    const enemy = b.enemyPokemon;

    // Collect end-of-turn effects for both sides, with opponent reference for leech seed
    const pokemonToCheck: { pokemon: PokemonInstance; opponent: PokemonInstance; isPlayer: boolean }[] = [];
    if (player.currentHp > 0) pokemonToCheck.push({ pokemon: player, opponent: enemy, isPlayer: true });
    if (enemy.currentHp > 0) pokemonToCheck.push({ pokemon: enemy, opponent: player, isPlayer: false });

    this.runEndOfTurnStep(pokemonToCheck, 0);
  }

  private runEndOfTurnStep(
    pokemonToCheck: { pokemon: PokemonInstance; opponent: PokemonInstance; isPlayer: boolean }[],
    idx: number,
  ): void {
    const b = this.battle();

    if (idx >= pokemonToCheck.length) {
      // Weather turn tick
      const weatherTick = this.weatherManager.tickTurn();
      if (weatherTick.length > 0) {
        this.showMessageQueue(weatherTick, 0, () => {
          this.updateWeatherDisplay();
          this.checkEndOfTurnFaints();
        });
        return;
      }
      this.updateWeatherDisplay();
      this.checkEndOfTurnFaints();
      return;
    }

    const { pokemon, opponent, isPlayer } = pokemonToCheck[idx];
    const { messages: allMessages } = collectEndOfTurnEffects(
      pokemon, opponent, isPlayer, this.statusHandler, this.weatherManager,
    );

    if (allMessages.length > 0) {
      b.updateHpBars();
      this.showMessageQueue(allMessages, 0, () => {
        this.time.delayedCall(400, () => this.runEndOfTurnStep(pokemonToCheck, idx + 1));
      });
    } else {
      this.runEndOfTurnStep(pokemonToCheck, idx + 1);
    }
  }

  /** Show a queue of messages sequentially with a delay, then run callback. */
  private showMessageQueue(messages: string[], idx: number, callback: () => void): void {
    showMsgQueue(this, messages, idx, (text) => this.msg(text), callback);
  }

  /** Update the weather indicator text. */
  private updateWeatherDisplay(): void {
    const w = this.weatherManager.getWeather();
    if (!w || !this.weatherText) {
      this.weatherText?.setText('');
      return;
    }
    const icons: Record<string, string> = { sun: '☀ Sun', rain: '🌧 Rain', sandstorm: '🌪 Sandstorm', hail: '❄ Hail' };
    this.weatherText?.setText(`${icons[w] ?? w} (${this.weatherManager.getTurnsRemaining()})`);
  }

  /** Check if anyone fainted from end-of-turn effects, then advance to next turn. */
  private checkEndOfTurnFaints(): void {
    const b = this.battle();
    if (b.enemyPokemon.currentHp <= 0) {
      const defName = pokemonData[b.enemyPokemon.dataId]?.name ?? '???';
      b.faintSprite(b.enemySprite);
      this.msg(`${defName} fainted!`);
      this.time.delayedCall(1500, () => this.runVictorySequence());
      return;
    }
    if (b.playerPokemon.currentHp <= 0) {
      const defName = pokemonData[b.playerPokemon.dataId]?.name ?? '???';
      this.applyFaintFriendshipLoss(b.playerPokemon);
      b.faintSprite(b.playerSprite);
      this.msg(`${defName} fainted!`);
      this.time.delayedCall(1500, () => {
        // BUG-062: Check for alive party members before blacking out
        if (this.hasAlivePartyMember()) {
          this.promptPartySwitch();
        } else {
          this.msg('You blacked out...');
          this.state = 'message';
          this.time.delayedCall(2000, () => this.endBattle());
        }
      });
      return;
    }
    // Next turn
    this.time.delayedCall(600, () => {
      // If player is charging a two-turn move, auto-execute it
      const charging = this.statusHandler.getChargingMove(b.playerPokemon);
      if (charging) {
        this.state = 'animating';
        this.hideActions();
        this.executeTurn(charging);
        return;
      }
      this.state = 'actions'; this.showActions(); this.msg('What will you do?');
    });
  }

  private pickEnemyMove(enemy: PokemonInstance): string {
    return pickEnemyMove(enemy);
  }

  /** Execute an enemy-only turn (after player uses item, switches, or fails to flee). */
  private executeEnemyOnlyTurn(): void {
    const b = this.battle();
    const enemy = b.enemyPokemon;
    const player = b.playerPokemon;
    const enemyMoveId = this.pickEnemyMove(enemy);

    this.state = 'animating';
    this.hideActions();

    // Create a single-entry turn order with only the enemy attacking
    const order = [{ attacker: enemy, defender: player, moveId: enemyMoveId, isPlayer: false }];
    this.runTurnStep(order, 0);
  }

  /** Check if the player has alive party members (for BUG-062). */
  private hasAlivePartyMember(): boolean {
    const party = GameManager.getInstance().getParty();
    return party.some(p => p.currentHp > 0);
  }

  /** Prompt the player to choose a replacement Pokemon after a faint. */
  private promptPartySwitch(): void {
    this.msg('Choose a Pokémon!');
    this.scene.sleep();
    this.scene.launch('PartyScene', { selectMode: true });
    const partyScene = this.scene.get('PartyScene');
    partyScene.events.once('pokemon-selected', (index: number) => {
      const gm = GameManager.getInstance();
      const party = gm.getParty();
      if (index > 0 && party[index] && party[index].currentHp > 0) {
        const temp = party[0];
        party[0] = party[index];
        party[index] = temp;
        const b = this.battle();
        b.playerPokemon = party[0];
        const pData = pokemonData[party[0].dataId];
        if (pData) b.playerSprite.setTexture(pData.spriteKeys.back);
        b.updateHpBars();
        const name = pData?.name ?? '???';
        this.msg(`Go! ${name}!`);
        this.statusHandler.clearPokemon(party[index]);
      }
    });
    partyScene.events.once('shutdown', () => {
      this.scene.wake();
      this.time.delayedCall(600, () => {
        this.state = 'actions';
        this.showActions();
        this.msg('What will you do?');
      });
    });
  }

  private msg(text: string): void { this.messageText.setText(text); }

  /** Show a floating damage number that rises and fades. */
  private showDamagePopup(damage: number, isPlayer: boolean, effectiveness: number): void {
    const b = this.battle();
    const sprite = isPlayer ? b.playerSprite : b.enemySprite;
    showDmgPopup(this, sprite, damage, effectiveness);
  }

  // ─── Poké Ball catch sequence (delegated to BattleCatchHandler) ───

  private handlePokeBallUse(ballItemId: string): void {
    doCatch(this.catchContext(), ballItemId);
  }

  private catchContext(): CatchContext {
    return {
      scene: this,
      battle: () => this.battle(),
      msg: (t: string) => this.msg(t),
      setState: (s: string) => { this.state = s as UIState; },
      hideActions: () => this.hideActions(),
      pickEnemyMove: (e: PokemonInstance) => this.pickEnemyMove(e),
      executeMove: (order, idx, name, moveName) => this.executeMove(order, idx, name, moveName),
      waitForConfirmThen: (cb: () => void) => this.waitForConfirmThen(cb),
      endBattle: () => this.endBattle(),
    };
  }

  private closeMoveMenu(): void {
    this.state = 'actions';
    this.moveMenuBg?.destroy();
    this.moveTexts.forEach(t => t.destroy());
    this.moveTexts = [];
    this.moveDecorations.forEach(d => d.destroy());
    this.moveDecorations = [];
    this.showActions();
    this.msg('What will you do?');
  }

  // ─── Victory & EXP sequence (delegated to BattleVictorySequence) ───
  private runVictorySequence(): void {
    doVictory(this.victoryContext());
  }

  private victoryContext(): VictoryContext {
    return {
      scene: this,
      battle: () => this.battle(),
      msg: (t: string) => this.msg(t),
      setState: (s: string) => { this.state = s as UIState; },
      hideActions: () => this.hideActions(),
      showMessageQueue: (msgs, idx, cb) => this.showMessageQueue(msgs, idx, cb),
      waitForConfirmThen: (cb: () => void) => this.waitForConfirmThen(cb),
      endBattle: () => this.endBattle(),
      moveCursor: this.moveCursor,
      moveMenuBg: this.moveMenuBg,
      moveTexts: this.moveTexts,
    };
  }

  /** Wait for a single Enter/Space press or tap then run callback. */
  private waitForConfirmThen(callback: () => void): void {
    let fired = false;
    const handler = () => {
      if (fired) return;
      fired = true;
      this.pendingWaitConfirm = undefined;
      this.input.keyboard!.off('keydown-ENTER', handler);
      this.input.keyboard!.off('keydown-SPACE', handler);
      this.input.off('pointerdown', handler);
      callback();
    };
    this.pendingWaitConfirm = handler;
    this.input.keyboard!.on('keydown-ENTER', handler);
    this.input.keyboard!.on('keydown-SPACE', handler);
    this.input.on('pointerdown', handler);
  }

  /** Check if player's Pokémon HP is critically low and toggle the warning beep. */
  private checkLowHpWarning(): void {
    const b = this.battle();
    const pct = b.playerPokemon.currentHp / b.playerPokemon.stats.hp;
    const audio = AudioManager.getInstance();
    if (pct > 0 && pct <= 0.2) {
      audio.startLowHpWarning();
    } else {
      audio.stopLowHpWarning();
    }
  }

  /** Apply friendship loss when a player's Pokémon faints (-1). */
  private applyFaintFriendshipLoss(pokemon: PokemonInstance): void {
    const gm = GameManager.getInstance();
    const idx = gm.getParty().indexOf(pokemon);
    if (idx >= 0) {
      gm.adjustFriendship(idx, -1);
    }
  }

  private endBattle(): void {
    AudioManager.getInstance().stopLowHpWarning();
    this.synthesisHandler.cleanup();
    this.battle().battleManager.cleanup();
    const b = this.battle();
    const returnScene = b.returnScene;
    const returnData = b.returnData;
    this.scene.stop();
    this.scene.stop('BattleScene');
    this.scene.start(returnScene, returnData);
  }

  shutdown(): void {
    this.input.keyboard?.removeAllListeners();
  }
}
