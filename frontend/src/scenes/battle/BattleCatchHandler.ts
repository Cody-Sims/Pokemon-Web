import Phaser from 'phaser';
import { CatchCalculator } from '@battle/calculation/CatchCalculator';
import { itemData } from '@data/item-data';
import { moveData } from '@data/moves';
import { pokemonData } from '@data/pokemon';
import { AudioManager } from '@managers/AudioManager';
import { GameManager } from '@managers/GameManager';
import { AchievementManager } from '@managers/AchievementManager';
import { blockReasonForCatch } from '@systems/engine/ChallengeRules';
import { SFX, BGM } from '@utils/audio-keys';
import { FONTS, COLORS, isMobile, mobileFontSize } from '@ui/theme';
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

  // Challenge-mode gate: monotype / solo / minimal-catches.
  const blockMsg = blockReasonForCatch(b.enemyPokemon);
  if (blockMsg) {
    ctx.msg(blockMsg);
    ctx.setState('message');
    return;
  }

  ballThrowCount++;
  ctx.setState('animating');
  ctx.hideActions();

  const ballData = itemData[ballItemId];
  const multiplier = ballData?.effect?.catchRateMultiplier ?? 1;
  const result = CatchCalculator.calculate(b.enemyPokemon, multiplier);
  const audio = AudioManager.getInstance();

  ctx.msg(`You threw a ${ballData?.name ?? 'Poké Ball'}!`);
  audio.playSFX(SFX.BALL_THROW);

  // BUG-045: The enemy sprite may still be mid-tween (slide-in or flash)
  // when the player opens BAG → Pokéball. Kill any in-flight tweens so the
  // sprite is at its final slot position, then snapshot that position so
  // the throw target + every shake position is stable.
  ctx.scene.tweens.killTweensOf(b.enemySprite);
  b.enemySprite.setAlpha(1);
  const enemyAnchorX = b.enemySprite.x;
  const enemyAnchorY = b.enemySprite.y;

  // BUG-021: Throw originates from the player back-sprite, not a hard-coded
  // (200, 400) which on portrait mobile sat above the actual Pokémon.
  // BUG-020: Capture the highlight dot so it can be destroyed alongside
  // ballGfx — previous code orphaned a white pixel on screen for the rest
  // of the battle and stacked another every throw.
  const startX = b.playerSprite?.x ?? 200;
  const startY = (b.playerSprite?.y ?? 400) - 20;
  const ballGfx = ctx.scene.add.circle(startX, startY, 8, 0xff3333).setDepth(100);
  const ballHighlight = ctx.scene.add.circle(startX - 2, startY - 2, 4, 0xffffff).setDepth(101);

  ctx.scene.tweens.add({
    targets: [ballGfx, ballHighlight],
    x: enemyAnchorX,
    y: enemyAnchorY,
    duration: 500,
    ease: 'Sine.easeIn',
    onComplete: () => {
      ballGfx.destroy();
      ballHighlight.destroy();
      b.enemySprite.setAlpha(0);
      runShakeSequence(ctx, result.shakes, result.caught, 0, enemyAnchorX, enemyAnchorY);
    },
  });
}

function runShakeSequence(
  ctx: CatchContext,
  totalShakes: number,
  caught: boolean,
  currentShake: number,
  // BUG-069: Pin ball coordinates to the captured slot anchor so every
  // shake renders in the same place even if the enemy sprite is later
  // tweened. Previous code re-read enemySprite.x/y per-shake and the icon
  // jumped between shakes when the sprite was mid-fade.
  ballX: number = 0,
  ballY: number = 0,
): void {
  const b = ctx.battle();
  const audio = AudioManager.getInstance();

  if (currentShake < totalShakes) {
    const shakeX = ballX || b.enemySprite.x;
    const shakeY = (ballY || b.enemySprite.y) + 20;
    const shakeGfx = ctx.scene.add.circle(shakeX, shakeY, 10, 0xff3333).setDepth(100);
    const shakeHighlight = ctx.scene.add.circle(shakeX - 2, shakeY - 2, 4, 0xffffff).setDepth(101);

    ctx.scene.time.delayedCall(400, () => {
      audio.playSFX(SFX.BALL_SHAKE);
      ctx.scene.tweens.add({
        targets: [shakeGfx, shakeHighlight],
        x: shakeX + 8,
        duration: 100,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          shakeGfx.destroy();
          shakeHighlight.destroy();
          ctx.scene.time.delayedCall(300, () => {
            runShakeSequence(ctx, totalShakes, caught, currentShake + 1, ballX, ballY);
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

// Gen-1 legendary Pokémon IDs
const LEGENDARY_IDS = new Set([144, 145, 146, 150, 151]); // Articuno, Zapdos, Moltres, Mewtwo, Mew

/** Tracks ball throws within the current battle for catch-first-ball achievement. */
let ballThrowCount = 0;

/** Reset ball throw count at the start of a new battle. */
export function resetBallThrowCount(): void {
  ballThrowCount = 0;
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
    fontSize: mobileFontSize(32), color: '#ffcc00',
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

    // ── Catch achievements ──
    const am = AchievementManager.getInstance();
    gm.incrementStat('totalCatches');
    const caughtCount = gm.getPokedex().caught.length;
    if (caughtCount >= 10) am.unlock('catch-10');
    if (caughtCount >= 50) am.unlock('catch-50');
    if (caughtCount >= 100) am.unlock('catch-100');
    if (caughtCount >= 151) am.unlock('catch-all');
    if (enemy.isShiny) am.unlock('shiny-catch');
    if (LEGENDARY_IDS.has(enemy.dataId)) am.unlock('legendary-catch');
    if (gm.getParty().length >= 6) am.unlock('full-party');

    // catch-first-ball: only unlock if this was the very first ball thrown
    if (ballThrowCount === 1) am.unlock('catch-first-ball');

    // all-starters: check if player owns all 3 starter lines (Bulbasaur/Charmander/Squirtle families)
    const STARTER_BASES = [1, 4, 7]; // Bulbasaur, Charmander, Squirtle
    const allPokemon = [...gm.getParty(), ...gm.getBoxes().flat()];
    const allIds = new Set(allPokemon.map(p => p.dataId));
    if (STARTER_BASES.every(base => allIds.has(base) || allIds.has(base + 1) || allIds.has(base + 2))) {
      am.unlock('all-starters');
    }

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
    ...FONTS.menuItem, fontSize: mobileFontSize(18), color: COLORS.textHighlight,
  }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(200);
  const noText = scene.add.text(cx + 60, scene.scale.height - 60, 'NO', {
    ...FONTS.menuItem, fontSize: mobileFontSize(18), color: COLORS.textWhite,
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
  // AUDIT-056: Clean up listeners if scene shuts down mid-prompt
  scene.events.once('shutdown', cleanup);
}
