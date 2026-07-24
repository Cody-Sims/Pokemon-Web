import { seededRandom } from '@utils/math-helpers';

export interface BattleRng {
  next(): number;
  chance(probability: number): boolean;
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
}

export class GlobalBattleRng implements BattleRng {
  next(): number {
    return seededRandom();
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('BattleRng.pick requires at least one item.');
    }
    return items[this.int(0, items.length - 1)];
  }
}

export class SeededBattleRng implements BattleRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6D2B79F5) | 0;
    let value = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('BattleRng.pick requires at least one item.');
    }
    return items[this.int(0, items.length - 1)];
  }
}

export const globalBattleRng = new GlobalBattleRng();

export function createBattleRng(seed?: number, rng?: BattleRng): BattleRng {
  if (rng) return rng;
  return seed === undefined ? globalBattleRng : new SeededBattleRng(seed);
}
