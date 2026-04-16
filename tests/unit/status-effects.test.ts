import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StatusEffectHandler } from '../../frontend/src/battle/effects/StatusEffectHandler';
import { PokemonInstance } from '../../frontend/src/data/interfaces';

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

const makePokemon = (overrides?: Partial<PokemonInstance>): PokemonInstance => ({
  dataId: 4, // Charmander
  level: 10,
  currentHp: 30,
  stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 },
  ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy',
  moves: [{ moveId: 'ember', currentPp: 25 }],
  status: null,
  exp: 0,
  friendship: 70,
  ...overrides,
});

describe('StatusEffectHandler', () => {
  describe('burn', () => {
    it('should halve physical attack', () => {
      const handler = new StatusEffectHandler();
      const pokemon = makePokemon({ status: 'burn' });
      handler.initPokemon(pokemon);
      const effective = handler.getEffectiveStat(pokemon, 'attack');
      expect(effective).toBe(Math.max(1, Math.floor(pokemon.stats.attack * 0.5)));
    });

    it('should deal 1/16 max HP damage at end of turn', () => {
      const handler = new StatusEffectHandler();
      const pokemon = makePokemon({ status: 'burn', currentHp: 30, stats: { hp: 30, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 } });
      handler.initPokemon(pokemon);
      const result = handler.applyEndOfTurn(pokemon);
      const expectedDmg = Math.max(1, Math.floor(30 / 16));
      expect(result.damage).toBe(expectedDmg);
      expect(pokemon.currentHp).toBe(30 - expectedDmg);
    });
  });

  describe('paralysis', () => {
    it('should quarter speed', () => {
      const handler = new StatusEffectHandler();
      const pokemon = makePokemon({ status: 'paralysis' });
      handler.initPokemon(pokemon);
      const effective = handler.getEffectiveStat(pokemon, 'speed');
      expect(effective).toBe(Math.max(1, Math.floor(pokemon.stats.speed * 0.25)));
    });

    it('should prevent action 25% of time', () => {
      const handler = new StatusEffectHandler();
      const pokemon = makePokemon({ status: 'paralysis' });
      handler.initPokemon(pokemon);

      // random = 0.1 → paralyzed (< 0.25)
      vi.spyOn(Math, 'random').mockReturnValue(0.1);
      let result = handler.checkTurnStart(pokemon);
      expect(result.canAct).toBe(false);

      // random = 0.5 → can act (>= 0.25)
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      result = handler.checkTurnStart(pokemon);
      expect(result.canAct).toBe(true);
    });
  });

  describe('sleep', () => {
    it('should prevent action while asleep', () => {
      const handler = new StatusEffectHandler();
      const pokemon = makePokemon({ status: 'sleep', statusTurns: 3 });
      handler.initPokemon(pokemon);
      const result = handler.checkTurnStart(pokemon);
      expect(result.canAct).toBe(false);
    });

    it('should wake up when turns expire', () => {
      const handler = new StatusEffectHandler();
      const pokemon = makePokemon({ status: 'sleep', statusTurns: 1 });
      handler.initPokemon(pokemon);
      const result = handler.checkTurnStart(pokemon);
      expect(result.canAct).toBe(true);
      expect(pokemon.status).toBeNull();
    });
  });

  describe('freeze', () => {
    it('should prevent action when frozen', () => {
      const handler = new StatusEffectHandler();
      const pokemon = makePokemon({ status: 'freeze' });
      handler.initPokemon(pokemon);

      // random = 0.5 → stays frozen (>= 0.2)
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = handler.checkTurnStart(pokemon);
      expect(result.canAct).toBe(false);
    });

    it('should thaw 20% of the time', () => {
      const handler = new StatusEffectHandler();
      const pokemon = makePokemon({ status: 'freeze' });
      handler.initPokemon(pokemon);

      // random = 0.1 → thaws (< 0.2)
      vi.spyOn(Math, 'random').mockReturnValue(0.1);
      const result = handler.checkTurnStart(pokemon);
      expect(result.canAct).toBe(true);
      expect(pokemon.status).toBeNull();
    });
  });

  describe('poison', () => {
    it('should deal 1/8 max HP at end of turn', () => {
      const handler = new StatusEffectHandler();
      const pokemon = makePokemon({ status: 'poison', currentHp: 80, stats: { hp: 80, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 } });
      handler.initPokemon(pokemon);
      const result = handler.applyEndOfTurn(pokemon);
      expect(result.damage).toBe(Math.max(1, Math.floor(80 / 8)));
    });
  });

  describe('bad-poison (toxic)', () => {
    it('should deal increasing damage each turn', () => {
      const handler = new StatusEffectHandler();
      const pokemon = makePokemon({ status: 'bad-poison', statusTurns: 1, currentHp: 160, stats: { hp: 160, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 } });
      handler.initPokemon(pokemon);

      const r1 = handler.applyEndOfTurn(pokemon);
      expect(r1.damage).toBe(Math.max(1, Math.floor(160 * 1 / 16)));
      expect(pokemon.statusTurns).toBe(2);

      const r2 = handler.applyEndOfTurn(pokemon);
      expect(r2.damage).toBe(Math.max(1, Math.floor(160 * 2 / 16)));
    });
  });

  describe('stat stages', () => {
    it('should modify effective stat based on stages', () => {
      const handler = new StatusEffectHandler();
      const pokemon = makePokemon();
      handler.initPokemon(pokemon);

      // Boost attack by 1 stage → 1.5x
      handler.getState(pokemon).statStages.attack = 1;
      const boosted = handler.getEffectiveStat(pokemon, 'attack');
      expect(boosted).toBe(Math.floor(pokemon.stats.attack * 1.5));
    });

    it('should clamp stages at -6 and +6', () => {
      const handler = new StatusEffectHandler();
      const pokemon = makePokemon();
      handler.initPokemon(pokemon);

      handler.getState(pokemon).statStages.attack = 6;
      const maxBoost = handler.getEffectiveStat(pokemon, 'attack');

      handler.getState(pokemon).statStages.attack = -6;
      const maxDrop = handler.getEffectiveStat(pokemon, 'attack');

      expect(maxBoost).toBeGreaterThan(maxDrop);
    });

    it('should reset all stages with resetAllStages', () => {
      const handler = new StatusEffectHandler();
      const p1 = makePokemon();
      const p2 = makePokemon({ dataId: 1 });
      handler.initPokemon(p1);
      handler.initPokemon(p2);
      handler.getState(p1).statStages.attack = 3;
      handler.getState(p2).statStages.defense = -2;

      handler.resetAllStages();

      expect(handler.getState(p1).statStages.attack).toBe(0);
      expect(handler.getState(p2).statStages.defense).toBe(0);
    });
  });

  describe('confusion', () => {
    it('should apply confusion through applyMoveEffect', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon();
      const defender = makePokemon({ dataId: 1 });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);

      vi.spyOn(Math, 'random').mockReturnValue(0.01); // pass chance check
      const result = handler.applyMoveEffect(attacker, defender, {
        id: 'confuse-ray', name: 'Confuse Ray', type: 'ghost', category: 'status', power: null, accuracy: 100, pp: 10,
        effect: { type: 'status', target: 'enemy', status: 'confusion', chance: 100 },
      }, 0);

      expect(result.messages.some(m => m.includes('confused'))).toBe(true);
      expect(handler.getState(defender).volatileStatuses.has('confusion')).toBe(true);
    });
  });

  describe('flinch', () => {
    it('should apply and consume flinch', () => {
      const handler = new StatusEffectHandler();
      const pokemon = makePokemon();
      handler.initPokemon(pokemon);

      // Set flinch
      handler.getState(pokemon).volatileStatuses.add('flinch');
      const msg = handler.checkFlinch(pokemon);
      expect(msg).not.toBeNull();
      expect(handler.getState(pokemon).volatileStatuses.has('flinch')).toBe(false);
    });
  });

  describe('leech seed', () => {
    it('should drain 1/8 HP and heal opponent at end of turn', () => {
      const handler = new StatusEffectHandler();
      const pokemon = makePokemon({ dataId: 4, currentHp: 80, stats: { hp: 80, attack: 15, defense: 12, spAttack: 18, spDefense: 14, speed: 16 } });
      const opponent = makePokemon({ dataId: 1, currentHp: 20, stats: { hp: 80, attack: 14, defense: 14, spAttack: 17, spDefense: 17, speed: 13 } });
      handler.initPokemon(pokemon);
      handler.initPokemon(opponent);
      handler.getState(pokemon).volatileStatuses.add('leech-seed');

      const result = handler.applyEndOfTurn(pokemon, opponent);
      expect(result.damage).toBeGreaterThan(0);
      expect(opponent.currentHp).toBeGreaterThan(20);
    });

    it('should not affect grass types', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ dataId: 4 });
      const grassDefender = makePokemon({ dataId: 1 }); // Bulbasaur is grass
      handler.initPokemon(attacker);
      handler.initPokemon(grassDefender);

      const result = handler.applyMoveEffect(attacker, grassDefender, {
        id: 'leech-seed', name: 'Leech Seed', type: 'grass', category: 'status', power: null, accuracy: 90, pp: 10,
        effect: { type: 'leech-seed', target: 'enemy', chance: 100 },
      }, 0);

      expect(result.messages.some(m => m.includes("doesn't affect"))).toBe(true);
    });
  });

  describe('type-based status immunity', () => {
    it('should make fire types immune to burn', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ dataId: 1 }); // Bulbasaur
      const fireDefender = makePokemon({ dataId: 4 }); // Charmander (fire)
      handler.initPokemon(attacker);
      handler.initPokemon(fireDefender);

      vi.spyOn(Math, 'random').mockReturnValue(0.01);
      const result = handler.applyMoveEffect(attacker, fireDefender, {
        id: 'will-o-wisp', name: 'Will-O-Wisp', type: 'fire', category: 'status', power: null, accuracy: 85, pp: 15,
        effect: { type: 'status', target: 'enemy', status: 'burn', chance: 100 },
      }, 0);

      expect(result.messages.some(m => m.includes("doesn't affect"))).toBe(true);
      expect(fireDefender.status).toBeNull();
    });

    it('should make electric types immune to paralysis', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ dataId: 4 });
      const electricDefender = makePokemon({ dataId: 25 }); // Pikachu
      handler.initPokemon(attacker);
      handler.initPokemon(electricDefender);

      vi.spyOn(Math, 'random').mockReturnValue(0.01);
      const result = handler.applyMoveEffect(attacker, electricDefender, {
        id: 'thunder-wave', name: 'Thunder Wave', type: 'electric', category: 'status', power: null, accuracy: 90, pp: 20,
        effect: { type: 'status', target: 'enemy', status: 'paralysis', chance: 100 },
      }, 0);

      expect(result.messages.some(m => m.includes("doesn't affect"))).toBe(true);
    });
  });

  describe('fire-type thawing', () => {
    it('should thaw frozen defender when hit by fire move', () => {
      const handler = new StatusEffectHandler();
      const frozen = makePokemon({ status: 'freeze' });
      handler.initPokemon(frozen);

      const msg = handler.checkThaw(frozen, {
        id: 'ember', name: 'Ember', type: 'fire', category: 'special', power: 40, accuracy: 100, pp: 25,
      });

      expect(msg).not.toBeNull();
      expect(frozen.status).toBeNull();
    });

    it('should not thaw for non-fire moves', () => {
      const handler = new StatusEffectHandler();
      const frozen = makePokemon({ status: 'freeze' });
      handler.initPokemon(frozen);

      const msg = handler.checkThaw(frozen, {
        id: 'tackle', name: 'Tackle', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35,
      });

      expect(msg).toBeNull();
      expect(frozen.status).toBe('freeze');
    });
  });

  describe('cleanup', () => {
    it('should remove all tracked pokemon', () => {
      const handler = new StatusEffectHandler();
      const p1 = makePokemon();
      const p2 = makePokemon({ dataId: 1 });
      handler.initPokemon(p1);
      handler.initPokemon(p2);
      handler.cleanup();

      // After cleanup, getState should create a fresh state
      const state = handler.getState(p1);
      expect(state.statStages.attack).toBe(0);
    });
  });
});
