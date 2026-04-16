import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';
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
import { SYNTHESIS_ITEM } from '@data/synthesis-data';
import { getMoveTarget } from '@battle/core/DoubleBattleManager';
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

  constructor() {
    super({ key: 'BattleUIScene' });
  }

  create(): void {
    this.state = 'actions';

    // Use the StatusEffectHandler from BattleManager (single source of truth)
    this.statusHandler = this.battle().battleManager.getStatusHandler();
    this.weatherManager = this.battle().battleManager.getWeatherManager();
    this.synthesisHandler = new SynthesisHandler();

    // Weather indicator (top-center, hidden initially)
    this.weatherText = this.add.text(GAME_WIDTH / 2, 12, '', {
      ...FONTS.caption, fontSize: '12px', color: COLORS.textHighlight,
    }).setOrigin(0.5).setDepth(50);

    // Nine-patch message bar
    new NinePatchPanel(this, GAME_WIDTH / 2, GAME_HEIGHT - 120, GAME_WIDTH - 20, 30, {
      fillColor: 0x0a0a18, fillAlpha: 0.92, borderColor: COLORS.border, borderWidth: 1, cornerRadius: 4,
    });
    this.messageText = this.add.text(30, GAME_HEIGHT - 132, 'What will you do?', { ...FONTS.body, fontSize: '16px' });

    // Nine-patch action menu
    this.actionMenuBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 60, GAME_WIDTH - 20, 100, 0x1a1a2e, 0.95);
    this.actionMenuBg.setStrokeStyle(2, COLORS.borderLight);
    new NinePatchPanel(this, GAME_WIDTH / 2, GAME_HEIGHT - 60, GAME_WIDTH - 20, 100, {
      fillColor: COLORS.bgPanel, fillAlpha: 0.95, borderColor: COLORS.borderLight, borderWidth: 2, cornerRadius: 6,
    });

    const actions = ['FIGHT', 'BAG', 'POKEMON', 'RUN'];
    const actionFontSize = mobileFontSize(18);
    const actionRowH = Math.round(35 * MOBILE_SCALE);
    this.actionTexts = actions.map((action, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const t = this.add.text(
        GAME_WIDTH / 2 - 80 + col * 160, GAME_HEIGHT - 85 + row * actionRowH,
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
      GAME_WIDTH / 2, GAME_HEIGHT - 15,
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
    if (dir === 'left'  && this[cur] % 2 === 1) this[cur]--;
    if (dir === 'right' && this[cur] % 2 === 0 && this[cur] + 1 < len) this[cur]++;
    if (dir === 'up'    && this[cur] >= 2) this[cur] -= 2;
    if (dir === 'down'  && this[cur] + 2 < len) this[cur] += 2;
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
        // Listen for pokeball use
        invScene.events.once('use-pokeball', (ballItemId: string) => {
          this.scene.wake();
          this.handlePokeBallUse(ballItemId);
        });
        invScene.events.once('shutdown', () => {
          // If shutdown without using a ball, just wake back up
          this.scene.wake();
        });
        break;
      }
      case 'POKEMON':
        this.scene.sleep();
        this.scene.launch('PartyScene');
        this.scene.get('PartyScene').events.once('shutdown', () => {
          this.scene.wake();
        });
        break;
      case 'RUN':
        AudioManager.getInstance().playSFX(SFX.RUN_SUCCESS);
        this.time.delayedCall(300, () => this.endBattle());
        break;
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
        fontSize: '24px', color: i === 0 ? COLORS.textHighlight : COLORS.textWhite,
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

    this.moveMenuBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 60, GAME_WIDTH - 20, 100, 0x1a1a2e, 0.95).setStrokeStyle(2, COLORS.borderLight);
    this.moveTexts = moves.map((m, i) => {
      const md = moveData[m.moveId];
      const col = i % 2; const row = Math.floor(i / 2);
      const x = GAME_WIDTH / 2 - 120 + col * 240;
      const y = GAME_HEIGHT - 85 + row * moveRowH;

      // Move type color dot
      if (md) {
        const typeColor = TYPE_COLORS[md.type] ?? 0x888888;
        const dot = this.add.circle(x - 80, y, 5, typeColor).setDepth(10);
        this.moveDecorations.push(dot);
        // Category indicator (P/S/St)
        const catAbbr = md.category === 'physical' ? 'P' : md.category === 'special' ? 'S' : 'St';
        const catColor = CATEGORY_COLORS[md.category] ?? 0x888899;
        const catText = this.add.text(x - 68, y - 5, catAbbr, { fontSize: '10px', color: `#${catColor.toString(16).padStart(6, '0')}`, fontFamily: 'monospace', fontStyle: 'bold' }).setDepth(10);
        this.moveDecorations.push(catText);
      }

      // PP coloring: normal=white, low (<=25%)=yellow, empty=red
      let ppColor: string = COLORS.textWhite;
      if (md) {
        const ppPct = m.currentPp / md.pp;
        if (ppPct <= 0) ppColor = COLORS.textDanger;
        else if (ppPct <= 0.25) ppColor = COLORS.textHighlight;
      }

      const t = this.add.text(x, y,
        md ? `${md.name}  ${m.currentPp}/${md.pp}` : m.moveId,
        { ...FONTS.body, fontSize: moveFontSize }
      ).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.setPadding(10, 6, 10, 6);

      // Apply PP color to the PP portion by coloring the whole text based on PP status
      if (ppColor !== COLORS.textWhite) t.setColor(ppColor);

      t.on('pointerover', () => { if (this.state === 'moves') { this.moveCursor = i; this.updateMoveCursor(); } });
      t.on('pointerdown', () => { if (this.state === 'moves') { this.moveCursor = i; this.selectMove(); } });
      return t;
    });
    // Back button
    const back = this.add.text(GAME_WIDTH - 60, GAME_HEIGHT - 115, '← Back', { ...FONTS.bodySmall, fontSize: mobileFontSize(14) })
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
                  this.msg('You blacked out...');
                  this.state = 'message';
                  this.time.delayedCall(2000, () => this.endBattle());
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
        const focusResult = HeldItemHandler.onAfterDamage(defender, attacker, result.damage.damage, defender.currentHp + result.damage.damage);
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
                  this.msg('You blacked out...');
                  this.state = 'message';
                  this.time.delayedCall(2000, () => this.endBattle());
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
                  this.msg('You blacked out...');
                  this.state = 'message';
                  this.time.delayedCall(2000, () => this.endBattle());
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
        this.msg('You blacked out...');
        this.state = 'message';
        this.time.delayedCall(2000, () => this.endBattle());
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
}
