import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { moveData } from '@data/moves';
import { pokemonData } from '@data/pokemon';
import { ExperienceCalculator } from '@battle/calculation/ExperienceCalculator';
import { AudioManager } from '@managers/AudioManager';
import { GameManager } from '@managers/GameManager';
import { SFX, BGM } from '@utils/audio-keys';
import { isMobile } from '@ui/theme';
import { processTrainerRewards, getContinueMessage } from './BattleRewardHandler';
import { EventManager } from '@managers/EventManager';
import type { PokemonInstance } from '@data/interfaces';
import type { BattleScene } from './BattleScene';

export interface VictoryContext {
  scene: Phaser.Scene;
  battle(): BattleScene;
  msg(text: string): void;
  setState(state: string): void;
  hideActions(): void;
  showMessageQueue(messages: string[], idx: number, callback: () => void): void;
  waitForConfirmThen(callback: () => void): void;
  endBattle(): void;
  moveCursor: number;
  moveMenuBg?: Phaser.GameObjects.Rectangle;
  moveTexts: Phaser.GameObjects.Text[];
}

export function runVictorySequence(ctx: VictoryContext): void {
  const b = ctx.battle();
  const player = b.playerPokemon;
  const expGained = ExperienceCalculator.calculateExp(b.enemyPokemon, b.isTrainerBattle);
  const name = player.nickname ?? pokemonData[player.dataId]?.name ?? '???';

  const gm = GameManager.getInstance();
  const participantIdx = gm.getParty().indexOf(player);
  if (participantIdx >= 0) {
    gm.adjustFriendship(participantIdx, 3);
  }

  AudioManager.getInstance().playBGM(BGM.VICTORY);

  ctx.msg(`${name} gained ${expGained} EXP. Points!`);
  ctx.setState('animating');

  const prevLevel = player.level;
  const result = ExperienceCalculator.awardExp(player, expGained);

  AudioManager.getInstance().playSFX(SFX.EXP_FILL);
  b.animateExpBar(800);

  ctx.scene.time.delayedCall(800, () => {
    if (result.levelsGained > 0) {
      AudioManager.getInstance().playSFX(SFX.LEVEL_UP);
      ctx.scene.time.delayedCall(600, () => {
        runLevelUpSequence(ctx, name, prevLevel, result.newLevel, result.newMoves, 0);
      });
    } else {
      ctx.scene.time.delayedCall(1200, () => {
        checkEvolutionThenEnd(ctx);
      });
    }
  });
}

function runLevelUpSequence(ctx: VictoryContext, name: string, _fromLevel: number, toLevel: number, newMoves: string[], moveIdx: number): void {
  const b = ctx.battle();

  const { w, h, cx, cy } = ui(ctx.scene);
  const flash = ctx.scene.add.rectangle(cx, cy, w, h, 0xffffff, 0.6);
  ctx.scene.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });

  ctx.msg(`${name} grew to Lv.${toLevel}!`);
  b.updateLevelDisplay();
  b.updateHpBars();

  ctx.scene.time.delayedCall(1500, () => {
    const p = b.playerPokemon;
    ctx.msg(`HP: ${p.stats.hp} | ATK: ${p.stats.attack} | DEF: ${p.stats.defense} | SpA: ${p.stats.spAttack} | SpD: ${p.stats.spDefense} | SPD: ${p.stats.speed}`);

    ctx.scene.time.delayedCall(2000, () => {
      if (moveIdx < newMoves.length) {
        offerNewMove(ctx, name, newMoves, moveIdx);
      } else {
        ctx.setState('message');
        ctx.msg(isMobile() ? 'Tap to continue...' : 'Press Enter to continue...');
        ctx.waitForConfirmThen(() => ctx.endBattle());
      }
    });
  });
}

function offerNewMove(ctx: VictoryContext, pokeName: string, newMoves: string[], moveIdx: number): void {
  const newMoveId = newMoves[moveIdx];
  const md = moveData[newMoveId];
  if (!md) { offerNextOrEnd(ctx, pokeName, newMoves, moveIdx); return; }

  const b = ctx.battle();
  const player = b.playerPokemon;

  if (player.moves.length < 4) {
    player.moves.push({ moveId: newMoveId, currentPp: md.pp });
    ctx.msg(`${pokeName} learned ${md.name}!`);
    ctx.scene.time.delayedCall(1500, () => offerNextOrEnd(ctx, pokeName, newMoves, moveIdx));
    return;
  }

  ctx.msg(`${pokeName} wants to learn ${md.name}! But it already knows 4 moves.`);
  ctx.setState('animating');

  ctx.scene.time.delayedCall(1500, () => {
    ctx.msg(`Forget a move to learn ${md.name}?`);
    showMoveReplaceMenu(ctx, newMoveId, md.name, pokeName, newMoves, moveIdx);
  });
}

