import { pokemonData } from '@data/pokemon';
import { GameManager } from '@managers/GameManager';
import { AchievementManager } from '@managers/AchievementManager';
import { AbilityHandler } from '@battle/effects/AbilityHandler';
import type { BattleUIScene } from './BattleUIScene';

/**
 * Handles the POKEMON action: voluntary party switching during battle
 * and forced switching after a player Pokemon faints.
 */
export class BattleSwitchHandler {
  private scene: BattleUIScene;

  constructor(scene: BattleUIScene) {
    this.scene = scene;
  }

  /** Open the party screen for a voluntary in-battle switch (POKEMON action). */
  openPartyMenu(): void {
    this.scene.scene.sleep();
    this.scene.scene.launch('PartyScene', { selectMode: true });
    const partyScene = this.scene.scene.get('PartyScene');
    let switched = false;

    // Listen for pokemon selection (BUG-063)
    partyScene.events.once('pokemon-selected', (index: number) => {
      switched = true;
      const gm = GameManager.getInstance();
      const party = gm.getParty();
      const b = this.scene.battle();

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
      this.scene.msg(`Go! ${name}!`);
      this.scene.statusHandler.clearPokemon(party[index]);
    });

    partyScene.events.once('shutdown', () => {
      this.scene.scene.wake();
      if (switched) {
        // Enemy gets a free attack after switch (BUG-063)
        this.scene.executeEnemyOnlyTurn();
      }
    });
  }

  /** Check if the player has alive party members (for BUG-062). */
  hasAlivePartyMember(): boolean {
    const party = GameManager.getInstance().getParty();
    return party.some(p => p.currentHp > 0);
  }

  /** Prompt the player to choose a replacement Pokemon after a faint. */
  promptPartySwitch(): void {
    this.scene.msg('Choose a Pok\u00e9mon!');
    this.scene.scene.sleep();
    this.scene.scene.launch('PartyScene', { selectMode: true });
    const partyScene = this.scene.scene.get('PartyScene');

    partyScene.events.once('pokemon-selected', (index: number) => {
      const gm = GameManager.getInstance();
      const party = gm.getParty();
      if (index > 0 && party[index] && party[index].currentHp > 0) {
        const temp = party[0];
        party[0] = party[index];
        party[index] = temp;
        const b = this.scene.battle();
        b.playerPokemon = party[0];
        const pData = pokemonData[party[0].dataId];
        if (pData) b.playerSprite.setTexture(pData.spriteKeys.back);
        b.updateHpBars();
        const name = pData?.name ?? '???';
        this.scene.msg(`Go! ${name}!`);
        this.scene.statusHandler.clearPokemon(party[index]);
      }
    });

    partyScene.events.once('shutdown', () => {
      this.scene.scene.wake();
      this.scene.time.delayedCall(600, () => {
        this.scene.state = 'actions';
        this.scene.showActions();
        this.scene.msg('What will you do?');
      });
    });
  }

  /**
   * Handle the forced switch after a player Pokemon faints mid-battle.
   * Called from turn execution when the player's Pokemon is KO'd.
   */
  handleFaintedSwitch(): void {
    const gm = GameManager.getInstance();
    const aliveParty = gm.getParty().filter(p => p.currentHp > 0);

    if (aliveParty.length === 0) {
      AchievementManager.getInstance().unlock('full-team-faint');
      this.scene.msg('You blacked out...');
      this.scene.state = 'message';
      this.scene.time.delayedCall(2000, () => this.scene.endBattle());
      return;
    }

    // Prompt player to switch
    this.scene.msg('Choose your next Pok\u00e9mon!');
    this.scene.time.delayedCall(800, () => {
      this.scene.scene.sleep();
      this.scene.scene.launch('PartyScene', { forcedSwitch: true });
      this.scene.scene.get('PartyScene').events.once('shutdown', () => {
        this.scene.scene.wake();
        const b = this.scene.battle();
        const newActive = gm.getParty().find(p => p.currentHp > 0);
        if (newActive) {
          b.playerPokemon = newActive;
          const newData = pokemonData[newActive.dataId];
          if (newData?.spriteKeys?.back) {
            b.playerSprite.setTexture(newData.spriteKeys.back);
          }
          b.updateHpBars();
          this.scene.statusHandler.initPokemon(newActive);
          // Trigger switch-in abilities
          const switchResult = AbilityHandler.onSwitchIn(
            newActive,
            b.enemyPokemon,
            this.scene.statusHandler,
          );
          if (switchResult.messages.length > 0) {
            this.scene.showMessageQueue(switchResult.messages, 0, () => {
              this.scene.state = 'actions';
              this.scene.showActions();
              this.scene.msg('What will you do?');
            });
          } else {
            this.scene.state = 'actions';
            this.scene.showActions();
            this.scene.msg('What will you do?');
          }
        }
      });
    });
  }
}
