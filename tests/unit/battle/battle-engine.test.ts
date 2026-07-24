import { describe, expect, it } from 'vitest';
import {
  BattleOrchestrationEngine,
  doubleBattleFormatStrategy,
  singleBattleFormatStrategy,
} from '../../../frontend/src/battle/core/BattleEngine';
import { PokemonInstance } from '../../../frontend/src/data/interfaces';

const makePokemon = (dataId: number): PokemonInstance => ({
  dataId,
  level: 10,
  currentHp: 30,
  stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 },
  ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy',
  moves: [{ moveId: 'ember', currentPp: 25 }],
  status: null,
  exp: 1000,
  friendship: 70,
});

describe('BattleOrchestrationEngine', () => {
  it('initializes single battle active slots through the format strategy', () => {
    const player = makePokemon(4);
    const enemy = makePokemon(16);
    const active = singleBattleFormatStrategy.createInitialActive({
      playerParty: [player],
      enemyParty: [enemy],
    });

    expect(singleBattleFormatStrategy.getActivePokemon(active)).toEqual([player, enemy]);
  });

  it('initializes double battle active slots through the format strategy', () => {
    const player = makePokemon(4);
    const ally = makePokemon(7);
    const enemy1 = makePokemon(16);
    const enemy2 = makePokemon(19);
    const active = doubleBattleFormatStrategy.createInitialActive({
      type: 'tag-battle',
      playerParty: [player],
      allyParty: [ally],
      enemyParty1: [enemy1],
      enemyParty2: [enemy2],
    });

    expect(doubleBattleFormatStrategy.getActivePokemon(active)).toEqual([
      player,
      ally,
      enemy1,
      enemy2,
    ]);
    expect(active.playerSlotMapping[1]?.party).toEqual([ally]);
  });

  it('emits internal state events without changing public manager signatures', () => {
    const engine = new BattleOrchestrationEngine({ format: 'single' });

    engine.transition('INTRO');
    engine.transition('PLAYER_TURN');

    expect(engine.drainEvents().map((event) => event.state)).toEqual(['INTRO', 'PLAYER_TURN']);
  });
});
