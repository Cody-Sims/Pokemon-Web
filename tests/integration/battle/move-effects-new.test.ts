import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MoveExecutor } from '../../../frontend/src/battle/execution/MoveExecutor';
import { StatusEffectHandler } from '../../../frontend/src/battle/effects/StatusEffectHandler';
import { PokemonInstance } from '../../../frontend/src/data/interfaces';
import { moveData } from '../../../frontend/src/data/moves';
import * as mathHelpers from '../../../frontend/src/utils/math-helpers';

beforeEach(() => {
  mathHelpers.seedRng(12345);
});

const makePokemon = (overrides?: Partial<PokemonInstance>): PokemonInstance => ({
  dataId: 4,
  level: 50,
  currentHp: 200,
  stats: { hp: 200, attack: 80, defense: 60, spAttack: 90, spDefense: 60, speed: 70 },
  ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  nature: 'hardy',
  moves: [{ moveId: 'tackle', currentPp: 35 }],
  status: null,
  exp: 0,
  friendship: 70,
  ...overrides,
});

describe('New Move Effects — Fairy / Dark / Ghost', () => {
  // ─── Fairy Moves ───────────────────────────────────────────────

  describe('fairy moves', () => {
    it.each(['moonblast', 'dazzling-gleam', 'play-rough', 'fairy-wind', 'disarming-voice'] as const)(
      '%s should exist in move data and be fairy type',
      (id) => {
        expect(moveData[id]).toBeDefined();
        expect(moveData[id].type).toBe('fairy');
      },
    );

    it('moonblast should deal special damage', () => {
      const attacker = makePokemon({ moves: [{ moveId: 'moonblast', currentPp: 15 }] });
      const defender = makePokemon({ dataId: 1 });
      const result = MoveExecutor.execute(attacker, defender, 'moonblast');
      expect(result.moveHit).toBe(true);
      expect(result.damage.damage).toBeGreaterThan(0);
    });

    it('moonblast should lower enemy spAttack at 30% chance', () => {
      vi.spyOn(mathHelpers, 'seededRandom').mockReturnValue(0.1); // Below 30% → effect triggers
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ moves: [{ moveId: 'moonblast', currentPp: 15 }] });
      const defender = makePokemon({ dataId: 1 });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);
      MoveExecutor.execute(attacker, defender, 'moonblast', handler);
      expect(handler.getState(defender).statStages.spAttack).toBeLessThan(0);
    });

    it('moonblast should NOT lower enemy spAttack when chance fails', () => {
      vi.spyOn(mathHelpers, 'seededRandom').mockReturnValue(0.9); // Above 30% → no effect
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ moves: [{ moveId: 'moonblast', currentPp: 15 }] });
      const defender = makePokemon({ dataId: 1 });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);
      MoveExecutor.execute(attacker, defender, 'moonblast', handler);
      expect(handler.getState(defender).statStages.spAttack).toBe(0);
    });

    it('play-rough should deal physical damage', () => {
      vi.spyOn(mathHelpers, 'seededRandom').mockReturnValue(0.5);
      const attacker = makePokemon({ moves: [{ moveId: 'play-rough', currentPp: 10 }] });
      const defender = makePokemon({ dataId: 1 });
      const result = MoveExecutor.execute(attacker, defender, 'play-rough');
      expect(result.moveHit).toBe(true);
      expect(result.damage.damage).toBeGreaterThan(0);
    });

    it('play-rough should lower enemy attack at 10% chance', () => {
      vi.spyOn(mathHelpers, 'seededRandom').mockReturnValue(0.05);
      vi.spyOn(mathHelpers, 'seededRandom').mockReturnValue(0.05); // Below 10%
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ moves: [{ moveId: 'play-rough', currentPp: 10 }] });
      const defender = makePokemon({ dataId: 1 });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);
      MoveExecutor.execute(attacker, defender, 'play-rough', handler);
      expect(handler.getState(defender).statStages.attack).toBeLessThan(0);
    });

    it('charm should lower enemy attack by 2 stages', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ moves: [{ moveId: 'charm', currentPp: 20 }] });
      const defender = makePokemon({ dataId: 1 });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);
      MoveExecutor.execute(attacker, defender, 'charm', handler);
      expect(handler.getState(defender).statStages.attack).toBe(-2);
    });

    it('charm should not deal damage (status move)', () => {
      const attacker = makePokemon({ moves: [{ moveId: 'charm', currentPp: 20 }] });
      const defender = makePokemon({ dataId: 1 });
      const hpBefore = defender.currentHp;
      MoveExecutor.execute(attacker, defender, 'charm');
      expect(defender.currentHp).toBe(hpBefore);
    });

    it('dazzling-gleam should deal special damage with no secondary effect', () => {
      const attacker = makePokemon({ moves: [{ moveId: 'dazzling-gleam', currentPp: 10 }] });
      const defender = makePokemon({ dataId: 1 });
      const result = MoveExecutor.execute(attacker, defender, 'dazzling-gleam');
      expect(result.moveHit).toBe(true);
      expect(result.damage.damage).toBeGreaterThan(0);
      expect(moveData['dazzling-gleam'].effect).toBeUndefined();
    });

    it('fairy-wind and disarming-voice should deal damage', () => {
      for (const id of ['fairy-wind', 'disarming-voice']) {
        const attacker = makePokemon({ moves: [{ moveId: id, currentPp: 30 }] });
        const defender = makePokemon({ dataId: 1, currentHp: 200 });
        const result = MoveExecutor.execute(attacker, defender, id);
        expect(result.moveHit).toBe(true);
        expect(result.damage.damage).toBeGreaterThan(0);
      }
    });
  });

  // ─── Dark Moves ────────────────────────────────────────────────

  describe('dark moves', () => {
    it.each(['bite', 'dark-pulse', 'crunch', 'sucker-punch', 'nasty-plot', 'pursuit', 'foul-play'] as const)(
      '%s should exist in move data and be dark type',
      (id) => {
        expect(moveData[id]).toBeDefined();
        expect(moveData[id].type).toBe('dark');
      },
    );

    it('bite should cause flinch at 30% chance', () => {
      vi.spyOn(mathHelpers, 'seededRandom').mockReturnValue(0.1); // Below 30%
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ moves: [{ moveId: 'bite', currentPp: 25 }] });
      const defender = makePokemon({ dataId: 1 });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);
      const result = MoveExecutor.execute(attacker, defender, 'bite', handler);
      expect(result.moveHit).toBe(true);
      expect(result.damage.damage).toBeGreaterThan(0);
      // Flinch is tracked as a volatile status
      expect(handler.getState(defender).volatileStatuses.has('flinch')).toBe(true);
    });

    it('dark-pulse should cause flinch at 20% chance', () => {
      vi.spyOn(mathHelpers, 'seededRandom').mockReturnValue(0.1); // Below 20%
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ moves: [{ moveId: 'dark-pulse', currentPp: 15 }] });
      const defender = makePokemon({ dataId: 1 });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);
      MoveExecutor.execute(attacker, defender, 'dark-pulse', handler);
      expect(handler.getState(defender).volatileStatuses.has('flinch')).toBe(true);
    });

    it('dark-pulse should NOT flinch when chance fails', () => {
      vi.spyOn(mathHelpers, 'seededRandom').mockReturnValue(0.9); // Above 20%
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ moves: [{ moveId: 'dark-pulse', currentPp: 15 }] });
      const defender = makePokemon({ dataId: 1 });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);
      MoveExecutor.execute(attacker, defender, 'dark-pulse', handler);
      expect(handler.getState(defender).volatileStatuses.has('flinch')).toBe(false);
    });

    it('crunch should lower enemy defense at 20% chance', () => {
      vi.spyOn(mathHelpers, 'seededRandom').mockReturnValue(0.1); // Below 20%
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ moves: [{ moveId: 'crunch', currentPp: 15 }] });
      const defender = makePokemon({ dataId: 1 });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);
      MoveExecutor.execute(attacker, defender, 'crunch', handler);
      expect(handler.getState(defender).statStages.defense).toBeLessThan(0);
    });

    it('sucker-punch should have priority 1', () => {
      expect(moveData['sucker-punch'].priority).toBe(1);
    });

    it('sucker-punch should deal physical damage', () => {
      const attacker = makePokemon({ moves: [{ moveId: 'sucker-punch', currentPp: 5 }] });
      const defender = makePokemon({ dataId: 1 });
      const result = MoveExecutor.execute(attacker, defender, 'sucker-punch');
      expect(result.moveHit).toBe(true);
      expect(result.damage.damage).toBeGreaterThan(0);
    });

    it('nasty-plot should raise self spAttack by 2 stages', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ moves: [{ moveId: 'nasty-plot', currentPp: 20 }] });
      const defender = makePokemon({ dataId: 1 });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);
      MoveExecutor.execute(attacker, defender, 'nasty-plot', handler);
      expect(handler.getState(attacker).statStages.spAttack).toBe(2);
    });

    it('nasty-plot should not deal damage (status move)', () => {
      const attacker = makePokemon({ moves: [{ moveId: 'nasty-plot', currentPp: 20 }] });
      const defender = makePokemon({ dataId: 1 });
      const hpBefore = defender.currentHp;
      MoveExecutor.execute(attacker, defender, 'nasty-plot');
      expect(defender.currentHp).toBe(hpBefore);
    });

    it('pursuit and foul-play should deal physical damage', () => {
      for (const id of ['pursuit', 'foul-play']) {
        const attacker = makePokemon({ moves: [{ moveId: id, currentPp: 20 }] });
        const defender = makePokemon({ dataId: 1, currentHp: 200 });
        const result = MoveExecutor.execute(attacker, defender, id);
        expect(result.moveHit).toBe(true);
        expect(result.damage.damage).toBeGreaterThan(0);
      }
    });
  });

  // ─── Ghost Moves ───────────────────────────────────────────────

  describe('ghost moves', () => {
    it.each(['lick', 'night-shade', 'confuse-ray', 'shadow-ball', 'shadow-claw', 'hex', 'phantom-force', 'will-o-wisp', 'destiny-bond'] as const)(
      '%s should exist in move data and be ghost type',
      (id) => {
        expect(moveData[id]).toBeDefined();
        expect(moveData[id].type).toBe('ghost');
      },
    );

    it('lick should inflict paralysis at 30% chance', () => {
      vi.spyOn(mathHelpers, 'seededRandom').mockReturnValue(0.1); // Below 30%
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ moves: [{ moveId: 'lick', currentPp: 30 }] });
      const defender = makePokemon({ dataId: 1 });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);
      MoveExecutor.execute(attacker, defender, 'lick', handler);
      expect(defender.status).toBe('paralysis');
    });

    it('lick should NOT inflict paralysis when chance fails', () => {
      vi.spyOn(mathHelpers, 'seededRandom').mockReturnValue(0.9); // Above 30%
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ moves: [{ moveId: 'lick', currentPp: 30 }] });
      const defender = makePokemon({ dataId: 1 });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);
      MoveExecutor.execute(attacker, defender, 'lick', handler);
      expect(defender.status).toBeNull();
    });

    it('night-shade should deal damage equal to user level', () => {
      const attacker = makePokemon({ level: 50, moves: [{ moveId: 'night-shade', currentPp: 15 }] });
      const defender = makePokemon({ dataId: 1, currentHp: 200 });
      const result = MoveExecutor.execute(attacker, defender, 'night-shade');
      if (result.moveHit) {
        expect(result.damage.damage).toBe(50);
      }
    });

    it('confuse-ray should inflict confusion at 100% chance', () => {
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ moves: [{ moveId: 'confuse-ray', currentPp: 10 }] });
      const defender = makePokemon({ dataId: 1 });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);
      MoveExecutor.execute(attacker, defender, 'confuse-ray', handler);
      expect(handler.getState(defender).volatileStatuses.has('confusion')).toBe(true);
    });

    it('confuse-ray should not deal damage (status move)', () => {
      const attacker = makePokemon({ moves: [{ moveId: 'confuse-ray', currentPp: 10 }] });
      const defender = makePokemon({ dataId: 1 });
      const hpBefore = defender.currentHp;
      MoveExecutor.execute(attacker, defender, 'confuse-ray');
      expect(defender.currentHp).toBe(hpBefore);
    });

    it('shadow-ball should lower enemy spDefense at 20% chance', () => {
      vi.spyOn(mathHelpers, 'seededRandom').mockReturnValue(0.1); // Below 20%
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ moves: [{ moveId: 'shadow-ball', currentPp: 15 }] });
      const defender = makePokemon({ dataId: 1 });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);
      MoveExecutor.execute(attacker, defender, 'shadow-ball', handler);
      expect(handler.getState(defender).statStages.spDefense).toBeLessThan(0);
    });

    it('shadow-claw should deal physical damage with no secondary effect', () => {
      const attacker = makePokemon({ moves: [{ moveId: 'shadow-claw', currentPp: 15 }] });
      const defender = makePokemon({ dataId: 1 });
      const result = MoveExecutor.execute(attacker, defender, 'shadow-claw');
      expect(result.moveHit).toBe(true);
      expect(result.damage.damage).toBeGreaterThan(0);
      expect(moveData['shadow-claw'].effect).toBeUndefined();
    });

    it('will-o-wisp should inflict burn at 100% chance', () => {
      vi.spyOn(mathHelpers, 'seededRandom').mockReturnValue(0.5);
      const handler = new StatusEffectHandler();
      const attacker = makePokemon({ moves: [{ moveId: 'will-o-wisp', currentPp: 15 }] });
      const defender = makePokemon({ dataId: 1 });
      handler.initPokemon(attacker);
      handler.initPokemon(defender);
      MoveExecutor.execute(attacker, defender, 'will-o-wisp', handler);
      expect(defender.status).toBe('burn');
    });

    it('will-o-wisp should not deal damage (status move)', () => {
      const attacker = makePokemon({ moves: [{ moveId: 'will-o-wisp', currentPp: 15 }] });
      const defender = makePokemon({ dataId: 1 });
      const hpBefore = defender.currentHp;
      MoveExecutor.execute(attacker, defender, 'will-o-wisp');
      expect(defender.currentHp).toBe(hpBefore);
    });

    it('hex should deal special damage', () => {
      const attacker = makePokemon({ moves: [{ moveId: 'hex', currentPp: 10 }] });
      const defender = makePokemon({ dataId: 1 });
      const result = MoveExecutor.execute(attacker, defender, 'hex');
      expect(result.moveHit).toBe(true);
      expect(result.damage.damage).toBeGreaterThan(0);
    });

    it('phantom-force should deal physical damage', () => {
      const attacker = makePokemon({ moves: [{ moveId: 'phantom-force', currentPp: 10 }] });
      const defender = makePokemon({ dataId: 1 });
      const result = MoveExecutor.execute(attacker, defender, 'phantom-force');
      expect(result.moveHit).toBe(true);
      expect(result.damage.damage).toBeGreaterThan(0);
    });

    it('destiny-bond should be a status move with no damage', () => {
      expect(moveData['destiny-bond'].category).toBe('status');
      expect(moveData['destiny-bond'].power).toBeNull();
    });
  });

  // ─── Cross-type data integrity ─────────────────────────────────

  describe('data integrity', () => {
    const newMoves = [
      'moonblast', 'dazzling-gleam', 'play-rough', 'fairy-wind', 'disarming-voice', 'charm',
      'dark-pulse', 'crunch', 'sucker-punch', 'nasty-plot', 'pursuit', 'foul-play',
      'shadow-ball', 'shadow-claw', 'hex', 'phantom-force', 'will-o-wisp', 'destiny-bond',
    ];

    it.each(newMoves)('%s should have valid PP > 0', (id) => {
      expect(moveData[id].pp).toBeGreaterThan(0);
    });

    it.each(newMoves)('%s should have accuracy between 1-100 or be null', (id) => {
      const acc = moveData[id].accuracy;
      if (acc !== null) {
        expect(acc).toBeGreaterThanOrEqual(1);
        expect(acc).toBeLessThanOrEqual(100);
      }
    });

    it.each(newMoves)('%s should have a valid category', (id) => {
      expect(['physical', 'special', 'status']).toContain(moveData[id].category);
    });

    it('status moves should have null power', () => {
      const statusMoves = ['charm', 'nasty-plot', 'confuse-ray', 'will-o-wisp', 'destiny-bond'];
      for (const id of statusMoves) {
        expect(moveData[id].power).toBeNull();
      }
    });

    it('damaging moves should have positive power', () => {
      const damageMoves = [
        'moonblast', 'dazzling-gleam', 'play-rough', 'fairy-wind', 'disarming-voice',
        'dark-pulse', 'crunch', 'sucker-punch', 'pursuit', 'foul-play',
        'shadow-ball', 'shadow-claw', 'hex', 'phantom-force',
      ];
      for (const id of damageMoves) {
        expect(moveData[id].power).toBeGreaterThan(0);
      }
    });
  });
});
