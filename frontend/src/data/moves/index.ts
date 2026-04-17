// ─── Move Registry ───
// Re-exports the combined moveData record from per-type files.

import { MoveData } from '../interfaces';
import { normalMoves } from './normal';
import { fireMoves } from './fire';
import { waterMoves } from './water';
import { electricMoves } from './electric';
import { grassMoves } from './grass';
import { iceMoves } from './ice';
import { fightingMoves } from './fighting';
import { poisonMoves } from './poison';
import { groundMoves } from './ground';
import { flyingMoves } from './flying';
import { psychicMoves } from './psychic';
import { bugMoves } from './bug';
import { rockMoves } from './rock';
import { ghostMoves } from './ghost';
import { dragonMoves } from './dragon';
import { darkMoves } from './dark';
import { fairyMoves } from './fairy';
import { steelMoves } from './steel';

export const moveData: Record<string, MoveData> = {
  ...normalMoves,
  ...fireMoves,
  ...waterMoves,
  ...electricMoves,
  ...grassMoves,
  ...iceMoves,
  ...fightingMoves,
  ...poisonMoves,
  ...groundMoves,
  ...flyingMoves,
  ...psychicMoves,
  ...bugMoves,
  ...rockMoves,
  ...ghostMoves,
  ...dragonMoves,
  ...darkMoves,
  ...fairyMoves,
  ...steelMoves,
};