function showMoveReplaceMenu(ctx: VictoryContext, newMoveId: string, newMoveName: string, pokeName: string, newMoves: string[], moveIdx: number): void {
  const b = ctx.battle();
  const player = b.playerPokemon;
  const scene = ctx.scene;
  ctx.setState('moves');
  ctx.moveCursor = 0;

  ctx.hideActions();
  const { w: rw, h: rh, cx: rcx } = ui(scene);
  ctx.moveMenuBg = scene.add.rectangle(rcx, rh - 60, rw - 20, 100, 0x1a1a2e, 0.95).setStrokeStyle(2, 0xffffff);

  const options = [
    ...player.moves.map(m => { const d = moveData[m.moveId]; return d ? d.name : m.moveId; }),
    "Don't learn"
  ];

  ctx.moveTexts = options.map((label, i) => {
    const col = i % 2; const row = Math.floor(i / 2);
    const t = scene.add.text(rcx - 120 + col * 240, rh - 90 + row * 28,
      label, { fontSize: '14px', color: '#ffffff' }
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });
    t.on('pointerover', () => { ctx.moveCursor = i; updateReplaceCursor(ctx, options.length); });
    t.on('pointerdown', () => {
      ctx.moveCursor = i;
      handleMoveReplace(ctx, i, newMoveId, newMoveName, pokeName, newMoves, moveIdx);
    });
    return t;
  });

  updateReplaceCursor(ctx, options.length);

  const confirmHandler = () => {
    handleMoveReplace(ctx, ctx.moveCursor, newMoveId, newMoveName, pokeName, newMoves, moveIdx);
    scene.input.keyboard!.off('keydown-ENTER', confirmHandler);
    scene.input.keyboard!.off('keydown-SPACE', confirmHandler);
  };
  scene.input.keyboard!.on('keydown-ENTER', confirmHandler);
  scene.input.keyboard!.on('keydown-SPACE', confirmHandler);
}

function updateReplaceCursor(ctx: VictoryContext, len: number): void {
  ctx.moveTexts.forEach((t, i) => { if (i < len) t.setColor(i === ctx.moveCursor ? '#ffcc00' : '#ffffff'); });
}

function handleMoveReplace(ctx: VictoryContext, choice: number, newMoveId: string, newMoveName: string, pokeName: string, newMoves: string[], moveIdx: number): void {
  const b = ctx.battle();
  const player = b.playerPokemon;
  const md = moveData[newMoveId];

  ctx.moveMenuBg?.destroy();
  ctx.moveTexts.forEach(t => t.destroy());
  ctx.moveTexts = [];

  if (choice < player.moves.length && md) {
    const oldName = moveData[player.moves[choice].moveId]?.name ?? player.moves[choice].moveId;
    player.moves[choice] = { moveId: newMoveId, currentPp: md.pp };
    ctx.msg(`1, 2, and... Poof! ${pokeName} forgot ${oldName} and learned ${newMoveName}!`);
  } else {
    ctx.msg(`${pokeName} did not learn ${newMoveName}.`);
  }

  ctx.scene.time.delayedCall(1500, () => offerNextOrEnd(ctx, pokeName, newMoves, moveIdx));
}

function offerNextOrEnd(ctx: VictoryContext, pokeName: string, newMoves: string[], moveIdx: number): void {
  if (moveIdx + 1 < newMoves.length) {
    offerNewMove(ctx, pokeName, newMoves, moveIdx + 1);
  } else {
    checkEvolutionThenEnd(ctx);
  }
}

function checkEvolutionThenEnd(ctx: VictoryContext): void {
  const b = ctx.battle();
  const player = b.playerPokemon;

  const evolvesTo = ExperienceCalculator.checkLevelUpEvolution(player);
  if (evolvesTo === null) {
    showTrainerRewardsThenEnd(ctx);
    return;
  }

  const oldData = pokemonData[player.dataId];
  const newData = pokemonData[evolvesTo];
  if (!newData) {
    showTrainerRewardsThenEnd(ctx);
    return;
  }

  const oldName = oldData?.name ?? '???';
  ctx.msg(`What? ${oldName} is evolving!`);
  AudioManager.getInstance().playJingle(BGM.EVOLUTION, true);
  ctx.setState('animating');

  ctx.scene.time.delayedCall(1200, () => {
    let flashCount = 0;
    ctx.scene.time.addEvent({
      delay: 150,
      repeat: 7,
      callback: () => {
        flashCount++;
        b.playerSprite.setAlpha(flashCount % 2 === 0 ? 1 : 0.1);
        b.playerSprite.setTint(flashCount % 2 === 0 ? 0xffffff : 0xddddff);
      },
    });

    ctx.scene.time.delayedCall(1400, () => {
      const { w: ew, h: eh, cx: ecx, cy: ecy } = ui(ctx.scene);
      const flash = ctx.scene.add.rectangle(ecx, ecy, ew, eh, 0xffffff, 0.9);
      ctx.scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 600,
        onComplete: () => flash.destroy(),
      });

      player.dataId = evolvesTo;

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

      b.playerSprite.setTexture(newData.spriteKeys.back);
      b.playerSprite.setAlpha(1);
      b.playerSprite.clearTint();

      b.playerNameText.setText(newData.name);
      const gm = GameManager.getInstance();
      gm.markSeen(evolvesTo);
      gm.markCaught(evolvesTo);

      ctx.msg(`Congratulations! ${oldName} evolved into ${newData.name}!`);
      b.updateHpBars();
      b.updateLevelDisplay();

      ctx.scene.time.delayedCall(2500, () => {
        showTrainerRewardsThenEnd(ctx);
      });
    });
  });
}

function showTrainerRewardsThenEnd(ctx: VictoryContext): void {
  const b = ctx.battle();
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
    ctx.showMessageQueue(messages, 0, () => {
      ctx.setState('message');
      ctx.msg(continueMsg);
      ctx.waitForConfirmThen(() => ctx.endBattle());
    });
  } else {
    ctx.setState('message');
    ctx.msg(continueMsg);
    ctx.waitForConfirmThen(() => ctx.endBattle());
  }
}
