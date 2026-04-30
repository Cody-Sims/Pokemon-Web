import type { PokemonInstance } from '@data/interfaces';
import { handlePokeBallUse as doCatch, type CatchContext } from './BattleCatchHandler';
import type { BattleUIScene } from './BattleUIScene';

/**
 * Handles the BAG action: launching InventoryScene in battle mode,
 * listening for pokeball/item use, and delegating to BattleCatchHandler.
 */
export class BattleBagHandler {
  private scene: BattleUIScene;

  constructor(scene: BattleUIScene) {
    this.scene = scene;
  }

  /** Open the inventory in battle mode. */
  openBag(): void {
    this.scene.scene.sleep();
    this.scene.scene.launch('InventoryScene', { battleMode: true });
    const invScene = this.scene.scene.get('InventoryScene');
    let ballUsed = false;
    let itemUsed = false;

    // Listen for pokeball use
    invScene.events.once('use-pokeball', (ballItemId: string) => {
      // LOW-8: Set synchronously before any async work to prevent race conditions
      ballUsed = true;
      this.scene.scene.wake();
      this.handlePokeBallUse(ballItemId);
    });

    // Listen for non-ball item use in battle (BUG-064)
    invScene.events.once('use-battle-item', () => {
      itemUsed = true;
    });

    invScene.events.once('shutdown', () => {
      if (ballUsed) return;
      this.scene.scene.wake();
      // If a non-ball item was used, enemy gets a free attack (BUG-064)
      if (itemUsed) {
        this.scene.executeEnemyOnlyTurn();
      }
    });
  }

  private handlePokeBallUse(ballItemId: string): void {
    doCatch(this.catchContext(), ballItemId);
  }

  private catchContext(): CatchContext {
    return {
      scene: this.scene,
      battle: () => this.scene.battle(),
      msg: (t: string) => this.scene.msg(t),
      setState: (s: string) => { this.scene.state = s as 'actions' | 'moves' | 'animating' | 'message' | 'target-select'; },
      hideActions: () => this.scene.hideActions(),
      pickEnemyMove: (e: PokemonInstance) => this.scene.pickEnemyMove(e),
      executeMove: (order, idx, name, moveName) => this.scene.executeMove(order, idx, name, moveName),
      waitForConfirmThen: (cb: () => void) => this.scene.waitForConfirmThen(cb),
      endBattle: () => this.scene.endBattle(),
    };
  }
}
