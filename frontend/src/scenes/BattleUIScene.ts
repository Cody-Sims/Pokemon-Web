import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';
import { moveData } from '@data/move-data';
import { pokemonData } from '@data/pokemon-data';
import { MoveExecutor } from '@battle/MoveExecutor';
import { ExperienceCalculator } from '@battle/ExperienceCalculator';
import { StatusEffectHandler } from '@battle/StatusEffectHandler';
import type { BattleScene } from './BattleScene';
import type { PokemonInstance } from '@data/interfaces';

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

    // Initialize status effect handler for this battle
    this.statusHandler = new StatusEffectHandler();
    const b = this.battle();
    this.statusHandler.initPokemon(b.playerPokemon);
    this.statusHandler.initPokemon(b.enemyPokemon);

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
    if (this.state === 'message') { this.state = 'actions'; this.showActions(); this.msg('What will you do?'); return; }
    if (this.state === 'actions') this.selectAction();
    else if (this.state === 'moves') this.selectMove();
  }

  private cancel(): void {
    if (this.state === 'animating') return;
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

  /** Run end-of-turn residual damage (burn, poison) for both Pokemon. */
  private runEndOfTurn(order: { attacker: PokemonInstance; defender: PokemonInstance; moveId: string; isPlayer: boolean }[]): void {
    const b = this.battle();
    const player = b.playerPokemon;
    const enemy = b.enemyPokemon;

    // Collect end-of-turn effects for both sides
    const pokemonToCheck: { pokemon: PokemonInstance; isPlayer: boolean }[] = [];
    if (player.currentHp > 0) pokemonToCheck.push({ pokemon: player, isPlayer: true });
    if (enemy.currentHp > 0) pokemonToCheck.push({ pokemon: enemy, isPlayer: false });

    this.runEndOfTurnStep(pokemonToCheck, 0);
  }

  private runEndOfTurnStep(
    pokemonToCheck: { pokemon: PokemonInstance; isPlayer: boolean }[],
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

    const { pokemon, isPlayer } = pokemonToCheck[idx];
    const eotResult = this.statusHandler.applyEndOfTurn(pokemon);
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
    const expGained = ExperienceCalculator.calculateExp(b.enemyPokemon, false);
    const name = pokemonData[player.dataId]?.name ?? '???';

    this.msg(`${name} gained ${expGained} EXP. Points!`);
    this.state = 'animating';

    // Award EXP
    const prevLevel = player.level;
    const result = ExperienceCalculator.awardExp(player, expGained);

    // Animate EXP bar
    this.time.delayedCall(800, () => {
      if (result.levelsGained > 0) {
        // First animate EXP bar to full (for level completing), then show level-up
        b.animateExpBar(1, 400);
        this.time.delayedCall(600, () => {
          this.runLevelUpSequence(name, prevLevel, result.newLevel, result.newMoves, 0);
        });
      } else {
        // Just animate EXP bar to new position
        b.animateExpBar(b.getExpPercent(), 600);
        this.time.delayedCall(1200, () => {
          this.state = 'message';
          this.msg('Press Enter to continue...');
          this.waitForConfirmThen(() => this.endBattle());
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

    // Reset EXP bar for new level
    this.time.delayedCall(200, () => {
      b.expBar.displayWidth = 0;
      b.animateExpBar(b.getExpPercent(), 400);
    });

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
      this.state = 'message';
      this.msg('Press Enter to continue...');
      this.waitForConfirmThen(() => this.endBattle());
    }
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

  private endBattle(): void {
    this.statusHandler.cleanup();
    this.scene.stop();
    this.scene.stop('BattleScene');
    this.scene.start('OverworldScene');
  }
}
