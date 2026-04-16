import { GameManager } from '@managers/GameManager';
import { moveData } from '@data/moves';

/** Heal all Pokémon in the party to full HP and PP, clear status. */
export function healParty(): void {
  const gm = GameManager.getInstance();
  const party = gm.getParty();
  for (let i = 0; i < party.length; i++) {
    const pokemon = party[i];
    pokemon.currentHp = pokemon.stats.hp;
    pokemon.status = null;
    pokemon.statusTurns = undefined;
    for (const move of pokemon.moves) {
      const md = moveData[move.moveId];
      move.currentPp = md?.pp ?? move.currentPp;
    }
    gm.adjustFriendship(i, 1);
  }
}
