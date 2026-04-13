import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StatusEffectHandler } from '../../frontend/src/battle/StatusEffectHandler';
import { PokemonInstance, MoveData } from '../../frontend/src/data/interfaces';

beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(0.5); });

const makePokemon = (overrides?: Partial<PokemonInstance>): PokemonInstance => ({
  dataId: 4, level: 10, currentHp: 100,
  stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 55 },
  ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy', moves: [{ moveId: 'ember', currentPp: 25 }],
  status: null, exp: 0, friendship: 70, ...overrides,
});

describe('StatusEffectHandler — Extended Scenarios', () => {
  describe('stat stage multiplier accuracy', () => {
    it.each([
      [0, 1],
      [1, 1.5],
      [2, 2],
      [3, 2.5],
      [4, 3],
      [5, 3.5],
      [6, 4],
      [-1, 2 / 3],
      [-2, 2 / 4],
      [-3, 2 / 5],
      [-6, 2 / 8],
    ])('stage %d should multiply by %f', (stage, expected) => {
      const handler = new StatusEffectHandler();
      const pokemon = makePokemon();
      handler.initPokemon(pokemon);
      handler.getState(pokemon).statStages.attack = stage;
      const effective = handler.getEffectiveStat(pokemon, 'attack');
      expect(effective).toBe(Math.max(1, Math.floor(pokemon.stats.attack * expected)));
    });
  });

  describe('paralysis — speed and action', () => {
    it('should quarter speed stat', () => {
      const handler = new StatusEffectHandler();
      const mon = makePokemon({ status: 'paralysis' });
      handler.initPokemon(mon);
      expect(handler.getEffectiveStat(mon, 'speed')).toBe(Math.max(1, Math.floor(55 * 0.25)));
    });

    it('should prevent 25% of actions deterministically', () => {
      const handler = new StatusEffectHandler();
      const mon = makePokemon({ status: 'paralysis' });
      handler.initPokemon(mon);

      vi.spyOn(Math, 'random').mockReturnValue(0.24); // < 0.25 → paralyzed
      expect(handler.checkTurnStart(mon).canAct).toBe(false);

      vi.spyOn(Math, 'random').mockReturnValue(0.26); // >= 0.25 → can act
      expect(handler.checkTurnStart(mon).canAct).toBe(true);
    });

    it('paralysis should not reduce non-speed stats', () => {
      const handler = new StatusEffectHandler();
      const mon = makePokemon({ status: 'paralysis' });
      handler.initPokemon(mon);
      expect(handler.getEffectiveStat(mon, 'attack')).toBe(mon.stats.attack);
      expect(handler.getEffectiveStat(mon, 'defense')).toBe(mon.stats.defense);
      expect(handler.getEffectiveStat(mon, 'spAttack')).toBe(mon.stats.spAttack);
      expect(handler.getEffectiveStat(mon, 'spDefense')).toBe(mon.stats.spDefense);
    });
  });

  describe('sleep — turn counting', () => {
    it('should count down sleep turns', () => {
      const handler = new StatusEffectHandler();
      const mon = makePokemon({ status: 'sleep', statusTurns: 3 });
      handler.initPokemon(mon);

      expect(handler.checkTurnStart(mon).canAct).toBe(false);
      expect(mon.statusTurns).toBe(2);

      expect(handler.checkTurnStart(mon).canAct).toBe(false);
      expect(mon.statusTurns).toBe(1);

      expect(handler.checkTurnStart(mon).canAct).toBe(true);
      expect(mon.status).toBeNull();
    });
  });

  describe('freeze — thawing', () => {
    it('should thaw at 20% chance each turn', () => {
      const handler = new StatusEffectHandler();
      const mon = makePokemon({ status: 'freeze' });
      handler.initPokemon(mon);

      vi.spyOn(Math, 'random').mockReturnValue(0.19); // < 0.2 → thaw
      const result = handler.checkTurnStart(mon);
      expect(mon.status).toBeNull();
      expect(result.canAct).toBe(true);
    });

    it('should stay frozen at > 20% roll', () => {
      const handler = new StatusEffectHandler();
      const mon = makePokemon({ status: 'freeze' });
      handler.initPokemon(mon);

      vi.spyOn(Math, 'random').mockReturnValue(0.21);
      const result = handler.checkTurnStart(mon);
      expect(mon.status).toBe('freeze');
      expect(result.canAct).toBe(false);
    });

    it('fire move should thaw frozen target', () => {
      const handler = new StatusEffectHandler();
      const mon = makePokemon({ status: 'freeze' });
      handler.initPokemon(mon);

      const msg = handler.checkThaw(mon, {
        id: 'ember', name: 'Ember', type: 'fire', category: 'special', power: 40, accuracy: 100, pp: 25,
      });
      expect(msg).toBeTruthy();
      expect(mon.status).toBeNull();
    });
  });

  describe('bad-poison — escalating damage', () => {
    it('should increase damage each turn: N/16 of max HP', () => {
      const handler = new StatusEffectHandler();
      const mon = makePokemon({ status: 'bad-poison', statusTurns: 1, currentHp: 160, stats: { hp: 160, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 55 } });
      handler.initPokemon(mon);

      const r1 = handler.applyEndOfTurn(mon);
      expect(r1.damage).toBe(Math.max(1, Math.floor(160 / 16)));   // 10
      expect(mon.statusTurns).toBe(2);

      const r2 = handler.applyEndOfTurn(mon);
      expect(r2.damage).toBe(Math.max(1, Math.floor(160 * 2 / 16))); // 20

      const r3 = handler.applyEndOfTurn(mon);
      expect(r3.damage).toBe(Math.max(1, Math.floor(160 * 3 / 16))); // 30
    });
  });

  describe('confusion — self-hit', () => {
    it('confused pokemon should sometimes hit itself', () => {
      const handler = new StatusEffectHandler();
      const mon = makePokemon();
      handler.initPokemon(mon);
      handler.getState(mon).volatileStatuses.add('confusion');
      handler.getState(mon).confusionTurns = 5;

      vi.spyOn(Math, 'random').mockReturnValue(0.1); // < 0.5 → self-hit
      const hp = mon.currentHp;
      const result = handler.checkTurnStart(mon);
      expect(result.canAct).toBe(false);
      expect(mon.currentHp).toBeLessThan(hp);
    });

    it('confusion should wear off after turns expire', () => {
      const handler = new StatusEffectHandler();
      const mon = makePokemon();
      handler.initPokemon(mon);
      handler.getState(mon).volatileStatuses.add('confusion');
      handler.getState(mon).confusionTurns = 1;

      vi.spyOn(Math, 'random').mockReturnValue(0.9);
      handler.checkTurnStart(mon);
      expect(handler.getState(mon).volatileStatuses.has('confusion')).toBe(false);
    });
  });

  describe('type-based immunities', () => {
    it.each([
      ['burn', 4, 'fire'],       // Charmander = fire → immune to burn
      ['paralysis', 25, 'electric'], // Pikachu = electric → immune to paralysis
      ['poison', 1, 'poison'],   // Bulbasaur = grass/poison → immune to poison
      ['freeze', -1, 'ice'],     // No ice type in data, skip
    ])('%s should not affect %s-type pokemon', (status, dataId, _type) => {
      if (dataId < 0) return; // skip if no test pokemon
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ dataId: 19 }); // Rattata
      const defender = makePokemon({ dataId });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);

      vi.spyOn(Math, 'random').mockReturnValue(0.01);
      const result = handler.applyMoveEffect(attacker, defender, {
        id: 'test', name: 'Test', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 10,
        effect: { type: 'status', target: 'enemy', status: status as any, chance: 100 },
      }, 0);

      expect(result.messages.some(m => m.includes("doesn't affect"))).toBe(true);
      expect(defender.status).toBeNull();
    });
  });

  describe('leech seed + end of turn', () => {
    it('should drain then heal each turn', () => {
      const handler = new StatusEffectHandler();
      const seeded = makePokemon({ currentHp: 80, stats: { hp: 80, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 55 } });
      const opponent = makePokemon({ currentHp: 50, stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 55 } });
      handler.initPokemon(seeded);
      handler.initPokemon(opponent);
      handler.getState(seeded).volatileStatuses.add('leech-seed');

      const result = handler.applyEndOfTurn(seeded, opponent);
      const expectedDmg = Math.max(1, Math.floor(80 / 8)); // 10
      expect(result.damage).toBeGreaterThanOrEqual(expectedDmg);
      expect(seeded.currentHp).toBeLessThan(80);
      expect(opponent.currentHp).toBeGreaterThan(50);
    });

    it('grass types should be immune to leech seed', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ dataId: 4 });
      const grassDef = makePokemon({ dataId: 1 }); // Bulbasaur (grass)
      handler.initPokemon(attacker);
      handler.initPokemon(grassDef);

      const result = handler.applyMoveEffect(attacker, grassDef, {
        id: 'leech-seed', name: 'Leech Seed', type: 'grass', category: 'status', power: null, accuracy: 90, pp: 10,
        effect: { type: 'leech-seed', target: 'enemy', chance: 100 },
      }, 0);

      expect(result.messages.some(m => m.includes("doesn't affect"))).toBe(true);
      expect(handler.getState(grassDef).volatileStatuses.has('leech-seed')).toBe(false);
    });
  });

  describe('trapping moves', () => {
    it('should trap for 4-5 turns then release', () => {
      const handler = new StatusEffectHandler();
      const trapped = makePokemon({ currentHp: 200, stats: { hp: 200, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 55 } });
      handler.initPokemon(trapped);

      vi.spyOn(Math, 'random').mockReturnValue(0.01); // randomInt(4,5) → 4
      const attacker = makePokemon();
      handler.initPokemon(attacker);
      handler.applyMoveEffect(attacker, trapped, {
        id: 'wrap', name: 'Wrap', type: 'normal', category: 'physical', power: 15, accuracy: 90, pp: 20,
        effect: { type: 'trap', target: 'enemy', chance: 100 },
      }, 10);

      expect(handler.getState(trapped).volatileStatuses.has('trapped')).toBe(true);

      // Apply end-of-turn for several turns
      for (let i = 0; i < 5; i++) {
        handler.applyEndOfTurn(trapped);
      }
      // Should be freed after trap turns expire
      expect(handler.getState(trapped).volatileStatuses.has('trapped')).toBe(false);
    });

    it('trap damage should be 1/8 max HP per turn', () => {
      const handler = new StatusEffectHandler();
      const trapped = makePokemon({ currentHp: 160, stats: { hp: 160, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 55 } });
      handler.initPokemon(trapped);
      handler.getState(trapped).volatileStatuses.add('trapped');
      handler.getState(trapped).trapTurns = 4;

      const result = handler.applyEndOfTurn(trapped);
      expect(result.damage).toBe(Math.max(1, Math.floor(160 / 8)));
    });
  });

  describe('stat change effect — detailed', () => {
    it('should apply stat boosts via move effect', () => {
      const handler = new StatusEffectHandler();
      const user = makePokemon();
      const enemy = makePokemon({ dataId: 19 });
      handler.initPokemon(user);
      handler.initPokemon(enemy);

      handler.applyMoveEffect(user, enemy, {
        id: 'swords-dance', name: 'Swords Dance', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 20,
        effect: { type: 'stat-change', target: 'self', stat: 'attack', stages: 2, chance: 100 },
      }, 0);

      expect(handler.getState(user).statStages.attack).toBe(2);
    });

    it('should cap stat stages at +6', () => {
      const handler = new StatusEffectHandler();
      const user = makePokemon();
      handler.initPokemon(user);
      handler.getState(user).statStages.attack = 5;

      handler.applyMoveEffect(user, makePokemon({ dataId: 19 }), {
        id: 'swords-dance', name: 'Swords Dance', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 20,
        effect: { type: 'stat-change', target: 'self', stat: 'attack', stages: 2, chance: 100 },
      }, 0);

      expect(handler.getState(user).statStages.attack).toBe(6);
    });

    it('should cap stat stages at -6', () => {
      const handler = new StatusEffectHandler();
      const enemy = makePokemon({ dataId: 19 });
      handler.initPokemon(makePokemon());
      handler.initPokemon(enemy);
      handler.getState(enemy).statStages.attack = -5;

      handler.applyMoveEffect(makePokemon(), enemy, {
        id: 'screech', name: 'Screech', type: 'normal', category: 'status', power: null, accuracy: 85, pp: 40,
        effect: { type: 'stat-change', target: 'enemy', stat: 'attack', stages: -2, chance: 100 },
      }, 0);

      expect(handler.getState(enemy).statStages.attack).toBe(-6);
    });

    it('should report when stat won\'t go higher/lower', () => {
      const handler = new StatusEffectHandler();
      const user = makePokemon();
      handler.initPokemon(user);
      handler.getState(user).statStages.attack = 6;

      const result = handler.applyMoveEffect(user, makePokemon({ dataId: 19 }), {
        id: 'swords-dance', name: 'Swords Dance', type: 'normal', category: 'status', power: null, accuracy: 100, pp: 20,
        effect: { type: 'stat-change', target: 'self', stat: 'attack', stages: 2, chance: 100 },
      }, 0);

      expect(result.messages.some(m => m.includes("won't go any higher"))).toBe(true);
    });
  });

  describe('drain moves', () => {
    it('should heal attacker for half damage dealt', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ currentHp: 50, stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 55 } });
      handler.initPokemon(attacker);

      const result = handler.applyMoveEffect(attacker, makePokemon({ dataId: 19 }), {
        id: 'absorb', name: 'Absorb', type: 'grass', category: 'special', power: 20, accuracy: 100, pp: 25,
        effect: { type: 'drain', target: 'self', chance: 100 },
      }, 40); // 40 damage dealt

      expect(result.healedHp).toBe(20); // half of 40
      expect(attacker.currentHp).toBe(70); // 50 + 20
    });

    it('should not overheal past max HP', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ currentHp: 95, stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 55 } });
      handler.initPokemon(attacker);

      handler.applyMoveEffect(attacker, makePokemon({ dataId: 19 }), {
        id: 'absorb', name: 'Absorb', type: 'grass', category: 'special', power: 20, accuracy: 100, pp: 25,
        effect: { type: 'drain', target: 'self', chance: 100 },
      }, 40);

      expect(attacker.currentHp).toBe(100); // capped at max HP
    });
  });

  describe('recoil moves', () => {
    it('should damage attacker proportional to damage dealt', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ currentHp: 100 });
      handler.initPokemon(attacker);

      const result = handler.applyMoveEffect(attacker, makePokemon({ dataId: 19 }), {
        id: 'take-down', name: 'Take Down', type: 'normal', category: 'physical', power: 90, accuracy: 85, pp: 20,
        effect: { type: 'recoil', target: 'self', amount: 25 },
      }, 60); // 60 damage dealt

      expect(result.recoilDamage).toBe(15); // 25% of 60
      expect(attacker.currentHp).toBe(85); // 100 - 15
    });
  });

  describe('heal moves', () => {
    it('Rest should heal fully and put user to sleep', () => {
      const handler = new StatusEffectHandler();
      const user = makePokemon({ currentHp: 10, stats: { hp: 100, attack: 50, defense: 40, spAttack: 60, spDefense: 45, speed: 55 } });
      handler.initPokemon(user);

      handler.applyMoveEffect(user, makePokemon({ dataId: 19 }), {
        id: 'rest', name: 'Rest', type: 'psychic', category: 'status', power: null, accuracy: 100, pp: 10,
        effect: { type: 'heal', target: 'self', amount: 100 },
      }, 0);

      expect(user.currentHp).toBe(100);
      expect(user.status).toBe('sleep');
      expect(user.statusTurns).toBe(2);
    });
  });

  describe('self-destruct moves', () => {
    it('should KO the attacker', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ currentHp: 100 });
      handler.initPokemon(attacker);

      const result = handler.applyMoveEffect(attacker, makePokemon({ dataId: 19 }), {
        id: 'self-destruct', name: 'Self-Destruct', type: 'normal', category: 'physical', power: 200, accuracy: 100, pp: 5,
        effect: { type: 'self-destruct', target: 'self' },
      }, 200);

      expect(attacker.currentHp).toBe(0);
      expect(result.selfDestruct).toBe(true);
    });
  });

  describe('move effect chance', () => {
    it('should not apply effect when random exceeds chance', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon();
      const defender = makePokemon({ dataId: 19 });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);

      vi.spyOn(Math, 'random').mockReturnValue(0.99); // 99% > 10% chance
      const result = handler.applyMoveEffect(attacker, defender, {
        id: 'ember', name: 'Ember', type: 'fire', category: 'special', power: 40, accuracy: 100, pp: 25,
        effect: { type: 'status', target: 'enemy', status: 'burn', chance: 10 },
      }, 20);

      expect(result.messages.length).toBe(0);
      expect(defender.status).toBeNull();
    });

    it('should apply effect when random is below chance', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon();
      const defender = makePokemon({ dataId: 19 });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);

      vi.spyOn(Math, 'random').mockReturnValue(0.01); // 1% < 10% chance
      const result = handler.applyMoveEffect(attacker, defender, {
        id: 'ember', name: 'Ember', type: 'fire', category: 'special', power: 40, accuracy: 100, pp: 25,
        effect: { type: 'status', target: 'enemy', status: 'burn', chance: 10 },
      }, 20);

      expect(defender.status).toBe('burn');
    });
  });

  describe('only one non-volatile status at a time', () => {
    it('should not overwrite existing status', () => {
      const handler = new StatusEffectHandler();
      const defender = makePokemon({ dataId: 19, status: 'burn' });
      handler.initPokemon(defender);

      vi.spyOn(Math, 'random').mockReturnValue(0.01);
      handler.applyMoveEffect(makePokemon(), defender, {
        id: 'thunder-wave', name: 'Thunder Wave', type: 'electric', category: 'status', power: null, accuracy: 90, pp: 20,
        effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 100 },
      }, 0);

      expect(defender.status).toBe('burn'); // unchanged
    });
  });

  describe('cleanup and clearPokemon', () => {
    it('clearPokemon should remove volatile statuses', () => {
      const handler = new StatusEffectHandler();
      const mon = makePokemon();
      handler.initPokemon(mon);
      handler.getState(mon).statStages.attack = 3;
      handler.getState(mon).volatileStatuses.add('confusion');
      handler.clearPokemon(mon);

      // Re-init should have fresh state
      handler.initPokemon(mon);
      expect(handler.getState(mon).statStages.attack).toBe(0);
      expect(handler.getState(mon).volatileStatuses.size).toBe(0);
    });

    it('cleanup should clear everything', () => {
      const handler = new StatusEffectHandler();
      handler.initPokemon(makePokemon());
      handler.initPokemon(makePokemon({ dataId: 1 }));
      handler.cleanup();
      // After cleanup, getting state should auto-create fresh
      const fresh = handler.getState(makePokemon());
      expect(fresh.statStages.attack).toBe(0);
    });
  });

  describe('resetAllStages', () => {
    it('should reset all pokemon stat stages to 0', () => {
      const handler = new StatusEffectHandler();
      const p1 = makePokemon();
      const p2 = makePokemon({ dataId: 1 });
      handler.initPokemon(p1);
      handler.initPokemon(p2);
      handler.getState(p1).statStages.attack = 6;
      handler.getState(p1).statStages.speed = -3;
      handler.getState(p2).statStages.defense = -4;
      handler.getState(p2).statStages.spAttack = 2;

      handler.resetAllStages();

      const keys = ['attack', 'defense', 'spAttack', 'spDefense', 'speed'] as const;
      for (const k of keys) {
        expect(handler.getState(p1).statStages[k]).toBe(0);
        expect(handler.getState(p2).statStages[k]).toBe(0);
      }
    });
  });
});
