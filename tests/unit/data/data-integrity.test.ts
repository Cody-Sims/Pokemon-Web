import { describe, it, expect } from 'vitest';
import { pokemonData } from '@data/pokemon';
import { moveData } from '@data/moves';
import { itemData } from '@data/item-data';
import { trainerData } from '@data/trainer-data';
import { encounterTables, fishingTables } from '@data/encounter-tables';
import { evolutionData } from '@data/evolution-data';
import { tmData, moveTutorData } from '@data/tm-data';
import { mapRegistry } from '@data/maps';
import { shopInventories } from '@data/shop-data';
import { questData } from '@data/quest-data';
import { cutsceneData } from '@data/cutscene-data';
import { ACHIEVEMENTS } from '@data/achievement-data';
import { battleTowerData } from '@data/battle-tower-data';
import { battlePointShopCatalog } from '@data/bp-shop-data';
import type { ObjectSpawn, NpcSpawn } from '@data/maps';

type DataIssue = { source: string; message: string };
type InteractionSpawn = (NpcSpawn | ObjectSpawn) & { id: string };

const addIssue = (issues: DataIssue[], source: string, message: string): void => {
  issues.push({ source, message });
};

const assertKnown = (
  issues: DataIssue[],
  source: string,
  registry: ReadonlySet<string>,
  registryName: string,
  id: string | undefined,
): void => {
  if (id && !registry.has(id)) {
    addIssue(issues, source, `references missing ${registryName} '${id}'`);
  }
};

const assertKnownNumber = (
  issues: DataIssue[],
  source: string,
  registry: ReadonlySet<number>,
  registryName: string,
  id: number | undefined,
): void => {
  if (id !== undefined && !registry.has(id)) {
    addIssue(issues, source, `references missing ${registryName} ${id}`);
  }
};

