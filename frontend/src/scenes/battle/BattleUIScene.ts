import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { layoutOn } from '@utils/layout-on';
import { moveData } from '@data/moves';
import { pokemonData } from '@data/pokemon';
import { GameManager } from '@managers/GameManager';
import { MoveExecutor } from '@battle/execution/MoveExecutor';
import { playMoveAnimation } from '@battle/execution/MoveAnimationPlayer';
import type { StatusEffectHandler } from '@battle/effects/StatusEffectHandler';
import { AbilityHandler } from '@battle/effects/AbilityHandler';
import { HeldItemHandler } from '@battle/effects/HeldItemHandler';
import type { WeatherManager } from '@battle/effects/WeatherManager';
import type { BattleScene } from './BattleScene';
import type { PokemonInstance } from '@data/interfaces';
import { AudioManager } from '@managers/AudioManager';
import { AchievementManager } from '@managers/AchievementManager';
import { SFX } from '@utils/audio-keys';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';
import { COLORS, FONTS, mobileFontSize, MOBILE_SCALE, isMobile } from '@ui/theme';
import { TouchControls } from '@ui/controls/TouchControls';
import { SynthesisHandler } from '@battle/effects/SynthesisHandler';
import { SYNTHESIS_ELIGIBLE } from '@data/synthesis-data';
import { trainerData } from '@data/trainers';
import { pickEnemyMove as pickEnemy, calculateTurnOrder } from './BattleTurnRunner';
import { collectEndOfTurnEffects } from './BattleEndOfTurn';
import { resetBallThrowCount } from './BattleCatchHandler';
import { runVictorySequence as doVictory, type VictoryContext } from './BattleVictorySequence';
import { BattleMessageHandler } from './BattleMessageHandler';
import { BattleActionMenu } from './BattleActionMenu';
import { BattleMoveMenu } from './BattleMoveMenu';
import { BattleBagHandler } from './BattleBagHandler';
import { BattleSwitchHandler } from './BattleSwitchHandler';

export type UIState = 'actions' | 'moves' | 'animating' | 'message' | 'target-select';

/**
 * Overlay scene that runs parallel to BattleScene.
 * Acts as an orchestrator — delegates UI concerns to focused sub-modules
 * while keeping the turn-execution pipeline and public API in one place.
 */
export class BattleUIScene extends Phaser.Scene {
  // ─── State accessible by sub-modules ───
  state: UIState = 'actions';
  statusHandler!: StatusEffectHandler;
  weatherManager!: WeatherManager;
  synthesisHandler!: SynthesisHandler;

  // ─── Sub-modules ───
  messageHandler!: BattleMessageHandler;
  actionMenu!: BattleActionMenu;
  moveMenu!: BattleMoveMenu;
  bagHandler!: BattleBagHandler;
  switchHandler!: BattleSwitchHandler;

  private bossSynthesisTriggered = false;

  /** Per-battle counter: damaging player moves used (used for status-master achievement). */
  playerDamagingMovesUsed = 0;
  /** Per-battle counter: status player moves used (used for status-master achievement). */
  playerStatusMovesUsed = 0;

  constructor() {
    super({ key: 'BattleUIScene' });
  }

