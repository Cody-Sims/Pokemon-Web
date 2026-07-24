import { describe, expect, it } from 'vitest';
import { BattleManager } from '../../../frontend/src/battle/core/BattleManager';
import { MoveExecutor } from '../../../frontend/src/battle/execution/MoveExecutor';
import { createPokemonFactory } from '../../helpers/pokemon-factory';


const makePokemon = createPokemonFactory('battle-rng');

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

    expect(first.turns).toHaveLength(3);
    expect(first.pp).toBe(12);
    expect(first.turns.some(turn => turn.hit || turn.damage > 0 || turn.totalHits !== null)).toBe(true);
    expect(second).toEqual(first);
    expect(different).not.toEqual(first);
  });
});
