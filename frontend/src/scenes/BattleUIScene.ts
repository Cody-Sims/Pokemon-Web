import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';
import { moveData } from '@data/moves';
import { pokemonData } from '@data/pokemon';
import { itemData } from '@data/item-data';
import { MoveExecutor } from '@battle/MoveExecutor';
import { playMoveAnimation } from '@battle/MoveAnimationPlayer';
import { ExperienceCalculator } from '@battle/ExperienceCalculator';
import { StatusEffectHandler } from '@battle/StatusEffectHandler';
import { AbilityHandler } from '@battle/AbilityHandler';
import { HeldItemHandler } from '@battle/HeldItemHandler';
import { CatchCalculator } from '@battle/CatchCalculator';
import type { WeatherManager } from '@battle/WeatherManager';
import type { BattleScene } from './BattleScene';
import type { PokemonInstance } from '@data/interfaces';
import { AudioManager } from '@managers/AudioManager';
import { GameManager } from '@managers/GameManager';
import { SFX, BGM } from '@utils/audio-keys';
import { NinePatchPanel } from '@ui/NinePatchPanel';
import { EventManager } from '@managers/EventManager';
import { COLORS, TYPE_COLORS, CATEGORY_COLORS, FONTS, mobileFontSize, MOBILE_SCALE, isMobile } from '@ui/theme';
import { TouchControls } from '@ui/TouchControls';
import { SynthesisHandler } from '@battle/SynthesisHandler';
import { SYNTHESIS_ITEM } from '@data/synthesis-data';
import { getMoveTarget } from '@battle/DoubleBattleManager';
import { pickEnemyMove, calculateTurnOrder } from './battle/BattleTurnRunner';
import { showMessageQueue as showMsgQueue } from './battle/BattleMessageQueue';
import { showDamagePopup as showDmgPopup } from './battle/BattleDamageNumbers';
import { processTrainerRewards, getContinueMessage } from './battle/BattleRewardHandler';
import { collectEndOfTurnEffects } from './battle/BattleEndOfTurn';

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

  // ─── Poké Ball catch sequence ───

  private handlePokeBallUse(ballItemId: string): void {
    const b = this.battle();

    // Can't catch trainer-owned Pokémon
    if (b.isTrainerBattle) {
      this.msg("You can't catch a trainer's Pokémon!");
      this.state = 'message';
      return;
    }

    this.state = 'animating';
    this.hideActions();

    const ballData = itemData[ballItemId];
    const multiplier = ballData?.effect?.catchRateMultiplier ?? 1;
    const result = CatchCalculator.calculate(b.enemyPokemon, multiplier);
    const audio = AudioManager.getInstance();

    this.msg(`You threw a ${ballData?.name ?? 'Poké Ball'}!`);
    audio.playSFX(SFX.BALL_THROW);

    // Ball throw animation: arc from player → enemy
    const ballGfx = this.add.circle(200, 400, 8, 0xff3333).setDepth(100);
    this.add.circle(200, 400, 4, 0xffffff).setDepth(101); // highlight

    // Arc tween to enemy position
    this.tweens.add({
      targets: ballGfx,
      x: b.enemySprite.x,
      y: b.enemySprite.y,
      duration: 500,
      ease: 'Sine.easeIn',
      onComplete: () => {
        ballGfx.destroy();
        // Enemy disappears into ball
        b.enemySprite.setAlpha(0);

        // Shake sequence
        this.runShakeSequence(result.shakes, result.caught, 0);
      },
    });
  }

  private runShakeSequence(totalShakes: number, caught: boolean, currentShake: number): void {
    const b = this.battle();
    const audio = AudioManager.getInstance();

    if (currentShake < totalShakes) {
      // Draw ball on ground
      const ballX = b.enemySprite.x;
      const ballY = b.enemySprite.y + 20;
      const shakeGfx = this.add.circle(ballX, ballY, 10, 0xff3333).setDepth(100);
      const shakeHighlight = this.add.circle(ballX - 2, ballY - 2, 4, 0xffffff).setDepth(101);

      this.time.delayedCall(400, () => {
        audio.playSFX(SFX.BALL_SHAKE);
        // Wobble animation
        this.tweens.add({
          targets: [shakeGfx, shakeHighlight],
          x: ballX + 8,
          duration: 100,
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            shakeGfx.destroy();
            shakeHighlight.destroy();
            this.time.delayedCall(300, () => {
              this.runShakeSequence(totalShakes, caught, currentShake + 1);
            });
          },
        });
      });
    } else if (caught) {
      // Catch success!
      this.onCatchSuccess();
    } else {
      // Broke free
      this.onCatchFailure();
    }
  }

  private onCatchSuccess(): void {
    const b = this.battle();
    const audio = AudioManager.getInstance();
    const gm = GameManager.getInstance();
    const enemy = b.enemyPokemon;
    const enemyData = pokemonData[enemy.dataId];
    const name = enemyData?.name ?? '???';

    audio.playSFX(SFX.CATCH_SUCCESS);

    // Star/sparkle effect
    const sparkle = this.add.text(b.enemySprite.x, b.enemySprite.y, '✦', {
      fontSize: '32px', color: '#ffcc00',
    }).setOrigin(0.5).setDepth(100);
    this.tweens.add({
      targets: sparkle,
      y: sparkle.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => sparkle.destroy(),
    });

    this.msg(`Gotcha! ${name} was caught!`);

    this.time.delayedCall(1800, () => {
      // Add to party (or auto-deposit if full)
      const added = gm.addToParty(enemy);
      gm.markSeen(enemy.dataId);
      gm.markCaught(enemy.dataId);

      if (added && gm.getParty().length > 6) {
        this.msg(`${name} was sent to the PC!`);
      } else if (added) {
        this.msg(`${name} was added to your party!`);
      } else {
        this.msg(`All boxes are full! ${name} could not be stored.`);
      }

      this.time.delayedCall(1500, () => {
        // Prompt for nickname
        this.promptNickname(enemy, name, () => {
          // Play victory BGM
          audio.playBGM(BGM.VICTORY);
          this.state = 'message';
          this.msg(isMobile() ? 'Tap to continue...' : 'Press Enter to continue...');
          this.waitForConfirmThen(() => this.endBattle());
        });
      });
    });
  }

  private onCatchFailure(): void {
    const b = this.battle();
    const enemyData = pokemonData[b.enemyPokemon.dataId];
    const name = enemyData?.name ?? '???';

    // Enemy reappears
    b.enemySprite.setAlpha(1);

    const breakMessages = [
      `Oh no! ${name} broke free!`,
      `Aww! It appeared to be caught!`,
      `Aargh! Almost had it!`,
      `Shoot! It was so close, too!`,
    ];
    const msg = breakMessages[Math.floor(Math.random() * breakMessages.length)];
    this.msg(msg);

    // Enemy gets a free attack turn
    this.time.delayedCall(1200, () => {
      const enemyMoveId = this.pickEnemyMove(b.enemyPokemon);
      const enemyMove = moveData[enemyMoveId];
      const enemyName = enemyData?.name ?? '???';
      const moveName = enemyMove?.name ?? enemyMoveId;

      this.executeMove(
        [{ attacker: b.enemyPokemon, defender: b.playerPokemon, moveId: enemyMoveId, isPlayer: false }],
        0,
        enemyName,
        moveName,
      );
    });
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

  // ─── Victory & EXP sequence ───
  private runVictorySequence(): void {
    const b = this.battle();
    const player = b.playerPokemon;
    const expGained = ExperienceCalculator.calculateExp(b.enemyPokemon, b.isTrainerBattle);
    const name = player.nickname ?? pokemonData[player.dataId]?.name ?? '???';

    // +3 friendship for the active participant that won
    const gm = GameManager.getInstance();
    const participantIdx = gm.getParty().indexOf(player);
    if (participantIdx >= 0) {
      gm.adjustFriendship(participantIdx, 3);
    }

    // Switch to victory BGM
    AudioManager.getInstance().playBGM(BGM.VICTORY);

    this.msg(`${name} gained ${expGained} EXP. Points!`);
    this.state = 'animating';

    // Award EXP
    const prevLevel = player.level;
    const result = ExperienceCalculator.awardExp(player, expGained);

    // Animate EXP bar
    AudioManager.getInstance().playSFX(SFX.EXP_FILL);
    b.animateExpBar(800);

    this.time.delayedCall(800, () => {
      if (result.levelsGained > 0) {
        AudioManager.getInstance().playSFX(SFX.LEVEL_UP);
        this.time.delayedCall(600, () => {
          this.runLevelUpSequence(name, prevLevel, result.newLevel, result.newMoves, 0);
        });
      } else {
        this.time.delayedCall(1200, () => {
          this.checkEvolutionThenEnd();
        });
      }
    });
  }

  private runLevelUpSequence(name: string, fromLevel: number, toLevel: number, newMoves: string[], moveIdx: number): void {
    const b = this.battle();

    // Flash effect for level up
    const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0.6);
    this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });

    this.msg(`${name} grew to Lv.${toLevel}!`);
    b.updateLevelDisplay();
    b.updateHpBars();

    // Show stat changes
    this.time.delayedCall(1500, () => {
      const p = b.playerPokemon;
      this.msg(`HP: ${p.stats.hp} | ATK: ${p.stats.attack} | DEF: ${p.stats.defense} | SpA: ${p.stats.spAttack} | SpD: ${p.stats.spDefense} | SPD: ${p.stats.speed}`);

      this.time.delayedCall(2000, () => {
        // Process new moves one at a time
        if (moveIdx < newMoves.length) {
          this.offerNewMove(name, newMoves, moveIdx);
        } else {
          this.state = 'message';
          this.msg(isMobile() ? 'Tap to continue...' : 'Press Enter to continue...');
          this.waitForConfirmThen(() => this.endBattle());
        }
      });
    });
  }

  private offerNewMove(pokeName: string, newMoves: string[], moveIdx: number): void {
    const newMoveId = newMoves[moveIdx];
    const md = moveData[newMoveId];
    if (!md) { this.offerNextOrEnd(pokeName, newMoves, moveIdx); return; }

    const b = this.battle();
    const player = b.playerPokemon;

    if (player.moves.length < 4) {
      // Auto-learn if fewer than 4 moves
      player.moves.push({ moveId: newMoveId, currentPp: md.pp });
      this.msg(`${pokeName} learned ${md.name}!`);
      this.time.delayedCall(1500, () => this.offerNextOrEnd(pokeName, newMoves, moveIdx));
      return;
    }

    // Prompt to replace a move
    this.msg(`${pokeName} wants to learn ${md.name}! But it already knows 4 moves.`);
    this.state = 'animating';

    this.time.delayedCall(1500, () => {
      this.msg(`Forget a move to learn ${md.name}?`);
      this.showMoveReplaceMenu(newMoveId, md.name, pokeName, newMoves, moveIdx);
    });
  }

  private showMoveReplaceMenu(newMoveId: string, newMoveName: string, pokeName: string, newMoves: string[], moveIdx: number): void {
    const b = this.battle();
    const player = b.playerPokemon;
    this.state = 'moves';
    this.moveCursor = 0;

    this.hideActions();
    this.moveMenuBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 60, GAME_WIDTH - 20, 100, 0x1a1a2e, 0.95).setStrokeStyle(2, 0xffffff);

    // Show current 4 moves + "Don't learn" option
    const options = [
      ...player.moves.map(m => { const d = moveData[m.moveId]; return d ? d.name : m.moveId; }),
      "Don't learn"
    ];

    this.moveTexts = options.map((label, i) => {
      const col = i % 2; const row = Math.floor(i / 2);
      const t = this.add.text(GAME_WIDTH / 2 - 120 + col * 240, GAME_HEIGHT - 90 + row * 28,
        label, { fontSize: '14px', color: '#ffffff' }
      ).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerover', () => { this.moveCursor = i; this.updateReplaceCursor(options.length); });
      t.on('pointerdown', () => {
        this.moveCursor = i;
        this.handleMoveReplace(i, newMoveId, newMoveName, pokeName, newMoves, moveIdx);
      });
      return t;
    });

    this.updateReplaceCursor(options.length);

    // Override confirm for this menu
    const confirmHandler = () => {
      this.handleMoveReplace(this.moveCursor, newMoveId, newMoveName, pokeName, newMoves, moveIdx);
      this.input.keyboard!.off('keydown-ENTER', confirmHandler);
      this.input.keyboard!.off('keydown-SPACE', confirmHandler);
    };
    this.input.keyboard!.on('keydown-ENTER', confirmHandler);
    this.input.keyboard!.on('keydown-SPACE', confirmHandler);
  }

  private updateReplaceCursor(len: number): void {
    this.moveTexts.forEach((t, i) => { if (i < len) t.setColor(i === this.moveCursor ? '#ffcc00' : '#ffffff'); });
  }

  private handleMoveReplace(choice: number, newMoveId: string, newMoveName: string, pokeName: string, newMoves: string[], moveIdx: number): void {
    const b = this.battle();
    const player = b.playerPokemon;
    const md = moveData[newMoveId];

    // Clean up replace menu
    this.moveMenuBg?.destroy();
    this.moveTexts.forEach(t => t.destroy());
    this.moveTexts = [];

    if (choice < player.moves.length && md) {
      // Replace the chosen move
      const oldName = moveData[player.moves[choice].moveId]?.name ?? player.moves[choice].moveId;
      player.moves[choice] = { moveId: newMoveId, currentPp: md.pp };
      this.msg(`1, 2, and... Poof! ${pokeName} forgot ${oldName} and learned ${newMoveName}!`);
    } else {
      this.msg(`${pokeName} did not learn ${newMoveName}.`);
    }

    this.time.delayedCall(1500, () => this.offerNextOrEnd(pokeName, newMoves, moveIdx));
  }

  private offerNextOrEnd(pokeName: string, newMoves: string[], moveIdx: number): void {
    if (moveIdx + 1 < newMoves.length) {
      this.offerNewMove(pokeName, newMoves, moveIdx + 1);
    } else {
      this.checkEvolutionThenEnd();
    }
  }

  /** Check if the player's Pokémon should evolve after level-up. */
  private checkEvolutionThenEnd(): void {
    const b = this.battle();
    const player = b.playerPokemon;

    // Use ExperienceCalculator's unified evolution check (level, friendship, move-known)
    const evolvesTo = ExperienceCalculator.checkLevelUpEvolution(player);
    if (evolvesTo === null) {
      this.showTrainerRewardsThenEnd();
      return;
    }

    const oldData = pokemonData[player.dataId];
    const newData = pokemonData[evolvesTo];
    if (!newData) {
      this.showTrainerRewardsThenEnd();
      return;
    }

    const oldName = oldData?.name ?? '???';
    this.msg(`What? ${oldName} is evolving!`);
    AudioManager.getInstance().playJingle(BGM.EVOLUTION, true);
    this.state = 'animating';

    // Evolution flash animation
    this.time.delayedCall(1200, () => {
      // Rapid white flashes
      let flashCount = 0;
      const flashTimer = this.time.addEvent({
        delay: 150,
        repeat: 7,
        callback: () => {
          flashCount++;
          b.playerSprite.setAlpha(flashCount % 2 === 0 ? 1 : 0.1);
          b.playerSprite.setTint(flashCount % 2 === 0 ? 0xffffff : 0xddddff);
        },
      });

      this.time.delayedCall(1400, () => {
        // Big flash
        const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0.9);
        this.tweens.add({
          targets: flash,
          alpha: 0,
          duration: 600,
          onComplete: () => flash.destroy(),
        });

        // Update the Pokémon data
        player.dataId = evolvesTo;

        // Recalculate stats with new base stats
        const newBase = newData.baseStats;
        player.stats = {
          hp: Math.floor(((2 * newBase.hp + player.ivs.hp) * player.level) / 100) + player.level + 10,
          attack: Math.floor(((2 * newBase.attack + player.ivs.attack) * player.level) / 100) + 5,
          defense: Math.floor(((2 * newBase.defense + player.ivs.defense) * player.level) / 100) + 5,
          spAttack: Math.floor(((2 * newBase.spAttack + player.ivs.spAttack) * player.level) / 100) + 5,
          spDefense: Math.floor(((2 * newBase.spDefense + player.ivs.spDefense) * player.level) / 100) + 5,
          speed: Math.floor(((2 * newBase.speed + player.ivs.speed) * player.level) / 100) + 5,
        };
        player.currentHp = Math.min(player.currentHp, player.stats.hp);

        // Swap sprite
        b.playerSprite.setTexture(newData.spriteKeys.back);
        b.playerSprite.setAlpha(1);
        b.playerSprite.clearTint();

        // Update name and mark in Pokédex
        b.playerNameText.setText(newData.name);
        const gm = GameManager.getInstance();
        gm.markSeen(evolvesTo);
        gm.markCaught(evolvesTo);

        this.msg(`Congratulations! ${oldName} evolved into ${newData.name}!`);
        b.updateHpBars();
        b.updateLevelDisplay();

        this.time.delayedCall(2500, () => {
          this.showTrainerRewardsThenEnd();
        });
      });
    });
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

  /** Show trainer reward messages (money, badge, dialogue), then end battle. */
  private showTrainerRewardsThenEnd(): void {
    const b = this.battle();
    const messages: string[] = [];

    if (b.isTrainerBattle && b.trainerId) {
      const { messages: rewardMsgs } = processTrainerRewards(b.trainerId, b.victoryFlag);
      messages.push(...rewardMsgs);
    } else if (b.victoryFlag) {
      GameManager.getInstance().setFlag(b.victoryFlag);
      EventManager.getInstance().emit('flag-set', b.victoryFlag);
    }

    const continueMsg = getContinueMessage();
    if (messages.length > 0) {
      this.showMessageQueue(messages, 0, () => {
        this.state = 'message';
        this.msg(continueMsg);
        this.waitForConfirmThen(() => this.endBattle());
      });
    } else {
      this.state = 'message';
      this.msg(continueMsg);
      this.waitForConfirmThen(() => this.endBattle());
    }
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

  /** Prompt the player to nickname a newly caught Pokémon. */
  private promptNickname(pokemon: PokemonInstance, speciesName: string, callback: () => void): void {
    this.msg(`Would you like to give a nickname to ${speciesName}?`);
    this.state = 'animating';

    // Show YES / NO options
    const yesText = this.add.text(GAME_WIDTH / 2 - 60, GAME_HEIGHT - 60, 'YES', {
      ...FONTS.menuItem, fontSize: '18px', color: COLORS.textHighlight,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(200);
    const noText = this.add.text(GAME_WIDTH / 2 + 60, GAME_HEIGHT - 60, 'NO', {
      ...FONTS.menuItem, fontSize: '18px', color: COLORS.textWhite,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(200);

    let cursor = 0;
    const updateCursor = () => {
      yesText.setColor(cursor === 0 ? COLORS.textHighlight : COLORS.textWhite);
      noText.setColor(cursor === 1 ? COLORS.textHighlight : COLORS.textWhite);
    };

    const cleanup = () => {
      yesText.destroy();
      noText.destroy();
      this.input.keyboard!.off('keydown-LEFT', onLeft);
      this.input.keyboard!.off('keydown-RIGHT', onRight);
      this.input.keyboard!.off('keydown-ENTER', onConfirm);
      this.input.keyboard!.off('keydown-SPACE', onConfirm);
    };

    const onLeft = () => { cursor = 0; updateCursor(); };
    const onRight = () => { cursor = 1; updateCursor(); };
    const onConfirm = () => {
      cleanup();
      if (cursor === 0) {
        // YES — launch nickname input
        this.scene.launch('NicknameScene', { pokemon, speciesName });
        this.scene.get('NicknameScene').events.once('shutdown', () => {
          callback();
        });
      } else {
        callback();
      }
    };

    yesText.on('pointerdown', () => { cursor = 0; onConfirm(); });
    noText.on('pointerdown', () => { cursor = 1; onConfirm(); });
    this.input.keyboard!.on('keydown-LEFT', onLeft);
    this.input.keyboard!.on('keydown-RIGHT', onRight);
    this.input.keyboard!.on('keydown-ENTER', onConfirm);
    this.input.keyboard!.on('keydown-SPACE', onConfirm);
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