  create(): void {
    this.state = 'actions';
    this.bossSynthesisTriggered = false;
    this.playerDamagingMovesUsed = 0;
    this.playerStatusMovesUsed = 0;
    resetBallThrowCount();

    // Use the StatusEffectHandler from BattleManager (single source of truth)
    this.statusHandler = this.battle().battleManager.getStatusHandler();
    this.weatherManager = this.battle().battleManager.getWeatherManager();
    this.synthesisHandler = new SynthesisHandler();

    // ── Instantiate sub-modules ──
    this.messageHandler = new BattleMessageHandler(this);
    this.actionMenu = new BattleActionMenu(this);
    this.moveMenu = new BattleMoveMenu(this);
    this.bagHandler = new BattleBagHandler(this);
    this.switchHandler = new BattleSwitchHandler(this);

    const { w, h, cx } = ui(this);

    // Compact mode for small mobile screens
    const compact = isMobile() && (window.innerHeight < 400 || h < 400);
    const menuH = compact ? 50 : 100;
    // Reserve room at the bottom of the canvas in mobile portrait so the
    // action menu doesn't sit underneath the DOM touch controls (joystick
    // + A/B buttons take ~140 px on phones). Landscape phones keep 0 since
    // controls sit on the sides, not below.
    const isPortrait = h > w;
    const bottomReserve = isMobile() && isPortrait ? 100 : 10;
    const menuY = h - menuH / 2 - bottomReserve;
    const messageY = menuY - menuH / 2 - 20;
    const messageTextY = messageY - 12;

    // Weather indicator (top-center, hidden initially)
    this.messageHandler.weatherText = this.add.text(cx, 12, '', {
      ...FONTS.caption, fontSize: mobileFontSize(12), color: COLORS.textHighlight,
    }).setOrigin(0.5).setDepth(50);

    // Nine-patch message bar
    new NinePatchPanel(this, cx, messageY, w - 20, 30, {
      fillColor: 0x0a0a18, fillAlpha: 0.92, borderColor: COLORS.border, borderWidth: 1, cornerRadius: 4,
    });
    this.messageHandler.messageText = this.add.text(30, messageTextY, 'What will you do?', { ...FONTS.body, fontSize: mobileFontSize(16) });

    // Nine-patch action menu
    this.actionMenu.actionMenuBg = this.add.rectangle(cx, menuY, w - 20, menuH, 0x1a1a2e, 0.95);
    this.actionMenu.actionMenuBg.setStrokeStyle(2, COLORS.borderLight);
    new NinePatchPanel(this, cx, menuY, w - 20, menuH, {
      fillColor: COLORS.bgPanel, fillAlpha: 0.95, borderColor: COLORS.borderLight, borderWidth: 2, cornerRadius: 6,
    });

    const actions = ['FIGHT', 'BAG', 'POKEMON', 'RUN'];
    const actionFontSize = mobileFontSize(compact ? 15 : 18);
    const actionRowH = Math.round(35 * MOBILE_SCALE);
    this.actionMenu.actionTexts = actions.map((action, i) => {
      let x: number, y: number;
      if (compact) {
        const spacing = w / 5;
        x = spacing * (i + 1);
        y = menuY;
      } else {
        const col = i % 2;
        const row = Math.floor(i / 2);
        // Center the 2x2 grid inside the menu panel — was hard-coded to
        // h-85/h-50, which clipped on tall portrait viewports because it
        // ignored the per-orientation menu Y.
        x = cx - 80 + col * 160;
        y = menuY - actionRowH / 2 + row * actionRowH;
      }
      const t = this.add.text(
        x, y,
        action, { ...FONTS.menuItem, fontSize: actionFontSize },
      ).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.setPadding(12, 8, 12, 8);
      t.on('pointerover', () => { if (this.state === 'actions') { this.actionMenu.cursor = i; this.actionMenu.updateCursor(); } });
      t.on('pointerdown', () => { if (this.state === 'actions') { this.actionMenu.cursor = i; this.actionMenu.selectAction(); } });
      return t;
    });
    this.actionMenu.cursor = 0;
    this.actionMenu.updateCursor();

    // ── SYNTH button (conditionally shown) ──
    this.actionMenu.synthText = this.add.text(
      cx, menuY + menuH / 2 + 8,
      'SYNTH', { ...FONTS.menuItem, fontSize: actionFontSize },
    ).setOrigin(0.5).setVisible(false).setInteractive({ useHandCursor: true });
    this.actionMenu.synthText.setPadding(12, 8, 12, 8);
    this.actionMenu.synthText.on('pointerdown', () => { if (this.state === 'actions') this.actionMenu.activateSynthesis(); });

    // ── Partner action indicator (double battles only) ──
    this.actionMenu.partnerActionText = this.add.text(
      30, messageY - 22, '',
      { ...FONTS.caption, fontSize: mobileFontSize(11), color: '#aaddff', fontStyle: 'italic' },
    ).setDepth(50).setVisible(false);

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
      const isP = h > w;
      const bReserve = isMobile() && isP ? 100 : 10;
      const mY = h - mH / 2 - bReserve;
      const msgY = mY - mH / 2 - 20;
      this.messageHandler.weatherText?.setPosition(cx, 12);
      this.messageHandler.messageText.setPosition(30, msgY - 12);
      this.actionMenu.actionMenuBg.setPosition(cx, mY).setSize(w - 20, mH);
      const rowH = Math.round(35 * MOBILE_SCALE);
      this.actionMenu.actionTexts.forEach((t, i) => {
        if (cpt) {
          const sp = w / 5;
          t.setPosition(sp * (i + 1), mY);
        } else {
          const col = i % 2;
          const row = Math.floor(i / 2);
          t.setPosition(cx - 80 + col * 160, mY - rowH / 2 + row * rowH);
        }
      });
      this.actionMenu.synthText?.setPosition(cx, mY + mH / 2 + 8);
      this.actionMenu.partnerActionText?.setPosition(30, msgY - 22);
    });
  }

  /** Poll touch A/B buttons each frame. */
  update(): void {
    const tc = TouchControls.getInstance();
    if (tc?.consumeConfirm()) {
      if (this.messageHandler.pendingWaitConfirm) {
        const cb = this.messageHandler.pendingWaitConfirm;
        this.messageHandler.pendingWaitConfirm = undefined;
        cb();
      } else {
        this.confirm();
      }
    }
    if (tc?.consumeCancel()) this.cancel();
  }

  // ─── Scene reference ───
  battle(): BattleScene { return this.scene.get('BattleScene') as BattleScene; }

  // ─── Delegate methods (public API for sub-modules and external callers) ───

  msg(text: string): void { this.messageHandler.msg(text); }
  showMessageQueue(messages: string[], idx: number, callback: () => void): void { this.messageHandler.showMessageQueue(messages, idx, callback); }
  showDamagePopup(damage: number, isPlayer: boolean, effectiveness: number): void { this.messageHandler.showDamagePopup(damage, isPlayer, effectiveness); }
  updateWeatherDisplay(): void { this.messageHandler.updateWeatherDisplay(); }
  checkLowHpWarning(): void { this.messageHandler.checkLowHpWarning(); }
  waitForConfirmThen(callback: () => void): void { this.messageHandler.waitForConfirmThen(callback); }

  showActions(): void { this.actionMenu.showActions(); }
  hideActions(): void { this.actionMenu.hideActions(); }

  openMoveMenu(): void { this.moveMenu.openMoveMenu(); }
  closeMoveMenu(): void { this.moveMenu.closeMoveMenu(); }

  pickEnemyMove(enemy: PokemonInstance): string { return pickEnemy(enemy); }

  // ─── Input routing ───

  private nav(dir: string): void {
    if (this.state === 'animating' || this.state === 'message') return;
    AudioManager.getInstance().playSFX(SFX.CURSOR);

    if (this.state === 'target-select') {
      if (dir === 'left' && this.moveMenu.targetCursor > 0) this.moveMenu.targetCursor--;
      if (dir === 'right' && this.moveMenu.targetCursor < this.moveMenu.targetArrows.length - 1) this.moveMenu.targetCursor++;
      this.moveMenu.updateTargetCursor();
      return;
    }

    const isMoveState = this.state === 'moves';
    let cur = isMoveState ? this.moveMenu.moveCursor : this.actionMenu.cursor;
    const len = isMoveState ? this.battle().playerPokemon.moves.length : 4;
    const compact = isMobile() && (window.innerHeight < 400 || this.cameras.main.height < 400);

    if (compact) {
      if (dir === 'left' && cur > 0) cur--;
      if (dir === 'right' && cur + 1 < len) cur++;
    } else {
      if (dir === 'left'  && cur % 2 === 1) cur--;
      if (dir === 'right' && cur % 2 === 0 && cur + 1 < len) cur++;
      if (dir === 'up'    && cur >= 2) cur -= 2;
      if (dir === 'down'  && cur + 2 < len) cur += 2;
    }

    if (isMoveState) {
      this.moveMenu.moveCursor = cur;
      this.moveMenu.updateMoveCursor();
    } else {
      this.actionMenu.cursor = cur;
      this.actionMenu.updateCursor();
    }
  }

  private confirm(): void {
    if (this.state === 'animating') return;
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    if (this.state === 'target-select') { this.moveMenu.confirmTarget(); return; }
    if (this.state === 'message') { this.state = 'actions'; this.showActions(); this.msg('What will you do?'); return; }
    if (this.state === 'actions') this.actionMenu.selectAction();
    else if (this.state === 'moves') this.moveMenu.selectMove();
  }

  private cancel(): void {
    if (this.state === 'animating') return;
    AudioManager.getInstance().playSFX(SFX.CANCEL);
    if (this.state === 'target-select') { this.moveMenu.clearTargetArrows(); this.state = 'moves'; this.openMoveMenu(); return; }
    if (this.state === 'moves') this.closeMoveMenu();
  }

  // ─── Turn execution (remains in the orchestrator) ───

  executeTurn(playerMoveId: string): void {
    const b = this.battle();
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
      this.runEndOfTurn(order);
      return;
    }

    const { attacker, defender, moveId, isPlayer } = order[idx];
    if (attacker.currentHp <= 0) {
      this.runTurnStep(order, idx + 1);
      return;
    }

    const b = this.battle();
    const name = pokemonData[attacker.dataId]?.name ?? '???';
    const moveName = moveData[moveId]?.name ?? moveId;

    // ── Track player move category for status-master achievement ──
    if (isPlayer) {
      const md = moveData[moveId];
      if (md?.category === 'status') this.playerStatusMovesUsed++;
      else if (md) this.playerDamagingMovesUsed++;
    }

    // ── Flinch check ──
    const flinchMsg = idx > 0 ? this.statusHandler.checkFlinch(attacker) : null;
    if (flinchMsg) {
      this.msg(flinchMsg);
      b.updateHpBars();
      this.time.delayedCall(900, () => this.runTurnStep(order, idx + 1));
      return;
    }

    // ── Status turn-start check ──
    const turnStart = this.statusHandler.checkTurnStart(attacker);
    if (turnStart.messages.length > 0) {
      this.showMessageQueue(turnStart.messages, 0, () => {
        b.updateHpBars();
        if (!turnStart.canAct) {
          if (attacker.currentHp <= 0) {
            const atkName = pokemonData[attacker.dataId]?.name ?? '???';
            this.time.delayedCall(600, () => {
              b.faintSprite(isPlayer ? b.playerSprite : b.enemySprite);
              this.msg(`${atkName} fainted!`);
              this.time.delayedCall(1500, () => {
                if (isPlayer) {
                  this.switchHandler.handleFaintedSwitch();
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
        this.executeMove(order, idx, name, moveName);
      });
      return;
    }

    this.executeMove(order, idx, name, moveName);
  }

  /** Execute a single move with animations and effect messages. */
  executeMove(
    order: { attacker: PokemonInstance; defender: PokemonInstance; moveId: string; isPlayer: boolean }[],
    idx: number,
    name: string,
    moveName: string,
  ): void {
    const { attacker, defender, moveId, isPlayer } = order[idx];
    const b = this.battle();

    this.msg(`${name} used ${moveName}!`);

    this.time.delayedCall(700, () => {
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
        this.showDamagePopup(result.damage.damage, !isPlayer, result.damage.effectiveness);
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
        // ── Battle achievements ──
        if (isPlayer) {
          const am = AchievementManager.getInstance();
          if (result.damage.isCritical) am.unlock('critical-hit');
          if (defender.currentHp <= 0 && result.damage.damage >= defender.stats.hp) {
            am.unlock('one-hit-ko');
          }
          if (result.damage.effectiveness > 1) {
            const gm = GameManager.getInstance();
            gm.incrementStat('superEffectiveHits');
            if (gm.getStat('superEffectiveHits') >= 50) am.unlock('type-master');
          }
        }
      } else if (!result.moveHit) {
        this.msg(`${name}'s attack missed!`);
      } else {
        this.msg(`${name} used ${moveName}!`);
      }

      // Show effect messages (status applied, stat changes, drain, recoil, etc.)
      const allEffectMsgs = [...result.effectMessages];

      // ── Ability: onAfterDamage ──
      if (result.moveHit && result.damage.damage > 0) {
        const md = moveData[moveId];
        if (md) {
          const abilityResult = AbilityHandler.onAfterDamage(attacker, defender, md, result.damage.damage);
          allEffectMsgs.push(...abilityResult.messages);
        }
        const lifeOrbResult = HeldItemHandler.onAttackLanded(attacker, result.damage.damage);
        allEffectMsgs.push(...lifeOrbResult.messages);
        const hpBeforeHit = defender.currentHp + result.damage.damage;
        const focusResult = HeldItemHandler.onAfterDamage(defender, attacker, result.damage.damage, hpBeforeHit);
        allEffectMsgs.push(...focusResult.messages);
        const threshResult = HeldItemHandler.checkHPThreshold(defender);
        allEffectMsgs.push(...threshResult.messages);
      }

      // ── Held item: status berry check ──
      if (defender.status) {
        const statusBerryResult = HeldItemHandler.onStatusApplied(defender);
        allEffectMsgs.push(...statusBerryResult.messages);
      }
      if (attacker.status) {
        const atkStatusBerry = HeldItemHandler.onStatusApplied(attacker);
        allEffectMsgs.push(...atkStatusBerry.messages);
      }

      // Play stat change SFX
      for (const m of allEffectMsgs) {
        if (m.includes('rose') || m.includes('raised')) {
          AudioManager.getInstance().playSFX(SFX.STAT_UP);
          break;
        }
        if (m.includes('fell') || m.includes('lowered')) {
          AudioManager.getInstance().playSFX(SFX.STAT_DOWN);
          break;
        }
      }

      if (result.recoilDamage && result.recoilDamage > 0) b.updateHpBars();
      if (result.healedHp && result.healedHp > 0) b.updateHpBars();

      // Show effect messages sequentially then check faint
      this.time.delayedCall(700, () => {
        this.showMessageQueue(allEffectMsgs, 0, () => {
          // Self-destruct
          if (result.selfDestruct && attacker.currentHp <= 0) {
            b.updateHpBars();
            this.time.delayedCall(400, () => {
              b.faintSprite(isPlayer ? b.playerSprite : b.enemySprite);
            });
          }

          // Check defender faint
          if (defender.currentHp <= 0) {
            // Friendship survival
            if (!isPlayer && defender.friendship >= 220 && Math.random() < 0.1) {
              defender.currentHp = 1;
              b.updateHpBars();
              const survName = defender.nickname ?? pokemonData[defender.dataId]?.name ?? '???';
              this.msg(`${survName} held on so you wouldn't feel sad!`);
              AchievementManager.getInstance().unlock('survive-1hp');
              this.time.delayedCall(1200, () => this.runTurnStep(order, idx + 1));
              return;
            }
            const defName = pokemonData[defender.dataId]?.name ?? '???';
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
                  this.switchHandler.handleFaintedSwitch();
                }
              });
            });
            return;
          }

          // Check attacker faint from recoil / self-destruct
          if (attacker.currentHp <= 0) {
            const atkName = pokemonData[attacker.dataId]?.name ?? '???';
            if (isPlayer) this.applyFaintFriendshipLoss(attacker);
            this.time.delayedCall(800, () => {
              AudioManager.getInstance().playSFX(SFX.FAINT);
              AudioManager.getInstance().playCry(attacker.dataId);
              b.faintSprite(isPlayer ? b.playerSprite : b.enemySprite);
              this.msg(`${atkName} fainted!`);
              this.time.delayedCall(1500, () => {
                if (isPlayer) {
                  this.switchHandler.handleFaintedSwitch();
                } else {
                  this.runVictorySequence();
                }
              });
            });
            return;
          }

          this.time.delayedCall(400, () => this.runTurnStep(order, idx + 1));
        });
      });
    }
  }

  // ─── End-of-turn effects ───

  private runEndOfTurn(order: { attacker: PokemonInstance; defender: PokemonInstance; moveId: string; isPlayer: boolean }[]): void {
    const b = this.battle();
    const player = b.playerPokemon;
    const enemy = b.enemyPokemon;

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
        this.switchHandler.handleFaintedSwitch();
      });
      return;
    }
    // Next turn
    this.time.delayedCall(600, () => {
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

  /** Execute an enemy-only turn (after player uses item, switches, or fails to flee). */
  executeEnemyOnlyTurn(): void {
    const b = this.battle();
    const enemy = b.enemyPokemon;
    const player = b.playerPokemon;
    const enemyMoveId = this.pickEnemyMove(enemy);

    this.state = 'animating';
    this.hideActions();

    const order = [{ attacker: enemy, defender: player, moveId: enemyMoveId, isPlayer: false }];
    this.runTurnStep(order, 0);
  }

  // ─── Victory & end ───

  private runVictorySequence(): void {
    if (this.battle().isDouble) {
      AchievementManager.getInstance().unlock('first-double');
    }
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
      moveCursor: this.moveMenu.moveCursor,
      moveMenuBg: this.moveMenu.moveMenuBg,
      moveTexts: this.moveMenu.moveTexts,
    };
  }

  /** Apply friendship loss when a player's Pokemon faints (-1). */
  private applyFaintFriendshipLoss(pokemon: PokemonInstance): void {
    const gm = GameManager.getInstance();
    const idx = gm.getParty().indexOf(pokemon);
    if (idx >= 0) {
      gm.adjustFriendship(idx, -1);
    }
  }

  endBattle(): void {
    const audio = AudioManager.getInstance();
    audio.stopLowHpWarning();
    audio.restoreBgmState();
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
    this.input.removeAllListeners();
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
