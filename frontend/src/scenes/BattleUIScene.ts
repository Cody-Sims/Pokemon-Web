import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';
import { moveData } from '@data/move-data';
import { pokemonData } from '@data/pokemon-data';
import { MoveExecutor } from '@battle/MoveExecutor';
import { ExperienceCalculator } from '@battle/ExperienceCalculator';
import { StatusEffectHandler } from '@battle/StatusEffectHandler';
import type { BattleScene } from './BattleScene';
import type { PokemonInstance } from '@data/interfaces';
import { AudioManager } from '@managers/AudioManager';
import { GameManager } from '@managers/GameManager';
import { trainerData } from '@data/trainer-data';
import { evolutionData } from '@data/evolution-data';
import { SFX, BGM } from '@utils/audio-keys';

type UIState = 'actions' | 'moves' | 'animating' | 'message';

export class BattleUIScene extends Phaser.Scene {
  private actionTexts: Phaser.GameObjects.Text[] = [];
  private cursor = 0;
  private moveTexts: Phaser.GameObjects.Text[] = [];
  private moveCursor = 0;
  private moveMenuBg?: Phaser.GameObjects.Rectangle;
  private actionMenuBg!: Phaser.GameObjects.Rectangle;
  private state: UIState = 'actions';
  private messageText!: Phaser.GameObjects.Text;
  private statusHandler!: StatusEffectHandler;

  constructor() {
    super({ key: 'BattleUIScene' });
  }

  create(): void {
    this.state = 'actions';

    // Use the StatusEffectHandler from BattleManager (single source of truth)
    this.statusHandler = this.battle().battleManager.getStatusHandler();

    // Message bar
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 120, GAME_WIDTH - 20, 30, 0x111111, 0.9);
    this.messageText = this.add.text(30, GAME_HEIGHT - 132, 'What will you do?', { fontSize: '16px', color: '#ffffff' });