describe('Data reference integrity', () => {
  it('has no dangling references across data registries', () => {
    const issues: DataIssue[] = [];
    const moveIds = new Set(Object.keys(moveData));
    const itemIds = new Set(Object.keys(itemData));
    const tmIds = new Set(Object.keys(tmData));
    const validItemOrTmIds = new Set([...itemIds, ...tmIds]);
    const pokemonIds = new Set(Object.keys(pokemonData).map(Number));
    const trainerIds = new Set(Object.keys(trainerData));
    const mapKeys = new Set(Object.keys(mapRegistry));
    const cutsceneIds = new Set(Object.keys(cutsceneData));
    const achievementIds = new Set<string>();

    for (const [pokemonId, pokemon] of Object.entries(pokemonData)) {
      for (const entry of pokemon.learnset) {
        assertKnown(issues, `frontend/src/data/pokemon pokemonData[${pokemonId}].learnset moveId`, moveIds, 'moveData id', entry.moveId);
      }

      for (const evolution of pokemon.evolutionChain) {
        assertKnownNumber(issues, `frontend/src/data/pokemon pokemonData[${pokemonId}].evolutionChain pokemonId`, pokemonIds, 'pokemonData id', evolution.pokemonId);
        assertKnown(issues, `frontend/src/data/pokemon pokemonData[${pokemonId}].evolutionChain itemId`, itemIds, 'itemData id', evolution.condition.itemId);
      }
    }

    for (const [tmKey, tm] of Object.entries(tmData)) {
      if (tm.id !== tmKey) {
        addIssue(issues, `frontend/src/data/tm-data.ts tmData['${tmKey}']`, `has id '${tm.id}' that does not match its key`);
      }
      assertKnown(issues, `frontend/src/data/tm-data.ts tmData['${tmKey}'].moveId`, moveIds, 'moveData id', tm.moveId);
    }

    for (const [tutorKey, tutor] of Object.entries(moveTutorData)) {
      if (tutor.id !== tutorKey) {
        addIssue(issues, `frontend/src/data/tm-data.ts moveTutorData['${tutorKey}']`, `has id '${tutor.id}' that does not match its key`);
      }
      assertKnown(issues, `frontend/src/data/tm-data.ts moveTutorData['${tutorKey}'].location`, mapKeys, 'mapRegistry key', tutor.location);
      for (const [moveIndex, move] of tutor.moves.entries()) {
        assertKnown(issues, `frontend/src/data/tm-data.ts moveTutorData['${tutorKey}'].moves[${moveIndex}].moveId`, moveIds, 'moveData id', move.moveId);
        if (move.costType === 'heart-scale') {
          assertKnown(issues, `frontend/src/data/tm-data.ts moveTutorData['${tutorKey}'].moves[${moveIndex}].costType`, itemIds, 'itemData id', 'heart-scale');
        }
      }
    }

    const checkEncounterEntries = (source: string, entries: { pokemonId: number }[]): void => {
      for (const [entryIndex, entry] of entries.entries()) {
        assertKnownNumber(issues, `${source}[${entryIndex}].pokemonId`, pokemonIds, 'pokemonData id', entry.pokemonId);
      }
    };

    for (const [tableKey, entries] of Object.entries(encounterTables)) {
      checkEncounterEntries(`frontend/src/data/encounter-tables.ts encounterTables['${tableKey}']`, entries);
    }

    for (const [mapKey, rodTables] of Object.entries(fishingTables)) {
      assertKnown(issues, `frontend/src/data/encounter-tables.ts fishingTables['${mapKey}']`, mapKeys, 'mapRegistry key', mapKey);
      for (const [rod, entries] of Object.entries(rodTables)) {
        checkEncounterEntries(`frontend/src/data/encounter-tables.ts fishingTables['${mapKey}'].${rod}`, entries ?? []);
      }
    }

    for (const [sourceId, evolutions] of Object.entries(evolutionData)) {
      assertKnownNumber(issues, `frontend/src/data/evolution-data.ts evolutionData['${sourceId}'] source`, pokemonIds, 'pokemonData id', Number(sourceId));
      for (const [evolutionIndex, evolution] of evolutions.entries()) {
        assertKnownNumber(issues, `frontend/src/data/evolution-data.ts evolutionData['${sourceId}'][${evolutionIndex}].evolvesTo`, pokemonIds, 'pokemonData id', evolution.evolvesTo);
        assertKnown(issues, `frontend/src/data/evolution-data.ts evolutionData['${sourceId}'][${evolutionIndex}].condition.itemId`, itemIds, 'itemData id', evolution.condition.itemId);
      }
    }

    const checkTrainerParty = (source: string, party: { pokemonId: number; moves?: string[] }[]): void => {
      for (const [memberIndex, member] of party.entries()) {
        assertKnownNumber(issues, `${source}.party[${memberIndex}].pokemonId`, pokemonIds, 'pokemonData id', member.pokemonId);
        for (const [moveIndex, moveId] of (member.moves ?? []).entries()) {
          assertKnown(issues, `${source}.party[${memberIndex}].moves[${moveIndex}]`, moveIds, 'moveData id', moveId);
        }
      }
    };

    for (const [trainerKey, trainer] of Object.entries(trainerData)) {
      if (trainer.id !== trainerKey) {
        addIssue(issues, `frontend/src/data/trainers trainerData['${trainerKey}']`, `has id '${trainer.id}' that does not match its key`);
      }
      checkTrainerParty(`frontend/src/data/trainers trainerData['${trainerKey}']`, trainer.party);
    }

    for (const [tierKey, tier] of Object.entries(battleTowerData)) {
      for (const [trainerIndex, trainer] of tier.trainers.entries()) {
        checkTrainerParty(`frontend/src/data/battle-tower-data.ts battleTowerData.${tierKey}.trainers[${trainerIndex}]`, trainer.party);
      }
    }

    const checkInteraction = (mapKey: string, collection: string, spawn: InteractionSpawn, index: number): void => {
      const source = `frontend/src/data/maps mapRegistry['${mapKey}'].${collection}[${index}] '${spawn.id}'`;
      assertKnown(issues, `${source}.givesItem`, validItemOrTmIds, 'itemData/tmData id', spawn.givesItem);
      assertKnown(issues, `${source}.triggerCutscene`, cutsceneIds, 'cutsceneData id', spawn.triggerCutscene);

      if (spawn.interactionType === 'move-tutor') {
        assertKnown(issues, `${source}.interactionData`, new Set(Object.keys(moveTutorData)), 'moveTutorData id', spawn.interactionData ?? spawn.id);
      }

      if (spawn.interactionType === 'berry-tree' && spawn.interactionData) {
        const [berryItemId] = spawn.interactionData.split(':');
        assertKnown(issues, `${source}.interactionData berry item`, itemIds, 'itemData id', berryItemId);
      }

      if (spawn.interactionType === 'wild-encounter' && spawn.interactionData) {
        const [pokemonId] = spawn.interactionData.split('-').map(Number);
        assertKnownNumber(issues, `${source}.interactionData pokemonId`, pokemonIds, 'pokemonData id', pokemonId);
      }

      if (spawn.interactionType === 'tag-battle' && spawn.interactionData) {
        const [allyId, enemyOneId, enemyTwoId] = spawn.interactionData.split('|');
        for (const trainerId of [allyId, enemyOneId, enemyTwoId]) {
          assertKnown(issues, `${source}.interactionData trainerId`, trainerIds, 'trainerData id', trainerId);
        }
      }
    };

    for (const [registryKey, map] of Object.entries(mapRegistry)) {
      if (map.key !== registryKey) {
        addIssue(issues, `frontend/src/data/maps mapRegistry['${registryKey}']`, `has MapDefinition key '${map.key}' that does not match its registry key`);
      }

      assertKnown(issues, `frontend/src/data/maps mapRegistry['${registryKey}'].encounterTableKey`, new Set([...Object.keys(encounterTables), '']), 'encounterTables key', map.encounterTableKey);
      assertKnown(issues, `frontend/src/data/maps mapRegistry['${registryKey}'].onEnterCutscene`, cutsceneIds, 'cutsceneData id', map.onEnterCutscene);

      for (const [warpIndex, warp] of map.warps.entries()) {
        const source = `frontend/src/data/maps mapRegistry['${registryKey}'].warps[${warpIndex}] (${warp.tileX},${warp.tileY})`;
        assertKnown(issues, `${source}.targetMap`, mapKeys, 'mapRegistry key', warp.targetMap);
        const targetMap = mapRegistry[warp.targetMap];
        if (targetMap && !Object.prototype.hasOwnProperty.call(targetMap.spawnPoints, warp.targetSpawnId)) {
          addIssue(issues, `${source}.targetSpawnId`, `references missing spawn '${warp.targetSpawnId}' in target map '${warp.targetMap}'`);
        }
      }

      for (const [trainerIndex, trainer] of map.trainers.entries()) {
        assertKnown(issues, `frontend/src/data/maps mapRegistry['${registryKey}'].trainers[${trainerIndex}] '${trainer.id}'.trainerId`, trainerIds, 'trainerData id', trainer.trainerId);
      }

      map.npcs.forEach((spawn, index) => checkInteraction(registryKey, 'npcs', spawn, index));
      map.objects.forEach((spawn, index) => checkInteraction(registryKey, 'objects', spawn, index));
    }

    for (const [shopKey, inventory] of Object.entries(shopInventories)) {
      assertKnown(issues, `frontend/src/data/shop-data.ts shopInventories['${shopKey}']`, mapKeys, 'mapRegistry key', shopKey);
      for (const [itemIndex, itemId] of inventory.entries()) {
        assertKnown(issues, `frontend/src/data/shop-data.ts shopInventories['${shopKey}'][${itemIndex}]`, validItemOrTmIds, 'itemData/tmData id', itemId);
      }
    }

    for (const [itemKey, item] of Object.entries(itemData)) {
      if (item.id !== itemKey) {
        addIssue(issues, `frontend/src/data/item-data.ts itemData['${itemKey}']`, `has id '${item.id}' that does not match its key`);
      }
      assertKnown(issues, `frontend/src/data/item-data.ts itemData['${itemKey}'].effect.moveId`, moveIds, 'moveData id', item.effect.moveId);
    }

    for (const [catalogIndex, entry] of battlePointShopCatalog.entries()) {
      assertKnown(issues, `frontend/src/data/bp-shop-data.ts battlePointShopCatalog[${catalogIndex}].itemId`, itemIds, 'itemData id', entry.itemId);
    }

    for (const [questKey, quest] of Object.entries(questData)) {
      if (quest.id !== questKey) {
        addIssue(issues, `frontend/src/data/quest-data.ts questData['${questKey}']`, `has id '${quest.id}' that does not match its key`);
      }
      for (const [rewardIndex, reward] of quest.rewards.entries()) {
        assertKnown(issues, `frontend/src/data/quest-data.ts questData['${questKey}'].rewards[${rewardIndex}].itemId`, validItemOrTmIds, 'itemData/tmData id', reward.itemId);
      }
      for (const [stepIndex, step] of quest.steps.entries()) {
        if (step.triggerEvent?.startsWith('map-entered:')) {
          assertKnown(issues, `frontend/src/data/quest-data.ts questData['${questKey}'].steps[${stepIndex}].triggerEvent`, mapKeys, 'mapRegistry key', step.triggerEvent.slice('map-entered:'.length));
        }
      }
    }

    for (const [cutsceneKey, cutscene] of Object.entries(cutsceneData)) {
      if (cutscene.id !== cutsceneKey) {
        addIssue(issues, `frontend/src/data/cutscene-data.ts cutsceneData['${cutsceneKey}']`, `has id '${cutscene.id}' that does not match its key`);
      }
    }

    for (const [achievementIndex, achievement] of ACHIEVEMENTS.entries()) {
      if (achievementIds.has(achievement.id)) {
        addIssue(issues, `frontend/src/data/achievement-data.ts ACHIEVEMENTS[${achievementIndex}]`, `duplicates achievement id '${achievement.id}'`);
      }
      achievementIds.add(achievement.id);
    }

    expect(
      issues,
      `Expected all data references to resolve. Found ${issues.length} dangling reference(s):\n${issues.map(issue => `- ${issue.source}: ${issue.message}`).join('\n')}`,
    ).toEqual([]);
  });
});

