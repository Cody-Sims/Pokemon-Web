import type { MoveId } from '@data/moves';

export interface ItemData {
  id: string;
  name: string;
  category: 'pokeball' | 'medicine' | 'battle' | 'key' | 'tm' | 'evolution';
  description: string;
  buyPrice?: number;
  effect: {
    type: 'heal-hp' | 'heal-status' | 'capture' | 'boost-stat' | 'key' | 'teach-move' | 'repel' | 'held-passive' | 'evolution-stone' | 'full-restore' | 'level-up';
    amount?: number;
    status?: string;
    catchRateMultiplier?: number;
    moveId?: MoveId;
    steps?: number;
    held?: string;
    stone?: string;
  };
}
