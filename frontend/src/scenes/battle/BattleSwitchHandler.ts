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
      // BUG-001: A voluntary switch never faints the prior Pokémon, so the
      // sprite transform is still valid — just refresh HP.
      b.updateHpBars();
      const name = pData?.name ?? '???';
      this.scene.msg(`Go! ${name}!`);
      this.scene.statusHandler.clearPokemon(party[index]);
      this.scene.statusHandler.initPokemon(party[0]);

      // Fire switch-in abilities (Intimidate, Drizzle, etc.)
      const switchResult = AbilityHandler.onSwitchIn(
        party[0],
        b.enemyPokemon,
        this.scene.statusHandler,
      );
      if (switchResult.messages.length > 0) {
        this.scene.showMessageQueue(switchResult.messages, 0, () => {});
      }
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
        this.scene.statusHandler.initPokemon(party[0]);

        // Fire switch-in abilities (Intimidate, Drizzle, etc.)
        const switchResult = AbilityHandler.onSwitchIn(
          party[0],
          b.enemyPokemon,
          this.scene.statusHandler,
        );
        if (switchResult.messages.length > 0) {
          this.scene.showMessageQueue(switchResult.messages, 0, () => {});
        }
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
   *
   * BUG-002: PartyScene only reads the `selectMode` flag, so the previous
   * `{ forcedSwitch: true }` was silently ignored — the menu opened in
   * browse mode and the active slot was always the first alive Pokémon
   * regardless of what the player tapped. Now we open in selectMode and
   * listen for `pokemon-selected` so the chosen Pokémon actually goes out.
   *
   * BUG-001: faintSprite() left the player back-sprite at scaleY=0/alpha=0.
   * After picking a replacement we call resetPlayerSprite() so the new
   * Pokémon emerges from the player slot instead of being invisible.
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
      this.scene.scene.launch('PartyScene', { selectMode: true, forcedSwitch: true });
      const partyScene = this.scene.scene.get('PartyScene');
      let chosenIndex = -1;

      partyScene.events.once('pokemon-selected', (index: number) => {
        const party = gm.getParty();
        if (index >= 0 && party[index] && party[index].currentHp > 0) {
          chosenIndex = index;
        }
      });

      partyScene.events.once('shutdown', () => {
        this.scene.scene.wake();
        const party = gm.getParty();
        // Fall back to the first alive Pokémon if the user somehow closed
        // the menu without picking (defensive — PartyScene's forcedSwitch
        // mode disables ESC to prevent this).
        let newActive = chosenIndex >= 0 ? party[chosenIndex] : undefined;
        if (!newActive || newActive.currentHp <= 0) {
          newActive = party.find(p => p.currentHp > 0);
        }
        if (!newActive) return;

        // Swap the chosen Pokémon to the active slot.
        const activeIdx = party.indexOf(newActive);
        if (activeIdx > 0) {
          const tmp = party[0];
          party[0] = party[activeIdx];
          party[activeIdx] = tmp;
        }

        const b = this.scene.battle();
        b.playerPokemon = party[0];
        const newData = pokemonData[party[0].dataId];
        if (newData?.spriteKeys?.back) {
          b.playerSprite.setTexture(newData.spriteKeys.back);
        }
        // BUG-001: restore visibility — the previous Pokémon faintSprite'd
        // the back-sprite to scaleY=0/alpha=0.
        b.resetPlayerSprite();
        b.updateHpBars();
        this.scene.statusHandler.initPokemon(party[0]);

        const switchResult = AbilityHandler.onSwitchIn(
          party[0],
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
      });
    });
  }
}
