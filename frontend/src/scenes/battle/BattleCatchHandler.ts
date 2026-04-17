import Phaser from 'phaser';
import { CatchCalculator } from '@battle/calculation/CatchCalculator';
import { itemData } from '@data/item-data';
import { moveData } from '@data/moves';
import { pokemonData } from '@data/pokemon';
import { AudioManager } from '@managers/AudioManager';
import { GameManager } from '@managers/GameManager';
import { SFX, BGM } from '@utils/audio-keys';
import { FONTS, COLORS, isMobile } from '@ui/theme';
import { ui } from '@utils/ui-layout';
import type { PokemonInstance } from '@data/interfaces';
import type { BattleScene } from './BattleScene';

export interface CatchContext {
  scene: Phaser.Scene;
  battle(): BattleScene;
  msg(text: string): void;
  setState(state: string): void;
  hideActions(): void;
  pickEnemyMove(enemy: PokemonInstance): string;
  executeMove(
    order: { attacker: PokemonInstance; defender: PokemonInstance; moveId: string; isPlayer: boolean }[],
    idx: number,
    name: string,
    moveName: string,
  ): void;
  waitForConfirmThen(callback: () => void): void;
  endBattle(): void;
}

export function handlePokeBallUse(ctx: CatchContext, ballItemId: string): void {
  const b = ctx.battle();

  if (b.isTrainerBattle) {
    ctx.msg("You can't catch a trainer's Pokémon!");
    ctx.setState('message');
    return;
  }

  ctx.setState('animating');
  ctx.hideActions();

  const ballData = itemData[ballItemId];
  const multiplier = ballData?.effect?.catchRateMultiplier ?? 1;
  const result = CatchCalculator.calculate(b.enemyPokemon, multiplier);
  const audio = AudioManager.getInstance();

  ctx.msg(`You threw a ${ballData?.name ?? 'Poké Ball'}!`);
  audio.playSFX(SFX.BALL_THROW);

  const ballGfx = ctx.scene.add.circle(200, 400, 8, 0xff3333).setDepth(100);
  ctx.scene.add.circle(200, 400, 4, 0xffffff).setDepth(101);

  ctx.scene.tweens.add({
    targets: ballGfx,
    x: b.enemySprite.x,
    y: b.enemySprite.y,
    duration: 500,
    ease: 'Sine.easeIn',
    onComplete: () => {
      ballGfx.destroy();
      b.enemySprite.setAlpha(0);
      runShakeSequence(ctx, result.shakes, result.caught, 0);
    },
  });
}

function runShakeSequence(ctx: CatchContext, totalShakes: number, caught: boolean, currentShake: number): void {
  const b = ctx.battle();
  const audio = AudioManager.getInstance();

  if (currentShake < totalShakes) {
    const ballX = b.enemySprite.x;
    const ballY = b.enemySprite.y + 20;
    const shakeGfx = ctx.scene.add.circle(ballX, ballY, 10, 0xff3333).setDepth(100);
    const shakeHighlight = ctx.scene.add.circle(ballX - 2, ballY - 2, 4, 0xffffff).setDepth(101);

    ctx.scene.time.delayedCall(400, () => {
      audio.playSFX(SFX.BALL_SHAKE);
      ctx.scene.tweens.add({
        targets: [shakeGfx, shakeHighlight],
        x: ballX + 8,
        duration: 100,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          shakeGfx.destroy();
          shakeHighlight.destroy();
          ctx.scene.time.delayedCall(300, () => {
            runShakeSequence(ctx, totalShakes, caught, currentShake + 1);
          });
        },
      });
    });
  } else if (caught) {
    onCatchSuccess(ctx);
  } else {
    onCatchFailure(ctx);
  }
}

