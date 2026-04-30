import Phaser from 'phaser';
import { pokemonData } from '@data/pokemon';
import { moveData } from '@data/moves';
import { AudioManager } from '@managers/AudioManager';
import { GameManager } from '@managers/GameManager';
import { AchievementManager } from '@managers/AchievementManager';
import { SFX } from '@utils/audio-keys';
import { COLORS } from '@ui/theme';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';
import { SYNTHESIS_ITEM } from '@data/synthesis-data';
import { PartnerAI } from '@battle/core/PartnerAI';
import type { BattleUIScene } from './BattleUIScene';

/**
 * Manages the FIGHT / BAG / POKEMON / RUN action menu,
 * the SYNTH button, partner action indicator, and the RUN flee logic.
 */
export class BattleActionMenu {
  private scene: BattleUIScene;

  actionTexts: Phaser.GameObjects.Text[] = [];
  cursor = 0;
  // NIT-002: Single bordered panel instead of a hidden Rectangle stacked
  // beneath an identical NinePatchPanel.
  actionMenuBg!: NinePatchPanel;
  synthText?: Phaser.GameObjects.Text;
  partnerActionText?: Phaser.GameObjects.Text;
  fleeAttempts = 0;

  constructor(scene: BattleUIScene) {
    this.scene = scene;
  }

  updateCursor(): void {
    this.actionTexts.forEach((t, i) =>
      t.setColor(i === this.cursor ? COLORS.textHighlight : COLORS.textWhite),
    );
  }

  showActions(): void {
    this.actionMenuBg.setVisible(true);
    this.actionTexts.forEach(t => t.setVisible(true));
    this.updateSynthButton();
    this.updateCursor();
    this.updatePartnerAction();
  }

  hideActions(): void {
    this.actionMenuBg.setVisible(false);
    this.actionTexts.forEach(t => t.setVisible(false));
    this.synthText?.setVisible(false);
    this.partnerActionText?.setVisible(false);
  }

  selectAction(): void {
    switch (this.actionTexts[this.cursor].text) {
      case 'FIGHT':
        this.scene.openMoveMenu();
        break;
      case 'BAG':
        this.scene.bagHandler.openBag();
        break;
      case 'POKEMON':
        this.scene.switchHandler.openPartyMenu();
        break;
      case 'RUN': {
        const b = this.scene.battle();
        if (b.battleManager.getBattleType() === 'trainer') {
          this.scene.msg('Can\'t escape from a trainer battle!');
          return;
        }
        // Speed-based flee formula
        if (!this.fleeAttempts) this.fleeAttempts = 0;
        this.fleeAttempts++;
        const playerSpeed = this.scene.statusHandler.getEffectiveStat(b.playerPokemon, 'speed');
        const enemySpeed = this.scene.statusHandler.getEffectiveStat(b.enemyPokemon, 'speed');
        const fleeChance = Math.floor(
          (playerSpeed * 128 / Math.max(1, enemySpeed) + 30 * this.fleeAttempts) % 256,
        );
        if (playerSpeed >= enemySpeed || Math.random() * 256 < fleeChance) {
          AudioManager.getInstance().playSFX(SFX.RUN_SUCCESS);
          this.scene.msg('Got away safely!');
          this.scene.time.delayedCall(800, () => this.scene.endBattle());
        } else {
          this.scene.msg('Can\'t escape!');
          this.scene.state = 'animating';
          this.scene.time.delayedCall(800, () => {
            this.scene.executeEnemyOnlyTurn();
          });
        }
        break;
      }
    }
  }

  // ─── Synthesis ───

  updateSynthButton(): void {
    if (!this.synthText) return;
    const gm = GameManager.getInstance();
    const hasItem = gm.getItemCount(SYNTHESIS_ITEM) > 0;
    const canSynth = this.scene.synthesisHandler.canSynthesize(
      this.scene.battle().playerPokemon,
      hasItem,
    );
    this.synthText.setVisible(canSynth);
  }

  /** Compute and display what the partner Pokemon plans to do this turn. */
  updatePartnerAction(): void {
    if (!this.partnerActionText) return;
    const b = this.scene.battle();
    if (!b.isDouble) {
      this.partnerActionText.setVisible(false);
      return;
    }
    const partner = b.playerPokemonSlots[1];
    if (!partner || partner.currentHp <= 0) {
      this.partnerActionText.setVisible(false);
      return;
    }
    const partnerData = pokemonData[partner.dataId];
    const partnerName = partner.nickname ?? partnerData?.name ?? 'Partner';

    const enemies = [b.enemyPokemonSlots[0] ?? null, b.enemyPokemonSlots[1] ?? null];
    const ally = b.playerPokemon;
    const { moveId } = PartnerAI.selectMove(partner, enemies, ally);
    const md = moveData[moveId];
    const moveName = md?.name ?? moveId;

    this.partnerActionText.setText(`Partner ${partnerName} will use ${moveName}`);
    this.partnerActionText.setVisible(true);
  }

  activateSynthesis(): void {
    const b = this.scene.battle();
    const player = b.playerPokemon;
    const gm = GameManager.getInstance();
    const hasItem = gm.getItemCount(SYNTHESIS_ITEM) > 0;

    if (!this.scene.synthesisHandler.canSynthesize(player, hasItem)) return;

    this.scene.state = 'animating';
    this.hideActions();

    this.scene.cameras.main.flash(200, 255, 255, 255);
    AudioManager.getInstance().playSFX(SFX.STAT_UP);

    const { messages } = this.scene.synthesisHandler.activate(player);

    AchievementManager.getInstance().unlock('synthesis-first');
    b.showSynthesisAura();

    this.scene.time.delayedCall(300, () => {
      this.scene.showMessageQueue(messages, 0, () => {
        this.scene.time.delayedCall(400, () => {
          this.scene.state = 'actions';
          this.showActions();
          this.scene.openMoveMenu();
        });
      });
    });
  }
}
