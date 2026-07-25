import { describe, expect, it } from 'vitest';
import { createPokemonByIdFactory } from '../../helpers/pokemon-factory';
import {
  BattleOrchestrationEngine,
  doubleBattleFormatStrategy,
  singleBattleFormatStrategy,
} from '../../../frontend/src/battle/core/BattleEngine';


const makePokemon = createPokemonByIdFactory('standard-exp');

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