function onCatchSuccess(ctx: CatchContext): void {
  const b = ctx.battle();
  const audio = AudioManager.getInstance();
  const gm = GameManager.getInstance();
  const enemy = b.enemyPokemon;
  const enemyData = pokemonData[enemy.dataId];
  const name = enemyData?.name ?? '???';

  audio.playSFX(SFX.CATCH_SUCCESS);

  const sparkle = ctx.scene.add.text(b.enemySprite.x, b.enemySprite.y, '✦', {
    fontSize: '32px', color: '#ffcc00',
  }).setOrigin(0.5).setDepth(100);
  ctx.scene.tweens.add({
    targets: sparkle,
    y: sparkle.y - 30,
    alpha: 0,
    duration: 800,
    onComplete: () => sparkle.destroy(),
  });

  ctx.msg(`Gotcha! ${name} was caught!`);

  ctx.scene.time.delayedCall(1800, () => {
    const added = gm.addToParty(enemy);
    gm.markSeen(enemy.dataId);
    gm.markCaught(enemy.dataId);

    if (added && gm.getParty().length > 6) {
      ctx.msg(`${name} was sent to the PC!`);
    } else if (added) {
      ctx.msg(`${name} was added to your party!`);
    } else {
      ctx.msg(`All boxes are full! ${name} could not be stored.`);
    }

    ctx.scene.time.delayedCall(1500, () => {
      promptNickname(ctx, enemy, name, () => {
        audio.playBGM(BGM.VICTORY);
        ctx.setState('message');
        ctx.msg(isMobile() ? 'Tap to continue...' : 'Press Enter to continue...');
        ctx.waitForConfirmThen(() => ctx.endBattle());
      });
    });
  });
}

function onCatchFailure(ctx: CatchContext): void {
  const b = ctx.battle();
  const enemyData = pokemonData[b.enemyPokemon.dataId];
  const name = enemyData?.name ?? '???';

  b.enemySprite.setAlpha(1);

  const breakMessages = [
    `Oh no! ${name} broke free!`,
    `Aww! It appeared to be caught!`,
    `Aargh! Almost had it!`,
    `Shoot! It was so close, too!`,
  ];
  const msg = breakMessages[Math.floor(Math.random() * breakMessages.length)];
  ctx.msg(msg);

  ctx.scene.time.delayedCall(1200, () => {
    const enemyMoveId = ctx.pickEnemyMove(b.enemyPokemon);
    const enemyMove = moveData[enemyMoveId];
    const enemyName = enemyData?.name ?? '???';
    const moveName = enemyMove?.name ?? enemyMoveId;

    ctx.executeMove(
      [{ attacker: b.enemyPokemon, defender: b.playerPokemon, moveId: enemyMoveId, isPlayer: false }],
      0,
      enemyName,
      moveName,
    );
  });
}

function promptNickname(ctx: CatchContext, pokemon: PokemonInstance, speciesName: string, callback: () => void): void {
  ctx.msg(`Would you like to give a nickname to ${speciesName}?`);
  ctx.setState('animating');

  const scene = ctx.scene;
  const { cx } = ui(scene);
  const yesText = scene.add.text(cx - 60, scene.scale.height - 60, 'YES', {
    ...FONTS.menuItem, fontSize: '18px', color: COLORS.textHighlight,
  }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(200);
  const noText = scene.add.text(cx + 60, scene.scale.height - 60, 'NO', {
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
    scene.input.keyboard!.off('keydown-LEFT', onLeft);
    scene.input.keyboard!.off('keydown-RIGHT', onRight);
    scene.input.keyboard!.off('keydown-ENTER', onConfirm);
    scene.input.keyboard!.off('keydown-SPACE', onConfirm);
  };

  const onLeft = () => { cursor = 0; updateCursor(); };
  const onRight = () => { cursor = 1; updateCursor(); };
  const onConfirm = () => {
    cleanup();
    if (cursor === 0) {
      scene.scene.launch('NicknameScene', { pokemon, speciesName });
      scene.scene.get('NicknameScene').events.once('shutdown', () => {
        callback();
      });
    } else {
      callback();
    }
  };

  yesText.on('pointerdown', () => { cursor = 0; onConfirm(); });
  noText.on('pointerdown', () => { cursor = 1; onConfirm(); });
  scene.input.keyboard!.on('keydown-LEFT', onLeft);
  scene.input.keyboard!.on('keydown-RIGHT', onRight);
  scene.input.keyboard!.on('keydown-ENTER', onConfirm);
  scene.input.keyboard!.on('keydown-SPACE', onConfirm);
}