    // Action menu
    this.actionMenuBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 60, GAME_WIDTH - 20, 100, 0x333333, 0.9);
    this.actionMenuBg.setStrokeStyle(2, 0xffffff);

    const actions = ['FIGHT', 'BAG', 'POKEMON', 'RUN'];
    this.actionTexts = actions.map((action, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const t = this.add.text(
        GAME_WIDTH / 2 - 80 + col * 160, GAME_HEIGHT - 85 + row * 35,
        action, { fontSize: '18px', color: '#ffffff' }
      ).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerover', () => { if (this.state === 'actions') { this.cursor = i; this.updateCursor(); } });
      t.on('pointerdown', () => { if (this.state === 'actions') { this.cursor = i; this.selectAction(); } });
      return t;
    });
    this.cursor = 0;
    this.updateCursor();

    // Keyboard
    this.input.keyboard!.on('keydown-LEFT', () => this.nav('left'));
    this.input.keyboard!.on('keydown-RIGHT', () => this.nav('right'));
    this.input.keyboard!.on('keydown-UP', () => this.nav('up'));
    this.input.keyboard!.on('keydown-DOWN', () => this.nav('down'));
    this.input.keyboard!.on('keydown-ENTER', () => this.confirm());
    this.input.keyboard!.on('keydown-SPACE', () => this.confirm());
    this.input.keyboard!.on('keydown-ESC', () => this.cancel());
  }

  private battle(): BattleScene { return this.scene.get('BattleScene') as BattleScene; }

  // ─── Input routing ───
  private nav(dir: string): void {
    if (this.state === 'animating' || this.state === 'message') return;
    AudioManager.getInstance().playSFX(SFX.CURSOR);
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
    if (this.state === 'message') { this.state = 'actions'; this.showActions(); this.msg('What will you do?'); return; }
    if (this.state === 'actions') this.selectAction();
    else if (this.state === 'moves') this.selectMove();
  }

  private cancel(): void {
    if (this.state === 'animating') return;
    AudioManager.getInstance().playSFX(SFX.CANCEL);
    if (this.state === 'moves') this.closeMoveMenu();
    else if (this.state === 'actions') this.endBattle();
  }

  // ─── Action menu ───
  private updateCursor(): void { this.actionTexts.forEach((t, i) => t.setColor(i === this.cursor ? '#ffcc00' : '#ffffff')); }
  private showActions(): void { this.actionMenuBg.setVisible(true); this.actionTexts.forEach(t => t.setVisible(true)); this.updateCursor(); }
  private hideActions(): void { this.actionMenuBg.setVisible(false); this.actionTexts.forEach(t => t.setVisible(false)); }

  private selectAction(): void {
    switch (this.actionTexts[this.cursor].text) {
      case 'FIGHT': this.openMoveMenu(); break;
      case 'BAG': this.scene.launch('InventoryScene'); break;
      case 'POKEMON': this.scene.launch('PartyScene'); break;
      case 'RUN': this.endBattle(); break;
    }
  }

  // ─── Move menu ───
  private openMoveMenu(): void {
    this.state = 'moves';
    this.moveCursor = 0;
    this.hideActions();
    const moves = this.battle().playerPokemon.moves;

    this.moveMenuBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 60, GAME_WIDTH - 20, 100, 0x1a1a2e, 0.95).setStrokeStyle(2, 0xffffff);
    this.moveTexts = moves.map((m, i) => {
      const md = moveData[m.moveId];
      const col = i % 2; const row = Math.floor(i / 2);
      const t = this.add.text(GAME_WIDTH / 2 - 120 + col * 240, GAME_HEIGHT - 85 + row * 35,
        md ? `${md.name}  ${m.currentPp}/${md.pp}` : m.moveId,
        { fontSize: '16px', color: '#ffffff' }
      ).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerover', () => { if (this.state === 'moves') { this.moveCursor = i; this.updateMoveCursor(); } });
      t.on('pointerdown', () => { if (this.state === 'moves') { this.moveCursor = i; this.selectMove(); } });
      return t;
    });
    // Back button
    const back = this.add.text(GAME_WIDTH - 60, GAME_HEIGHT - 115, '← Back', { fontSize: '14px', color: '#aaaaaa' })
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.closeMoveMenu());
    this.moveTexts.push(back);
    this.updateMoveCursor();
    this.msg('Choose a move!');
  }

  private updateMoveCursor(): void {
    const moveCount = this.battle().playerPokemon.moves.length;
    this.moveTexts.forEach((t, i) => { if (i < moveCount) t.setColor(i === this.moveCursor ? '#ffcc00' : '#ffffff'); });
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

    this.executeTurn(mi.moveId);
  }

  // ─── Turn execution ───
  private executeTurn(playerMoveId: string): void {
    const b = this.battle();
    const player = b.playerPokemon;
    const enemy = b.enemyPokemon;

    // Use effective speed (accounts for stat stages and paralysis)
    const playerSpeed = this.statusHandler.getEffectiveStat(player, 'speed');
    const enemySpeed = this.statusHandler.getEffectiveStat(enemy, 'speed');

    // Check move priority
    const playerMove = moveData[playerMoveId];
    const enemyMoveId = this.pickEnemyMove(enemy);
    const enemyMove = moveData[enemyMoveId];
    const playerPriority = playerMove?.priority ?? 0;
    const enemyPriority = enemyMove?.priority ?? 0;

    const playerFirst = playerPriority > enemyPriority
      || (playerPriority === enemyPriority && playerSpeed >= enemySpeed);

    const order: { attacker: PokemonInstance; defender: PokemonInstance; moveId: string; isPlayer: boolean }[] = playerFirst
      ? [{ attacker: player, defender: enemy, moveId: playerMoveId, isPlayer: true }, { attacker: enemy, defender: player, moveId: enemyMoveId, isPlayer: false }]
      : [{ attacker: enemy, defender: player, moveId: enemyMoveId, isPlayer: false }, { attacker: player, defender: enemy, moveId: playerMoveId, isPlayer: true }];

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
      const result = MoveExecutor.execute(attacker, defender, moveId, this.statusHandler);
      b.updateHpBars();

      if (result.moveHit && result.damage.damage > 0) {
        b.flashSprite(isPlayer ? b.enemySprite : b.playerSprite);
        // Play appropriate hit SFX
        const audio = AudioManager.getInstance();
        if (result.damage.isCritical) audio.playSFX(SFX.HIT_CRIT);
        else if (result.damage.effectiveness > 1) audio.playSFX(SFX.HIT_SUPER);
        else if (result.damage.effectiveness < 1 && result.damage.effectiveness > 0) audio.playSFX(SFX.HIT_WEAK);
        else audio.playSFX(SFX.HIT_NORMAL);
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
      const allEffectMsgs = result.effectMessages;

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
            const defName = pokemonData[defender.dataId]?.name ?? '???';
            this.time.delayedCall(800, () => {
              AudioManager.getInstance().playSFX(SFX.FAINT);
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
            this.time.delayedCall(800, () => {
              AudioManager.getInstance().playSFX(SFX.FAINT);
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
    });
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
      // All end-of-turn done — check if anyone fainted
      if (b.enemyPokemon.currentHp <= 0) {
        const defName = pokemonData[b.enemyPokemon.dataId]?.name ?? '???';
        b.faintSprite(b.enemySprite);
        this.msg(`${defName} fainted!`);
        this.time.delayedCall(1500, () => this.runVictorySequence());
        return;
      }
      if (b.playerPokemon.currentHp <= 0) {
        const defName = pokemonData[b.playerPokemon.dataId]?.name ?? '???';
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
      this.time.delayedCall(600, () => { this.state = 'actions'; this.showActions(); this.msg('What will you do?'); });
      return;
    }

    const { pokemon, opponent, isPlayer } = pokemonToCheck[idx];
    const eotResult = this.statusHandler.applyEndOfTurn(pokemon, opponent);
    if (eotResult.messages.length > 0) {
      b.updateHpBars();
      this.showMessageQueue(eotResult.messages, 0, () => {
        this.time.delayedCall(400, () => this.runEndOfTurnStep(pokemonToCheck, idx + 1));
      });
    } else {
      this.runEndOfTurnStep(pokemonToCheck, idx + 1);
    }
  }

  /** Show a queue of messages sequentially with a delay, then run callback. */
  private showMessageQueue(messages: string[], idx: number, callback: () => void): void {
    if (idx >= messages.length) { callback(); return; }
    this.msg(messages[idx]);
    this.time.delayedCall(900, () => this.showMessageQueue(messages, idx + 1, callback));
  }

  private pickEnemyMove(enemy: PokemonInstance): string {
    const avail = enemy.moves.filter(m => m.currentPp > 0);
    if (avail.length === 0) return 'tackle';
    return avail[Math.floor(Math.random() * avail.length)].moveId;
  }

  private msg(text: string): void { this.messageText.setText(text); }

  private closeMoveMenu(): void {
    this.state = 'actions';
    this.moveMenuBg?.destroy();
    this.moveTexts.forEach(t => t.destroy());
    this.moveTexts = [];
    this.showActions();
    this.msg('What will you do?');
  }

  // ─── Victory & EXP sequence ───
  private runVictorySequence(): void {
    const b = this.battle();
    const player = b.playerPokemon;
    const expGained = ExperienceCalculator.calculateExp(b.enemyPokemon, b.isTrainerBattle);
    const name = pokemonData[player.dataId]?.name ?? '???';

    // Switch to victory BGM
    AudioManager.getInstance().playBGM(BGM.VICTORY);

    // Handle trainer battle rewards
    if (b.isTrainerBattle && b.trainerId) {
      const gm = GameManager.getInstance();
      gm.defeatTrainer(b.trainerId);
      const tData = trainerData[b.trainerId];
      if (tData) {
        gm.addMoney(tData.rewardMoney);
        // Grant badge for gym leaders
        if (b.trainerId === 'gym-brock') {
          gm.addBadge('boulder');
          gm.setFlag('defeatedBrock');
        }
      }
    }

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
          this.msg('Press Enter to continue...');
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
    const evolutions = evolutionData[player.dataId];
    if (!evolutions) {
      this.showTrainerRewardsThenEnd();
      return;
    }

    const evo = evolutions.find(e =>
      e.condition.type === 'level' && e.condition.level != null && player.level >= e.condition.level
    );
    if (!evo) {
      this.showTrainerRewardsThenEnd();
      return;
    }

    const oldData = pokemonData[player.dataId];
    const newData = pokemonData[evo.evolvesTo];
    if (!newData) {
      this.showTrainerRewardsThenEnd();
      return;
    }

    const oldName = oldData?.name ?? '???';
    this.msg(`What? ${oldName} is evolving!`);
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
        player.dataId = evo.evolvesTo;

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
        gm.markSeen(evo.evolvesTo);
        gm.markCaught(evo.evolvesTo);

        this.msg(`Congratulations! ${oldName} evolved into ${newData.name}!`);
        b.updateHpBars();
        b.updateLevelDisplay();

        this.time.delayedCall(2500, () => {
          this.showTrainerRewardsThenEnd();
        });
      });
    });
  }

  /** Wait for a single Enter/Space press then run callback. */
  private waitForConfirmThen(callback: () => void): void {
    const handler = () => {
      this.input.keyboard!.off('keydown-ENTER', handler);
      this.input.keyboard!.off('keydown-SPACE', handler);
      callback();
    };
    this.input.keyboard!.on('keydown-ENTER', handler);
    this.input.keyboard!.on('keydown-SPACE', handler);
  }

  /** Show trainer reward messages (money, badge, dialogue), then end battle. */
  private showTrainerRewardsThenEnd(): void {
    const b = this.battle();
    const messages: string[] = [];

    if (b.isTrainerBattle && b.trainerId) {
      const tData = trainerData[b.trainerId];
      if (tData) {
        messages.push(`You defeated ${tData.name}!`);
        messages.push(`Got ¥${tData.rewardMoney} for winning!`);
        if (b.trainerId === 'gym-brock') {
          messages.push('You received the Boulder Badge!');
        }
        if (tData.dialogue.after.length > 0) {
          messages.push(...tData.dialogue.after);
        }
      }
    }

    if (messages.length > 0) {
      this.showMessageQueue(messages, 0, () => {
        this.state = 'message';
        this.msg('Press Enter to continue...');
        this.waitForConfirmThen(() => this.endBattle());
      });
    } else {
      this.state = 'message';
      this.msg('Press Enter to continue...');
      this.waitForConfirmThen(() => this.endBattle());
    }
  }

  private endBattle(): void {
    this.battle().battleManager.cleanup();
    const b = this.battle();
    const returnScene = b.returnScene;
    const returnData = b.returnData;
    this.scene.stop();
    this.scene.stop('BattleScene');
    this.scene.start(returnScene, returnData);
  }
}
