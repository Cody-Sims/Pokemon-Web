import { describe, expect, it } from 'vitest';
import { PokemonInstance } from '../../../frontend/src/data/interfaces';
import { BattleManager } from '../../../frontend/src/battle/core/BattleManager';
import { MoveExecutor } from '../../../frontend/src/battle/execution/MoveExecutor';

const makePokemon = (overrides: Partial<PokemonInstance> = {}): PokemonInstance => ({
  dataId: 4,
  level: 30,
  currentHp: 95,
  stats: { hp: 95, attack: 65, defense: 55, spAttack: 70, spDefense: 60, speed: 70 },
  ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy',
  moves: [{ moveId: 'fury-swipes', currentPp: 15 }],
  status: null,
  exp: 0,
  friendship: 70,
  ...overrides,
});

interface BattleSnapshot {
  attackerHp: number;
  defenderHp: number;
  pp: number;
  turns: {
    damage: number;
    hit: boolean;
    critical: boolean;
    totalHits: number | null;
    messages: string[];
  }[];
}

function runSequence(seed: number): BattleSnapshot {
  const attacker = makePokemon({ nickname: 'Aurum' });
  const defender = makePokemon({ dataId: 1, nickname: 'Verdant' });
  const manager = new BattleManager({ type: 'wild', playerParty: [attacker], enemyParty: [defender], rngSeed: seed });
  const turns: BattleSnapshot['turns'] = [];

  for (let i = 0; i < 3 && attacker.currentHp > 0 && defender.currentHp > 0; i++) {
    const result = MoveExecutor.execute(
      attacker,
      defender,
      'fury-swipes',
      manager.getStatusHandler(),
      manager.getWeatherManager(),
      false,
      manager.getRng(),
    );
    turns.push({
      damage: result.damage.damage,
      hit: result.moveHit,
      critical: result.damage.isCritical,
      totalHits: result.totalHits ?? null,
      messages: result.effectMessages,
    });
  }

  return {
    attackerHp: attacker.currentHp,
    defenderHp: defender.currentHp,
    pp: attacker.moves[0].currentPp,
    turns,
  };
}

describe('BattleRng deterministic battle sequences', () => {
  it('replays identical outcomes for the same seed and diverges for a different seed', () => {
    const first = runSequence(20260724);
    const second = runSequence(20260724);
    const different = runSequence(20260725);

    expect(second).toEqual(first);
    expect(different).not.toEqual(first);
  });
});