describe('Data Integrity', () => {
  describe('pokemon-data', () => {
    it('all Pokemon have base stats > 0', () => {
      for (const [id, pokemon] of Object.entries(pokemonData)) {
        for (const [stat, value] of Object.entries(pokemon.baseStats)) {
          expect(value, `${pokemon.name}.baseStats.${stat}`).toBeGreaterThan(0);
        }
      }
    });

    it('all Pokemon have valid types', () => {
      const validTypes = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
      for (const [, pokemon] of Object.entries(pokemonData)) {
        for (const type of pokemon.types) {
          expect(validTypes, `${pokemon.name} has invalid type ${type}`).toContain(type);
        }
        expect(pokemon.types.length).toBeGreaterThanOrEqual(1);
        expect(pokemon.types.length).toBeLessThanOrEqual(2);
      }
    });

    it('all Pokemon learnset moves exist in move-data', () => {
      for (const [, pokemon] of Object.entries(pokemonData)) {
        for (const entry of pokemon.learnset) {
          expect(moveData[entry.moveId], `${pokemon.name} has invalid move ${entry.moveId}`).toBeDefined();
        }
      }
    });

    it('all Pokemon have positive catch rate', () => {
      for (const [, pokemon] of Object.entries(pokemonData)) {
        expect(pokemon.catchRate, `${pokemon.name} catchRate`).toBeGreaterThan(0);
      }
    });

    it('all Pokemon have positive exp yield', () => {
      for (const [, pokemon] of Object.entries(pokemonData)) {
        expect(pokemon.expYield, `${pokemon.name} expYield`).toBeGreaterThan(0);
      }
    });

    it('all Pokemon evolution targets exist in pokemon-data', () => {
      for (const [, pokemon] of Object.entries(pokemonData)) {
        for (const evo of pokemon.evolutionChain) {
          expect(pokemonData[evo.pokemonId], `${pokemon.name} evolves to invalid ID ${evo.pokemonId}`).toBeDefined();
        }
      }
    });

    it('all Pokemon have sprite keys', () => {
      for (const [, pokemon] of Object.entries(pokemonData)) {
        expect(pokemon.spriteKeys.front, `${pokemon.name} missing front sprite`).toBeTruthy();
        expect(pokemon.spriteKeys.back, `${pokemon.name} missing back sprite`).toBeTruthy();
        expect(pokemon.spriteKeys.icon, `${pokemon.name} missing icon sprite`).toBeTruthy();
      }
    });
  });

  describe('move-data', () => {
    it('all moves have valid types', () => {
      const validTypes = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
      for (const [, move] of Object.entries(moveData)) {
        expect(validTypes, `Move ${move.name} has invalid type ${move.type}`).toContain(move.type);
      }
    });

    it('all moves have PP > 0', () => {
      for (const [, move] of Object.entries(moveData)) {
        expect(move.pp, `Move ${move.name} PP`).toBeGreaterThan(0);
      }
    });

    it('status moves have null power', () => {
      for (const [, move] of Object.entries(moveData)) {
        if (move.category === 'status') {
          expect(move.power, `Status move ${move.name} should have null power`).toBeNull();
        }
      }
    });

    it('all moves have accuracy between 0 and 100', () => {
      for (const [, move] of Object.entries(moveData)) {
        expect(move.accuracy, `Move ${move.name} accuracy`).toBeGreaterThan(0);
        expect(move.accuracy, `Move ${move.name} accuracy`).toBeLessThanOrEqual(100);
      }
    });

    it('all moves have valid category', () => {
      for (const [, move] of Object.entries(moveData)) {
        expect(['physical', 'special', 'status'], `Move ${move.name} invalid category`).toContain(move.category);
      }
    });
  });

  describe('item-data', () => {
    it('all items have valid categories', () => {
      const validCategories = ['pokeball', 'medicine', 'battle', 'key', 'tm', 'evolution'];
      for (const [, item] of Object.entries(itemData)) {
        expect(validCategories, `Item ${item.name} has invalid category ${item.category}`).toContain(item.category);
      }
    });

    it('all items have a description', () => {
      for (const [, item] of Object.entries(itemData)) {
        expect(item.description, `Item ${item.name} has no description`).toBeTruthy();
      }
    });

    it('all items have an effect', () => {
      for (const [, item] of Object.entries(itemData)) {
        expect(item.effect, `Item ${item.name} has no effect`).toBeDefined();
      }
    });

    it('pokeballs have catch rate multiplier > 0', () => {
      for (const [, item] of Object.entries(itemData)) {
        if (item.category === 'pokeball') {
          expect(item.effect.catchRateMultiplier, `${item.name} missing catchRateMultiplier`).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('trainer-data', () => {
    it('all trainer party Pokemon exist in pokemon-data', () => {
      for (const [, trainer] of Object.entries(trainerData)) {
        for (const member of trainer.party) {
          expect(pokemonData[member.pokemonId], `Trainer ${trainer.name} has invalid Pokemon ID ${member.pokemonId}`).toBeDefined();
        }
      }
    });

    it('all trainer party moves exist in move-data', () => {
      for (const [, trainer] of Object.entries(trainerData)) {
        for (const member of trainer.party) {
          if (member.moves) {
            for (const moveId of member.moves) {
              expect(moveData[moveId], `Trainer ${trainer.name} Pokemon has invalid move ${moveId}`).toBeDefined();
            }
          }
        }
      }
    });

    it('all trainers have reward money >= 0', () => {
      for (const [, trainer] of Object.entries(trainerData)) {
        expect(trainer.rewardMoney, `Trainer ${trainer.name} rewardMoney`).toBeGreaterThanOrEqual(0);
      }
    });

    it('all trainers have dialogue', () => {
      for (const [, trainer] of Object.entries(trainerData)) {
        expect(trainer.dialogue.before.length, `Trainer ${trainer.name} missing before dialogue`).toBeGreaterThan(0);
        expect(trainer.dialogue.after.length, `Trainer ${trainer.name} missing after dialogue`).toBeGreaterThan(0);
      }
    });
  });

  describe('encounter-tables', () => {
    it('all encounter table Pokemon exist in pokemon-data', () => {
      for (const [route, entries] of Object.entries(encounterTables)) {
        for (const entry of entries) {
          expect(pokemonData[entry.pokemonId], `Route ${route} has invalid Pokemon ID ${entry.pokemonId}`).toBeDefined();
        }
      }
    });

    it('all encounter entries have valid level ranges', () => {
      for (const [route, entries] of Object.entries(encounterTables)) {
        for (const entry of entries) {
          expect(entry.levelRange[0], `Route ${route} min level`).toBeGreaterThan(0);
          expect(entry.levelRange[1], `Route ${route} max level`).toBeGreaterThanOrEqual(entry.levelRange[0]);
        }
      }
    });

    it('all encounter entries have positive weights', () => {
      for (const [route, entries] of Object.entries(encounterTables)) {
        for (const entry of entries) {
          expect(entry.weight, `Route ${route} weight`).toBeGreaterThan(0);
        }
      }
    });

    it('encounter weights sum to a reasonable total per route', () => {
      for (const [route, entries] of Object.entries(encounterTables)) {
        const total = entries.reduce((sum, e) => sum + e.weight, 0);
        expect(total, `Route ${route} total weight`).toBeGreaterThan(0);
      }
    });
  });

  describe('evolution-data', () => {
    it('all evolution targets exist in pokemon-data', () => {
      for (const [fromId, evos] of Object.entries(evolutionData)) {
        for (const evo of evos) {
          expect(pokemonData[evo.evolvesTo], `Pokemon ${fromId} evolves to invalid ID ${evo.evolvesTo}`).toBeDefined();
        }
      }
    });

    it('all evolution sources exist in pokemon-data', () => {
      for (const fromId of Object.keys(evolutionData)) {
        expect(pokemonData[Number(fromId)], `Evolution source ${fromId} not in pokemon-data`).toBeDefined();
      }
    });

    it('level-based evolutions have valid levels', () => {
      for (const [, evos] of Object.entries(evolutionData)) {
        for (const evo of evos) {
          if (evo.condition.type === 'level') {
            expect(evo.condition.level, `Evolution level`).toBeGreaterThan(0);
            expect(evo.condition.level, `Evolution level`).toBeLessThanOrEqual(100);
          }
        }
      }
    });
  });
});
